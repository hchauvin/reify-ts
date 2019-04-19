/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Kind, Atom } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('literal', t => {
  transformUnitTestProgram(t, 'literal')
    .assertTypesEqual({
      StringLiteral: {
        kind: Kind.literal,
        atom: Atom.string,
        value: 'a',
      },
      NumberLiteral: {
        kind: Kind.literal,
        atom: Atom.number,
        value: 10,
      },
      NegativeNumberLiteral: {
        kind: Kind.literal,
        atom: Atom.number,
        value: -10,
      },
      BooleanLiteralTrue: {
        kind: Kind.literal,
        atom: Atom.boolean,
        value: true,
      },
      BooleanLiteralFalse: {
        kind: Kind.literal,
        atom: Atom.boolean,
        value: false,
      },
    })
    .applyFastCheck();
});
