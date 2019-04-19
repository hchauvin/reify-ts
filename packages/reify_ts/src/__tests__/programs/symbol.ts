const symbol = Symbol('hello');

export type Symbol = typeof symbol;

export interface Interface {
  prop: string;
  symbolValue: symbol;
}
