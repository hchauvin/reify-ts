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

test('documentation', t => {
  transformUnitTestProgram(t, 'documentation')
    .assertEntriesEqual({
      TypeAlias: {
        type: NUMBER,
        documentation: { text: 'Documentation' },
      },
      RecordTypeAlias: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: STRING,
              documentation: { text: 'Documentation: a' },
            },
          },
        },
        documentation: { text: 'Documentation' },
      },
      Interface: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: STRING,
              documentation: { text: 'Documentation: a' },
            },
          },
        },
        documentation: { text: 'Documentation' },
      },
      WithTags: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: STRING,
              documentation: {
                text: 'Documentation: a',
                tags: [
                  {
                    name: 'qux',
                    text: 'bar',
                  },
                ],
              },
            },
          },
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
    })
    .applyFastCheck();
});
