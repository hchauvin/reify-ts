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

test('intersection', t => {
  transformUnitTestProgram(t, 'intersection').assertTypesEqual({
    Intersection: {
      kind: Kind.intersection,
      types: [
        STRING,
        {
          kind: Kind.record,
          fields: {
            a: { type: STRING },
          },
        },
      ],
    },
  });
  // Cannot fast-check as the intersection is not inhabited.
});
