/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { STRING, BOOLEAN, NUMBER, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('map', t => {
  transformUnitTestProgram(t, 'map')
    .assertTypesEqual({
      StringMap: {
        kind: Kind.map,
        key: STRING,
        value: NUMBER,
      },
      NumberMap: {
        kind: Kind.map,
        key: NUMBER,
        value: STRING,
      },
      Enum: {
        kind: Kind.enum,
        elements: [
          {
            label: 'a',
            value: 'a',
          },
          {
            label: 'b',
            value: 'b',
          },
        ],
      },
      StringInEnumMap: {
        kind: Kind.map,
        key: {
          kind: Kind.reference,
          typeName: 'Enum',
        },
        value: BOOLEAN,
      },
    })
    .applyFastCheck();
});
