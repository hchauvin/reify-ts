// This should be automatically rewritten by the type checker to a union
// of intersections
export type IntersectionUnionIntersection = {
  a: string;
} & ({ b: string } | { c: string });

interface Interface {
  a: string;
}

// This should be automatically rewritten by the type checker to a union
// of intersections
export type IntersectionUnionIntersectionWithInterface = Interface &
  ({ b: string } | { c: string });

export type IntersectionThree = { a: string } & { b: string } & { c: string };
