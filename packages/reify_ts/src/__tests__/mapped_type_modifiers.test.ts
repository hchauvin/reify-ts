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

test('mapped_type_modifiers', t => {
  transformUnitTestProgram(t, 'mapped_type_modifiers')
    .assertTypesEqual({
      Optional: {
        kind: Kind.record,
        fields: {
          mandatory: { type: STRING },
          optional: {
            type: {
              kind: Kind.optional,
              value: NUMBER,
            },
          },
        },
      },
      Readonly: {
        kind: Kind.record,
        fields: {
          mutable: { type: STRING },
          immutable: {
            type: NUMBER,
          },
        },
      },
      MutableRequiredExample: {
        kind: Kind.record,
        fields: {
          a: { type: STRING },
          b: { type: NUMBER },
        },
      },
    })
    .applyFastCheck();
});
