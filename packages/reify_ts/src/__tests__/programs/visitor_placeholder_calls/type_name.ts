import { getTypeName } from '../../../consumers/type_name';

type Type = { a: number };

export const typeName = getTypeName<Type>();
