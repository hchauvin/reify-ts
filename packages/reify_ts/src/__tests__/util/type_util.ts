/**
 * Utility for manipulating type ASTs coming from reify-ts.
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
import { TypeEntry, Type, Kind, Atom, Documentation } from '../../types';
import { FastChecker } from '../../consumers/fast_checker';
import { Validator, ValidationError } from '../../consumers/validator';
import { ExecutionContext } from 'ava';
import { ProgramTransformationResult } from '../../internal/ts_transformer';
import { TypeMirror } from '../../runtime/type_mirror';

/**
 * Wraps a list of type entries, typically provided by the type AST file generated
 * during compilation with reify-ts ts_plugin.
 */
export class ProgramTransformationResultWrapper {
  constructor(
    private readonly result: ProgramTransformationResult,
    private t: ExecutionContext<unknown>,
  ) {}

  get entries(): TypeEntry[] {
    return this.result.types;
  }

  get transformedContent(): { [moduleName: string]: string } {
    return this.result.transformedContent;
  }

  getTransformedContentSingle(): string {
    const content = Object.values(this.transformedContent);
    if (content.length !== 1) {
      throw new Error(
        `expected one and only one module; got ${Object.keys(
          this.transformedContent,
        ).join(', ')}`,
      );
    }
    return content[0];
  }

  printTransformedContent(): this {
    const transformedContent = this.transformedContent;
    for (const moduleName in transformedContent) {
      console.log(
        `- ${moduleName} <<<\n${transformedContent[moduleName]}\n>>>`,
      );
    }
    return this;
  }

  /**
   * The number of entries
   */
  get length(): number {
    return this.entries.length;
  }

  /**
   * Gets an entry by name, optionally stripping all file qualification
   * from the type names to perform the match.
   */
  get(name: string, stripFileQualifiers: boolean = true): WrappedTypeEntry {
    const matches = this.entries.filter(it =>
      stripFileQualifiers ? it.name.endsWith(`#${name}`) : it.name === name,
    );
    if (matches.length === 0) {
      throw new Error(
        `no match for name ${name}; available: ${this.getTypeNames()}`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `multiple matches for name ${name}: ${this.debug(matches)}`,
      );
    }
    return new WrappedTypeEntry(matches[0]);
  }

  /**
   * Asserts that all the type references can be followed to one entry
   * within the type entry list.
   */
  assertAllReferencesCanBeFollowed(): this {
    for (const entry of this.entries) {
      new WrappedTypeEntry(entry).visitType(type => {
        if (type.kind === Kind.reference) {
          this.t.notThrows(() => this.get(type.typeName, false));
        }
        return type;
      });
    }
    return this;
  }

  /**
   * Asserts that the (actual) types maintained by this class
   * wrapper are equal to expected types, optionally stripping
   * all file qualification from the type names when performing the
   * comparisons.
   */
  assertTypesEqual(
    entries: { [name: string]: Type },
    { stripFileQualifiers = true } = {},
  ): this {
    this.t.assert(Object.values(entries).length === this.length);
    for (const name in entries) {
      this.t.deepEqual(
        (stripFileQualifiers
          ? this.get(name, true).stripFileQualifiers()
          : this.get(name, false)
        ).type,
        entries[name],
        `${name}.type`,
      );
    }
    return this;
  }

  /**
   * Same as [[assertTypesEqual]], but for whole type entries, including
   * documentation.
   */
  assertEntriesEqual(
    entries: {
      [name: string]: { type: Type; documentation?: Documentation };
    },
    { stripFileQualifiers = true } = {},
  ): this {
    this.t.assert(Object.values(entries).length === this.length);
    for (const name in entries) {
      let actualType = this.get(name);
      if (stripFileQualifiers) actualType = actualType.stripFileQualifiers();
      this.t.deepEqual(actualType.type, entries[name].type, `${name}.type`);
      this.t.deepEqual(
        this.get(name).documentation,
        entries[name].documentation,
        `${name}.documentation`,
      );
    }
    return this;
  }

  /**
   * Fast check validation for all the types.
   */
  applyFastCheck({
    not = [],
    only,
    register = () => {},
  }: {
    not?: string[];
    only?: string[];
    register?: (fastChecker: FastChecker, validator: Validator) => void;
  } = {}): this {
    const ast = new TypeMirror(this.entries);
    const fastChecker = new FastChecker(ast);
    const validator = new Validator(ast);
    register(fastChecker, validator);
    const notFullTypeNames = not.map(it => this.getFullTypeName(it));
    const fullTypeNames = (only
      ? only.map(it => this.getFullTypeName(it))
      : this.entries.map(it => it.name)
    ).filter(it => !notFullTypeNames.includes(it));
    for (const fullTypeName of fullTypeNames) {
      fc.assert(
        fc.property(fastChecker.getArbitrary(fullTypeName), arb => {
          try {
            this.t.deepEqual(
              validator.encode(
                fullTypeName,
                validator.decode(fullTypeName, arb),
              ),
              arb,
            );
          } catch (err) {
            if (err instanceof ValidationError) {
              throw new Error(`Type ${fullTypeName}: ${err.stack}\n---------`);
            }
            throw err;
          }
        }),
        { numRuns: 50 },
      );
    }
    return this;
  }

  private getFullTypeName(typeName: string): string {
    return this.entries.find(it => it.name.endsWith(`#${typeName}`))!.name;
  }

  /**
   * Pretty-print the type entries.
   */
  print(): this {
    console.log(this.toString());
    return this;
  }

  toString(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /** Get all the type names. */
  private getTypeNames(entries: TypeEntry[] = this.entries): string {
    return entries.map(entry => entry.name).join(', ');
  }

  private debug(entries: TypeEntry[] = this.entries) {
    return JSON.stringify(entries, null, 2);
  }
}

/**
 * Wraps a single type entry.
 */
export class WrappedTypeEntry implements TypeEntry {
  constructor(private readonly entry: TypeEntry) {}

  get name() {
    return this.entry.name;
  }

  get type() {
    return this.entry.type;
  }

  get documentation() {
    return this.entry.documentation;
  }

  /** Visit the type entry recursively. */
  visitType(fn: (t: Type) => Type): WrappedTypeEntry {
    return new WrappedTypeEntry({
      ...this.entry,
      type: visitTypeRec(this.type),
    });

    function visitTypeRec(type: Type): Type {
      return fn(visitTypeInner(type));
    }

    function visitTypeInner(type: Type): Type {
      switch (type.kind) {
        case Kind.record:
          return {
            ...type,
            fields: _.mapValues(type.fields, it => ({
              ...it,
              type: visitTypeRec(it.type),
            })),
          };

        case Kind.tuple:
          return {
            ...type,
            elements: type.elements.map(it => ({
              ...it,
              type: visitTypeRec(it.type),
            })),
          };

        case Kind.union:
        case Kind.intersection:
          return {
            ...type,
            types: type.types.map(visitTypeRec),
          };

        case Kind.array:
          return {
            ...type,
            element: visitTypeRec(type.element),
          };

        case Kind.map: {
          const key = visitTypeRec(type.key);
          if (
            key.kind === Kind.reference ||
            (key.kind === Kind.atom &&
              (key.atom === Atom.string || key.atom === Atom.number))
          ) {
            return {
              ...type,
              key,
              value: visitTypeRec(type.value),
            };
          }
          throw new Error(`unsuspected key ${JSON.stringify(key)}`);
        }

        case Kind.optional:
          return {
            ...type,
            value: visitTypeRec(type.value),
          };

        case Kind.brand:
          return {
            ...type,
            type: visitTypeRec(type.type),
          };

        default:
          return type;
      }
    }
  }

  /** Recursively strips the file qualifiers from the type names. */
  stripFileQualifiers(): WrappedTypeEntry {
    return this.visitType(t => {
      if (t.kind !== Kind.reference) {
        return t;
      }
      const separatorIdx = t.typeName.lastIndexOf('#');
      if (separatorIdx === -1) {
        throw new Error(`cannot find separator "#" in "${t.typeName}"`);
      }
      return {
        ...t,
        typeName: t.typeName.substring(separatorIdx + 1),
      };
    });
  }
}
