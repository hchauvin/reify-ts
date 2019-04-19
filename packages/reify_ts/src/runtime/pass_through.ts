/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BaseError } from 'make-error';

export class UnexpectedPassThroughError extends BaseError {
  constructor() {
    super('unexpected pass-through');
  }
}

let passThroughDisabled = false;

export function disablePassThrough(shouldDisable: boolean) {
  passThroughDisabled = shouldDisable;
}

export function checkPassThrough() {
  if (passThroughDisabled) {
    throw new UnexpectedPassThroughError();
  }
}
