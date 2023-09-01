type AllNever = unknown | never | Record<any, never> | never[] | ((...args: never) => any)

type IfNever<T, Y, N> = [T] extends [AllNever] ? Y : N
export type And<A, B> = IfNever<A, B, IfNever<B, A, A & B>>
export type Or<A, B> = IfNever<A, B, IfNever<B, A, A | B>>

// ---

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type AnyOf<T, U> = T extends U ? true : false
export type Includes<T, U> = UnionToIntersection<T extends any ? AnyOf<T, U> : never> extends true ? true : false
