// This intersection is not inhabited, but this is not something that TypeScript checks.
export type Intersection = string & { a: string };
