/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ValueOf<T> = T[keyof T];

export function filterNotNull<T>(ar: (T | null | undefined)[]): T[] {
  return ar.filter(it => !!it) as any;
}

/**
 * This function is used to make sure that types are exhaustive. Putting it at the end
 * of a switch statement will only throw if x has an assignable type.
 */
/* istanbul ignore next */
export function assertUnreachable(x: never, shouldThrow: boolean): never {
  let prettyX: any = x;
  try {
    prettyX = JSON.stringify(prettyX);
  } catch (e) {}
  const err = new Error(prettyX);
  if (shouldThrow) {
    throw err;
  }
  return null as never;
}

export function tuple<T extends any[]>(...ar: T): T {
  return ar;
}

export function listFlags(flagCombination: number, flags: any): string[] {
  const list: string[] = [];
  for (const flag in flags) {
    if (flagCombination & (flags as any)[flag]) {
      list.push(flag);
    }
  }
  return list;
}
