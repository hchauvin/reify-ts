export type PickExample = Pick<B, 'a'>;

type B = { a: number; b: string };

export type ExcludeExample = Exclude<keyof B, 'a'>;

export type ExtractExample = Extract<keyof B, 'b'>;

export type NonNullableExample = NonNullable<'a' | null>;

export type ReturnTypeExample = ReturnType<() => number>;

class C {
  constructor(public readonly a: string, public readonly b: number) {}
}

export type InstanceTypeExample = InstanceType<typeof C>;

export type ParametersExample = Parameters<(a: number, b: string) => void>;

export type ConstructorParametersExample = ConstructorParameters<typeof C>;
