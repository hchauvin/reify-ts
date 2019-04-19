/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ANY, STRING, Kind } from '../types';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('exclusion', t => {
  transformUnitTestProgram(t, 'exclusion', {
    parserOptionsOverride: {
      excludeSymbols: ['#ExcludedType$'],
    },
  }).assertTypesEqual({
    WithExcludedType: {
      kind: Kind.record,
      fields: {
        a: {
          type: {
            ...ANY,
            warnings: [
              {
                code: 'excludedSymbol',
                text: `symbol 'exclusion.ts#ExcludedType' has been marked as excluded`,
              },
            ],
          },
        },
      },
    },
    NotExcluded: STRING,
  });
});
