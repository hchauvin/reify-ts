/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as _ from 'lodash';
import { BaseError } from 'make-error';
import { TypeEntry } from '../types';

type ExtendedTypeEntry = TypeEntry & {
  isRecursive?: boolean;
  directTypeDependencies?: string[];
  indirectTypeDependencies?: string[];
};

/**
 * Throwns when a type name is not found in a [[TypeMirror]].
 */
export class UnknownTypeError extends BaseError {
  /** @ignore */
  constructor(public readonly typeName: string) {
    super(`type ${typeName} cannot be found`);
  }
}

export class TypeMirror {
  private types: {
    [typeName: string]: ExtendedTypeEntry;
  };

  constructor(types: TypeEntry[]) {
    this.types = {};
    for (const type of types) {
      this.types[type.name] = type;
    }
  }

  private getExtendedType(typeName: string): ExtendedTypeEntry {
    const type = this.types[typeName];
    if (!type) {
      throw new UnknownTypeError(typeName);
    }
    return type;
  }

  getType(typeName: string): TypeEntry {
    return this.getExtendedType(typeName);
  }

  getTypes(): TypeEntry[] {
    return Object.values(this.types);
  }
}
