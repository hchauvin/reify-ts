/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueOf } from './internal/utils';

export interface TypeEntry {
  name: string;
  type: Type;
  documentation?: Documentation;
}

export enum Kind {
  atom = 'atom',
  record = 'record',
  tuple = 'tuple',
  union = 'union',
  intersection = 'intersection',
  enum = 'enum',
  array = 'array',
  map = 'map',
  optional = 'optional',
  literal = 'literal',
  reference = 'reference',
  brand = 'brand',
}

export enum Atom {
  any = 'any',
  number = 'number',
  string = 'string',
  boolean = 'boolean',
  null = 'null',
}

export const ANY: TypeFor<Kind.atom> = { kind: Kind.atom, atom: Atom.any };
export const NUMBER: TypeFor<Kind.atom> = {
  kind: Kind.atom,
  atom: Atom.number,
};
export const STRING: TypeFor<Kind.atom> = {
  kind: Kind.atom,
  atom: Atom.string,
};
export const BOOLEAN: TypeFor<Kind.atom> = {
  kind: Kind.atom,
  atom: Atom.boolean,
};
export const NULL: TypeFor<Kind.atom> = {
  kind: Kind.atom,
  atom: Atom.null,
};

export interface Documentation {
  text?: string;
  tags?: Array<{ name: string; text?: string }>;
}

type Types = {
  [Kind.atom]: { atom: Atom };
  [Kind.record]: {
    fields: {
      [fieldName: string]: {
        type: Type;
        documentation?: Documentation;
        fieldOrder?: number;
      };
    };
  };
  [Kind.tuple]: { elements: { type: Type; documentation?: Documentation }[] };
  [Kind.union]: {
    discriminator?: string;
    types: Type[];
  };
  [Kind.intersection]: {
    types: Type[];
  };
  [Kind.enum]: {
    elements: {
      label: string;
      value: string | number;
      documentation?: Documentation;
    }[];
  };
  [Kind.array]: {
    element: Type;
  };
  [Kind.map]: {
    key: typeof STRING | typeof NUMBER | TypeFor<Kind.reference>;
    value: Type;
  };
  [Kind.optional]: {
    value: Type;
  };
  [Kind.reference]: {
    typeName: string;
  };
  [Kind.literal]: {
    atom: Atom;
    value: any;
  } & (
    | { atom: Atom.number; value: number }
    | { atom: Atom.string; value: string }
    | { atom: Atom.boolean; value: boolean });
  [Kind.brand]: {
    type: Type;
    brand: string;
  };
};

export type TypeFor<K extends Kind> = Types[K] & {
  kind: K;
  documentation?: Documentation;
  warnings?: { code: string; text: string }[];
};

export type Type = ValueOf<{ [kind in Kind]: TypeFor<kind> }>;
