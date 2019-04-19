/**
 * @module
 *
 * Entry point for the "runtime type" transformer, a TypeScript transformer that
 * generates runtime type validation from TypeScript types.
 *
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** */
import * as ts from 'typescript';
import { TypeExtractor } from './engine/extractor';
import { NameResolver } from './engine/name_resolver';
import * as _ from 'lodash';
import { TypeExtractorOptions } from './engine/types';
import { SourceFileVisitorClass } from './engine/visitor';

export type Options = {
  extractor?: Partial<TypeExtractorOptions>;
  astFileName: string;
  visitors?: (string | { visitor: string; [optionName: string]: any })[];
};

export const DEFAULT_PARSER_OPTIONS: TypeExtractorOptions = {
  fileNameFilter: null,
  excludeSymbols: [],
  allOptional: false,
};

export const DEFAULT_VISITORS = ['placeholder_calls'];

const WELL_KNOWN_VISITORS = ['placeholder_calls', 'all_types'];

/**
 * Entry point.
 *
 * @param program The TypeScript program to transform.
 * @param options The transformer options to overload the default transformer options.
 * @return A TypeScript transformer factory.
 */
export default function tsPlugin(
  program: ts.Program,
  options: Options,
  helpers: { addDiagnostic: (diag: ts.Diagnostic) => void },
): ts.TransformerFactory<ts.SourceFile> {
  const parserOptions: TypeExtractorOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options.extractor,
  };
  const compilerHost = ts.createCompilerHost(program.getCompilerOptions());
  const nameResolver = new NameResolver(
    program.getCompilerOptions(),
    compilerHost,
    program.getCompilerOptions().baseUrl,
  );
  const extractor = new TypeExtractor(
    parserOptions,
    nameResolver,
    compilerHost,
    helpers.addDiagnostic,
  );
  const visitorClasses: Array<{
    name: string;
    visitorClass: SourceFileVisitorClass;
    options: { [optionName: string]: any };
  }> = (options.visitors || DEFAULT_VISITORS).map(it => {
    const visitor = typeof it === 'string' ? it : it.visitor;
    return {
      name: visitor,
      visitorClass: require(WELL_KNOWN_VISITORS.includes(visitor)
        ? `./visitors/${visitor}`
        : visitor).default,
      options: typeof it === 'string' ? {} : _.omit(it, 'visitor'),
    };
  });
  if (visitorClasses.length === 0) {
    throw new Error('expected at least one visitor module');
  }
  extractor.hydrate(options.astFileName);
  return (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
    extractor.removeAllTypeEntriesFromFile(sourceFile.fileName);
    let nextSourceFile: ts.SourceFile = sourceFile;
    for (const { visitorClass, options } of visitorClasses) {
      const visitor = new visitorClass(
        extractor,
        nextSourceFile,
        program.getTypeChecker(),
        context,
        nameResolver,
        options,
      );
      nextSourceFile = visitor.visitSourceFile();
    }
    extractor.save(options.astFileName);
    return nextSourceFile;
  };
}
