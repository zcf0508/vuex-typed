import Vuex, {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
  mapState as _mapState,
} from 'vuex'
import type { ActionContext, Store as VuexStore } from 'vuex'
import type { ComputedGetter } from 'vue'
import type { And, GetModulesKeys, HasDefinedAndNotAny, UnionToIntersection } from './utils'
import { IS_VUEX_3 } from './helper'

interface ModuleCommit<MUTATIONS> {
  <T extends keyof MUTATIONS, P extends MUTATIONS[T]>(type: HasDefinedAndNotAny<P> extends true ? never : T, payload?: undefined): void
  <T extends keyof MUTATIONS, P extends MUTATIONS[T]>(type: T, payload: HasDefinedAndNotAny<P> extends true ? P : undefined): void
  <T extends keyof MUTATIONS>(input: { type: T } & MUTATIONS[T]): void
}

interface ModuleDispatch<ACTIONS> {
  <T extends keyof ACTIONS, P extends ACTIONS[T]>(type: HasDefinedAndNotAny<P> extends true ? never : T, payload?: undefined): Promise<any>
  <T extends keyof ACTIONS, P extends ACTIONS[T]>(type: T, payload: HasDefinedAndNotAny<P> extends true ? P : undefined): Promise<any>
  <T extends keyof ACTIONS>(input: { type: T } & ACTIONS[T]): Promise<any>
}

/**
 * Normal Module Instance
 */
export interface Module<STATE, MUTATIONS, ACTIONS, GETTERS> {
  namespaced: false
  state: STATE
  mutations: { [K in keyof MUTATIONS]: (state: STATE, payload: MUTATIONS[K]) => void }
  actions: { [K in keyof ACTIONS]: (injectee: {
    state: STATE
    commit: ModuleCommit<MUTATIONS>
    dispatch: ModuleDispatch<ACTIONS>
    getters: GETTERS
  }, payload: ACTIONS[K]) => void }
  getters: { [K in keyof GETTERS]: (state: STATE) => GETTERS[K] }
  modules: never
}

/**
 * Namespacing Module Instance
 */
export interface NSModule<STATE, MUTATIONS, ACTIONS, GETTERS, MODULES> {
  namespaced: true
  state: STATE
  mutations: { [K in keyof MUTATIONS]: (state: STATE, payload: MUTATIONS[K]) => void }
  actions: { [K in keyof ACTIONS]: (injectee: {
    state: STATE
    commit: ModuleCommit<MUTATIONS>
    dispatch: ModuleDispatch<ACTIONS>
    getters: GETTERS
  }, payload: ACTIONS[K]) => void }
  getters: { [K in keyof GETTERS]: (state: STATE) => GETTERS[K] }
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
    (state: STATE, payload: HasDefinedAndNotAny<MUTATIONS[K]> extends true ? MUTATIONS[K] : undefined) => void }
  actions?: {
    /**
     * @param ctx not support `rootState` and `rootGetters`
     * @param payload Pass `undefined` when no parameters are required, and
     */
    [K in keyof ACTIONS]: <
      DISPATCH extends ModuleDispatch<ACTIONS>, ACTIONGETTERS extends GETTERS,
    >(injectee: Omit<ActionContext<STATE, unknown>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
      state: STATE
      commit: ModuleCommit<MUTATIONS>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: HasDefinedAndNotAny<ACTIONS[K]> extends true ? ACTIONS[K] : undefined) => any
  }
  getters?: {
    /** not support `rootState` and `rootGetters` */
    [K in keyof GETTERS]: <LGS extends GETTERS>(state: STATE, getters: LGS) => GETTERS[K]
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
    & { [K in keyof MODULES]: MODULES[K] extends ModuleInstance ? MODULES[K]['state'] : never }
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
        >(type: HasDefinedAndNotAny<P> extends true ? never : K extends string ? K : never, payload?: HasDefinedAndNotAny<P> extends false ? P | undefined : never): void

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
        >(type: K extends string ? K : never, payload: HasDefinedAndNotAny<P> extends true ? P : never): void

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
              : undefined
            : K extends keyof ACTIONS
              ? ACTIONS[K]
              : undefined),
        >(type: HasDefinedAndNotAny<P> extends true ? never : K, payload?: HasDefinedAndNotAny<P> extends false ? P | undefined : never): Promise<any>

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
        >(type: K, payload: HasDefinedAndNotAny<P> extends true ? P : undefined): Promise<any>

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

interface MapMutations<MUTATIONS, MODULES> {
  // 1. without namespace
  // 1.1 accept a object
  <
    MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'mutations'>, MAP extends Record<string, MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: MAP[K] extends MODULE_MUTATIONS_KEYS ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['mutations'][MAP[K]] : never
    >[1]) => void : never
  }, {
    [K in keyof MAP]: MAP[K] extends MUTATIONS_KEYS ? (payload: MUTATIONS[MAP[K]]) => void : never
  }>
  // 1.2 accept a list
  <
    MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'mutations'>, KEY_ITEM extends string,
  >(map: KEY_ITEM[]): {
    [K in KEY_ITEM extends MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS ? KEY_ITEM : never]:
    K extends MODULE_MUTATIONS_KEYS
      ? (payload: Parameters<
          M extends Module<any, any, any, any>
            ? K extends keyof M['mutations'] ? M['mutations'][K] : never : never
        >[1]) => void
      : K extends MUTATIONS_KEYS
        ? (payload: MUTATIONS[K]) => void
        : never
  }
  // 2.with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'][MAP[K]] extends (...args: any) => any ? MODULES[MODULES_KEYS]['mutations'][MAP[K]] : never : never>[1]) => void
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'] : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'][K] extends (...args: any) => any ? MODULES[MODULES_KEYS]['mutations'][K] : never : never>[1]) => void
  }
}

interface MapActions<ACTIONS, MODULES> {
  // 1. without namespace
  // 1.1 accept a list
  <
    ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'actions'>, MAP_ITEM extends string,
  >(map: MAP_ITEM[]): {
    [K in MAP_ITEM extends MODULE_ACTIONS_KEYS | ACTIONS_KEYS ? MAP_ITEM : never]:
    K extends MODULE_ACTIONS_KEYS
      ? (payload: Parameters<
        M extends Module<any, any, any, any> ? K extends keyof M['actions'] ? M['actions'][K] : never : never
      >[1]) => void
      : K extends ACTIONS_KEYS
        ? (payload: ACTIONS[K]) => void
        : never
  }
  // 1.2 accept a object
  <
    ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'actions'>, MAP extends Record<string, MODULE_ACTIONS_KEYS | ACTIONS_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: MAP[K] extends MODULE_ACTIONS_KEYS ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['actions'][MAP[K]] : never
    >[1]) => void : never
  }, {
    [K in keyof MAP]: MAP[K] extends ACTIONS_KEYS ? (payload: ACTIONS[MAP[K]]) => void : never
  }>
  // 2. with namespace
  <
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['actions'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['actions'][MAP[K]] extends (...args: any) => any ? MODULES[MODULES_KEYS]['actions'][MAP[K]] : never : never>[1]) => void
  }
  <
    MODULES_KEYS extends keyof MODULES, ALL_KEYS extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['actions'] : never), MAP_ITEM extends string,
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
    [K in MAP_ITEM extends ALL_KEYS ? MAP_ITEM : never]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['actions'][K] extends (...args: any) => any ? MODULES[MODULES_KEYS]['actions'][K] : never : never>[1]) => void
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
    STATE_KEYS extends keyof STATE, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_STATE_KEYS extends GetModulesKeys<MODULES extends Modules ? MODULES : never, 'state'>, MAP extends Record<string, MODULE_STATE_KEYS | STATE_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: ComputedGetter<MAP[K] extends STATE_KEYS ? never : M extends Module<any, any, any, any> ? M['state'][MAP[K]] : never>
  }, {
    [K in keyof MAP]: ComputedGetter<MAP[K] extends STATE_KEYS ? STATE[MAP[K]] : never>
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
    [K in keyof MAP]: ComputedGetter<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['state'][MAP[K]] : never>
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
  state: StoreState<MODULES, ROOTSTATE>
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
  MODULES = {}, ROOTSTATE extends Record<string, any> = {}, MUTATIONS = {}, ACTIONS = {}, GETTERS = {},
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
    (state: ROOTSTATE, payload: HasDefinedAndNotAny<MUTATIONS[K]> extends true ? MUTATIONS[K] : undefined) => void }
  actions?: {
    /**
     * @param payload Pass `undefined` when no parameters are required
     */
    [K in keyof ACTIONS]: <
      DISPATCH extends StoreDispatch<MODULES, ACTIONS>, ACTIONGETTERS extends GETTERS,
    >(injectee: Omit<ActionContext<ROOTSTATE, ROOTSTATE>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
      state: StoreState<MODULES, ROOTSTATE>
      commit: StoreCommit<MODULES, MUTATIONS>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: HasDefinedAndNotAny<ACTIONS[K]> extends true ? ACTIONS[K] : undefined) => void
  }
  getters?: { [K in keyof GETTERS]: (state: StoreState<MODULES, ROOTSTATE>) => GETTERS[K] }

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
