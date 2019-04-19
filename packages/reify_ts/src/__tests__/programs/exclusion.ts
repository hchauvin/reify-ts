export interface ExcludedType {
  a: number;
}

export interface WithExcludedType {
  a: ExcludedType;
}

export type NotExcluded = string;
