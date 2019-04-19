import { Validator, decode } from '../../../consumers/validator';

type Type = { a: number };

// Type inferred from return value
export const value: Type = decode({} as Validator, { foo: 'bar' });
