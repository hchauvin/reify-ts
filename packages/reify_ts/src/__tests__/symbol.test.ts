/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ANY, STRING, Kind, Type } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('symbol', t => {
  const ANY_WITH_SYMBOL_WARNING: Type = {
    ...ANY,
    warnings: [
      {
        code: 'symbol',
        text: 'a symbol has been encountered',
      },
    ],
  };
  transformUnitTestProgram(t, 'symbol').assertTypesEqual({
    Symbol: ANY_WITH_SYMBOL_WARNING,
    Interface: {
      kind: Kind.record,
      fields: {
        prop: {
          type: STRING,
        },
        symbolValue: {
          type: ANY_WITH_SYMBOL_WARNING,
        },
      },
    },
  });
});
