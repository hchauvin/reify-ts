/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from 'io-ts';
import { Refinement } from 'fp-ts/lib/function';
import * as fc from 'fast-check';

export const parameterizedBrand = <
  C extends t.Any,
  N extends string,
  B extends { readonly [K in N]: symbol },
  P
>(
  codec: C,
  predicate: (p: P) => Refinement<t.TypeOf<C>, t.Branded<t.TypeOf<C>, B>>,
  name: N,
) => (p: P): t.BrandC<C, B> => {
  return t.refinement(codec, predicate(p), name);
};

interface ApiLimitBrand<max extends number> {
  readonly ApiLimit: unique symbol;
  readonly max: max;
}

export const ApiLimit2 = parameterizedBrand(
  t.number,
  <max extends number>(max: max) => (
    n,
  ): n is t.Branded<number, ApiLimitBrand<max>> =>
    Number.isInteger(n) && n >= 0 && n <= max,
  'ApiLimit',
);

export type ApiLimit2<max extends number> = number &
  t.Brand<ApiLimitBrand<max>>;

export const apiLimitSeed2 = parameterizedBrandArbitrary(
  <max extends number>(p: max) => fc.integer(0, p),
  'ApiLimit',
);

export class ParameterizedBrandArbitrary<T, B> extends fc.Arbitrary<B> {
  constructor(
    private readonly arbitrary: fc.Arbitrary<T>,
    public readonly name: string,
  ) {
    super();
  }

  generate(mrng: fc.Random): fc.Shrinkable<B> {
    return this.arbitrary.generate(mrng) as any;
  }
}

export function parameterizedBrandArbitrary<
  T,
  N extends string,
  B extends { readonly [K in N]: symbol },
  P
>(
  arbitrary: (p: P) => fc.Arbitrary<T>,
  name: string,
): (p: P) => ParameterizedBrandArbitrary<T, B> {
  return (p: P) => new ParameterizedBrandArbitrary(arbitrary(p), name);
}
