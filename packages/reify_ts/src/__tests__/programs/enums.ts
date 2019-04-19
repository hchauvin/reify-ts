export enum StringEnum {
  a = 'A',
  b = 'B',
}

export enum EmptyEnum {}

export enum IntegerEnum {
  a = 0,
  b = 1,
}

export const enum ConstEnum {
  a = 0,
  b = 1,
}

export enum IntegerEnumWithAutoInitializer {
  a,
  b,
  c = 5,
  d,
  e = 10,
}

enum NotExported {
  a = 0,
  b = 1,
}

export type TypeAlias = { a: NotExported };
