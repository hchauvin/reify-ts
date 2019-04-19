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

test('intersection_rewrite', t => {
  transformUnitTestProgram(t, 'intersection_rewrite')
    .assertTypesEqual({
      IntersectionUnionIntersection: {
        kind: Kind.union,
        types: [
          {
            kind: Kind.intersection,
            types: [
              {
                kind: Kind.record,
                fields: {
                  a: {
                    type: STRING,
                  },
                },
              },
              {
                kind: Kind.record,
                fields: {
                  b: {
                    type: STRING,
                  },
                },
              },
            ],
          },
          {
            kind: Kind.intersection,
            types: [
              {
                kind: Kind.record,
                fields: {
                  a: { type: STRING },
                },
              },
              {
                kind: Kind.record,
                fields: {
                  c: { type: STRING },
                },
              },
            ],
          },
        ],
      },
      IntersectionUnionIntersectionWithInterface: {
        kind: Kind.union,
        types: [
          {
            kind: Kind.intersection,
            types: [
              {
                kind: Kind.reference,
                typeName: 'Interface',
              },
              {
                kind: Kind.record,
                fields: {
                  b: { type: STRING },
                },
              },
            ],
          },
          {
            kind: Kind.intersection,
            types: [
              {
                kind: Kind.reference,
                typeName: 'Interface',
              },
              {
                kind: Kind.record,
                fields: {
                  c: {
                    type: STRING,
                  },
                },
              },
            ],
          },
        ],
      },
      Interface: {
        kind: Kind.record,
        fields: {
          a: {
            type: STRING,
          },
        },
      },
      IntersectionThree: {
        kind: Kind.intersection,
        types: [
          {
            kind: Kind.record,
            fields: {
              a: {
                type: STRING,
              },
            },
          },
          {
            kind: Kind.record,
            fields: {
              b: {
                type: STRING,
              },
            },
          },
          {
            kind: Kind.record,
            fields: {
              c: {
                type: STRING,
              },
            },
          },
        ],
      },
    })
    .applyFastCheck();
});
