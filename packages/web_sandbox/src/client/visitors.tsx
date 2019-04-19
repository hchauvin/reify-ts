import * as fc from 'fast-check';
import { TypeMirror } from 'reify-ts/lib/runtime/type_mirror';
import { TypeEntry } from 'reify-ts/lib/types';
import { FastChecker } from 'reify-ts/lib/consumers/fast_checker';
import { Validator } from 'reify-ts/lib/consumers/validator';

const SAMPLE_COUNT = 5;

export function getSampleValues(ast: TypeEntry[], typeName: string): any[] {
  const typeMirror = new TypeMirror(ast);
  const fastChecker = new FastChecker(typeMirror);
  return fc.sample(fastChecker.getArbitrary(typeName), SAMPLE_COUNT);
}

export function validateValue(value: any, ast: TypeEntry[], typeName: string) {
  const typeMirror = new TypeMirror(ast);
  const validator = new Validator(typeMirror);
  validator.decode(typeName, value);
}
