/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Kind, Type, ANY, STRING, BOOLEAN, NUMBER, NULL } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('atoms', t => {
  const OPTIONAL_NULL: Type = {
    kind: Kind.optional,
    value: NULL,
  };

  transformUnitTestProgram(t, 'atoms')
    .assertTypesEqual({
      AtomAny: {
        ...ANY,
        warnings: [
          {
            code: 'anyType',
            text:
              'an "any" type has been encountered; use "unknown", the type-safe counterpart of "any", to remove this warning',
          },
        ],
      },
      AtomString: STRING,
      AtomNumber: NUMBER,
      AtomBoolean: BOOLEAN,
      AtomObject: {
        ...ANY,
        warnings: [
          {
            code: 'nonPrimitiveType',
            text: 'an "object" type has been encountered (non-primitive type)',
          },
        ],
      },
      AtomUnknown: ANY,
      AtomVoid: OPTIONAL_NULL,
      AtomUndefined: OPTIONAL_NULL,
      AtomNever: {
        ...ANY,
        warnings: [
          {
            code: 'neverType',
            text: 'a "never" type has been encountered',
          },
        ],
      },
    })
    .applyFastCheck();
});
