import { FastChecker, getArbitrary } from '../../../consumers/fast_checker';

getArbitrary<{ a: number }>({} as FastChecker);
