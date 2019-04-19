import { getTypeName as getTypeNameAlias } from '../../../consumers/type_name';

type Type = { a: number };

export const typeName = getTypeNameAlias<Type>();
