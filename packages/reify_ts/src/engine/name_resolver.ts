/**
 * Module name and file resolution.
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
import * as path from 'path';
import { BaseError } from 'make-error';

/**
 * Thrown when a module could not be resolved.
 */
export class ModuleResolutionError extends BaseError {
  /** @ignore */
  constructor(
    public readonly containingFile: string,
    public readonly lineno: number,
    public readonly moduleName: string,
  ) {
    super(`${containingFile}:${lineno}: cannot resolve module '${moduleName}'`);
  }
}

/**
 * Used to resolve module names and files.  All the file names
 * are optionally given related to a `root` folder.
 */
export class NameResolver {
  constructor(
    private readonly compilerOptions: ts.CompilerOptions,
    private readonly moduleResolutionHost: ts.ModuleResolutionHost,
    private readonly root?: string,
  ) {}

  /**
   * Format a full name from a `fileName` and a `symbolName`.
   *
   * @see [[getSymbolFullName]] to operate directly on a symbol.
   */
  formatFullName(fileName: string, symbolName: string): string {
    return `${this.adaptFileName(fileName)}#${symbolName}`;
  }

  /**
   * Whether a symbol represents an "anonymous" type node.  If a name
   * is required for this symbol, it would have to be arbitrarily generated.
   */
  isAnonymousSymbol(symbol: ts.Symbol): boolean {
    for (const internalSymbolName in ts.InternalSymbolName) {
      if (symbol.getName() === ts.InternalSymbolName[internalSymbolName]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the full name of a symbol, including the file ("a file",
   * when the symbol is defined in multiple locations) in which it was defined.
   *
   * @see [[formatFullName]]
   */
  getSymbolFullName(symbol: ts.Symbol): string {
    if (!symbol.declarations || symbol.declarations.length === 0) {
      return null as any;
    }
    const sortedFileNames = symbol.declarations
      .map(it => it.getSourceFile().fileName)
      .sort();
    const fileName = sortedFileNames[0];
    let symbolName = symbol.getName();
    const moduleNames = this.getModuleNamespaces(symbol);
    if (moduleNames.length > 0) {
      symbolName = `${moduleNames.join('.')}.${symbolName}`;
    }
    return this.formatFullName(fileName, symbolName);
  }

  /**
   * Pretty-prints the declarations of a symbol.
   */
  symbolDeclarationsToString(symbol: ts.Symbol): string {
    if (!symbol.declarations || symbol.declarations.length === 0) {
      return `<no declaration found>`;
    }
    const locations = symbol.declarations.map(it => {
      const sourceFile = it.getSourceFile();
      const {
        line,
        character,
      } = it.getSourceFile().getLineAndCharacterOfPosition(it.getStart());
      return `${sourceFile.fileName}:${line}:${character}`;
    });
    return `${symbol.getName()} declared at ${locations.join(', ')}`;
  }

  /**
   * Adapts a file name according to the resolution policy.
   */
  adaptFileName(fileName: string): string {
    return this.root ? path.relative(this.root, fileName) : fileName;
  }

  /**
   * Resolves a module name invoked in a given node.
   */
  resolveModuleName(moduleName: string, fromNode: ts.Node): string {
    const containingFile = fromNode.getSourceFile().fileName;
    const { resolvedModule } = ts.resolveModuleName(
      moduleName,
      containingFile,
      this.compilerOptions,
      this.moduleResolutionHost,
    );
    if (!resolvedModule) {
      throw new ModuleResolutionError(
        containingFile,
        fromNode.getStart(),
        moduleName,
      );
    }
    return resolvedModule.resolvedFileName;
  }

  /**
   * Get all the namespace names of a symbol, from outermost to innermost.
   */
  private getModuleNamespaces(symbol: ts.Symbol): string[] {
    const parent: ts.Symbol | undefined = (symbol as any).parent;
    if (parent && parent.flags & ts.SymbolFlags.NamespaceModule) {
      return [...this.getModuleNamespaces(parent), parent.getName()];
    }
    return [];
  }
}
