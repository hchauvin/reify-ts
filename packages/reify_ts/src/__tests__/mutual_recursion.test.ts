/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('mutual_recursion', t => {
  transformUnitTestProgram(t, 'mutual_recursion')
    .assertTypesEqual({
      A: {
        kind: Kind.record,
        fields: {
          b: {
            type: {
              kind: Kind.optional,
              value: {
                kind: Kind.reference,
                typeName: 'B',
              },
            },
          },
        },
      },
      B: {
        kind: Kind.record,
        fields: {
          a: {
            type: {
              kind: Kind.optional,
              value: {
                kind: Kind.reference,
                typeName: 'A',
              },
            },
          },
        },
      },
    })
    .applyFastCheck();
});
