export type Optional = {
  mandatory: string;
  optional?: number;
};

export type Readonly = {
  mutable: string;
  readonly immutable: number;
};

type MutableRequired<T> = { -readonly [P in keyof T]-?: T[P] };

export type MutableRequiredExample = MutableRequired<{
  a: string;
  readonly b?: number;
}>;
