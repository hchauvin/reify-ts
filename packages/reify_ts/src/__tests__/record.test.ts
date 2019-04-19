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

test('record', t => {
  transformUnitTestProgram(t, 'record')
    .assertTypesEqual({
      TypeAlias: {
        kind: Kind.record,
        fields: {
          a: { type: STRING },
          b: { type: NUMBER },
        },
      },
      IntersectionTypeAlias: {
        kind: Kind.intersection,
        types: [
          {
            kind: Kind.reference,
            typeName: 'TypeAlias',
          },
          {
            kind: Kind.record,
            fields: {
              c: { type: NUMBER },
            },
          },
        ],
      },
      Interface: {
        kind: Kind.record,
        fields: {
          a: { type: STRING },
          b: { type: NUMBER },
        },
      },
      SubInterface: {
        kind: Kind.record,
        fields: {
          a: { type: STRING },
          b: { type: NUMBER },
          c: { type: NUMBER },
        },
      },
      InterfaceExtendsKlass: {
        kind: Kind.record,
        fields: {
          d: { type: STRING },
          e: { type: NUMBER },
          f: { type: NUMBER },
        },
      },
    })
    .applyFastCheck();
});
