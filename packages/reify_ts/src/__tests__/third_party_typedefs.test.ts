/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'fs';
import test from 'ava';
import {
  getProgramFromTranspiledPackage,
  getProgramFromFiles,
} from '../internal/program';
import { transformProgramWithTsPlugin } from '../internal/ts_transformer';
import { ProgramTransformationResultWrapper } from './util/type_util';

const thirdPartyExportedTypesDir = path.resolve(
  'src/__tests__/third_party_exported_types',
);

type ThirdPartyTypeDefinition = {
  name: string;
  path?: string;
};

const thirdPartyTypeDefinitions: ThirdPartyTypeDefinition[] = [
  // { name: 'node', path: '@types/node/index.d.ts' },
  { name: 'node_inspector', path: '@types/node/inspector.d.ts' },
  { name: 'lodash', path: '@types/lodash/index.d.ts' },
  { name: 'react', path: '@types/react/index.d.ts' },
  { name: 'io-ts' },
  { name: 'fp-ts' },
  { name: 'newtype-ts', path: 'newtype-ts' },
  { name: 'monocle-ts', path: 'monocle-ts' },
  { name: 'typelevel-ts', path: 'typelevel-ts' },
  {
    name: 'typescript-protocol',
    path: 'typescript/lib/protocol.d.ts',
  },
  {
    name: 'typescript-tsserverlibrary',
    path: 'typescript/lib/tsserverlibrary.d.ts',
  },
  {
    name: 'typescript',
    path: 'typescript/lib/typescript.d.ts',
  },
  {
    name: 'typescript-services',
    path: 'typescript/lib/typescriptServices.d.ts',
  },
  { name: 'lib-es5', path: 'typescript/lib/lib.es5.d.ts' },
  { name: 'rxjs', path: 'rxjs/index.d.ts' },
  { name: 'vue', path: 'vue/types/index.d.ts' },
  { name: 'reselect' },
  { name: 'redux' },
  { name: 'mobx' },
  { name: 'antd' },
];

test.before(() => {
  if (!fs.existsSync(thirdPartyExportedTypesDir)) {
    fs.mkdirSync(thirdPartyExportedTypesDir);
  }
});

for (const typeDefinition of thirdPartyTypeDefinitions) {
  test(typeDefinition.name, t => {
    const { compilerHost, program } =
      typeDefinition.path && typeDefinition.path.endsWith('.ts')
        ? getProgramFromFiles([require.resolve(typeDefinition.path)])
        : getProgramFromTranspiledPackage(
            typeDefinition.path || typeDefinition.name,
          );
    const types = new ProgramTransformationResultWrapper(
      transformProgramWithTsPlugin(
        compilerHost,
        program,
        undefined,
        undefined,
        {
          includeAllDeclarations: true,
        },
      ),
      t,
    );
    t.assert(types.length > 0);
    types.assertAllReferencesCanBeFollowed();
    fs.writeFileSync(
      path.resolve(thirdPartyExportedTypesDir, `${typeDefinition.name}.json`),
      types.toString(),
    );
  });
}
