/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { TsWatcher, TsTestPackage } from './util/ttsc';
import { NUMBER, STRING, BOOLEAN } from '../types';

test.serial('watch single file', async t => {
  const pkg = new TsTestPackage({ name: 'watch' });
  try {
    await pkg.setup();
    await pkg.writeFile('src/index.ts', 'export type Foo = number');
    const watcher = new TsWatcher(pkg);
    try {
      await watcher.setup();
      await watcher.waitForEndOfTranspilation();
      (await pkg.getProgramTransformationResult(t)).assertTypesEqual({
        Foo: NUMBER,
      });
      await pkg.writeFile('src/index.ts', 'export type Foo = string');
      await watcher.waitForEndOfTranspilation();
      (await pkg.getProgramTransformationResult(t)).assertTypesEqual({
        Foo: STRING,
      });
    } finally {
      await watcher.teardown();
    }
  } finally {
    await pkg.teardown();
  }
});

test.serial('watch multiple files', async t => {
  const pkg = new TsTestPackage({ name: 'watch-multiple' });
  try {
    await pkg.setup();
    await pkg.writeFile('src/a.ts', 'export type Foo = number');
    await pkg.writeFile('src/b.ts', 'export type Bar = string');
    const watcher = new TsWatcher(pkg);
    try {
      await watcher.setup();
      await watcher.waitForEndOfTranspilation();
      (await pkg.getProgramTransformationResult(t)).assertTypesEqual({
        Foo: NUMBER,
        Bar: STRING,
      });
      await pkg.writeFile('src/a.ts', 'export type Foo = boolean');
      await watcher.waitForEndOfTranspilation();
      (await pkg.getProgramTransformationResult(t)).assertTypesEqual({
        Foo: BOOLEAN,
        Bar: STRING,
      });
    } finally {
      await watcher.teardown();
    }
  } finally {
    await pkg.teardown();
  }
});

test.serial('error', async t => {
  const pkg = new TsTestPackage({
    name: 'error',
    extractor: {
      warningLevels: { symbol: 'error' },
    },
  });
  try {
    await pkg.setup();
    await pkg.writeFile(
      'src/index.ts',
      'const foo = Symbol("foo"); export type Foo = typeof foo',
    );
    const { exitCode } = await pkg.yarn(['ttsc'], {
      mustSucceed: false,
    });
    t.assert(exitCode !== 0);
  } finally {
    await pkg.teardown();
  }
});
