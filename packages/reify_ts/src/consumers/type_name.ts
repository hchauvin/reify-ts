/**
 * Placeholder from getting a type name from a type parameter.
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
import { checkPassThrough } from '../runtime/pass_through';

export function getTypeName<_T>(): string {
  checkPassThrough();
  return '<pass-through>';
}
