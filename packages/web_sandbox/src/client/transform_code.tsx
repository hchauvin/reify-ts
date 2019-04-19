/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeEntry } from 'reify-ts/lib/types';
import { TypeExtractorOptions } from 'reify-ts/lib/engine/types';
import { TypeExtractor } from 'reify-ts/lib/engine/extractor';
import { SourceFileVisitorClass } from 'reify-ts/lib/engine/visitor';
import * as ts from 'typescript';
import { NameResolver } from 'reify-ts/lib/engine/name_resolver';
import { DEFAULT_PARSER_OPTIONS } from 'reify-ts/lib/transform';
import AllTypesVisitor from 'reify-ts/lib/visitors/all_types';
import PlaceholderCallsVisitor from 'reify-ts/lib/visitors/placeholder_calls';
import {
  DEFAULT_LIB_FILE_NAME,
  DEFAULT_LIB_LOCATION,
  commonSourceFiles,
} from '../../src/client/common_source_files';

const SOURCE_FILE_NAME = 'index.ts';

export enum VisitorClassName {
  allTypes = 'allTypes',
  placeholderCalls = 'placeholderCalls',
}

export type VisitorMap = {
  [className in VisitorClassName]: { [optionName: string]: any } | undefined
};

class PlaceholderCallsVisitorModified extends PlaceholderCallsVisitor {
  /** @override */
  getDirname(): string {
    return 'node_modules/reify-ts/lib/visitors';
  }
}

const visitorClasses: {
  [visitorClassName in VisitorClassName]: SourceFileVisitorClass
} = {
  [VisitorClassName.allTypes]: AllTypesVisitor,
  [VisitorClassName.placeholderCalls]: PlaceholderCallsVisitorModified,
};

export function transformCode(
  code: string,
  visitorMap: VisitorMap,
): { ast: TypeEntry[]; generatedCode: string; console: string } {
  const compilerHost = new InMemoryCompilerHost(
    { [SOURCE_FILE_NAME]: code, ...commonSourceFiles },
    '.',
  );
  const options: ts.CompilerOptions = {
    strict: true,
    noEmitOnError: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.CommonJS,
    allowUnusedLabels: true,
    listFiles: true,
    listEmittedFiles: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  };
  const program = ts.createProgram([SOURCE_FILE_NAME], options, compilerHost);
  const sourceFile = program.getSourceFile(SOURCE_FILE_NAME);
  if (!sourceFile) {
    return {
      ast: [],
      generatedCode: '',
      console: '',
    };
  }
  const {
    transformer,
    extractor,
    diagnostics: transformationDiagnostics,
  } = getTransformer(
    compilerHost,
    program,
    Object.entries(visitorMap)
      .filter(([_visitorClassName, visitorOptions]) => !!visitorOptions)
      .map(([visitorClassName, visitorOptions]) => [
        (visitorClasses as any)[visitorClassName],
        visitorOptions!,
      ]),
  );

  const emitResult = program.emit(sourceFile, undefined, undefined, undefined, {
    before: [transformer],
  });
  const diagnostics = [...emitResult.diagnostics, ...transformationDiagnostics];
  if (diagnostics.length > 0) {
    return {
      ast: [],
      generatedCode: '',
      console: diagnosticsToString(diagnostics),
    };
  }

  return {
    ast: extractor.getTypes(),
    generatedCode: compilerHost.outputFiles['index.js'] || '',
    console: '',
  };
}

class InMemoryCompilerHost implements ts.CompilerHost {
  outputFiles: { [fileName: string]: string } = {};

  constructor(
    private readonly fileContent: { [fileName: string]: string },
    private readonly currentDirectory: string,
  ) {}

  getSourceFile(
    fileName: string,
    languageVersion: ts.ScriptTarget,
    _onError?: (message: string) => void,
    _shouldCreateNewSourceFile?: boolean,
  ): ts.SourceFile | undefined {
    const content = this.fileContent[fileName];
    if (!content) return undefined;
    return ts.createSourceFile(fileName, content, languageVersion);
  }

  getDefaultLibFileName(_options: ts.CompilerOptions): string {
    return DEFAULT_LIB_FILE_NAME;
  }

  getDefaultLibLocation() {
    return DEFAULT_LIB_LOCATION;
  }

  writeFile(
    fileName: string,
    data: string,
    _writeByteOrderMark: boolean,
    _onError?: (message: string) => void,
    _sourceFiles?: ReadonlyArray<ts.SourceFile>,
  ): void {
    this.outputFiles[fileName] = data;
  }

  getCurrentDirectory() {
    return this.currentDirectory;
  }

  getCanonicalFileName(fileName: string): string {
    return fileName;
  }

  useCaseSensitiveFileNames(): boolean {
    return true;
  }

  getNewLine(): string {
    return '\n';
  }

  fileExists(fileName: string): boolean {
    return (this.fileContent[fileName] as string | undefined) !== undefined;
  }

  readFile(fileName: string): string | undefined {
    return this.fileContent[fileName];
  }
}

function getTransformer(
  compilerHost: ts.CompilerHost,
  program: ts.Program,
  visitors: [SourceFileVisitorClass, { [optionName: string]: any }][],
  parserOptionsOverride?: Partial<TypeExtractorOptions>,
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
      let nextSourceFile = sourceFile;
      for (const [visitorClass, visitorOptions] of visitors) {
        const visitor = new visitorClass(
          extractor,
          nextSourceFile,
          program.getTypeChecker(),
          context,
          nameResolver,
          visitorOptions,
        );
        nextSourceFile = visitor.visitSourceFile();
      }
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
        if (diagnostic.file === undefined || diagnostic.start === undefined) {
          return message;
        }
        const {
          line,
          character,
        } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return `* ${diagnostic.file.fileName}:${line + 1}:${character +
          1}: ${message}`;
      })
      .join('\n') || '<no diagnostic message>'
  );
}
