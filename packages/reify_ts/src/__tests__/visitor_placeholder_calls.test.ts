/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test, { ExecutionContext } from 'ava';
import * as _ from 'lodash';
import * as fs from 'fs';
import PlaceholderCallsVisitor from '../visitors/placeholder_calls';
import { transformUnitTestProgram, getUnitTestProgramPath } from './util/unit';
import { Type, Kind, NUMBER } from '../types';
import { promisify } from 'util';

const PROGRAM_PREFIX = 'visitor_placeholder_calls/';

test('all programs are taken into account', async t => {
  const actualRelativeProgramNames = (await promisify(fs.readdir)(
    getUnitTestProgramPath(PROGRAM_PREFIX),
  ))
    .map(it => it.replace(/\.ts$/, ''))
    .sort();

  const expectedRelativeProgramNames = Object.keys(
    expectedTransformationResults,
  ).sort();

  t.deepEqual(actualRelativeProgramNames, expectedRelativeProgramNames);
});

const TYPE_RECORD: Type = {
  kind: Kind.record,
  fields: {
    a: {
      type: NUMBER,
    },
  },
};

const OPTIONAL_TYPE_RECORD: Type = {
  kind: Kind.record,
  fields: {
    a: {
      type: {
        kind: Kind.optional,
        value: NUMBER,
      },
    },
  },
};

type ExpectedTransformationResult = {
  types: { [name: string]: Type };
  codeContains: (RegExp | string)[];
};

const expectedTransformationResults: {
  [relativeProgramName: string]: ExpectedTransformationResult;
} = {
  fast_checker_anonymous: {
    types: {
      $AnonymousType_0: TYPE_RECORD,
    },
    codeContains: [
      '({} as FastChecker).getArbitrary("visitor_placeholder_calls/fast_checker_anonymous.ts#$AnonymousType_0")',
    ],
  },
  fast_checker: {
    types: {
      Type: TYPE_RECORD,
    },
    codeContains: [
      '({} as FastChecker).getArbitrary("visitor_placeholder_calls/fast_checker.ts#Type")',
    ],
  },
  type_name_anonymous: {
    types: {
      $AnonymousType_0: TYPE_RECORD,
    },
    codeContains: [
      'export const anonymousTypeName = "visitor_placeholder_calls/type_name_anonymous.ts#$AnonymousType_0"',
    ],
  },
  type_name: {
    types: {
      Type: TYPE_RECORD,
    },
    codeContains: [
      'export const typeName = "visitor_placeholder_calls/type_name.ts#Type"',
    ],
  },
  type_name_alias: {
    types: {
      Type: TYPE_RECORD,
    },
    codeContains: [
      'export const typeName = "visitor_placeholder_calls/type_name_alias.ts#Type"',
    ],
  },
  validator_decode_anonymous: {
    types: {
      $AnonymousType_0: TYPE_RECORD,
    },
    codeContains: [
      `({} as Validator).decode("visitor_placeholder_calls/validator_decode_anonymous.ts#$AnonymousType_0", { foo: 'bar' })`,
    ],
  },
  validator_decode_return_value: {
    types: {
      Type: TYPE_RECORD,
    },
    codeContains: [
      `export const value: Type = ({} as Validator).decode("visitor_placeholder_calls/validator_decode_return_value.ts#Type", { foo: 'bar' })`,
    ],
  },
  validator_decode_type_parameter: {
    types: {
      Type: TYPE_RECORD,
    },
    codeContains: [
      `({} as Validator).decode("visitor_placeholder_calls/validator_decode_type_parameter.ts#Type", { foo: 'bar' })`,
    ],
  },
  validator_encode_anonymous: {
    types: {
      $AnonymousType_0: OPTIONAL_TYPE_RECORD,
    },
    codeContains: [
      '({} as Validator).encode("visitor_placeholder_calls/validator_encode_anonymous.ts#$AnonymousType_0", {})',
    ],
  },
  validator_encode_type_parameter: {
    types: {
      OptionalType: OPTIONAL_TYPE_RECORD,
    },
    codeContains: [
      '({} as Validator).encode("visitor_placeholder_calls/validator_encode_type_parameter.ts#OptionalType", {})',
    ],
  },
  validator_encode: {
    types: {
      $AnonymousType_0: TYPE_RECORD,
    },
    codeContains: [
      `({} as Validator).encode("visitor_placeholder_calls/validator_encode.ts#$AnonymousType_0", { a: 10 })`,
    ],
  },
};

for (const relativeProgramName in expectedTransformationResults) {
  test(
    relativeProgramName,
    hasTypesAndGeneratedCode,
    relativeProgramName,
    expectedTransformationResults[relativeProgramName],
  );
}

function hasTypesAndGeneratedCode(
  t: ExecutionContext,
  relativeProgramName: string,
  expectedTransformationResult: ExpectedTransformationResult,
) {
  const result = transformUnitTestProgram(
    t,
    `${PROGRAM_PREFIX}${relativeProgramName}`,
    {
      visitor: PlaceholderCallsVisitor,
    },
  ).assertTypesEqual(expectedTransformationResult.types);
  const code = result.getTransformedContentSingle();
  for (const pattern of expectedTransformationResult.codeContains) {
    if (typeof pattern === 'string') {
      t.assert(
        code.includes(pattern),
        `<<<${pattern}>>> (string literal) not found`,
      );
    } else {
      t.assert(
        pattern.test(code),
        `no match for regex <<<${pattern.source}>>>`,
      );
    }
  }
}
