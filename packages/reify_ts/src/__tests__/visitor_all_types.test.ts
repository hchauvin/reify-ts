/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'ava';
import { STRING, Kind, NUMBER, Atom } from '../types';
import { transformUnitTestProgram } from './util/unit';

test('visitor_all_types', t => {
  transformUnitTestProgram(t, 'visitor_all_types').assertEntriesEqual(
    {
      Enum: {
        type: {
          kind: Kind.enum,
          elements: [
            {
              label: 'a',
              value: 'a',
            },
          ],
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      Interface: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: {
                kind: Kind.reference,
                typeName: 'NonExportedDependency',
              },
            },
          },
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      NonExportedDependency: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: NUMBER,
            },
          },
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      TypeAlias: {
        type: STRING,
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      ExportedThroughNamedExport: {
        type: {
          kind: Kind.literal,
          atom: Atom.number,
          value: 10,
        },
      },
      $Default: {
        type: {
          kind: Kind.literal,
          atom: Atom.number,
          value: 10,
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      'Module.SubModule.Interface': {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: NUMBER,
            },
          },
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      'Module.SubModule.TypeAlias': {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: NUMBER,
            },
          },
        },
        documentation: {
          text: 'Documentation',
          tags: [
            {
              name: 'foo',
              text: 'bar',
            },
          ],
        },
      },
      ModuleTypeReference: {
        type: {
          kind: Kind.record,
          fields: {
            a: {
              type: {
                kind: Kind.reference,
                typeName: 'Module.SubModule.Interface',
              },
            },
            b: {
              type: {
                kind: Kind.reference,
                typeName: 'Module.SubModule.TypeAlias',
              },
            },
          },
        },
      },
    },
    { stripFileQualifiers: true },
  );
});
