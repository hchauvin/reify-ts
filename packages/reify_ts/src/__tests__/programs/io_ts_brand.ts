import * as t from 'io-ts';
import * as fc from 'fast-check';
import { brandArbitrary } from '../../consumers/fast_checker';

interface IntegerBrand {
  readonly Integer: unique symbol;
}

export const Integer = t.brand(
  t.number,
  (n): n is t.Branded<number, IntegerBrand> => Number.isInteger(n),
  'Integer',
);
export const integerSeed = brandArbitrary(fc.integer(), 'Integer');

export type Integer = t.TypeOf<typeof Integer>;

export interface Interface {
  a: Integer;
}
