/**
 * Abstract source file visitor that all visitors should extend.
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
import { NameResolver } from './name_resolver';
import { TypeExtractor } from './extractor';
import { TypeConversionInvariantError } from './internal/errors';

export interface SourceFileVisitorClass {
  prototype: AbstractSourceFileVisitor;
  new (
    extractor: TypeExtractor,
    sourceFile: ts.SourceFile,
    checker: ts.TypeChecker,
    context: ts.TransformationContext,
    nameResolver: NameResolver,
    visitorOptions: { [optionName: string]: any },
  ): AbstractSourceFileVisitor;
}

/**
 * Base class for source file visitors.
 *
 * A new source file visitor is instantiated for each source file to visit.
 */
export abstract class AbstractSourceFileVisitor {
  /**
   * Whether the source file should be updated because the visitor doesn't
   * only extract the types but also transform the source files.
   */
  protected shouldUpdateSourceFile = false;

  /** Counter used to generate unique but predictable anonymous type names. */
  private anonymousTypeCount = 0;

  constructor(
    protected extractor: TypeExtractor,
    protected sourceFile: ts.SourceFile,
    protected checker: ts.TypeChecker,
    protected context: ts.TransformationContext,
    protected nameResolver: NameResolver,
    protected visitorOptions: { [optionName: string]: any },
  ) {}

  /**
   * Gets a list of statements to prepend to the source file when
   * [[shouldUpdateSourceFile]] is `true`.
   */
  protected getStatementsToPrepend(): ReadonlyArray<ts.Statement> {
    return [];
  }

  /** Visits a source file looking for service definitions */
  visitSourceFile(): ts.SourceFile {
    // If a file name filter has been specified, return with modification all the
    // files with names that do not match the filter.
    if (
      this.extractor.options.fileNameFilter &&
      !new RegExp(this.extractor.options.fileNameFilter).test(
        this.sourceFile.fileName,
      )
    ) {
      return this.sourceFile;
    }

    // Visit the nodes in the source file recursively.
    const visitedSourceFile = this.visitNodeAndChildren(this.sourceFile);
    if (!this.shouldUpdateSourceFile) {
      // Do not insert import declarations
      return visitedSourceFile;
    }
    // Insert import declarations that are used by the runtime type definitions.
    return ts.updateSourceFileNode(this.sourceFile, [
      ...this.getStatementsToPrepend(),
      ...visitedSourceFile.statements,
    ]);
  }

  /**
   * Visits (and perhaps transforms) a node and its children recursively.
   */
  protected visitNodeAndChildren(node: ts.SourceFile): ts.SourceFile;
  protected visitNodeAndChildren(node: ts.Node): ts.Node;
  protected visitNodeAndChildren(node: ts.Node): ts.Node {
    return ts.visitEachChild(
      this.visitNode(node),
      childNode => this.visitNodeAndChildren(childNode),
      this.context,
    );
  }

  /**
   * Visits nodes.  This is where the type extraction takes place.
   */
  protected abstract visitNode(node: ts.Node): ts.Node;

  /**
   * Extracts from a call expression the function name and the name of the
   * file where it is declared, or `null` if such location could not be
   * determined.
   */
  protected getFunctionDeclarationLocation(
    node: ts.CallExpression,
  ): { fileName: string; name: string } | null {
    const symbol = this.checker.getSymbolAtLocation(node.expression);
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
      const decl = symbol.declarations[0];
      if (ts.isImportSpecifier(decl)) {
        const expr = decl.parent.parent.parent.moduleSpecifier;
        if (!ts.isStringLiteral(expr)) {
          throw new TypeConversionInvariantError(
            node.getText(),
            'expected the module specified to be a string literal',
          );
        }
        return {
          fileName: this.nameResolver.resolveModuleName(expr.text, node),
          name: decl.propertyName ? decl.propertyName.text : symbol.getName(),
        };
      }
    }
    const signature = this.checker.getResolvedSignature(node);
    if (typeof signature === 'undefined') {
      return null;
    }
    const { declaration } = signature;
    if (!declaration) {
      return null;
    }
    const declarationName = (declaration as any)['name'];
    if (!declarationName) {
      return null;
    }
    return {
      fileName: declaration.getSourceFile().fileName,
      name: declarationName.getText(),
    };
  }

  /**
   * Get the return type of a function invocation.
   */
  protected getReturnType(node: ts.CallExpression) {
    return this.checker.getTypeAtLocation(node.parent);
  }

  /**
   * Gets the full name of a type.  If the symbol is anonymous
   * (see [[NameResolver.isAnonymousSymbol]]), then an arbitrary, but
   * predictable name is assigned (predictable in that using the same
   * version of TypeScript and the same visitor would lead to the same
   * name being generated).
   *
   * @see [[NameResolver.getSymbolFullName]].
   */
  protected getTypeFullName(type: ts.Type): string {
    const symbol = type.aliasSymbol || type.symbol;
    if (!symbol || this.nameResolver.isAnonymousSymbol(symbol)) {
      const name = this.nameResolver.formatFullName(
        this.sourceFile.fileName,
        `$AnonymousType_${this.anonymousTypeCount++}`,
      );
      this.extractor.convertType(
        type,
        name,
        undefined,
        this.checker,
        undefined,
      );
      return name;
    }
    this.extractor.convertType(
      type,
      undefined,
      undefined,
      this.checker,
      undefined,
    );
    return this.nameResolver.getSymbolFullName(symbol);
  }

  /**
   * Whether the two given source file names reference the same
   * TypeScript source file.
   *
   * We account for the fact that the source file could be included either
   * compiled or directly from source.
   */
  protected isSameSourceFile(
    fileName: string,
    expectedRelativeFileName: string,
  ): boolean {
    const expectedRelativeFileNameSrc = expectedRelativeFileName.replace(
      /\/(lib|es)\//,
      '/src/',
    );
    const extensions = ['ts', 'd.ts', 'js'];

    for (const extension of extensions) {
      if (
        fileName === `${expectedRelativeFileName}.${extension}` ||
        fileName === `${expectedRelativeFileNameSrc}.${extension}`
      ) {
        return true;
      }
    }

    return false;
  }
}
