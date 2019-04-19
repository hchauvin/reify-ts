/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { getFastChecker, getValidator } from '../validator';
import { getArbitrary } from 'reify-ts/lib/consumers/fast_checker';
import { getTypeName } from 'reify-ts/lib/consumers/type_name';
import {
  ExampleRequest,
  exampleApiImpl,
  exampleApi,
  ExampleResponse,
} from '../api';
import fc from 'fast-check';
import { isAfter, isEqual } from 'date-fns';
import { disablePassThrough } from 'reify-ts/lib/runtime/pass_through';
import { registerBrands } from '../brands';

test.before(() => {
  disablePassThrough(true);
  registerBrands(getValidator(), getFastChecker());
});

test('impl', t => {
  fc.assert(
    fc.property(getArbitrary<ExampleRequest>(getFastChecker()), request => {
      const response = exampleApiImpl(request);
      t.assert(response.messages.length <= request.limit);
      for (const message of response.messages) {
        t.assert(
          isAfter(message.date, request.after) ||
            isEqual(message.date, request.after),
        );
      }
    }),
  );
});

test.only('i/o boundary', t => {
  fc.assert(
    fc.property(
      fc.oneof(fc.anything(), getArbitrary<ExampleRequest>(getFastChecker())),
      requestAny => {
        const isValidRequest = getValidator()
          .getValidator(getTypeName<ExampleRequest>())
          .is(requestAny);
        if (isValidRequest) {
          t.notThrows(() => {
            const responseAny = exampleApi(requestAny);
            const isValidResponse = getValidator()
              .getValidator(getTypeName<ExampleResponse>())
              .is(responseAny);
            t.true(isValidResponse);
          });
        } else {
          t.throws(() => {
            exampleApi(requestAny);
          });
        }
      },
    ),
  );
});
