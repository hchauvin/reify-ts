/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { listFlags } from '../utils';

test('listFlags', t => {
  t.deepEqual(listFlags(0, [0]), [], 'no flag');
  t.deepEqual(listFlags(100, [0]), [], 'flag not found is ignored');
  t.deepEqual(listFlags(2 | 8, { A: 2, B: 4, C: 8 }), ['A', 'C']);
});
