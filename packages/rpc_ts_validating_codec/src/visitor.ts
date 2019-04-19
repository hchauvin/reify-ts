/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';
import * as path from 'path';
import { AbstractSourceFileVisitor } from 'reify-ts/lib/engine/visitor';

export default class RpcTsValidatingCodecVisitor extends AbstractSourceFileVisitor {
  protected visitNode(node: ts.Node): ts.Node {
    if (!ts.isCallExpression(node)) {
      return node;
    }

    const name = this.getFunctionDeclarationLocation(node);

    if (
      name &&
      this.isSameSourceFile(name.fileName, path.resolve(__dirname, 'index'))
    ) {
      if (name.name === 'getValidatingCodec') {
        this.shouldUpdateSourceFile = true;
        const serviceDefinitionType = this.checker.getTypeAtLocation(
          node.arguments[1],
        );
        const typeName =
          node.getSourceFile().fileName +
          '#typeof#' +
          node.arguments[1].getText();
        this.extractor.convertType(
          serviceDefinitionType,
          typeName,
          undefined,
          this.checker,
          undefined,
        );
        return ts.createCall(
          ts.createPropertyAccess(node.arguments[0], 'get'),
          undefined,
          [ts.createLiteral(typeName)],
        );
      }
    }

    return node;
  }
}
