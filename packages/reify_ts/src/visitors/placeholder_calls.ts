/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';
import * as path from 'path';
import { assertUnreachable } from '../internal/utils';
import { AbstractSourceFileVisitor } from '../engine/visitor';

export default class PlaceholderCallsVisitor extends AbstractSourceFileVisitor {
  protected getDirname(): string {
    return __dirname;
  }

  private normalize(relativeFileName: string): string {
    return path.normalize(path.join(this.getDirname(), relativeFileName));
  }

  protected visitNode(node: ts.Node): ts.Node {
    if (!ts.isCallExpression(node)) {
      return node;
    }

    const name = this.getFunctionDeclarationLocation(node);

    if (
      name &&
      this.isSameSourceFile(
        name.fileName,
        this.normalize('../consumers/validator'),
      )
    ) {
      if (name.name === 'decode' || name.name === 'encode') {
        this.shouldUpdateSourceFile = true;
        switch (name.name) {
          case 'decode': {
            const type = node.typeArguments
              ? this.checker.getTypeFromTypeNode(node.typeArguments[0])
              : this.getReturnType(node);
            return ts.createCall(
              ts.createPropertyAccess(node.arguments[0], name.name),
              undefined,
              [ts.createLiteral(this.getTypeFullName(type)), node.arguments[1]],
            );
          }
          case 'encode': {
            const type = node.typeArguments
              ? this.checker.getTypeFromTypeNode(node.typeArguments[0])
              : this.checker.getTypeAtLocation(node.arguments[1]);
            return ts.createCall(
              ts.createPropertyAccess(node.arguments[0], name.name),
              undefined,
              [ts.createLiteral(this.getTypeFullName(type)), node.arguments[1]],
            );
          }
          /* istanbul ignore next */
          default:
            assertUnreachable(name.name, true);
        }
      }
    }

    if (
      name &&
      this.isSameSourceFile(
        name.fileName,
        this.normalize('../consumers/fast_checker'),
      )
    ) {
      if (name.name === 'getArbitrary') {
        this.shouldUpdateSourceFile = true;
        const type = node.typeArguments
          ? this.checker.getTypeFromTypeNode(node.typeArguments[0])
          : this.checker.getTypeAtLocation(node.parent);
        return ts.createCall(
          ts.createPropertyAccess(node.arguments[0], name.name),
          undefined,
          [ts.createLiteral(this.getTypeFullName(type))],
        );
      }
    }

    if (
      name &&
      this.isSameSourceFile(
        name.fileName,
        this.normalize('../consumers/type_name'),
      )
    ) {
      if (name.name === 'getTypeName') {
        this.shouldUpdateSourceFile = true;
        if (!node.typeArguments) {
          return node; // This will hit the pass-through error if set
        }
        return ts.createLiteral(
          this.getTypeFullName(
            this.checker.getTypeFromTypeNode(node.typeArguments[0]),
          ),
        );
      }
    }

    return node;
  }
}
