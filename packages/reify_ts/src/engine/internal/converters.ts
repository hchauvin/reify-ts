/**
 * Individual type converters.  Type converters are matched using type flags.
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
import {
  Kind,
  Type,
  ANY,
  STRING,
  NUMBER,
  BOOLEAN,
  TypeFor,
  Atom,
  NULL,
} from '../../types';
import { typeToString } from './utils';
import { filterNotNull } from '../../internal/utils';
import { WARNINGS } from '../warnings';
import { NameResolver } from '../name_resolver';
import { TypeExtractorOptions } from '../types';
import { getDocumentationForSymbol } from '../documentation';
import { TypeConversionInvariantError } from './errors';

/**
 * Converts a type.
 */
type TypeConverter = (type: ts.Type, context: TypeConverterContext) => Type;

/**
 * Context passed to all the type converters.
 */
interface TypeConverterContext {
  /** The TypeScript type checker. */
  checker: ts.TypeChecker;
  /** Convert a nested type (with safeguards for recursion). */
  nestedConvertType: (type: ts.Type) => Type;
  /** Transformer options */
  options: TypeExtractorOptions;
  /** Used to emit an "ANY" type along with a warning */
  warning: <warning extends keyof typeof WARNINGS>(
    symbol: ts.Symbol | undefined,
    warning: warning,
    ...args: Parameters<typeof WARNINGS[warning]>
  ) => TypeFor<Kind.atom>;
  /** Used to resolve symbol names, module names, ... */
  nameResolver: NameResolver;
  parentSymbol: ts.Symbol | undefined;
}

/**
 * Lookup table that associate a converted to a given type flag.
 *
 * The first converter with a matching type flag is used, and the other
 * ones down the line are not applied.
 */
export const typeFlagsToTypeConverters: {
  [typeFlags: number]: Type | TypeConverter;
} = {
  // type _ = never;
  [ts.TypeFlags.Never]: (type, { checker, warning, parentSymbol }) => {
    // The never type represents the type of values that never occur.
    // It is weird to have this as the type of something that you serialize,
    // deserialize, thus the warning.
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (typeStr !== 'never') {
      throw new TypeConversionInvariantError(typeStr, 'not never');
    }
    return warning(parentSymbol, 'neverType');
  },
  // type _ = symbol;
  [ts.TypeFlags.ESSymbolLike]: (_type, { warning, parentSymbol }) => {
    return warning(parentSymbol, 'symbol');
  },
  // type A<T> = T;  (--> type of T)
  [ts.TypeFlags.TypeVariable]: (type, { warning, checker, parentSymbol }) => {
    return warning(
      parentSymbol,
      'typeVariableErasure',
      type.symbol
        ? type.symbol.getEscapedName().toString()
        : typeToString(type, checker),
    );
  },
  // type _ = string;
  [ts.TypeFlags.String]: STRING,
  // type _ = number;
  [ts.TypeFlags.Number]: NUMBER,
  // type _ = boolean;
  [ts.TypeFlags.Boolean]: BOOLEAN,
  // type _ = unknown;
  [ts.TypeFlags.Unknown]: (type, { checker }) => {
    // unknown is the type-safe counterpart of any. Anything is assignable to
    // unknown, but unknown isn’t assignable to anything but itself and any
    // without a type assertion or a control flow based narrowing.
    //
    // Unknown is probably better to use than `any`, if you really want to use
    // `any`.  That's why `unknown` is processed without a warning, whereas
    // a warning is issued if the extractor encountered an `any` type.
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (typeStr !== 'unknown') {
      throw new TypeConversionInvariantError(typeStr, 'not unknown');
    }
    return ANY;
  },
  // type _ = any;
  [ts.TypeFlags.Any]: (type, { checker, warning, parentSymbol }) => {
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (typeStr !== 'any') {
      throw new TypeConversionInvariantError(typeStr, 'not any');
    }
    return warning(parentSymbol, 'anyType');
  },
  // type _ = null;
  [ts.TypeFlags.Null]: NULL,
  // type _ = undefined;
  [ts.TypeFlags.Undefined]: (type, { checker }) => {
    // In JavaScript, 'undefined' and 'null' are different with respect to
    // serialization.  Among other things, `null` is JSON-serialized into
    // "null", and if you pass `undefined` to `JSON.stringify` you get
    // `undefined` as a return value (that is, not a string).  Also, properties
    // with an `undefined` value are excluded from records.
    //
    // In our type system, undefined is typed as optional null.
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (typeStr !== 'undefined') {
      throw new TypeConversionInvariantError(typeStr, 'not undefined');
    }
    return {
      kind: Kind.optional,
      value: NULL,
    };
  },
  // type _ = void;
  [ts.TypeFlags.Void]: (type, { checker }) => {
    // In  TypeScript, void is the absence of type.  You can only assign
    // `undefined` to a `void` variable.
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (typeStr !== 'void') {
      throw new TypeConversionInvariantError(typeStr, 'not any');
    }
    return {
      kind: Kind.optional,
      value: NULL,
    };
  },
  // type _ = keyof A;
  [ts.TypeFlags.Index]: (type, { checker, warning, parentSymbol }) => {
    const typeStr = typeToString(type, checker);
    /* istanbul ignore next */
    if (!typeStr.startsWith('keyof ')) {
      throw new TypeConversionInvariantError(typeStr, 'not keyof');
    }
    return warning(parentSymbol, 'keyofType', typeStr);
  },
  // type _<T> = T extends number ? Foo : Bar;
  [ts.TypeFlags.Conditional]: (type, { checker, warning, parentSymbol }) => {
    return warning(
      parentSymbol,
      'conditionalType',
      typeToString(type, checker),
    );
  },
  // enum _ {
  // foo = 'foo',
  // bar = 'bar',
  // }
  [ts.TypeFlags.EnumLike]: (type, { checker }) => {
    const elements: TypeFor<Kind.enum>['elements'] = [];
    let symbol = type.getSymbol();
    /* istanbul ignore next */
    if (!symbol) {
      throw new TypeConversionInvariantError(
        typeToString(type, checker),
        'expected a symbol for an enum-like type',
      );
    }
    if ((symbol.flags & ts.SymbolFlags.EnumMember) !== 0) {
      // NOTE: No idea why that might be happening, but in some instances
      // the symbol points to the first enum number and not the enum itself.
      // In these cases, we go back to the parent.
      symbol = (symbol as any).parent;
    }
    if (symbol && symbol.exports) {
      let defaultNumberInitializer = 0;
      symbol.exports.forEach((enumMemberSymbol, key) => {
        if (!enumMemberSymbol.valueDeclaration) {
          // NOTE: We encountered this case where an enum and a namespace bear the
          // same name.  The namespaced members are then listed as enum
          // members without a value declaration.
          return;
        }
        /* istanbul ignore next */
        if (!ts.isEnumMember(enumMemberSymbol.valueDeclaration)) {
          throw new TypeConversionInvariantError(
            typeToString(type, checker),
            `expected an enum member`,
          );
        }
        const expr = enumMemberSymbol.valueDeclaration.initializer;
        let value: string | number;
        if (expr) {
          if (ts.isStringLiteral(expr)) {
            value = expr.text;
          } else if (ts.isNumericLiteral(expr)) {
            value = Number.parseFloat(expr.text);
            defaultNumberInitializer = value + 1;
          } else if (ts.isPrefixUnaryExpression(expr)) {
            const text = expr.getText();
            /* istanbul ignore next */
            if (!text.startsWith('-') && !text.startsWith('+')) {
              throw new TypeConversionInvariantError(
                typeToString(type, checker),
                `expected a prefix unary expression with the -/+ unary operator, got "${text}"`,
              );
            }
            value = Number.parseFloat(text);
            defaultNumberInitializer = value + 1;
          } else {
            /* istanbul ignore next */
            throw new TypeConversionInvariantError(
              typeToString(type, checker),
              `expected a string literal, numeric literal, or prefix unary expression, got "${expr.getText()}"`,
            );
          }
        } else {
          value = defaultNumberInitializer++;
        }
        elements.push({
          value,
          label: key.toString(),
        });
      });
    }
    return {
      kind: Kind.enum,
      elements,
    };
  },
  // type _ = true;   (or type _ = false;)
  [ts.TypeFlags.BooleanLiteral]: (type: ts.LiteralType, { checker }) => {
    const intrinsicName = (type as any).intrinsicName;
    let value: boolean;
    switch (intrinsicName) {
      case 'true':
        value = true;
        break;

      case 'false':
        value = false;
        break;

      /* istanbul ignore next */
      default:
        throw new TypeConversionInvariantError(
          typeToString(type, checker),
          `unexpected intrinsic name for a boolean literal: "${intrinsicName}"`,
        );
    }

    return {
      kind: Kind.literal,
      atom: Atom.boolean,
      value,
    };
  },
  // type _ = 'foo';  (or type _ = 10;)
  [ts.TypeFlags.Literal]: (type: ts.LiteralType, { checker }) => {
    switch (typeof type.value) {
      case 'number':
        return {
          kind: Kind.literal,
          atom: Atom.number,
          value: type.value,
        };

      case 'string':
        return {
          kind: Kind.literal,
          atom: Atom.string,
          value: type.value,
        };

      /* istanbul ignore next */
      default:
        throw new TypeConversionInvariantError(
          typeToString(type, checker),
          `unexpected literal value type: ${typeof type.value}`,
        );
    }
  },
  // type _ = { foo: 'bar' } & { qux: number };
  [ts.TypeFlags.Intersection]: (
    type: ts.UnionOrIntersectionType,
    { nestedConvertType },
  ) => {
    return {
      kind: Kind.intersection,
      types: filterNotNull(type.types.map(it => nestedConvertType(it))),
    };
  },
  // type _ = { foo: string } | { bar: number };
  [ts.TypeFlags.Union]: (
    type: ts.UnionOrIntersectionType,
    { nestedConvertType },
  ) => {
    return {
      kind: Kind.union,
      types: filterNotNull(type.types.map(it => nestedConvertType(it))),
    };
  },
  // type _ = string[];            (Array)
  // type _ = [string, number];    (Tuple)
  // type _ = { foo: string };     (Dictionary)
  [ts.TypeFlags.Object]: (
    type: ts.ObjectType,
    {
      checker,
      nestedConvertType,
      options,
      warning,
      nameResolver,
      parentSymbol,
    },
  ) => {
    const symbolForWarnings = type.getSymbol() || parentSymbol;

    if (isArrayType(type)) {
      const elementTypeOrUndefined = nestedConvertType(
        getArrayElementTypeOrUndefined(type, checker),
      );
      return {
        kind: Kind.array,
        element: getNotNullOrUndefinedType(elementTypeOrUndefined),
      };
    } else if (
      type.objectFlags & ts.ObjectFlags.Reference &&
      !(type.objectFlags & ts.ObjectFlags.ClassOrInterface)
    ) {
      // Tuple

      // tslint:disable-next-line no-unnecessary-type-assertion
      const referenceType = type as ts.TypeReference;
      if (!referenceType.typeArguments) {
        // Empty tuple
        return {
          kind: Kind.tuple,
          elements: [],
        };
      }
      return {
        kind: Kind.tuple,
        elements: filterNotNull(
          referenceType.typeArguments.map(it => nestedConvertType(it)),
        ).map(type => ({ type })),
      };
    } else {
      // Dictionary/record
      const properties = type.getProperties();

      const keysForCallableValues: string[] = [];
      const ans: Type = {
        kind: Kind.record,
        fields: properties.reduce(
          (acc, property) => {
            let propertyType = checker.getTypeOfSymbolAtLocation(
              property,
              property.valueDeclaration,
            );
            if ((propertyType as any).intrinsicName === 'error') {
              propertyType = (property as any).type;
              if (!propertyType) {
                if (property.getName() === 'prototype') {
                  return acc;
                }
                throw new TypeConversionInvariantError(
                  typeToString(type, checker),
                  `cannot get type of property "${property.getName()}"`,
                );
              }
            }
            if (isCallable(propertyType)) {
              // Remove callables from keys
              keysForCallableValues.push(property.getName());
              return acc;
            }
            const convertedType = nestedConvertType(propertyType);
            const field: TypeFor<Kind.record>['fields'][0] = {
              type:
                (property.flags & ts.SymbolFlags.Optional) !== 0 ||
                options.allOptional
                  ? { kind: Kind.optional, value: convertedType }
                  : convertedType,
            };
            const documentation = getDocumentationForSymbol(property, checker);
            if (documentation) field.documentation = documentation;
            return {
              ...acc,
              [property.getName()]: field,
            };
          },
          {} as TypeFor<Kind.record>['fields'],
        ),
      } as Type;
      if (keysForCallableValues.length > 0) {
        ans.warnings = [
          ...(ans.warnings || []),
          ...(warning(
            symbolForWarnings,
            'keysForCallableValues',
            keysForCallableValues,
          ).warnings || []),
        ];
      }
      if (
        type.getCallSignatures().length > 0 ||
        type.getConstructSignatures().length > 0
      ) {
        ans.warnings = [
          ...(ans.warnings || []),
          ...(warning(
            symbolForWarnings,
            'hasCallOrConstructSignatures',
            type.getCallSignatures().length +
              type.getConstructSignatures().length,
          ).warnings || []),
        ];
      }

      const numberIndexType = type.getNumberIndexType();
      const stringIndexType = type.getStringIndexType();
      let indexAns: Type | undefined;
      if (numberIndexType) {
        indexAns = {
          kind: Kind.map,
          key: NUMBER,
          value: nestedConvertType(numberIndexType)!,
        };
      } else if (stringIndexType) {
        indexAns = {
          kind: Kind.map,
          key: STRING,
          value: nestedConvertType(stringIndexType)!,
        };
      } else if ((type.objectFlags & ts.ObjectFlags.Mapped) !== 0) {
        const constraintType = (type as any).constraintType as ts.Type;
        const templateType = (type as any).templateType as ts.Type;
        if (constraintType.getSymbol()) {
          const key: Type =
            constraintType.flags & ts.TypeFlags.TypeVariable
              ? {
                  ...warning(
                    symbolForWarnings,
                    'typeVariableErasure',
                    constraintType.symbol.getName(),
                  ),
                  ...STRING,
                }
              : {
                  kind: Kind.reference,
                  typeName: nameResolver.getSymbolFullName(
                    constraintType.getSymbol()!,
                  ),
                };
          return {
            kind: Kind.map,
            key,
            value: nestedConvertType(templateType)!,
          };
        }
      }

      if (!indexAns) {
        return ans;
      }

      if (properties.length === 0) {
        return indexAns;
      }

      return {
        kind: Kind.intersection,
        types: [ans, indexAns],
      };
    }
  },
  // type _ = object;
  [ts.TypeFlags.NonPrimitive]: (
    type: ts.Type,
    { warning, parentSymbol, checker },
  ) => {
    const intrinsicName = (type as any).intrinsicName;
    if (intrinsicName !== 'object') {
      throw new TypeConversionInvariantError(
        typeToString(type, checker),
        `expected "object" intrinsic name, got "${intrinsicName}"`,
      );
    }
    return warning(parentSymbol || type.getSymbol(), 'nonPrimitiveType');
  },
};

/** Whether the given type represents an array. */
function isArrayType(type: ts.Type) {
  const symbol = type.getSymbol();
  if (!symbol) return false;
  const escapedName = symbol.getEscapedName();
  return escapedName === 'Array';
}

/**
 * Gets the type of the elements of an array, or undefined (this is the return
 * type of `Array.prototype.pop`).
 *
 * @param type The array type.
 * @param checker The type checker.
 */
function getArrayElementTypeOrUndefined(
  type: ts.Type,
  checker: ts.TypeChecker,
): ts.Type {
  // We get the type of an array element by looking at the return value
  // of the `pop` member function.
  const popProperty = type.getProperty('pop');
  /* istanbul ignore next */
  if (!popProperty) {
    throw new TypeConversionInvariantError(
      typeToString(type, checker),
      "expected 'pop' property on array type",
    );
  }
  const pop = checker.getTypeOfSymbolAtLocation(
    popProperty,
    popProperty.valueDeclaration,
  );
  return checker
    .getSignaturesOfType(pop, ts.SignatureKind.Call)[0]
    .getReturnType();
}

/** Whether the given type represents a callable object. */
function isCallable(type: ts.Type): boolean {
  const callSignatures = type.getCallSignatures();
  return callSignatures && callSignatures.length > 0;
}

/** Try to get a not null or undefined type from a type. */
function getNotNullOrUndefinedType(type: Type): Type {
  if (type.kind === Kind.optional) {
    type = type.value;
  }
  if (type.kind === Kind.union) {
    const types = type.types.filter(it => {
      if (it.kind === Kind.optional) {
        return false;
      }
      if (it.kind === Kind.atom && it.atom === Atom.null) {
        return false;
      }
      return true;
    });
    if (types.length === 0) {
      return type;
    }
    if (types.length === 1) {
      return types[0];
    }
    return {
      ...type,
      types,
    };
  }
  return type;
}
