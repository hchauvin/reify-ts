/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import '../../src/scss/app.scss';
import 'codemirror/mode/javascript/javascript';

ReactDOM.render(<App />, document.getElementById('root'));
