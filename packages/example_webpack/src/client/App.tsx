/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as useFetch from 'fetch-suspense';
import { getTypeName } from 'reify-ts/lib/consumers/type_name';
import { TypeMirror } from 'reify-ts/lib/runtime/type_mirror';

const TYPES_URL = '/types.json';

type Person = {
  name: string;
  age: number;
  rememberMe: boolean;
};

const RuntimeTypesContext = React.createContext<string | null>(null);

function ShowType(props: { typeName: string }) {
  const typesUrl = React.useContext(RuntimeTypesContext);
  const types = useFetch(typesUrl);
  const ast = new TypeMirror(types);
  return (
    <pre id="type_json">
      {JSON.stringify(ast.getType(props.typeName), null, 2)}
    </pre>
  );
}

export function App() {
  return (
    <React.Suspense fallback="Loading...">
      <RuntimeTypesContext.Provider value={TYPES_URL}>
        <ShowType typeName={getTypeName<Person>()} />
      </RuntimeTypesContext.Provider>
    </React.Suspense>
  );
}
