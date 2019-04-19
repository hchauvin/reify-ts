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

test('enums', t => {
  transformUnitTestProgram(t, 'enums')
    .assertTypesEqual({
      StringEnum: {
        kind: Kind.enum,
        elements: [{ label: 'a', value: 'A' }, { label: 'b', value: 'B' }],
      },
      EmptyEnum: {
        kind: Kind.enum,
        elements: [],
      },
      IntegerEnum: {
        kind: Kind.enum,
        elements: [{ label: 'a', value: 0 }, { label: 'b', value: 1 }],
      },
      ConstEnum: {
        kind: Kind.enum,
        elements: [{ label: 'a', value: 0 }, { label: 'b', value: 1 }],
      },
      IntegerEnumWithAutoInitializer: {
        kind: Kind.enum,
        elements: [
          {
            value: 0,
            label: 'a',
          },
          {
            value: 1,
            label: 'b',
          },
          {
            value: 5,
            label: 'c',
          },
          {
            value: 6,
            label: 'd',
          },
          {
            value: 10,
            label: 'e',
          },
        ],
      },
      TypeAlias: {
        kind: Kind.record,
        fields: {
          a: {
            type: {
              kind: Kind.reference,
              typeName: 'NotExported',
            },
          },
        },
      },
      NotExported: {
        kind: Kind.enum,
        elements: [
          {
            value: 0,
            label: 'a',
          },
          {
            value: 1,
            label: 'b',
          },
        ],
      },
    })
    .applyFastCheck({ not: ['EmptyEnum'] });
});
