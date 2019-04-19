/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';

export function useDebounce<T>(
  value: T,
  delayMs: number,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(
    () => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delayMs);

      return () => {
        clearTimeout(timer);
      };
    },
    [value],
  );
  return [debouncedValue, setDebouncedValue];
}
