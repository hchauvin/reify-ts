/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { Kind, NUMBER, Atom, STRING } from '../types';
import { transformUnitTestProgram } from './util/unit';

test('predefined_conditional_types', t => {
  transformUnitTestProgram(t, 'predefined_conditional_types').assertTypesEqual({
    PickExample: {
      kind: Kind.record,
      fields: {
        a: {
          type: NUMBER,
        },
      },
    },
    ExcludeExample: {
      kind: Kind.literal,
      atom: Atom.string,
      value: 'b',
    },
    ExtractExample: {
      kind: Kind.literal,
      atom: Atom.string,
      value: 'b',
    },
    NonNullableExample: {
      kind: Kind.literal,
      atom: Atom.string,
      value: 'a',
    },
    ReturnTypeExample: NUMBER,
    InstanceTypeExample: {
      kind: Kind.record,
      fields: {
        a: { type: STRING },
        b: { type: NUMBER },
      },
    },
    ParametersExample: {
      kind: Kind.tuple,
      elements: [
        {
          type: NUMBER,
        },
        {
          type: STRING,
        },
      ],
    },
    ConstructorParametersExample: {
      kind: Kind.tuple,
      elements: [
        {
          type: STRING,
        },
        {
          type: NUMBER,
        },
      ],
    },
  });
});
