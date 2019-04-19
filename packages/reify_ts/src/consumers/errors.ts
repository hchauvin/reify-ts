/**
 * Errors common to all consumers.
 *
 * @module
 *
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** */
import { BaseError } from 'make-error';

/**
 * Thrown when a brand has not been registered for a consumer but is part
 * of a type requested through the consumer.
 */
export class UnregisteredBrandError extends BaseError {
  constructor(public readonly brandName: string) {
    super(`brand ${brandName} has not been registered`);
  }
}

/**
 * Thrown when an attempt is made to register an already registered brand.
 */
export class AlreadyRegisteredBrandError extends BaseError {
  constructor(public readonly brandName: string) {
    super(`brand ${brandName} has already been registered`);
  }
}

/**
 * A consumer does not support a given type.  It can be, for instance,
 * that the type is not inhabited (e.g. there is no value that can have
 * this type), and so the fast checker cannot sample it.
 */
export class UnsupportedTypeError extends BaseError {}
