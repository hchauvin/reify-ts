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

test('array', t => {
  transformUnitTestProgram(t, 'array')
    .assertTypesEqual({
      Array1: {
        kind: Kind.array,
        element: STRING,
      },
      Array2: {
        kind: Kind.array,
        element: NUMBER,
      },
    })
    .applyFastCheck();
});
