/**
 * Use runtime type reflection for hypothesis testing.  The underlying engine
 * is the `fast-check` package.
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
import * as fc from 'fast-check';
import * as _ from 'lodash';
import * as Immutable from 'immutable';
import { TypeMirror } from '../runtime/type_mirror';
import { Type, Kind, Atom, TypeFor } from '../types';
import { assertUnreachable, tuple } from '../internal/utils';
import { BaseError } from 'make-error';
import { checkPassThrough } from '../runtime/pass_through';
import {
  UnregisteredBrandError,
  AlreadyRegisteredBrandError,
  UnsupportedTypeError,
} from './errors';

/**
 * Placeholder to get an arbitrary from the type given in the type parameter.
 *
 * With the `placeholder_calls` visitor, this placeholder is replaced during TypeScript
 * AST transformation with a call to [[FastChecker.getArbitrary]] using the
 * extracted type name.
 */
export function getArbitrary<T>(_fastChecker: FastChecker): fc.Arbitrary<T> {
  checkPassThrough();
  return fc.anything();
}

/**
 * Thrown when a recursion in the type mirror exceeds the maximum recursion
 * depth.
 */
/* istanbul ignore next */
export class RecursionExceedsMaxDepthError extends BaseError {
  /** @ignore */
  constructor(type: Type, visitedTypes: VisitedTypes) {
    super(
      `recursion exceed max depth while visiting ${JSON.stringify(
        type,
      )}: stack: ${visitedTypes.toString()}`,
    );
  }
}

/**
 * Maintains a stack of visited types to check for infinite recursion.
 *
 * The current recursion depth is given per type.
 */
class VisitedTypes {
  constructor(
    public readonly maxDepth: number = 10,
    private readonly types = Immutable.Map<Type, number>(),
  ) {}

  canVisit(type: Type): boolean {
    return this.getDepth(type) < this.maxDepth;
  }

  visit(type: Type): VisitedTypes {
    return new VisitedTypes(
      this.maxDepth,
      this.types.update(type, depth => (depth || 0) + 1),
    );
  }

  getDepth(type: Type): number {
    return this.types.get(type) || 0;
  }

  toString(): string {
    return this.types
      .map((value, key) => `${JSON.stringify(key)} (recursion depth: ${value})`)
      .join(', ');
  }
}

/**
 * A fast-check brand arbitrary.
 *
 * @see [[brandArbitrary]]
 */
export class BrandArbitrary<T, B> extends fc.Arbitrary<B> {
  constructor(
    private readonly arbitrary: fc.Arbitrary<T>,
    public readonly name: string,
  ) {
    super();
  }

  generate(mrng: fc.Random): fc.Shrinkable<B> {
    return this.arbitrary.generate(mrng) as any;
  }
}

/**
 * Gets a fast-check brand arbitrary for an `io-ts` brand.
 */
export function brandArbitrary<
  T,
  N extends string,
  B extends { readonly [K in N]: symbol }
>(arbitrary: fc.Arbitrary<T>, name: string): BrandArbitrary<T, B> {
  return new BrandArbitrary(arbitrary, name);
}

/**
 * Fast-checking engine that uses a type mirror for hypothesis testing.
 */
export class FastChecker {
  private arbitraries: {
    [typeName: string]: fc.Arbitrary<any> | undefined;
  } = {};
  private brandArbitraries: {
    [brand: string]: BrandArbitrary<any, any> | undefined;
  } = {};

  /** Creates a fast-checking engine from a type mirror. */
  constructor(private readonly typeMirror: TypeMirror) {}

  /**
   * Registers a brand arbitrary for a given brand.
   *
   * @throws [[AlreadyRegisteredBrandError]] if the brand has already been
   * registered.
   */
  registerBrand(brandArbitrary: BrandArbitrary<any, any>) {
    if (this.brandArbitraries[brandArbitrary.name]) {
      throw new AlreadyRegisteredBrandError(brandArbitrary.name);
    }
    this.brandArbitraries[brandArbitrary.name] = brandArbitrary;
  }

  /**
   * Gets an arbitrary for a given type name (the type name must be present in the
   * type mirror).
   */
  getArbitrary(typeName: string): fc.Arbitrary<any> {
    return this.getArbitraryImpl(typeName, new VisitedTypes());
  }

  private getType(
    typeName: string,
    visitedTypes: VisitedTypes = new VisitedTypes(),
  ): Type {
    const typeEntry = this.typeMirror.getType(typeName);
    if (!visitedTypes.canVisit(typeEntry.type)) {
      throw new RecursionExceedsMaxDepthError(typeEntry.type, visitedTypes);
    }
    return typeEntry.type;
  }

  private getArbitraryImpl(
    typeName: string,
    visitedTypes: VisitedTypes,
  ): fc.Arbitrary<any> {
    let arb = this.arbitraries[typeName];
    if (arb) {
      return arb;
    }
    const type = this.typeMirror.getType(typeName);
    arb = this.getArbitraryForType(type.type, visitedTypes);
    this.arbitraries[typeName] = arb;
    return arb;
  }

  private getArbitraryForType(
    type: Type,
    visitedTypes: VisitedTypes,
  ): fc.Arbitrary<any> {
    if (!visitedTypes.canVisit(type)) {
      throw new RecursionExceedsMaxDepthError(type, visitedTypes);
    }

    switch (type.kind) {
      case Kind.atom:
        return arbitraryForAtom[type.atom];

      case Kind.record:
        return fc.record(
          _.mapValues(type.fields, field =>
            this.getArbitraryForType(field.type, visitedTypes.visit(type)),
          ),
        );

      case Kind.union: {
        const arbs = type.types
          .filter(it => visitedTypes.getDepth(it) < visitedTypes.maxDepth - 1)
          .map(it => this.getArbitraryForType(it, visitedTypes.visit(type)));
        if (arbs.length === 0) {
          throw new RecursionExceedsMaxDepthError(type, visitedTypes);
        }
        return fc.oneof(...arbs);
      }

      case Kind.intersection: {
        if (
          type.types.length === 2 &&
          type.types[0].kind === Kind.record &&
          type.types[1].kind === Kind.map
        ) {
          // In this case, intersection can be achieved by using the
          // spread operator and just combining the records.
          return fc
            .tuple(
              this.getArbitraryForType(type.types[0], visitedTypes.visit(type)),
              this.getArbitraryForType(type.types[1], visitedTypes.visit(type)),
            )
            .map(([a, b]) => ({ ...a, ...b }));
        }
        // Otherwise, let's try to flatten an intersection to go back to
        // an intersection of records.
        const flattened = this.flattenIntersection(type.types, visitedTypes);
        if (!flattened) {
          throw new UnsupportedTypeError(
            `intersection not implemented in the general case; please supply a custom arbitrary for ${JSON.stringify(
              type,
              null,
              2,
            )}`,
          );
        }
        return this.getArbitraryForType(flattened, visitedTypes.visit(type));
      }

      case Kind.enum:
        if (type.elements.length === 0) {
          throw new UnsupportedTypeError(
            'cannot generate a value for enum with no element',
          );
        }
        return fc.constantFrom(...type.elements.map(it => it.value));

      case Kind.array:
        return fc.array(
          this.getArbitraryForType(type.element, visitedTypes.visit(type)),
        );

      case Kind.map: {
        if (type.key.kind === Kind.reference) {
          const keyType = this.getType(
            type.key.typeName,
            visitedTypes.visit(type),
          );
          if (keyType.kind === Kind.enum) {
            const valueArb = this.getArbitraryForType(
              type.value,
              visitedTypes.visit(type),
            );
            const recordModel = _.fromPairs(
              keyType.elements.map(element => tuple(element.value, valueArb)),
            );
            return fc.record(recordModel);
          }
          throw new UnsupportedTypeError('unexpected non-enum constraint');
        }
        return fc
          .array(
            fc.tuple(
              this.getArbitraryForType(type.key, visitedTypes.visit(type)),
              this.getArbitraryForType(type.value, visitedTypes.visit(type)),
            ),
          )
          .map(_.fromPairs);
      }

      case Kind.optional:
        if (visitedTypes.getDepth(type.value) >= visitedTypes.maxDepth - 1) {
          return fc.constantFrom(undefined);
        }
        return fc.option(
          this.getArbitraryForType(type.value, visitedTypes.visit(type)),
        );

      case Kind.literal:
        return fc.constant(type.value);

      case Kind.reference:
        // Notice that mutual recursion is taken care of, using caching
        // (`this.arbitraries`).
        return this.getArbitraryImpl(type.typeName, visitedTypes.visit(type));

      case Kind.tuple:
        return fc.genericTuple(
          type.elements.map(it =>
            this.getArbitraryForType(it.type, visitedTypes.visit(type)),
          ),
        );

      case Kind.brand: {
        const arb = this.brandArbitraries[type.brand];
        if (!arb) {
          throw new UnregisteredBrandError(type.brand);
        }
        return arb;
      }

      /* istanbul ignore next */
      default:
        return assertUnreachable(type, true);
    }
  }

  /**
   * Tries to flatten an intersection.
   *
   * @param types The types comprising the intersection.
   * @param visitedTypes The types already visited.
   * @return The flattened type, or `undefined` if the intersection could not
   * be flattened.
   */
  private flattenIntersection(
    types: Type[],
    visitedTypes: VisitedTypes,
  ): Type | undefined {
    const ans: TypeFor<Kind.record> = {
      kind: Kind.record,
      fields: {},
    };

    for (let type of types) {
      if (type.kind === Kind.reference) {
        type = this.getType(type.typeName, visitedTypes);
      }
      if (type.kind !== Kind.record) {
        return undefined;
      }

      for (const fieldName in type.fields) {
        if (!ans.fields[fieldName]) {
          ans.fields[fieldName] = type.fields[fieldName];
        } else {
          const flattened = this.flattenIntersection(
            [ans.fields[fieldName].type, type.fields[fieldName].type],
            visitedTypes,
          );
          if (!flattened) {
            return undefined;
          }
          ans.fields[fieldName] = { type: flattened };
        }
      }
    }

    return ans;
  }
}

const arbitraryForAtom: { [atom in Atom]: fc.Arbitrary<any> } = {
  [Atom.any]: fc.anything(),
  [Atom.number]: fc.double(),
  [Atom.string]: fc.string(),
  [Atom.boolean]: fc.boolean(),
  [Atom.null]: fc.constant(null),
};
