/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { STRING, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('recursion', t => {
  transformUnitTestProgram(t, 'recursion')
    .assertTypesEqual({
      LinkedListNode: {
        kind: Kind.record,
        fields: {
          next: {
            type: {
              kind: Kind.optional,
              value: {
                kind: Kind.reference,
                typeName: 'LinkedListNode',
              },
            },
          },
        },
      },
      A: {
        kind: Kind.record,
        fields: {
          d: {
            type: {
              kind: Kind.union,
              types: [
                STRING,
                {
                  kind: Kind.reference,
                  typeName: 'A',
                },
              ],
            },
          },
        },
      },
    })
    .applyFastCheck();
});
