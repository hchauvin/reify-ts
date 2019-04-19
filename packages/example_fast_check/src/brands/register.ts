/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Validator } from 'reify-ts/lib/consumers/validator';
import {
  FastChecker,
  BrandArbitrary,
} from 'reify-ts/lib/consumers/fast_checker';
import { ApiLimit, apiLimitSeed } from './api_limit';
import { DateString, dateStringSeed } from './date_string';
import * as t from 'io-ts';

function entry<
  C extends t.Any,
  N extends string,
  B extends { readonly [K in N]: symbol }
>(
  forValidator: t.BrandC<C, B>,
  forFastChecker: BrandArbitrary<C, B>,
): [t.BrandC<t.Any, B>, BrandArbitrary<t.Any, B>] {
  return [forValidator, forFastChecker];
}

const registry = [
  entry(ApiLimit, apiLimitSeed),
  entry(DateString, dateStringSeed),
];

export function registerBrands(
  validator?: Validator,
  fastChecker?: FastChecker,
) {
  for (const [forValidator, forFastChecker] of registry) {
    validator && validator.registerBrand(forValidator);
    fastChecker && fastChecker.registerBrand(forFastChecker);
  }
}
