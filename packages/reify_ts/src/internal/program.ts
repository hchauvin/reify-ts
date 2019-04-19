/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as ts from 'typescript';
import * as _ from 'lodash';

export function getProgramFromFiles(
  files: string[],
  jsonCompilerOptions: any = {},
  basePath: string = './',
): { compilerHost: ts.CompilerHost; program: ts.Program } {
  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`file ${file} does not exist`);
    }
  }

  // use built-in default options
  const compilerOptions = ts.convertCompilerOptionsFromJson(
    jsonCompilerOptions,
    basePath,
  ).options;

  const options: ts.CompilerOptions = {
    noEmit: false,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.CommonJS,
    allowUnusedLabels: true,
    listFiles: true,
    listEmittedFiles: true,
    types: ['node'],
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  };

  for (const k in compilerOptions) {
    if (compilerOptions.hasOwnProperty(k)) {
      options[k] = compilerOptions[k];
    }
  }

  const compilerHost = ts.createCompilerHost(options);
  return {
    compilerHost,
    program: ts.createProgram(files, options, compilerHost),
  };
}

export function getProgramFromTranspiledPackage(
  moduleId: string,
): { compilerHost: ts.CompilerHost; program: ts.Program } {
  if (moduleId.endsWith('.ts')) {
    throw new Error('moduleId should not end with .ts');
  }
  const packageJson = JSON.parse(
    fs.readFileSync(require.resolve(moduleId + '/package.json'), {
      encoding: 'utf8',
    }),
  );
  const typings: string = packageJson.typings || 'index.d.ts';
  return getProgramFromFiles([require.resolve(moduleId + '/' + typings)]);
}
