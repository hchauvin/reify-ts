export type TypeAlias = {
  a: string;
  b: number;
};

export type IntersectionTypeAlias = TypeAlias & {
  c: number;
};

export interface Interface {
  a: string;
  b: number;
}

export interface SubInterface extends Interface {
  c: number;
}

export class Klass {
  d: string;
  e: number;
}

export interface InterfaceExtendsKlass extends Klass {
  f: number;
}
