/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Validator } from 'reify-ts/lib/consumers/validator';
import { TypeMirror } from 'reify-ts/lib/runtime/type_mirror';

let validator: Validator | undefined;

export function getValidator(): Validator {
  if (!validator) {
    const typeMirror = new TypeMirror(
      JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../types.json'), 'utf8'),
      ),
    );
    validator = new Validator(typeMirror);
  }
  return validator;
}
