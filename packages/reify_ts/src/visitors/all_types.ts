/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';
import { getDocumentationForNode } from '../engine/documentation';
import { AbstractSourceFileVisitor } from '../engine/visitor';

export interface AllTypesVisitorOptions {
  includeAllDeclarations: boolean;
}

export default class AllTypesVisitor extends AbstractSourceFileVisitor {
  getVisitorOptions(): AllTypesVisitorOptions {
    return this.visitorOptions as any;
  }

  protected visitNode(node: ts.Node): ts.Node {
    if (ts.isNamedExports(node)) {
      for (const element of node.elements) {
        this.extractor.convertType(
          this.checker.getTypeAtLocation(element),
          this.nameResolver.formatFullName(
            element.getSourceFile().fileName,
            element.name.getText(),
          ),
          undefined,
          this.checker,
          undefined,
        );
      }
    } else if (ts.isExportAssignment(node)) {
      this.extractor.convertType(
        this.checker.getTypeAtLocation(node.expression),
        this.nameResolver.formatFullName(
          node.getSourceFile().fileName,
          '$Default',
        ),
        getDocumentationForNode(node.expression, this.checker),
        this.checker,
        undefined,
      );
    }

    if (!this.getVisitorOptions().includeAllDeclarations) {
      const modifiers = node.modifiers;
      if (
        !modifiers ||
        !modifiers.find(it => it.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        return node;
      }
    }

    if (ts.isEnumDeclaration(node)) {
      this.extractor.convertType(
        this.checker.getTypeAtLocation(node),
        this.nameResolver.formatFullName(
          node.getSourceFile().fileName,
          node.name.getText(),
        ),
        getDocumentationForNode(node.name, this.checker),
        this.checker,
        this.checker.getSymbolAtLocation(node.name),
      );
      return node;
    } else if (ts.isInterfaceDeclaration(node)) {
      this.extractor.convertType(
        this.checker.getTypeAtLocation(node),
        undefined,
        getDocumentationForNode(node.name, this.checker),
        this.checker,
        this.checker.getSymbolAtLocation(node.name),
      );
      return node;
    } else if (ts.isTypeAliasDeclaration(node)) {
      this.extractor.convertType(
        this.checker.getTypeAtLocation(node),
        this.nameResolver.formatFullName(
          node.getSourceFile().fileName,
          node.name.getText(),
        ),
        getDocumentationForNode(node.name, this.checker),
        this.checker,
        this.checker.getSymbolAtLocation(node.name),
      );
      return node;
    }
    return node;
  }
}
