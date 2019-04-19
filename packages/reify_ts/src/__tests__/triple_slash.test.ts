/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { transformUnitTestProgram } from './util/unit';
import { Kind } from '../types';

test('triple_slash', t => {
  transformUnitTestProgram(t, 'triple_slash').assertTypesEqual(
    {
      'triple_slash/a.ts#A.Hello': {
        kind: Kind.record,
        fields: {
          world: {
            type: {
              kind: Kind.reference,
              typeName: 'triple_slash/b.ts#B.World',
            },
          },
        },
      },
      'triple_slash/b.ts#B.World': {
        kind: Kind.record,
        fields: {
          hello: {
            type: {
              kind: Kind.reference,
              typeName: 'triple_slash/a.ts#A.Hello',
            },
          },
        },
      },
    },
    { stripFileQualifiers: false },
  );
});
