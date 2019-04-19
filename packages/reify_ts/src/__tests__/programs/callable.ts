export type Callable = (foo: string) => void;

export interface CallableInterface {
  (foo: string): void;
  (bar: number): string;
}

export interface InterfaceWithCallableProperty {
  a: (bar: number) => string;
  b: Callable;
}

export type TypeAliasWithCallableProperty = {
  a: (bar: number) => string;
  b: Callable;
};

export interface InterfaceWithConstructSignature {
  new (a: string): CallableInterface;
}
