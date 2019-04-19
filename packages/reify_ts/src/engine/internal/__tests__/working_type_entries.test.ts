/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';
import test from 'ava';
import { WorkingTypeEntries } from '../working_type_entries';
import { NUMBER, STRING, TypeEntry } from '../../../types';

test('hydrate/save', t => {
  const compilerHost = new InMemoryCompilerHost({}, '.');

  let types: TypeEntry[];
  {
    const workingTypeEntries = new WorkingTypeEntries();

    // Hydration from a non-existing file is ignored
    t.assert(
      !compilerHost.fileExists(AST_FILE_NAME),
      'precondition: the AST file should not already exist',
    );
    workingTypeEntries.hydrate(AST_FILE_NAME, compilerHost);

    // Let's add some type entries
    workingTypeEntries.set(
      'IgnoredTypeEntry',
      'IgnoredTypeEntry',
      undefined, // Type entry ignored because no type provided (--> pending type)
      undefined,
    );
    workingTypeEntries.set('KEY', 'Foo', NUMBER, undefined);
    workingTypeEntries.set('KEY2', 'BAR', STRING, undefined);
    types = workingTypeEntries.getTypes();

    // We can save the type entries
    workingTypeEntries.save(AST_FILE_NAME, compilerHost);
    t.assert(
      compilerHost.fileExists(AST_FILE_NAME),
      'the AST file should have been written to',
    );
  }

  {
    const workingTypeEntries = new WorkingTypeEntries();

    workingTypeEntries.hydrate(AST_FILE_NAME, compilerHost);

    t.deepEqual(workingTypeEntries.getTypes(), types);
  }
});

const AST_FILE_NAME = 'types.json';

class InMemoryCompilerHost implements ts.CompilerHost {
  constructor(
    public fileContent: { [fileName: string]: string },
    private readonly currentDirectory: string,
  ) {}

  getSourceFile(
    fileName: string,
    languageVersion: ts.ScriptTarget,
    _onError?: (message: string) => void,
    _shouldCreateNewSourceFile?: boolean,
  ): ts.SourceFile | undefined {
    const content = this.fileContent[fileName];
    if (!content) return undefined;
    return ts.createSourceFile(fileName, content, languageVersion);
  }

  getDefaultLibFileName(_options: ts.CompilerOptions): string {
    throw new Error('unsupported');
  }

  getDefaultLibLocation(): string {
    throw new Error('unsupported');
  }

  writeFile(
    fileName: string,
    data: string,
    _writeByteOrderMark: boolean,
    _onError?: (message: string) => void,
    _sourceFiles?: ReadonlyArray<ts.SourceFile>,
  ): void {
    this.fileContent[fileName] = data;
  }

  getCurrentDirectory() {
    return this.currentDirectory;
  }

  getCanonicalFileName(fileName: string): string {
    return fileName;
  }

  useCaseSensitiveFileNames(): boolean {
    return true;
  }

  getNewLine(): string {
    return '\n';
  }

  fileExists(fileName: string): boolean {
    return (this.fileContent[fileName] as string | undefined) !== undefined;
  }

  readFile(fileName: string): string | undefined {
    return this.fileContent[fileName];
  }
}
