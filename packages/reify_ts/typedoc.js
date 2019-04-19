/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  out: 'doc',
  exclude: ['**/__tests__/**', '**/benchmark/**', '**/internal/**'],
  mode: 'modules',
  excludeExternals: true,
  excludeNotExported: true,
  excludePrivate: true,
  listInvalidSymbolLinks: true,
  hideGenerator: true,
  theme: 'default',
};
