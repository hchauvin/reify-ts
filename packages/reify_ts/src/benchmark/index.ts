/**
 * @ignore
 *
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** */
import * as Benchmark from 'benchmark';
import * as ts from 'typescript';
import * as _ from 'lodash';
import {
  ProgramTransformationResult,
  transformProgram,
  transformProgramWithTsPlugin,
} from '../internal/ts_transformer';
import {
  getProgramFromTranspiledPackage,
  getProgramFromFiles,
} from '../internal/program';

new Benchmark.Suite()
  .add('react:exported_types', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage(
      '@types/react',
    );
    transformProgramWithTsPlugin(compilerHost, program);
  })
  .add('react:do_nothing', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage(
      '@types/react',
    );
    transformProgramWithDoNothingPlugin(compilerHost, program);
  })
  .add('esnext:exported_types', function() {
    const { compilerHost, program } = getProgramFromFiles([
      require.resolve('typescript/lib/lib.esnext.d.ts'),
    ]);
    transformProgramWithTsPlugin(compilerHost, program);
  })
  .add('esnext:do_nothing', function() {
    const { compilerHost, program } = getProgramFromFiles([
      require.resolve('typescript/lib/lib.esnext.d.ts'),
    ]);
    transformProgramWithDoNothingPlugin(compilerHost, program);
  })
  .add('rxjs:exported_types', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('rxjs');
    transformProgramWithTsPlugin(compilerHost, program);
  })
  .add('rxjs:do_nothing', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('rxjs');
    transformProgramWithDoNothingPlugin(compilerHost, program);
  })
  .add('vue:exported_types', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('vue');
    transformProgramWithTsPlugin(compilerHost, program);
  })
  .add('vue:do_nothing', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('vue');
    transformProgramWithDoNothingPlugin(compilerHost, program);
  })
  .add('redux:exported_types', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('redux');
    transformProgramWithTsPlugin(compilerHost, program);
  })
  .add('redux:do_nothing', function() {
    const { compilerHost, program } = getProgramFromTranspiledPackage('redux');
    transformProgramWithDoNothingPlugin(compilerHost, program);
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('error', function(err: any) {
    console.error(err);
  })
  .run({ async: true });

function transformProgramWithDoNothingPlugin(
  _compilerHost: ts.CompilerHost,
  program: ts.Program,
): ProgramTransformationResult {
  const transformer = (_context: ts.TransformationContext) => (
    sourceFile: ts.SourceFile,
  ) => sourceFile;
  const transformedContent = transformProgram(program, transformer);

  return { types: [], transformedContent };
}
