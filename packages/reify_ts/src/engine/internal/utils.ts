/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';

/** Get a string representation of a TypeScript type. */
export function typeToString(type: ts.Type, checker: ts.TypeChecker) {
  const typeNode = checker.typeToTypeNode(type);
  const symbol = type.getSymbol();
  const typeStr = typeNode
    ? ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, typeNode, undefined as any)
    : '<unknown>';
  return symbol ? `${symbol.getName()} = ${typeStr}` : typeStr;
}
