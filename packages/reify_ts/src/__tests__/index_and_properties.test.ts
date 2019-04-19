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

test('index_and_properties', t => {
  transformUnitTestProgram(t, 'index_and_properties')
    .assertTypesEqual({
      IndexAndPropertiesTypeAlias: {
        kind: Kind.intersection,
        types: [
          {
            kind: Kind.record,
            fields: {
              a: {
                type: BOOLEAN,
              },
            },
          },
          {
            kind: Kind.map,
            key: STRING,
            value: BOOLEAN,
          },
        ],
      },
      IndexAndPropertiesInterface: {
        kind: Kind.intersection,
        types: [
          {
            kind: Kind.record,
            fields: {
              a: {
                type: BOOLEAN,
              },
            },
          },
          {
            kind: Kind.map,
            key: STRING,
            value: BOOLEAN,
          },
        ],
      },
    })
    .applyFastCheck();
});
