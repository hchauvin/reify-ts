import { Validator, decode } from '../../../consumers/validator';

type Type = { a: number };

// Type specified as type parameter
decode<Type>({} as Validator, { foo: 'bar' });
