/**
 * Use runtime type reflection for payload validation (encoding/decoding).  The
 * underlying engine is the `io-ts` engine.
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
import * as t from 'io-ts';
import * as _ from 'lodash';
import { Kind, Atom, Type } from '../types';
import { BaseError } from 'make-error';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { TypeMirror } from '../runtime/type_mirror';
import { assertUnreachable, tuple } from '../internal/utils';
import { checkPassThrough } from '../runtime/pass_through';
import { UnregisteredBrandError, AlreadyRegisteredBrandError } from './errors';

/**
 * Placeholder to decode a payload and validate its shape against the type
 * given in the type parameter.
 *
 * With the `placeholder_calls` visitor, this placeholder is replaced during TypeScript
 * AST transformation with a call to [[Validator.decode]] using the
 * extracted type name.
 */
export function decode<T>(_validator: Validator, payload: any): T {
  checkPassThrough();
  return payload;
}

/**
 * Placeholder to encode a payload according to the type given in the type
 * parameter.
 *
 * With the `placeholder_calls` visitor, this placeholder is replaced during TypeScript
 * AST transformation with a call to [[Validator.encode]] using the
 * extracted type name.
 */
export function encode<T>(_validator: Validator, payload: T): any {
  checkPassThrough();
  return payload as any;
}

/**
 * Thrown when payload validation fails.
 */
export class ValidationError extends BaseError {
  /** @ignore */
  constructor(public readonly validation: t.Validation<any>) {
    super(PathReporter.report(validation).join('\n'));
  }
}

/**
 * Validation engine that uses a type mirror for payload validation.
 */
export class Validator {
  private validators: { [typeName: string]: t.Mixed } = {};
  private brandValidators: { [brand: string]: t.BrandC<t.Any, any> } = {};

  /** Creates a validation engine from a type mirror. */
  constructor(public readonly ast: TypeMirror) {}

  /**
   * Registers a brand validator for a given brand.
   *
   * @throws [[AlreadyRegisteredBrandError]] if the brand has already been
   * registered.
   */
  registerBrand<A extends t.Any, B>(brandValidator: t.BrandC<A, B>) {
    if (this.brandValidators[brandValidator.name]) {
      throw new AlreadyRegisteredBrandError(brandValidator.name);
    }
    this.brandValidators[brandValidator.name] = brandValidator;
  }

  /** Decodes a payload and validates it against the given type name. */
  decode(typeName: string, payload: any): any {
    const validation = this.getValidator(typeName).decode(payload);
    if (validation.isLeft()) {
      throw new ValidationError(validation);
    }
    return validation.value;
  }

  /** Encodes a payload according to a given type name. */
  encode(typeName: string, payload: any): any {
    return this.getValidator(typeName).encode(payload);
  }

  /** Gets an `io-ts` validator for a given type name. */
  getValidator(typeName: string): t.Mixed {
    if (!this.validators[typeName]) {
      const type = this.ast.getType(typeName);
      this.validators[typeName] = this.getValidatorForType(type.type);
    }
    return this.validators[typeName];
  }

  /**
   * Get a validator from a type AST.  All the type references are resolved
   * using the type mirror.
   */
  getValidatorForType(type: Type): t.Mixed {
    switch (type.kind) {
      case Kind.atom:
        return ioTypeForAtom[type.atom];

      case Kind.record:
        return t.type(
          _.mapValues(type.fields, field =>
            this.getValidatorForType(field.type),
          ),
        );

      case Kind.union:
        return safeUnion(type.types.map(it => this.getValidatorForType(it)));

      case Kind.intersection:
        return safeIntersection(
          type.types.map(it => this.getValidatorForType(it)),
        );

      case Kind.enum:
        return safeUnion(type.elements.map(it => t.literal(it.value)));

      case Kind.array:
        return t.array(this.getValidatorForType(type.element));

      case Kind.map:
        if (type.key.kind === Kind.atom && type.key.atom === Atom.number) {
          // In JavaScript, numbers are perfectly valid as map keys.  However,
          // their type will always be "string".
          return t.record(StringNumber, this.getValidatorForType(type.value));
        }
        if (type.key.kind === Kind.reference) {
          const { type: keyType } = this.ast.getType(type.key.typeName);
          if (keyType.kind === Kind.enum) {
            // Because the typeof of a key will always be "string" in JavaScript,
            // we must ensure that numbers are represented as string.
            // Also, when the key type is an enum, all the enum values must
            // be present in the map.
            const valueValidator = this.getValidatorForType(type.value);
            return t.type(
              _.fromPairs(
                keyType.elements.map(it =>
                  tuple(it.value.toString(), valueValidator),
                ),
              ),
            );
          }
        }
        return t.record(
          this.getValidatorForType(type.key),
          this.getValidatorForType(type.value),
        );

      case Kind.optional:
        return t.union([
          this.getValidatorForType(type.value),
          t.null,
          t.undefined,
        ]);

      case Kind.literal:
        return t.literal(type.value);

      case Kind.reference:
        return t.recursion(type.typeName, () =>
          this.getValidator(type.typeName),
        );

      case Kind.tuple:
        return safeTuple(
          type.elements.map(it => this.getValidatorForType(it.type)),
        );

      case Kind.brand: {
        const validator = this.brandValidators[type.brand];
        if (!validator) {
          throw new UnregisteredBrandError(type.brand);
        }
        return validator;
      }

      /* istanbul ignore next */
      default:
        return assertUnreachable(type, true);
    }
  }
}

const ioTypeForAtom: { [atom in Atom]: t.Type<any> } = {
  [Atom.any]: t.unknown,
  [Atom.number]: t.number,
  [Atom.string]: t.string,
  [Atom.boolean]: t.boolean,
  [Atom.null]: t.null,
};

function safeUnion(codecs: t.Mixed[]): t.Mixed {
  return t.union(codecs as any);
}

function safeIntersection(codecs: t.Mixed[]): t.Mixed {
  return t.intersection(codecs as any);
}

function safeTuple(codecs: t.Mixed[]): t.Mixed {
  return t.tuple(codecs as any);
}

interface StringNumberBrand {
  readonly StringNumber: unique symbol;
}

const StringNumber = t.brand(
  t.string,
  (str): str is t.Branded<string, StringNumberBrand> => !isNaN(str as any),
  'StringNumber',
);
