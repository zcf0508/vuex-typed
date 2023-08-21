type AllNever = unknown | never | Record<any, never> | never[] | ((...args: never) => any)

type IfNever<T, Y, N> = [T] extends [AllNever] ? Y : N
export type And<A, B> = IfNever<A, B, IfNever<B, A, A & B>>
export type Or<A, B> = IfNever<A, B, IfNever<B, A, A | B>>
