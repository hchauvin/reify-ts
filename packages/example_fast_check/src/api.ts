/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { decode, encode } from 'reify-ts/lib/consumers/validator';
import { getValidator } from './validator';
import { ApiLimit } from './brands/api_limit';
import { DateString } from './brands';
import fc from 'fast-check';
import { addDays, parseISO } from 'date-fns';

/** An API handler sitting at an I/O boundary */
export function exampleApi(requestAny: any): any {
  const request: ExampleRequest = decode<ExampleRequest>(
    getValidator(),
    requestAny,
  );
  const response = exampleApiImpl(request);
  return encode(getValidator(), response);
}

export type ExampleRequest = {
  after: DateString;
  limit: ApiLimit;
};

export type ExampleResponse = {
  messages: Array<{ date: DateString; message: string }>;
};

export function exampleApiImpl(request: ExampleRequest): ExampleResponse {
  const count = fc.sample(fc.integer(0, request.limit), 1)[0];
  const messages = fc.sample(fc.string(), count);

  return {
    messages: messages.map((message, index) => ({
      date: addDays(parseISO(request.after), index).toISOString() as DateString,
      message,
    })),
  };
}
