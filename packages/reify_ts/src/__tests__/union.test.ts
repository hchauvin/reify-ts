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

test('union', t => {
  transformUnitTestProgram(t, 'union')
    .assertTypesEqual({
      Union: {
        kind: Kind.union,
        types: [
          {
            kind: Kind.literal,
            atom: Atom.string,
            value: 'a',
          },
          {
            kind: Kind.literal,
            atom: Atom.string,
            value: 'b',
          },
        ],
      },
      Union2: {
        kind: Kind.union,
        types: [
          {
            kind: Kind.literal,
            atom: Atom.string,
            value: 'a',
          },
          {
            kind: Kind.literal,
            atom: Atom.string,
            value: 'b',
          },
          {
            kind: Kind.literal,
            atom: Atom.string,
            value: 'c',
          },
        ],
      },
    })
    .applyFastCheck();
});
