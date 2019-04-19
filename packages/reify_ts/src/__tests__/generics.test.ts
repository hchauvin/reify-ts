/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ANY, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('generics', t => {
  // Generics, when used directly: erasure of type parameters for now
  const anyWithWarning = {
    ...ANY,
    warnings: [
      {
        code: 'typeVariableErasure',
        text: "type variable 'A' could not be expanded",
      },
    ],
  };
  transformUnitTestProgram(t, 'generics').assertTypesEqual({
    GenericInterface: {
      kind: Kind.record,
      fields: {
        a: {
          type: anyWithWarning,
        },
      },
    },
    GenericTypeAlias: anyWithWarning,
  });
});
