/**
 * Transform source files with ts_plugin.
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
import * as ts from 'typescript';
import * as _ from 'lodash';
import { TypeEntry } from '../types';
import { DEFAULT_PARSER_OPTIONS } from '../transform';
import { TypeExtractor } from '../engine/extractor';
import AllTypesVisitor from '../visitors/all_types';
import { NameResolver } from '../engine/name_resolver';
import { SourceFileVisitorClass } from '../engine/visitor';
import { TypeExtractorOptions } from '../engine/types';

export interface ProgramTransformationResult {
  types: TypeEntry[];
  transformedContent: { [moduleName: string]: string };
}

export function transformProgramWithTsPlugin(
  compilerHost: ts.CompilerHost,
  program: ts.Program,
  parserOptionsOverride?: Partial<TypeExtractorOptions>,
  visitor: SourceFileVisitorClass = AllTypesVisitor,
  visitorOptions: { [optionName: string]: any } = {},
): ProgramTransformationResult {
  const { transformer, extractor, diagnostics } = getTransformer(
    compilerHost,
    program,
    visitor,
    parserOptionsOverride,
    visitorOptions,
  );
  if (diagnostics.length > 0) {
    throw new Error(diagnosticsToString(diagnostics));
  }

  const transformedContent = transformProgram(program, transformer);

  return { types: extractor.getTypes(), transformedContent };
}

export function transformProgram(
  program: ts.Program,
  transformer: ts.TransformerFactory<ts.SourceFile>,
): { [moduleName: string]: string } {
  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
  if (preEmitDiagnostics.length > 0) {
    throw new Error(diagnosticsToString(preEmitDiagnostics));
  }

  const transformedContent: { [moduleName: string]: string } = {};

  for (const rootFileName of program.getRootFileNames()) {
    const sourceFile = program.getSourceFile(rootFileName);
    if (!sourceFile) {
      throw new Error(
        `cannot get source file foor root file name '${rootFileName}'`,
      );
    }
    const result = ts.transform(
      sourceFile,
      [transformer],
      program.getCompilerOptions(),
    );
    if (result.diagnostics && result.diagnostics.length > 0) {
      throw new Error(diagnosticsToString(result.diagnostics));
    }
    transformedContent[sourceFile.fileName] = ts
      .createPrinter(undefined, {
        substituteNode: result.substituteNode,
      })
      .printFile(result.transformed[0]);
  }

  return transformedContent;
}

function getTransformer(
  compilerHost: ts.CompilerHost,
  program: ts.Program,
  visitorClass: SourceFileVisitorClass,
  parserOptionsOverride?: Partial<TypeExtractorOptions>,
  visitorOptions: { [optionName: string]: any } = {},
): {
  transformer: ts.TransformerFactory<ts.SourceFile>;
  extractor: TypeExtractor;
  diagnostics: ReadonlyArray<ts.Diagnostic>;
} {
  const parserOptions: TypeExtractorOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    ...parserOptionsOverride,
  };
  const nameResolver = new NameResolver(
    program.getCompilerOptions(),
    compilerHost,
    program.getCompilerOptions().baseUrl,
  );
  const diagnostics: ts.Diagnostic[] = [];
  const addDiagnostic = (diagnostic: ts.Diagnostic) => {
    diagnostics.push(diagnostic);
  };
  const extractor = new TypeExtractor(
    parserOptions,
    nameResolver,
    compilerHost,
    addDiagnostic,
  );
  const transformer = (context: ts.TransformationContext) => (
    sourceFile: ts.SourceFile,
  ) => {
    try {
      const visitor = new visitorClass(
        extractor,
        sourceFile,
        program.getTypeChecker(),
        context,
        nameResolver,
        visitorOptions,
      );
      const nextSourceFile = visitor.visitSourceFile();
      return nextSourceFile;
    } catch (err) {
      console.error(err.stack);
      throw err;
    }
  };
  return { transformer, extractor, diagnostics };
}

function diagnosticsToString(
  diagnostics: ReadonlyArray<ts.Diagnostic>,
): string {
  return (
    diagnostics
      .map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n',
        );
        if (!diagnostic.file) {
          return message;
        }
        const {
          line,
          character,
        } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        return `${diagnostic.file.fileName} (${line + 1},${character +
          1}): ${message}`;
      })
      .join('\n') || '<no diagnostic message>'
  );
}
