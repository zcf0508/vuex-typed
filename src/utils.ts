import type { Module, ModuleInstance, NSModule } from '.'

type AllNever = unknown | never | Record<any, never> | never[] | ((...args: never) => any)

type IfNever<T, Y, N> = [T] extends [AllNever] ? Y : N
export type And<A, B> = IfNever<A, B, IfNever<B, A, A & B>>
export type Or<A, B> = IfNever<A, B, IfNever<B, A, A | B>>

type Equal<Left, Right> =
  (<U>() => U extends Left ? 1 : 0) extends (<U>() => U extends Right ? 1 : 0) ? true : false

type IsAny<T> = Equal<T, any> extends true ? true : false

export type IsNever<T> = Equal<T, never> extends true ? true : false

type IsOptional<T> = Equal<T | undefined, T>

export type HasDefinedAndNotAnyAndNonOptional<T> =
  IsAny<T> extends true
    ? false
    : Equal<T, unknown> extends true
      ? false
      : IsOptional<T> extends true
        ? false
        : true

export type HasDefinedAndNotAny<T> =
  IsAny<T> extends true
    ? false
    : Equal<T, unknown> extends true
      ? false
      : true

// ---

/** a|b -> a&b */
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type AnyOf<T, U> = T extends U ? true : false
export type Includes<T, U> = UnionToIntersection<T extends any ? AnyOf<T, U> : never> extends true ? true : false

// ---

/** Get the keys corresponding to the attributes in all Modules. */
export type GetModulesKeys<T extends Record<string, ModuleInstance>, K extends 'state' | 'mutations' | 'actions' | 'getters'> = keyof UnionToIntersection<{
  [I in keyof T]: T[I] extends Module<any, any, any, any>
    ? T[I] extends { [P in K]: infer U }
      ? U
      : never
    : never
}[keyof T]>

/** Get the keys corresponding to the attributes in all NSModules. */
export type GetNSModulesKeys<T extends Record<string, ModuleInstance>, K extends 'state' | 'mutations' | 'actions' | 'getters'> = keyof UnionToIntersection<{
  [I in keyof T]: T[I] extends NSModule<any, any, any, any, any>
    ? T[I] extends { [P in K]: infer U }
      ? U
      : never
    : never
}[keyof T]>

/**
 * https://stackoverflow.com/questions/56687668/a-way-to-disable-type-argument-inference-in-generics
 *
 * https://github.com/microsoft/TypeScript/pull/56794
 *
 * TODO: maybe remove this type after typescript 5.4 is released
 */
export type NoInfer<T> = [T][T extends any ? 0 : never]

export type IsFunction<T> = T extends (...args: any[]) => any ? true : false
