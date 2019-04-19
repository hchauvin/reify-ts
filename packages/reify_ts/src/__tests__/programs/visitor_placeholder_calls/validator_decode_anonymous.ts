import { Validator, decode } from '../../../consumers/validator';

decode<{ a: number }>({} as Validator, { foo: 'bar' });
