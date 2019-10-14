/**
 * Parser that extracts TypeScript types from the TypeScript AST
 * and type checker.
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
import { Kind, Type, ANY, TypeEntry, TypeFor, Documentation } from '../types';
import { typeToString } from './internal/utils';
import { WARNINGS } from './warnings';
import { NameResolver } from './name_resolver';
import { typeFlagsToTypeConverters } from './internal/converters';
import { TypeExtractorOptions } from './types';
import { getDocumentationForSymbol } from './documentation';
import { TypeConversionInvariantError } from './internal/errors';
import { WorkingTypeEntries } from './internal/working_type_entries';

/**
 * Extracts TypeScript types from the TypeScript AST and the
 * TypeScript type checker.
 *
 * This extractor is shared across multiple source file reads.
 */
export class TypeExtractor {
  private workingTypeEntries = new WorkingTypeEntries();

  constructor(
    public readonly options: TypeExtractorOptions,
    private readonly nameResolver: NameResolver,
    private readonly compilerHost: ts.CompilerHost,
    private readonly addDiagnostic: (diagnostic: ts.Diagnostic) => void,
  ) {}

  /**
   * Hydrates the map of type entries from the type entries serialized
   * in a file.  The file is read using the TypeScript CompilerHost (so no
   * direct use of the local file system).
   *
   * If the file does not exist, the function silently returns.
   */
  hydrate(typeEntriesFileName: string) {
    return this.workingTypeEntries.hydrate(
      typeEntriesFileName,
      this.compilerHost,
    );
  }

  /**
   * Saves the serialized type entries in a file.  The file is written
   * using the TypeScript CompilerHost (so no direct use of the local file
   * system).
   *
   * If the file already exists, it is overwritten.
   */
  save(astFileName: string) {
    return this.workingTypeEntries.save(astFileName, this.compilerHost);
  }

  /**
   * Serializes the type entries already extracted.
   */
  getTypes(): TypeEntry[] {
    return this.workingTypeEntries.getTypes();
  }

  /**
   * Remove all the type entries with a declaration originating in a given
   * file.  This is useful for incremental compilation, when the TypeScript
   * compiler is in watch mode.
   */
  removeAllTypeEntriesFromFile(fileName: string) {
    return this.workingTypeEntries.removeAllTypeEntriesFromFile(
      this.nameResolver.adaptFileName(fileName),
    );
  }

  /**
   * Convert a type.
   *
   * @param type The TS Type to convert.
   * @param name The full name to give to the type.  If not specified, the
   * name is inferred from the symbol of the type.
   * @param documentation The documentation to associate to the type.  If not
   * specified, it is inferred from the symbol of the type.
   * @param checker The type checker to use.
   * @see [[convertEnum]] to convert an enum.
   */
  convertType(
    type: ts.Type,
    name: string | undefined,
    documentation: Documentation | undefined,
    checker: ts.TypeChecker,
    parentSymbol: ts.Symbol | undefined,
  ): Type {
    if (
      typeToString(type, checker).includes('globalThis = typeof globalThis')
    ) {
      return this.warning(type.getSymbol() || parentSymbol, 'globalThis');
    }

    if (type.flags & ts.TypeFlags.TypeVariable && !name) {
      const symbol = type.getSymbol();
      return this.warning(
        symbol || parentSymbol,
        'typeVariableErasure',
        symbol ? symbol.getEscapedName().toString() : '<anonymous>',
      );
    }

    const symbol = type.aliasSymbol || type.getSymbol();
    const key = symbol || name;
    const isAnonymous = !symbol
      ? false
      : this.nameResolver.isAnonymousSymbol(symbol);
    const symbolName =
      name || (symbol && this.nameResolver.getSymbolFullName(symbol));
    if (key && symbolName && (name || !isAnonymous)) {
      if (
        this.options.excludeSymbols.find(it => new RegExp(it).test(symbolName))
      ) {
        return this.warning(
          symbol || parentSymbol,
          'excludedSymbol',
          symbolName,
        );
      }

      let storedType = this.workingTypeEntries.get(key, symbolName);
      if (!storedType) {
        if (!documentation) {
          documentation = symbol
            ? getDocumentationForSymbol(symbol, checker)
            : undefined;
        }
        this.workingTypeEntries.set(key, symbolName, undefined, documentation);
        const convertedType = this.convertTypeInner(
          type,
          checker,
          symbol || parentSymbol,
        );
        storedType = {
          name: symbolName,
          type: convertedType,
        };
        this.workingTypeEntries.set(
          key,
          symbolName,
          convertedType,
          documentation,
        );
      }
      if (
        symbol &&
        this.nameResolver.isAnonymousSymbol(symbol) &&
        storedType.type
      ) {
        return storedType.type;
      }
      if (!name) {
        if (!storedType.name) {
          throw new Error('unexpected');
        }
        return { kind: Kind.reference, typeName: storedType.name };
      }
    }
    return this.convertTypeInner(type, checker, symbol || parentSymbol);
  }

  private extractBranding(
    type: ts.Type,
    checker: ts.TypeChecker,
    parentSymbol: ts.Symbol | undefined,
  ): null | TypeFor<Kind.brand> {
    if (!(type.flags & ts.TypeFlags.Intersection)) {
      return null;
    }
    const intersection = type as ts.UnionOrIntersectionType;
    if (intersection.types.length !== 2) {
      return null;
    }
    const secondType = intersection.types[1];
    const secondSymbol = secondType.getSymbol();
    if (
      !secondSymbol ||
      secondSymbol.getName() !== 'Brand' ||
      !('typeArguments' in secondType)
    ) {
      return null;
    }
    const typeArguments = (secondType as ts.TypeReference).typeArguments;
    if (!typeArguments || typeArguments.length !== 1) {
      return null;
    }
    const properties = typeArguments[0].getProperties();
    if (properties.length !== 1) {
      return null;
    }
    return {
      kind: Kind.brand,
      type: this.convertTypeInner(
        intersection.types[0],
        checker,
        type.getSymbol() || parentSymbol,
      ),
      brand: properties[0].getName(),
    };
  }

  private convertTypeInner(
    type: ts.Type,
    checker: ts.TypeChecker,
    parentSymbol: ts.Symbol | undefined,
  ): Type {
    const branding = this.extractBranding(type, checker, parentSymbol);
    if (branding) {
      return branding;
    }

    // The `io-ts` runtime type is derived, among other things, from the type flags
    // (see the `typeFlagsToTypeConverters` "lookup" table below).
    for (const flags in typeFlagsToTypeConverters) {
      if (type.flags & (flags as any)) {
        // The entry with the first flag match is used
        const fn = typeFlagsToTypeConverters[flags];
        try {
          return fn instanceof Function
            ? fn(type, {
                checker,
                nestedConvertType: type2 => {
                  const branding2 = this.extractBranding(
                    type2,
                    checker,
                    type.getSymbol() || parentSymbol,
                  );
                  if (branding2) {
                    return branding2;
                  }
                  return this.convertType(
                    type2,
                    undefined,
                    undefined,
                    checker,
                    type.getSymbol() || parentSymbol,
                  );
                },
                options: this.options,
                warning: this.warning.bind(this),
                nameResolver: this.nameResolver,
                parentSymbol,
              })
            : fn;
        } catch (err) {
          // We report the type conversion error for the innermost type where
          // it appears.  This way, in the type definition `{ foo: { bar: string } }`,
          // if there is an error when dealing with property "bar", the type
          // conversion is reported for `{ bar: string }`, not `{ foo: { bar: string } }`.
          if (err instanceof TypeConversionInvariantError) {
            throw err;
          }
          throw new TypeConversionInvariantError(
            typeToString(type, checker) +
              ' ' +
              (type.symbol &&
                this.nameResolver.symbolDeclarationsToString(type.symbol)),
            undefined,
            err,
          );
        }
      }
    }

    // No type converter match was found
    throw new TypeConversionInvariantError(
      typeToString(type, checker),
      'unsupported type',
    );
  }

  private warning<warning extends keyof typeof WARNINGS>(
    symbol: ts.Symbol | undefined,
    warning: warning,
    ...args: Parameters<typeof WARNINGS[warning]>
  ): TypeFor<Kind.atom> {
    const warningLevel =
      this.options.warningLevels && this.options.warningLevels[warning];

    if (warningLevel === 'silent') {
      return ANY;
    }

    const text = (WARNINGS[warning] as any)(...args);

    let diagnostic: ts.Diagnostic = {
      category:
        warningLevel === 'error'
          ? ts.DiagnosticCategory.Error
          : ts.DiagnosticCategory.Warning,
      code: `(reify_ts-${warning})` as any,
      messageText: text,
      file: undefined,
      start: undefined,
      length: undefined,
    };
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
      const sourceFile = symbol.declarations[0].getSourceFile();
      diagnostic = {
        ...diagnostic,
        file: sourceFile,
        start: symbol.declarations[0].getStart(),
        length: symbol.declarations[0].getWidth(),
      };
    }
    this.addDiagnostic(diagnostic);

    return {
      ...ANY,
      warnings: [
        {
          code: warning as string,
          text,
        },
      ],
    };
  }
}
