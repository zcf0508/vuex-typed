type AllNever = never | Record<any, never> | never[] | ((...args: never) => never)
export type And<A, B> = A extends AllNever ? B extends AllNever ? never : B : B extends AllNever ? A : A & B
