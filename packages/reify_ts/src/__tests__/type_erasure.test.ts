/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { STRING, BOOLEAN, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('type_erasure', t => {
  transformUnitTestProgram(t, 'type_erasure')
    .assertTypesEqual({
      MapWithGenericKey: {
        kind: Kind.map,
        key: {
          ...STRING,
          warnings: [
            {
              code: 'typeVariableErasure',
              text: "type variable 'K' could not be expanded",
            },
          ],
        },
        value: BOOLEAN,
      },
    })
    .applyFastCheck();
});
