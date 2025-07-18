import Vuex, {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
  mapState as _mapState,
} from 'vuex'
import type { ActionContext, Store as VuexStore } from 'vuex'
import type { ComputedGetter } from 'vue'
import type { And, GetModulesKeys, HasDefinedAndNotAny, HasDefinedAndNotAnyAndNonOptional, IsFunction, NoInfer, UnionToIntersection } from './utils'
import { IS_VUEX_3 } from './helper'

interface ModuleCommit<MUTATIONS> {
  <T extends keyof MUTATIONS, P extends MUTATIONS[T]>(type: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? never : T, payload?: NoInfer<P> | undefined): void
  <T extends keyof MUTATIONS, P extends MUTATIONS[T]>(type: T, payload: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? NoInfer<P> : undefined): void
  <T extends keyof MUTATIONS>(input: { type: T } & MUTATIONS[T]): void
}

interface ModuleDispatch<ACTIONS> {
  <T extends keyof ACTIONS, P extends ACTIONS[T]>(type: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? never : T, payload?: NoInfer<P> | undefined): Promise<any>
  <T extends keyof ACTIONS, P extends ACTIONS[T]>(type: T, payload: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? NoInfer<P> : undefined): Promise<any>
  <T extends keyof ACTIONS>(input: { type: T } & ACTIONS[T]): Promise<any>
}

type STATE_VALUE = Record<string, any> | (() => Record<string, any>)

type GEN_STATE<T> = IsFunction<T> extends true ? ReturnType<T extends (...args: any) => any ? T : never> : NoInfer<T>

/**
 * Normal Module Instance
 */
export interface Module<STATE, MUTATIONS, ACTIONS, GETTERS> {
  namespaced: false
  state: GEN_STATE<STATE>
  mutations: { [K in keyof MUTATIONS]: (state: GEN_STATE<STATE>, payload: HasDefinedAndNotAny<MUTATIONS[K]> extends true ? MUTATIONS[K] : undefined) => void }
  actions: { [K in keyof ACTIONS]: (injectee: {
    state: GEN_STATE<STATE>
    commit: ModuleCommit<MUTATIONS>
    dispatch: ModuleDispatch<ACTIONS>
    getters: GETTERS
  }, payload: ACTIONS[K]) => void }
  getters: { [K in keyof GETTERS]: (state: GEN_STATE<STATE>) => GETTERS[K] }
  modules: never
}

/**
 * Namespacing Module Instance
 */
export interface NSModule<STATE, MUTATIONS, ACTIONS, GETTERS, MODULES> {
  namespaced: true
  state: GEN_STATE<STATE>
  mutations: { [K in keyof MUTATIONS]: (state: GEN_STATE<STATE>, payload: HasDefinedAndNotAny<MUTATIONS[K]> extends true ? MUTATIONS[K] : undefined) => void }
  actions: { [K in keyof ACTIONS]: (injectee: {
    state: GEN_STATE<STATE>
    commit: ModuleCommit<MUTATIONS>
    dispatch: ModuleDispatch<ACTIONS>
    getters: GETTERS
  }, payload: ACTIONS[K]) => void }
  getters: { [K in keyof GETTERS]: (state: GEN_STATE<STATE>) => GETTERS[K] }
  modules: MODULES
}

export function defineModule<
  STATE = {}, MUTATIONS = {}, ACTIONS = {}, GETTERS = {}, NAMESPACED extends true | false = false,
>(options: {
  namespaced?: NAMESPACED
  state: STATE
  mutations?: { [K in keyof MUTATIONS]:
    /**
     * @param payload Pass `undefined` when no parameters are required
     */
    (state: GEN_STATE<STATE>, payload: MUTATIONS[K]) => void }
  actions?: {
    /**
     * @param ctx not support `rootState` and `rootGetters`
     * @param payload Pass `undefined` when no parameters are required, and
     */
    [K in keyof ACTIONS]: <
      DISPATCH extends ModuleDispatch<NoInfer<ACTIONS>>, ACTIONGETTERS extends NoInfer<GETTERS>,
    >(injectee: Omit<ActionContext<NoInfer<STATE>, unknown>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
      state: GEN_STATE<STATE>
      commit: ModuleCommit<NoInfer<MUTATIONS>>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: ACTIONS[K]) => any
  }
  getters?: {
    /** not support `rootState` and `rootGetters` */
    [K in keyof GETTERS]: <LGS extends GETTERS>(state: GEN_STATE<STATE>, getters: LGS) => GETTERS[K]
  }
  // modules?: NS extends true
  //     ? MDS extends Record<string, NSModule<any,any,any,any, any>>
  //         ? MDS
  //         : never
  //     : never
  /** Nesting is **not** allowed */
  modules?: never
}): [NAMESPACED] extends [true]
    ? NSModule<
      STATE,
      MUTATIONS,
      ACTIONS,
      GETTERS,
      never
  >
    : Module<
      STATE,
      MUTATIONS,
      ACTIONS,
      GETTERS
      // MDS
  > {
  // @ts-ignore
  return options
}

// ---

export type ModuleInstance =
  | Module<any, any, any, any>
  | NSModule<any, any, any, any, any>

export type Modules = Record<string, ModuleInstance>

type Flatten<T extends Record<string, Record<string, any>>> = UnionToIntersection<T[keyof T]>

/**
 * A helper type for expanding `getters`.
 */
type FlattenGetters<
  T extends Modules,
> = Flatten<{
  [K1 in keyof T]: {
    [K2 in keyof T[K1]['getters'] as (T[K1] extends NSModule<any, any, any, any, any>
      ? `${string & K1}/${
          string & K2
      }` : K2)
    ]: ReturnType<T[K1]['getters'][K2]>
  }
}>

/**
 * A helper type for expanding `mutations`.
 */
type FlattenMutations<
  T extends Modules,
> = Flatten<{
  [K1 in keyof T]: {
    [K2 in keyof T[K1]['mutations'] as (T[K1] extends NSModule<any, any, any, any, any>
      ? `${string & K1}/${
          string & K2
      }` : K2)
    ]: T[K1]['mutations'][K2]
  }
}>

/**
 * A helper type for expanding `actions`.
 */
type FlattenActions<
  T extends Modules,
> = Flatten<{
  [K1 in keyof T]: {
    [K2 in keyof T[K1]['actions'] as (T[K1] extends NSModule<any, any, any, any, any>
      ? `${string & K1}/${
          string & K2
      }` : K2)
    ]: T[K1]['actions'][K2]
  }
}>

// ---

type StoreState<MODULES, ROOTSTATE> = Readonly<
    & { [K in keyof MODULES]: MODULES[K] extends ModuleInstance ? GEN_STATE<MODULES[K]['state']> : never }
    & { [K in keyof ROOTSTATE]: ROOTSTATE[K] }
>

type StoreCommit<MODULES, MUTATIONS> =
  (
    MODULES[keyof MODULES] extends ModuleInstance
      ? {
        <
          MS extends FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >,
          K extends keyof (MS & MUTATIONS),
          P extends (K extends keyof MS
            ? MS[K] extends (...args: any) => any
              ? Parameters<MS[K]>[1]
              : undefined
            : K extends keyof MUTATIONS
              ? MUTATIONS[K]
              : undefined),
        >(type: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? never : K extends string ? K : never, payload?: HasDefinedAndNotAny<NoInfer<P>> extends false ? NoInfer<P> | undefined : never): void

        <
          MS extends FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >,
          K extends keyof (MS & MUTATIONS),
          P extends (K extends keyof MS
            ? MS[K] extends (...args: any) => any
              ? Parameters<MS[K]>[1]
              : undefined
            : K extends keyof MUTATIONS
              ? MUTATIONS[K]
              : undefined),
        >(type: K extends string ? K : never, payload: HasDefinedAndNotAny<NoInfer<P>> extends true ? NoInfer<P> : never): void

        <
        MS extends FlattenMutations<
          MODULES extends Modules ? MODULES : never
        >,
        K extends keyof (MS & MUTATIONS),
      >(input: { type: K } & (
          K extends keyof MS
            ? MS[K] extends (...args: any) => any
              ? Parameters<MS[K]>[1]
              : {}
            : K extends keyof MUTATIONS
              ? MUTATIONS[K]
              : {})): void
        }
      : {
          <T extends keyof MUTATIONS>(type: T, payload: MUTATIONS[T]): void
          <T extends keyof MUTATIONS>(input: { type: T } & MUTATIONS[T]): void
        }
  )

type StoreDispatch<MODULES, ACTIONS> =
  (MODULES[keyof MODULES] extends ModuleInstance
    ? {
        <
          AS extends FlattenActions<
          MODULES extends Modules ? MODULES : never
        >,
          K extends keyof (AS & ACTIONS),
          P extends (K extends keyof AS
            ? AS[K] extends (...args: any) => any
              ? Parameters<AS[K]>[1]
              : never
            : K extends keyof ACTIONS
              ? ACTIONS[K]
              : never),
        >(type: HasDefinedAndNotAnyAndNonOptional<NoInfer<P>> extends true ? never : K, payload?: NoInfer<P> | undefined): Promise<any>

        <
          AS extends FlattenActions<
          MODULES extends Modules ? MODULES : never
        >,
          K extends keyof (AS & ACTIONS),
          P extends (K extends keyof AS
            ? AS[K] extends (...args: any) => any
              ? Parameters<AS[K]>[1]
              : undefined
            : K extends keyof ACTIONS
              ? ACTIONS[K]
              : undefined),
        >(type: K, payload: HasDefinedAndNotAny<NoInfer<P>> extends true ? NoInfer<P> : undefined): Promise<any>

        <
          AS extends FlattenActions<
          MODULES extends Modules ? MODULES : never
        >,
          K extends keyof (AS & ACTIONS),
        >(input: { type: K } & (
          K extends keyof AS
            ? AS[K] extends (...args: any) => any
              ? Parameters<AS[K]>[1]
              : {}
            : K extends keyof ACTIONS
              ? ACTIONS[K]
              : {}
        )): Promise<any>
      }
    : {
      <T extends keyof ACTIONS>(type: T, payload: ACTIONS[T]): Promise<any>
      <T extends keyof ACTIONS>(input: { type: T } & ACTIONS[T]): Promise<any>
      }
  )

type StoreGetters<MODULES, GETTERS> =
FlattenGetters<
  MODULES extends Modules ? MODULES : never
> & { [K in keyof GETTERS]: GETTERS[K] }

// ---

interface MapGetters<GETTERS, MODULES> {
  // 1.without namespace
  // 1.1 accept a list
  <
    GETTERS_KEYS extends keyof GETTERS, MODULES_KEYS extends keyof MODULES, M extends (
      MODULES[MODULES_KEYS] extends ModuleInstance
        ? MODULES[MODULES_KEYS]
        : never
    ), MODULE_GETTERS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'getters'>, KEY_ITEM extends string,
  >(map: KEY_ITEM[]): {
    [K in KEY_ITEM extends MODULE_GETTERS_KEYS | GETTERS_KEYS ? KEY_ITEM : never]:
    K extends MODULE_GETTERS_KEYS
      ? ComputedGetter< M extends Module<any, any, any, any> ? K extends keyof M['getters'] ? ReturnType<M['getters'][K]> : never : never >
      : K extends GETTERS_KEYS
        ? ComputedGetter<GETTERS[K]> : never
  }
  // 1.2 accept a object
  <
    GETTERS_KEYS extends keyof GETTERS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_GETTERS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'getters'>, MAP extends Record<string, MODULE_GETTERS_KEYS | GETTERS_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: ComputedGetter<ReturnType<MAP[K] extends GETTERS_KEYS ? never : M extends Module<any, any, any, any> ? M['getters'][MAP[K]] : never>>
  }, {
    [K in keyof MAP]: ComputedGetter<MAP[K] extends GETTERS_KEYS ? GETTERS[MAP[K]] : never>
  }>
  // 2.with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: ComputedGetter<ReturnType<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'][MAP[K]] : never>>
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'] : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: ComputedGetter<ReturnType<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'][K] : never>>
  }
}

type PickModuleMutaions<M> = M extends Module<any, infer Mutations, any, any> ? HasDefinedAndNotAny<UnionToIntersection<Mutations>> extends true ? UnionToIntersection<Mutations> : {} : {}

type PickNSModuleMutaions<M> = M extends NSModule<any, infer Mutations, any, any, any> ? HasDefinedAndNotAny<UnionToIntersection<Mutations>> extends true ? UnionToIntersection<Mutations> : {} : {}

interface MapMutations<MUTATIONS, MODULES> {
  // 1. without namespace
  // 1.1 accept a object
  <
    MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'mutations'>, MAP extends Record<string, MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS>,
    MM extends M extends Module<any, any, any, any> ? PickModuleMutaions<M> : never,
  >(map: MAP): {
    [K in keyof MAP]:
    MAP[K] extends MODULE_MUTATIONS_KEYS
      ? HasDefinedAndNotAnyAndNonOptional<MAP[K] extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[MAP[K]] : never> extends true
        ? (payload: MAP[K] extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[MAP[K]] : never) => void
        : (payload?: (MAP[K] extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[MAP[K]] : never) | undefined) => void
      : MAP[K] extends MUTATIONS_KEYS
        ? HasDefinedAndNotAnyAndNonOptional<MUTATIONS[MAP[K]]> extends true
          ? (payload: MUTATIONS[MAP[K]]) => void
          : (payload?: MUTATIONS[MAP[K]] | undefined) => void
        : never
  }
  // 1.2 accept a list
  <
    MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'mutations'>, KEY_ITEM extends string,
    MM extends M extends Module<any, any, any, any> ? PickModuleMutaions<M> : never,
  >(map: KEY_ITEM[]): {
    [K in KEY_ITEM extends MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS ? KEY_ITEM : never]:
    K extends MODULE_MUTATIONS_KEYS
      ? HasDefinedAndNotAnyAndNonOptional<K extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[K] : never> extends true
        ? (payload: K extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[K] : never) => void
        : (payload?: (K extends keyof UnionToIntersection<MM> ? UnionToIntersection<MM>[K] : never) | undefined) => void
      : K extends MUTATIONS_KEYS
        ? HasDefinedAndNotAnyAndNonOptional<MUTATIONS[K]> extends true
          ? (payload: MUTATIONS[K]) => void
          : (payload?: MUTATIONS[K] | undefined) => void
        : never
  }
  // 2.with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]> : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: HasDefinedAndNotAnyAndNonOptional<MAP[K] extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[MAP[K]] : never> extends true
      ? (payload: MAP[K] extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[MAP[K]] : never) => void
      : (payload?: (MAP[K] extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[MAP[K]] | undefined : never) | undefined) => void
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]> : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: HasDefinedAndNotAnyAndNonOptional<K extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[K] : never> extends true
      ? (payload: K extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[K] : never) => void
      : (payload?: (K extends keyof PickNSModuleMutaions<MODULES[MODULES_KEYS]> ? PickNSModuleMutaions<MODULES[MODULES_KEYS]>[K] | undefined : never) | undefined) => void
  }
}

type PickModuleActions<M> = M extends Module<any, any, infer Actions, any> ? HasDefinedAndNotAny<UnionToIntersection<Actions>> extends true ? UnionToIntersection<Actions> : {} : {}

type PickNSModuleActions<M> = M extends NSModule<any, any, infer Actions, any, any> ? HasDefinedAndNotAny<UnionToIntersection<Actions>> extends true ? UnionToIntersection<Actions> : {} : {}

interface MapActions<ACTIONS, MODULES> {
  // 1. without namespace
  // 1.1 accept a list
  <
    ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'actions'>, KEY_ITEM extends string,
    MA extends M extends Module<any, any, any, any> ? PickModuleActions<M> : never,
  >(map: KEY_ITEM[]): {
    [K in KEY_ITEM extends MODULE_ACTIONS_KEYS | ACTIONS_KEYS ? KEY_ITEM : never]:
    K extends MODULE_ACTIONS_KEYS
      ? HasDefinedAndNotAnyAndNonOptional<K extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[K] : never> extends true
        ? (payload: K extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[K] : never) => any
        : (payload?: (K extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[K] : never) | undefined) => any
      : K extends ACTIONS_KEYS
        ? HasDefinedAndNotAnyAndNonOptional<ACTIONS[K]> extends true
          ? (payload: ACTIONS[K]) => any
          : (payload?: ACTIONS[K] | undefined) => any
        : never
  }
  // 1.2 accept a object
  <
    ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'actions'>, MAP extends Record<string, MODULE_ACTIONS_KEYS | ACTIONS_KEYS>,
    MA extends M extends Module<any, any, any, any> ? PickModuleActions<M> : never,
  >(map: MAP): {
    [K in keyof MAP]:
    MAP[K] extends MODULE_ACTIONS_KEYS
      ? HasDefinedAndNotAnyAndNonOptional<MAP[K] extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[MAP[K]] : never> extends true
        ? (payload: MAP[K] extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[MAP[K]] : never) => any
        : (payload?: (MAP[K] extends keyof UnionToIntersection<MA> ? UnionToIntersection<MA>[MAP[K]] : never) | undefined) => any
      : MAP[K] extends ACTIONS_KEYS
        ? HasDefinedAndNotAnyAndNonOptional<ACTIONS[MAP[K]]> extends true
          ? (payload: ACTIONS[MAP[K]]) => any
          : (payload?: ACTIONS[MAP[K]] | undefined) => any
        : never
  }
  // 2. with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? PickNSModuleActions<MODULES[MODULES_KEYS]> : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: HasDefinedAndNotAnyAndNonOptional<MAP[K] extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[MAP[K]] : never> extends true
      ? (payload: MAP[K] extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[MAP[K]] : never) => any
      : (payload?: (MAP[K] extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[MAP[K]] | undefined : never) | undefined) => any
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? PickNSModuleActions<MODULES[MODULES_KEYS]> : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: HasDefinedAndNotAnyAndNonOptional<K extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[K] : never> extends true
      ? (payload: K extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[K] : never) => any
      : (payload?: (K extends keyof PickNSModuleActions<MODULES[MODULES_KEYS]> ? PickNSModuleActions<MODULES[MODULES_KEYS]>[K] | undefined : never) | undefined) => any
  }
}

interface MapState<STATE, MODULES> {
  // 1.without namespace
  // 1.1 accept a list
  <
    STATE_KEYS extends keyof STATE, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_STATE_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'state'>, KEY_ITEM extends string,
  >(map: KEY_ITEM[]): {
    /** vuex not support */
    [K in KEY_ITEM extends MODULE_STATE_KEYS | STATE_KEYS ? KEY_ITEM : never]:
    K extends MODULE_STATE_KEYS
      ? ComputedGetter<
      M extends Module<any, any, any, any>
        // vuex not support
        ? undefined
        // M['state'][K]
        : never>
      : K extends STATE_KEYS
        ? ComputedGetter<STATE[K]>
        : never
  }
  // 1.2 accept a object
  <
    STATE_KEYS extends keyof GEN_STATE<STATE>, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_STATE_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'state'>, MAP extends Record<string, MODULE_STATE_KEYS | STATE_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: ComputedGetter<MAP[K] extends STATE_KEYS ? never : M extends Module<any, any, any, any> ? M['state'][MAP[K]] : never>
  }, {
    [K in keyof MAP]: ComputedGetter<MAP[K] extends STATE_KEYS ? GEN_STATE<STATE>[MAP[K]] : never>
  }>
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, ((state: STATE & { [K in MODULES_KEYS]: MODULES[K] extends ModuleInstance ? MODULES[K]['state'] : never }) => any)>,
  >(map: MAP): {
    [K in keyof MAP]: ComputedGetter<ReturnType<MAP[K]>>
  }
  // 2.with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['state'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: ComputedGetter<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? GEN_STATE<MODULES[MODULES_KEYS]['state']>[MAP[K]] : never>
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['state'] : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: ComputedGetter<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['state'][K] : never>
  }
}

// ---

type StoreInstance<
  MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS,
> = Omit<InstanceType<typeof VuexStore<StoreState<MODULES, ROOTSTATE>>>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
  state: StoreState<MODULES, GEN_STATE<ROOTSTATE>>
  /** mutations */
  commit: StoreCommit<MODULES, MUTATIONS>
  /** actions */
  dispatch: StoreDispatch<MODULES, ACTIONS>
  /** getters */
  getters: StoreGetters<MODULES, GETTERS>
}

interface StoreWrap<
  MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS,
> {
  store: StoreInstance<MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS>
  mapMutations: MapMutations<MUTATIONS, MODULES>
  mapGetters: MapGetters<GETTERS, MODULES>
  mapActions: MapActions<ACTIONS, MODULES>
  mapState: MapState<ROOTSTATE, MODULES>
  useStore: () => StoreInstance<MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS>
}

export function defineStore<
  MODULES = {}, ROOTSTATE extends STATE_VALUE = {}, MUTATIONS = {}, ACTIONS = {}, GETTERS = {},
>(options: {
  modules?: { [K in keyof MODULES]:
    MODULES[K] extends ModuleInstance
      ? MODULES[K]
      : never
  }
  state?: ROOTSTATE
  mutations?: { [K in keyof MUTATIONS]:
    /**
     * @param payload Pass `undefined` when no parameters are required
     */
    (state: GEN_STATE<ROOTSTATE>, payload: MUTATIONS[K]) => void }
  actions?: {
    /**
     * @param payload Pass `undefined` when no parameters are required
     */
    [K in keyof ACTIONS]: <
      DISPATCH extends StoreDispatch<NoInfer<MODULES>, NoInfer<ACTIONS>>, ACTIONGETTERS extends NoInfer<GETTERS>,
    >(injectee: Omit<ActionContext<NoInfer<ROOTSTATE>, NoInfer<ROOTSTATE>>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
      state: StoreState<NoInfer<MODULES>, GEN_STATE<ROOTSTATE>>
      commit: StoreCommit<NoInfer<MODULES>, NoInfer<MUTATIONS>>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: ACTIONS[K]) => void
  }
  getters?: { [K in keyof GETTERS]: (state: StoreState<NoInfer<MODULES>, GEN_STATE<ROOTSTATE>>) => GETTERS[K] }

}, /** only vue2 use */_Vue?: any): StoreWrap<MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS> {
  if (_Vue && IS_VUEX_3)
    _Vue.use(Vuex)

  // @ts-ignore
  const store = IS_VUEX_3 ? new Vuex.Store(options) : Vuex.createStore(options)

  return {
    store,
    mapState: _mapState,
    mapMutations: _mapMutations,
    mapActions: _mapActions,
    mapGetters: _mapGetters,
    useStore: () => store,
  }
}
