/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BackgroundProcessResource } from './background_process_resource';

export class WebpackDevServer {
  private backgroundProcess: BackgroundProcessResource;

  constructor(
    public readonly yarnScript: string,
    public readonly serverPort: number,
  ) {
    this.backgroundProcess = new BackgroundProcessResource(
      'yarn',
      [yarnScript],
      data => {
        if (!data) return {};
        const dataStr: string = data.toString();
        return {
          ready: dataStr.includes('Compiled successfully.'),
          // \x08 is "backspace"
          silence: /(\s*[0-9]+%)|(^(\s|\x08)*$)/.test(dataStr.trim()),
          error: dataStr.includes('Failed to compile.')
            ? new Error('failed to compile')
            : undefined,
        };
      },
      {
        PORT: serverPort,
      },
    );
  }

  async setup() {
    await this.backgroundProcess.setup();
  }

  async teardown() {
    await this.backgroundProcess.teardown();
  }

  getUrlBase(): string {
    return `http://localhost:${this.serverPort}`;
  }
}
