/**
 * Warnings that could be generated during parsing.
 *
 * @module
 *
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Map of warnings that could be generated during parsing and their formatting
 * functions.
 */
export const WARNINGS = {
  /**
   * A symbol has been marked as excluded, therefore its type is replaced by
   * `ANY`.
   */
  excludedSymbol: (symbolName: string) =>
    `symbol '${symbolName}' has been marked as excluded`,
  /**
   * A given set of keys where excluded from a record because their
   * value is callable and thus not serializable.
   */
  keysForCallableValues: (keys: string[]) =>
    `${keys.length} keys excluded because the value is callable: ${keys.join(
      ', ',
    )}`,
  /**
   * A type has count or construct signatures that are callable, not
   * serializable, and thus ignored.
   */
  hasCallOrConstructSignatures: (count: number) =>
    `this type has ${count} call or construct signatures that were ignored`,
  /**
   * A type to extract is a generic, and its type variables are erased
   * and replaced by the `ANY` type.
   */
  typeVariableErasure: (typeVariableName: string) =>
    `type variable '${typeVariableName}' could not be expanded`,
  /**
   * A JS symbol has been encountered.  Symbols cannot be serialized
   * and are replaced by the `ANY` type.
   */
  symbol: () => 'a symbol has been encountered',
  /**
   * An `object` type has been encountered and typed as `ANY`, although
   * ANY can also stand for primitive types such as `number`, `boolean`,
   * and so on.
   */
  nonPrimitiveType: () =>
    'an "object" type has been encountered (non-primitive type)',
  anyType: () =>
    'an "any" type has been encountered; use "unknown", the type-safe counterpart of "any", to remove this warning',
  neverType: () => 'a "never" type has been encountered',
  keyofType: (typeStr: string) => `the "${typeStr}" type could not be expanded`,
  conditionalType: (typeStr: string) =>
    `a conditional type could not be expanded: ${typeStr}`,
};
