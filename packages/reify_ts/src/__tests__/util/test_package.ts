/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fsExtra from 'fs-extra';
import { promisify } from 'util';
import { spawn, ChildProcess } from 'child_process';
import { ExternalResource } from './external_resource';

/** Directory where all the scratch test packages reside. */
const testPackagesDir = path.resolve('src/__tests__/test_packages');

export interface TestPackageOptions {
  /** Package name */
  name: string;
}

/**
 * Resource class for manipulating test commonjs packages created from scratch.
 */
export class TestPackage<
  Options extends TestPackageOptions = TestPackageOptions
> implements ExternalResource {
  constructor(protected readonly options: Options) {}

  /** @override */
  async setup() {
    await promisify(rimraf)(this.packageDir);
  }

  /** @override */
  async teardown() {
    await promisify(rimraf)(this.packageDir);
  }

  /** Return the directory for this test package. */
  get packageDir() {
    return path.resolve(testPackagesDir, this.options.name);
  }

  /** Resolve a path relative to the package directory. */
  path(relative: string): string {
    return path.resolve(this.packageDir, relative);
  }

  /**
   * Write a file to the package directory, creating subdirectories
   * if necessary.
   */
  async writeFile(relativeFileName: string, content: string) {
    const fileName = this.path(relativeFileName);
    await mkdirp(path.dirname(fileName));
    await writeFile(fileName, content);
  }

  /**
   * Write some JSON content to a file in the package directory.
   *
   * @see [[writeFile]]
   */
  async writeJson(relativeFileName: string, content: any) {
    await this.writeFile(relativeFileName, JSON.stringify(content, null, 2));
  }

  /** Read a text file in the package directory. */
  async readFile(relativeFileName: string): Promise<string> {
    return readFile(this.path(relativeFileName), { encoding: 'utf8' });
  }

  /** Parse a JSON file in the package directory. */
  async readJson(relativeFileName: string): Promise<any> {
    return JSON.parse(await this.readFile(relativeFileName));
  }

  /** Spawn the yarn CLI within the package directory. */
  spawnYarn(command: string[] = []): ChildProcess {
    return spawn('yarn', command, { cwd: this.packageDir });
  }

  /**
   * Execute a yarn command and resolves when the yarn process exits.
   */
  async yarn(
    command: string[] = [],
    { mustSucceed = true, verbose = false } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }>((resolve, reject) => {
      let stdout: string = '';
      let stderr: string = '';

      const proc = this.spawnYarn(command);
      proc.on('exit', (exitCode, signal) => {
        const reason = `yarn exited with code ${exitCode} and signal ${signal}; STDOUT: <<<\n${stdout}\n>>>; STDERR: <<<\n${stderr}\n>>>`;
        if (verbose) {
          console.log(reason);
        }
        if (mustSucceed && exitCode !== 0) {
          reject(new Error(reason));
        }
        resolve({ stdout, stderr, exitCode });
      });

      proc.on('error', (err: Error) => {
        console.error(`child process errored: ${err.toString()}`);
        reject(err);
      });

      proc.stdout.on('data', (data: any) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: any) => {
        stderr += data.toString();
      });
    });
  }
}

const mkdirp = promisify(fsExtra.mkdirp);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
