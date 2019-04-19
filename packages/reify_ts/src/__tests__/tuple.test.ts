/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { STRING, NUMBER, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('tuple', t => {
  transformUnitTestProgram(t, 'tuple')
    .assertTypesEqual({
      Tuple: {
        kind: Kind.tuple,
        elements: [{ type: STRING }, { type: NUMBER }],
      },
      EmptyTuple: {
        kind: Kind.tuple,
        elements: [],
      },
    })
    .applyFastCheck();
});
