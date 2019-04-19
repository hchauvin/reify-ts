/**
 * Helpers for unit tests.
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
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as _ from 'lodash';
import AllTypesVisitor from '../../visitors/all_types';
import { ExecutionContext } from 'ava';
import { transformProgramWithTsPlugin } from '../../internal/ts_transformer';
import { ProgramTransformationResultWrapper } from './type_util';
import { getProgramFromFiles } from '../../internal/program';
import { TypeExtractorOptions } from '../../engine/types';
import { SourceFileVisitorClass } from '../../engine/visitor';

export function transformUnitTestProgram(
  t: ExecutionContext<{}>,
  programName: string,
  {
    extraFiles = [],
    parserOptionsOverride,
    visitor = AllTypesVisitor,
  }: {
    extraFiles?: string[];
    parserOptionsOverride?: Partial<TypeExtractorOptions>;
    visitor?: SourceFileVisitorClass;
  } = {},
): ProgramTransformationResultWrapper {
  const { compilerHost, program } = getProgramFromName(programName, {
    extraFiles,
  });
  const result = transformProgramWithTsPlugin(
    compilerHost,
    program,
    parserOptionsOverride,
    visitor,
  );
  return new ProgramTransformationResultWrapper(result, t);
}

export function getUnitTestProgramPath(programName: string): string {
  return path
    .resolve(__dirname, '../programs', programName)
    .replace('/lib/', '/src/');
}

function getProgramFromName(
  programName: string,
  options: { extraFiles: string[] },
): { compilerHost: ts.CompilerHost; program: ts.Program } {
  const compilerOptions: ts.CompilerOptions = {
    baseUrl: path.resolve(__dirname, '../programs').replace('/lib/', '/src/'),
  };

  const folder = getUnitTestProgramPath(programName);
  if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
    return getProgramFromFiles(
      [
        ...fs
          .readdirSync(folder)
          .filter(it => it.endsWith('.ts'))
          .map(it => path.join(folder, it)),
        ...options.extraFiles,
      ],
      compilerOptions,
    );
  }

  return getProgramFromFiles(
    [`${getUnitTestProgramPath(programName)}.ts`, ...options.extraFiles],
    compilerOptions,
  );
}
