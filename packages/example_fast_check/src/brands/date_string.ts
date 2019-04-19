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
import { addMinutes } from 'date-fns';
import { ValidationError } from 'reify-ts/lib/consumers/validator';

interface DateStringBrand {
  readonly DateString: unique symbol;
}

export const DateString = t.brand(
  t.string,
  (s): s is t.Branded<string, DateStringBrand> => {
    const d = new Date(s);
    return !isNaN(d.getTime());
  },
  'DateString',
);

export type DateString = t.TypeOf<typeof DateString>;
export const dateStringSeed = brandArbitrary(
  fc.float().map(offset => {
    const res = DateString.decode(
      addMinutes(
        new Date(2014, 6, 10, 12, 0),
        (offset - 0.5) * 1000,
      ).toISOString(),
    );
    if (res.isLeft()) {
      throw new ValidationError(res);
    }
    return res.value;
  }),
  'DateString',
);
