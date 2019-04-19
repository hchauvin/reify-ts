/**
 * Documentation extraction.
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
import { Documentation } from '../types';

/**
 * Extracts the documentation (text + tags) for a given symbol, if it canb be found.
 */
export function getDocumentationForSymbol(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
): Documentation | undefined {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker));
  const tags = symbol.getJsDocTags();
  if (!text && tags.length === 0) {
    return undefined;
  }
  const documentation: Documentation = {};
  if (text) {
    documentation.text = text;
  }
  if (tags.length > 0) {
    documentation.tags = tags;
  }
  return documentation;
}

/**
 * Extracts the documentation (text + tags) for a given node, if it can be found.
 */
export function getDocumentationForNode(
  node: ts.Node,
  checker: ts.TypeChecker,
): Documentation | undefined {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) {
    return undefined;
  }
  return getDocumentationForSymbol(symbol, checker);
}
