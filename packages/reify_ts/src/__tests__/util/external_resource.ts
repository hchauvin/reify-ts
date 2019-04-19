/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * An external resource is a test fixture that sets up some test external resource.
 * It has to be cleaned up.
 */
export interface ExternalResource {
  setup(): Promise<void>;
  teardown(): Promise<void>;
}
