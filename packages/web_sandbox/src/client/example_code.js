/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import array from '!!raw-loader!reify-ts/src/__tests__/programs/array.ts';
import atoms from '!!raw-loader!reify-ts/src/__tests__/programs/atoms.ts';
import callable from '!!raw-loader!reify-ts/src/__tests__/programs/callable.ts';
import documentation from '!!raw-loader!reify-ts/src/__tests__/programs/documentation.ts';
import enums from '!!raw-loader!reify-ts/src/__tests__/programs/enums.ts';
import generics from '!!raw-loader!reify-ts/src/__tests__/programs/generics.ts';
import index_and_properties from '!!raw-loader!reify-ts/src/__tests__/programs/index_and_properties.ts';
import intersection_rewrite from '!!raw-loader!reify-ts/src/__tests__/programs/intersection_rewrite.ts';
import intersection from '!!raw-loader!reify-ts/src/__tests__/programs/intersection.ts';
import literal from '!!raw-loader!reify-ts/src/__tests__/programs/literal.ts';
import map from '!!raw-loader!reify-ts/src/__tests__/programs/map.ts';
import mapped_type_modifiers from '!!raw-loader!reify-ts/src/__tests__/programs/mapped_type_modifiers.ts';
import mutual_recursion from '!!raw-loader!reify-ts/src/__tests__/programs/mutual_recursion.ts';
import predefined_conditional_types from '!!raw-loader!reify-ts/src/__tests__/programs/predefined_conditional_types.ts';
import record from '!!raw-loader!reify-ts/src/__tests__/programs/record.ts';
import recursion from '!!raw-loader!reify-ts/src/__tests__/programs/recursion.ts';
import symbol from '!!raw-loader!reify-ts/src/__tests__/programs/symbol.ts';
import tuple from '!!raw-loader!reify-ts/src/__tests__/programs/tuple.ts';
import union from '!!raw-loader!reify-ts/src/__tests__/programs/union.ts';
import visitor_all_types from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_all_types.ts';
import visitor_placeholder_calls__fast_checker_anonymous from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/fast_checker_anonymous.ts';
import visitor_placeholder_calls__fast_checker from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/fast_checker.ts';
import visitor_placeholder_calls__type_name_anonymous from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/type_name_anonymous.ts';
import visitor_placeholder_calls__type_name from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/type_name.ts';
import visitor_placeholder_calls__validator_decode_anonymous from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_decode_anonymous.ts';
import visitor_placeholder_calls__validator_decode_return_value from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_decode_return_value.ts';
import visitor_placeholder_calls__validator_decode_type_parameter from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_decode_type_parameter.ts';
import visitor_placeholder_calls__validator_encode from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_encode.ts';
import visitor_placeholder_calls__validator_encode_anonymous from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_encode_anonymous.ts';
import visitor_placeholder_calls__validator_encode_type_parameter from '!!raw-loader!reify-ts/src/__tests__/programs/visitor_placeholder_calls/validator_encode_type_parameter.ts';

export const exampleCode = {
  array,
  atoms,
  callable,
  documentation,
  enums,
  generics,
  index_and_properties,
  intersection_rewrite,
  intersection,
  // io_ts_brand --> excluded on purpose (because depends on fast-checker)
  literal,
  map,
  mapped_type_modifiers,
  mutual_recursion,
  predefined_conditional_types,
  record,
  recursion,
  symbol,
  tuple,
  union,
  visitor_all_types,
  visitor_placeholder_calls__fast_checker_anonymous,
  visitor_placeholder_calls__fast_checker,
  visitor_placeholder_calls__type_name_anonymous,
  visitor_placeholder_calls__type_name,
  visitor_placeholder_calls__validator_decode_anonymous,
  visitor_placeholder_calls__validator_decode_return_value,
  visitor_placeholder_calls__validator_decode_type_parameter,
  visitor_placeholder_calls__validator_encode,
  visitor_placeholder_calls__validator_encode_anonymous,
  visitor_placeholder_calls__validator_encode_type_parameter,
};
