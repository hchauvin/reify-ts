import { Validator, encode } from '../../../consumers/validator';

type OptionalType = { a?: number };

encode<OptionalType>({} as Validator, {});
