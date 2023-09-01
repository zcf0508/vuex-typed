import type { Module, ModuleInstance, NSModule } from '.'

type AllNever = unknown | never | Record<any, never> | never[] | ((...args: never) => any)

type IfNever<T, Y, N> = [T] extends [AllNever] ? Y : N
export type And<A, B> = IfNever<A, B, IfNever<B, A, A & B>>
export type Or<A, B> = IfNever<A, B, IfNever<B, A, A | B>>

// ---

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type AnyOf<T, U> = T extends U ? true : false
export type Includes<T, U> = UnionToIntersection<T extends any ? AnyOf<T, U> : never> extends true ? true : false

// ---

// 获取所有 module 中对应属性的键值
export type GetModulesKeys<T extends Record<string, ModuleInstance>, K extends 'state' | 'mutations' | 'actions' | 'getters'> = keyof UnionToIntersection<{
  [I in keyof T]: T[I] extends Module<any, any, any, any>
    ? T[I] extends { [P in K]: infer U }
      ? U
      : never
    : never
}[keyof T]>

// 获取所有 module 中对应属性的键值
export type GetNSModulesKeys<T extends Record<string, ModuleInstance>, K extends 'state' | 'mutations' | 'actions' | 'getters'> = keyof UnionToIntersection<{
  [I in keyof T]: T[I] extends NSModule<any, any, any, any, any>
    ? T[I] extends { [P in K]: infer U }
      ? U
      : never
    : never
}[keyof T]>
