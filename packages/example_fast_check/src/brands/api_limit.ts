/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from 'io-ts';
import * as fc from 'fast-check';
import { brandArbitrary } from 'reify-ts/lib/consumers/fast_checker';

export const API_LIMIT = 20;

interface ApiLimitBrand {
  readonly ApiLimit: unique symbol;
}

export const ApiLimit = t.brand(
  t.number,
  (n): n is t.Branded<number, ApiLimitBrand> =>
    Number.isInteger(n) && n >= 0 && n <= API_LIMIT,
  'ApiLimit',
);

export type ApiLimit = t.TypeOf<typeof ApiLimit>;

export const apiLimitSeed = brandArbitrary(
  fc.integer(0, API_LIMIT),
  'ApiLimit',
);
