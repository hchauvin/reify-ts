import { Validator, encode } from '../../../consumers/validator';

encode<{ a?: number }>({} as Validator, {});
