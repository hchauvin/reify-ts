/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WARNINGS } from './warnings';

/** Options for the [[TypeExtractor]]. */
export type TypeExtractorOptions = {
  /**
   * Only process source files with a name that matches a given
   * regular expression.
   */
  fileNameFilter?: string | null;

  /**
   * Excludes symbols based on a list of regular expressions applied to symbol
   * full names.
   */
  excludeSymbols: string[];

  /**
   * If `true`, all the properties of objects are set as optional,
   * so that
   * ```Typescript
   * type Foo = { bar: number };
   * ```
   * is equivalent to
   * ```Typescript
   * type Foo = { bar?: number | null };
   * ```
   *
   * This is the runtime equivalent of disabling null checks.
   */
  allOptional: boolean;

  /**
   * Behavior when a warning is logged:
   *
   * - `'silent'`: The warning is silently logged, the user is not warned.
   * - `'normal'`: The warning is shown to the user and included in the
   * TypeMirror type entries.
   * - `'error'`: The warning is promoted to an error and the transformation
   * by the TypeScript plugins fails.
   */
  warningLevels?: Partial<
    { [warning in keyof typeof WARNINGS]: 'silent' | 'normal' | 'error' }
  >;
};
