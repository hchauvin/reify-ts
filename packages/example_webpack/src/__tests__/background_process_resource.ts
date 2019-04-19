/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as childProcess from 'child_process';
import * as util from 'util';
import * as terminate from 'terminate';

/**
 * Callback for new data coming either from the stderr or stdout handles of the background
 * process.
 */
export type OnData = (data: string | Buffer | undefined) => OnDataStatus;

/** What to do with incoming data. */
export type OnDataStatus = {
  /** Exit the `setup` async method successfully */
  ready?: boolean;
  /** Silence the data (do not pipe it to `winston`) */
  silence?: boolean;
  /** Exit the `setup` async method with an error */
  error?: Error;
};

/**
 * External resource to start and stop a background process.
 */
export class BackgroundProcessResource {
  private process: childProcess.ChildProcess;

  constructor(
    public readonly command: string,
    public readonly args: string[],
    private readonly onData: OnData = () => ({ ready: true }),
    private readonly envVarOverwrite: { [key: string]: any } = {},
  ) {}

  async setup() {
    this.process = childProcess.spawn(this.command, this.args, {
      env: { ...process.env, ...this.envVarOverwrite },
    });

    return new Promise<void>((resolve, reject) => {
      this.process.on('exit', (code, signal) => {
        const reason = `child process exited with code ${code} and signal ${signal}`;
        console.log(reason);
        reject(reason);
      });

      this.process.on('error', (err: Error) => {
        console.error(`child process errored: ${err.toString()}`);
        reject(err);
      });

      const { ready, error } = this.onData(undefined);

      if (error) {
        reject(error);
      } else if (ready) {
        resolve();
      } else {
        ['stderr', 'stdout'].forEach(fileno => {
          (this.process as any)[fileno].on('data', (data: any) => {
            const { ready, error, silence } = this.onData(data);
            if (!silence) {
              // Remove back spaces (\x08) before displaying
              console.log(
                data
                  .toString()
                  .replace('\x08', '')
                  .trim(),
                fileno,
              );
            }
            if (error) {
              reject(error);
            } else if (ready) {
              resolve();
            }
          });
        });
      }
    });
  }

  async teardown() {
    try {
      const killWithChildren = util.promisify(terminate);
      await killWithChildren(this.process.pid);
    } catch (err) {
      console.warn(
        `Could not kill background process because it has already exited (this is probably a bug):`,
        err,
      );
    }
  }
}
