export type StringMap = { [key: string]: number };
export type NumberMap = { [key: number]: string };
export enum Enum {
  a = 'a',
  b = 'b',
}
export type StringInEnumMap = { [key in Enum]: boolean };
