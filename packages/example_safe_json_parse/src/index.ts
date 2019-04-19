/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { decode, ValidationError } from 'reify-ts/lib/consumers/validator';
import { getValidator } from './validator';
import { disablePassThrough } from 'reify-ts/lib/runtime/pass_through';

main();

interface Type {
  foo: string;
  bar?: number;
}

function main() {
  disablePassThrough(true);

  const validPayload = JSON.stringify({ foo: 'abc' });
  const value: Type = decode<Type>(getValidator(), JSON.parse(validPayload));
  if (JSON.stringify(value) !== validPayload) {
    throw new Error('expected pass-through');
  }

  const invalidPayload = JSON.stringify(10);
  try {
    const value: Type = decode(getValidator(), JSON.parse(invalidPayload));
    value;
    throw new Error('expected a ValidationError');
  } catch (err) {
    if (!(err instanceof ValidationError)) {
      throw new Error('expected a ValidationError');
    }
  }
}
