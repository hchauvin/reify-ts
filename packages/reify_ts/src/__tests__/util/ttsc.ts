/**
 * Manipulation of scratch test packages which contain typescript code
 * to transpile using the reify-ts ts_plugin plugin.
 *
 * @module
 *
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** */
import { TestPackage, TestPackageOptions } from './test_package';
import { ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as terminate from 'terminate';
import { ExecutionContext } from 'ava';
import { TypeExtractorOptions } from '../../engine/types';
import { ExternalResource } from './external_resource';
import { ProgramTransformationResultWrapper } from './type_util';

/**
 * The constant file name where the type ASTs are stored after the
 * reify-ts ts_plugin plugin has been applied.
 */
const AST_FILE_NAME = './types.json';

export interface TsTestPackageOptions extends TestPackageOptions {
  extractor?: Partial<TypeExtractorOptions>;
}

/**
 * Resource class for manipulating scratch test packages which contain
 * typescript code to transpile using the reify-ts ts_plugin plugin.
 */
export class TsTestPackage extends TestPackage<TsTestPackageOptions> {
  /** @override */
  async setup() {
    await super.setup();

    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../package.json'), {
        encoding: 'utf8',
      }),
    );

    await this.writeJson('package.json', {
      name: this.options.name,
      private: true,
      version: packageJson.version,
      dependencies: {
        'reify-ts': packageJson.version,
        'ts-node': '^4',
        typescript: '3.4.1',
        ttypescript: '^1.5.6',
      },
    });

    await this.writeJson('tsconfig.json', {
      version: '3.2.2',
      compilerOptions: {
        outDir: './build',
        rootDir: './src',
        target: 'es2017',
        noImplicitAny: true,
        alwaysStrict: true,
        sourceMap: true,
        skipLibCheck: true,
        pretty: true,
        plugins: [
          {
            name: 'tslint-language-service',
          },
          {
            transform: 'reify-ts/lib/transform',
            extractor: this.options.extractor,
            astFileName: AST_FILE_NAME,
            visitors: ['all_types'],
          },
        ],
        typeRoots: ['./node_modules/@types', './node_modules'],
        types: ['node', 'mocha'],
        lib: ['es7', 'es2017', 'dom'],
        module: 'commonjs',
        moduleResolution: 'node',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        strictNullChecks: true,
        baseUrl: '.',
      },
      exclude: ['./node_modules'],
      compileOnSave: true,
      watch: true,
    });

    await this.yarn();
  }

  /** Gets the type ASTs that are gathered by ts_plugin. */
  async getProgramTransformationResult(
    t: ExecutionContext<{}>,
  ): Promise<ProgramTransformationResultWrapper> {
    return new ProgramTransformationResultWrapper(
      {
        types: await this.readJson(AST_FILE_NAME),
        // We are not using the transformed content right now,
        // so it is fine to not populate this map.
        transformedContent: {},
      },
      t,
    );
  }
}

/**
 * Maintains a `ttsc --watch` transpiler watcher as a background process.
 */
export class TsWatcher implements ExternalResource {
  private proc: ChildProcess | undefined;

  constructor(private readonly pkg: TestPackage) {}

  /** @override */
  async setup() {
    this.proc = this.pkg.spawnYarn(['ttsc', '--watch']);

    this.proc.stderr.on('data', (data: any) => {
      console.log('STDERR:', data.toString());
    });
  }

  /** @override */
  async teardown() {
    if (this.proc) {
      promisify(terminate)(this.proc.pid);
    }
  }

  /**
   * Waits for transpilation to end.
   *
   * @return The number of errors encountered during transpilation.
   */
  async waitForEndOfTranspilation({ mustSucceed = true } = {}): Promise<
    number
  > {
    return new Promise<number>((resolve, reject) => {
      if (!this.proc) {
        reject(new Error('"setup" must be called'));
      } else {
        const listener = (data: any) => {
          const dataStr: string = data.toString();
          if (dataStr.includes('Watching for file changes.')) {
            this.proc!.stdout.removeListener('data', listener);
            const match = dataStr.match(/Found ([0-9]+) error/);
            if (!match) {
              reject(new Error(`cannot find error count in <<<${dataStr}>>>`));
            } else {
              const errors = Number.parseInt(match[1], 10);
              if (mustSucceed && errors > 0) {
                reject(
                  new Error(
                    `${errors} errors encountered during transpilation`,
                  ),
                );
              } else {
                resolve(errors);
              }
            }
          }
        };
        this.proc.stdout.on('data', listener);
      }
    });
  }
}
