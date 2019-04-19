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

test('import', t => {
  transformUnitTestProgram(t, 'import')
    .assertTypesEqual(
      {
        ['import/b.ts#World']: STRING,
        ['import/a.ts#Hello']: {
          kind: Kind.record,
          fields: {
            world: {
              type: STRING,
            },
          },
        },
      },
      { stripFileQualifiers: false },
    )
    .applyFastCheck();
});
