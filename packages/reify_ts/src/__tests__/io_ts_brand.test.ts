/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import { NUMBER, Kind } from '../types';
import { Integer, integerSeed } from './programs/io_ts_brand';
import test from 'ava';
import { transformUnitTestProgram } from './util/unit';

test('io_ts_brand', t => {
  transformUnitTestProgram(t, 'io_ts_brand', {
    extraFiles: [
      path.resolve(__dirname, '../../src/consumers/fast_checker.ts'),
    ],
  })
    .assertTypesEqual({
      Integer: {
        kind: Kind.brand,
        type: NUMBER,
        brand: 'Integer',
      },
      Interface: {
        kind: Kind.record,
        fields: {
          a: {
            type: {
              kind: Kind.brand,
              type: NUMBER,
              brand: 'Integer',
            },
          },
        },
      },
    })
    .applyFastCheck({
      register(fastChecker, validator) {
        fastChecker.registerBrand(integerSeed);
        validator.registerBrand(Integer);
      },
    });
});
