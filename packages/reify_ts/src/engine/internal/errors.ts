/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BaseError } from 'make-error';

/**
 * The given type could not be converted because an invariant has been violated.
 *
 * If this error is raised, ths indicates a bug in our extractor.
 */
/* istanbul ignore next */
export class TypeConversionInvariantError extends BaseError {
  constructor(
    public readonly typeStr: string,
    public readonly msg?: string,
    public readonly cause?: Error,
  ) {
    super(
      [
        `while processing type \`${typeStr}\``,
        msg,
        `${cause && getStack(cause)}\n------`,
      ]
        .filter(it => !!it)
        .join(': '),
    );
  }
}

function getStack(cause: Error): string {
  try {
    return cause.stack || '<stack unavailable>';
  } catch (err) {
    return `<stack unavailable: ${err}>`;
  }
}
