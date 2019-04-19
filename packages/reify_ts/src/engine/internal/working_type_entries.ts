/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ts from 'typescript';
import { Type, Documentation, TypeEntry } from '../../types';
import { TypeConversionInvariantError } from './errors';

export interface WorkingTypeEntry {
  name: string;
  type?: Type;
  documentation?: Documentation;
}

export class WorkingTypeEntries {
  private types = new Map<ts.Symbol | string, WorkingTypeEntry>();

  hydrate(typeEntriesFileName: string, compilerHost: ts.CompilerHost) {
    const content = compilerHost.readFile(typeEntriesFileName);
    if (!content) {
      // File does not exist
      return;
    }
    const typeEntries: TypeEntry[] = JSON.parse(content);
    this.types = new Map<string, TypeEntry>();
    for (const typeEntry of typeEntries) {
      this.types.set(typeEntry.name, typeEntry);
    }
  }

  save(astFileName: string, compilerHost: ts.CompilerHost) {
    const nextTypes = this.getTypes();
    compilerHost.writeFile(
      astFileName,
      JSON.stringify(nextTypes, null, 2),
      false,
    );
    return nextTypes;
  }

  getTypes(): TypeEntry[] {
    const nextTypes: TypeEntry[] = [];
    this.types.forEach((entry, _symbol) => {
      if (!entry.name || !entry.type) {
        return;
      }
      nextTypes.push({
        name: entry.name,
        type: entry.type,
        documentation: entry.documentation,
      });
    });
    return nextTypes;
  }

  removeAllTypeEntriesFromFile(adaptedFileName: string) {
    this.types.forEach((entry, key) => {
      if (
        (entry.name && entry.name.startsWith(`${adaptedFileName}#`)) ||
        (typeof key === 'string' && key.startsWith(`${adaptedFileName}#`))
      ) {
        this.types.delete(key);
      }
    });
  }

  set(
    key: string | ts.Symbol,
    name: string,
    type: Type | undefined,
    documentation: Documentation | undefined,
  ) {
    // NOTE: The following line allows us to deal nicely with the Array<> type.
    const nameKey = name.endsWith('#__type') ? key : name;

    const entry: WorkingTypeEntry = { name, type };
    if (documentation) entry.documentation = documentation;
    const existing = this.get(nameKey, name);
    if (existing && existing.type) {
      throw new TypeConversionInvariantError(
        `type unexpectedly set twice: key=${nameKey}; name=${name}`,
      );
    } else {
      this.types.set(nameKey, entry);
    }
  }

  get(key: string | ts.Symbol, name: string) {
    return this.types.get(name) || this.types.get(key);
  }
}
