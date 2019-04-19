/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import libES5 from '!!raw-loader!typescript/lib/lib.es5.d.ts';
import validator from '!!raw-loader!reify-ts/lib/consumers/validator.d.ts';
import fast_checker from '!!raw-loader!reify-ts/lib/consumers/fast_checker.d.ts';
import type_name from '!!raw-loader!reify-ts/lib/consumers/type_name.d.ts';

export const DEFAULT_LIB_FILE_NAME = 'lib/lib.es5.d.ts';
export const DEFAULT_LIB_LOCATION = 'lib';

export const commonSourceFiles = {
  [DEFAULT_LIB_FILE_NAME]: libES5,
  'node_modules/reify-ts/lib/consumers/validator.d.ts': validator,
  'node_modules/reify-ts/lib/consumers/fast_checker.d.ts': fast_checker,
  'node_modules/reify-ts/lib/consumers/type_name.d.ts': type_name,
};
