/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('callable', t => {
  transformUnitTestProgram(t, 'callable').assertTypesEqual({
    Callable: {
      kind: Kind.record,
      fields: {},
      warnings: [
        {
          code: 'hasCallOrConstructSignatures',
          text:
            'this type has 1 call or construct signatures that were ignored',
        },
      ],
    },
    CallableInterface: {
      kind: Kind.record,
      fields: {},
      warnings: [
        {
          code: 'hasCallOrConstructSignatures',
          text:
            'this type has 2 call or construct signatures that were ignored',
        },
      ],
    },
    InterfaceWithCallableProperty: {
      kind: Kind.record,
      fields: {},
      warnings: [
        {
          code: 'keysForCallableValues',
          text: '2 keys excluded because the value is callable: a, b',
        },
      ],
    },
    TypeAliasWithCallableProperty: {
      kind: Kind.record,
      fields: {},
      warnings: [
        {
          code: 'keysForCallableValues',
          text: '2 keys excluded because the value is callable: a, b',
        },
      ],
    },
    InterfaceWithConstructSignature: {
      kind: Kind.record,
      fields: {},
      warnings: [
        {
          code: 'hasCallOrConstructSignatures',
          text:
            'this type has 1 call or construct signatures that were ignored',
        },
      ],
    },
  });
});
