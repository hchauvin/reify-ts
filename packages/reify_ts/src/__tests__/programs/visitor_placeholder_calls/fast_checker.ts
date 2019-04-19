import { FastChecker, getArbitrary } from '../../../consumers/fast_checker';

type Type = { a: number };

getArbitrary<Type>({} as FastChecker);
