import Vuex, {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
} from 'vuex'
import type { Store as VuexStore } from 'vuex'
import Vue from 'vue'
import type { ComputedGetter } from 'vue'
import type { And } from './utils'

interface ModuleCommit<MUTATIONS> {
  <T extends keyof MUTATIONS>(type: T, payload: MUTATIONS[T]): void
  <T extends keyof MUTATIONS>(input: { type: T } & MUTATIONS[T]): void
}

interface ModuleDispatch<ACTIONS> {
  <T extends keyof ACTIONS>(type: T, payload: ACTIONS[T]): Promise<any>
  <T extends keyof ACTIONS>(input: { type: T } & ACTIONS[T]): Promise<any>
}

/**
 * Normal Module Instance
 */
interface Module<STATE, MUTATIONS, ACTIONS, GETTERS> {
  namespaced: false
  state: STATE
  mutations: { [K in keyof MUTATIONS]: (state: STATE, payload: MUTATIONS[K]) => void }
  actions: { [K in keyof ACTIONS]: (store: {
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
interface NSModule<STATE, MUTATIONS, ACTIONS, GETTERS, MODULES> {
  namespaced: true
  state: STATE
  mutations: { [K in keyof MUTATIONS]: (state: STATE, payload: MUTATIONS[K]) => void }
  actions: { [K in keyof ACTIONS]: (ctx: {
    state: STATE
    commit: ModuleCommit<MUTATIONS>
    dispatch: ModuleDispatch<ACTIONS>
    getters: GETTERS
  }, payload: ACTIONS[K]) => void }
  getters: { [K in keyof GETTERS]: (state: STATE) => GETTERS[K] }
  modules: MODULES
}

export function defineModule<
  STATE, MUTATIONS, ACTIONS, GETTERS, NAMESPACED extends boolean = false,
>(options: {
  namespaced?: NAMESPACED
  state: STATE
  mutations?: { [K in keyof MUTATIONS]:
    /**
     * @param payload Pass `undefined` when no parameters are required
     */
    (state: STATE, payload: MUTATIONS[K]) => void }
  /** not support `rootState` and `rootGetters` */
  actions?: { [K in keyof ACTIONS]: <
    DISPATCH extends ModuleDispatch<ACTIONS>,
    ACTIONGETTERS extends GETTERS,
    >(ctx: {
      state: STATE
      commit: ModuleCommit<MUTATIONS>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: ACTIONS[K]) => any }
  /** not support `rootState` and `rootGetters` */
  getters?: { [K in keyof GETTERS]: <LGS extends GETTERS>(state: STATE, getters: LGS) => GETTERS[K] }
  // modules?: NS extends true
  //     ? MDS extends Record<string, NSModule<any,any,any,any, any>>
  //         ? MDS
  //         : never
  //     : never
  /** Nesting is **not** allowed */
  modules?: never
}): NAMESPACED extends true
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
  // @ts-expect-error
  return options
}

// ---

type ModuleInstance =
  | Module<any, any, any, any>
  | NSModule<any, any, any, any, any>

type Modules = Record<string, ModuleInstance>

/**
 * A helper type for expanding `getters`.
 */
type FlattenGetters<
  T extends Modules,
> = {
  [K in keyof T as (
    T[K] extends NSModule<any, any, any, any, any>
      ? `${string & K}/${
          keyof T[K]['getters'] extends string
            ? keyof T[K]['getters']
            : never
      }`
      : keyof T[K]['getters']
  )]: ReturnType<T[K]['getters'][keyof T[K]['getters']]>
}

/**
 * A helper type for expanding `mutations`.
 */
type FlattenMutations<
  T extends Modules,
> = {
  [K in keyof T as (
    T[K] extends NSModule<any, any, any, any, any>
      ? `${string & K}/${
          keyof T[K]['mutations'] extends string
            ? keyof T[K]['mutations']
            : never
      }`
      : keyof T[K]['mutations']
  )]: T[K]['mutations'][keyof T[K]['mutations']]
}

/**
 * A helper type for expanding `actions`.
 */
type FlattenActions<
  T extends Modules,
> = {
  [K in keyof T as (
    T[K] extends NSModule<any, any, any, any, any>
      ? `${string & K}/${
          keyof T[K]['actions'] extends string
            ? keyof T[K]['actions']
            : never
      }`
      : keyof T[K]['actions']
  )]: T[K]['actions'][keyof T[K]['actions']]
}

// ---

type StoreState<MODULES, ROOTSTATE> = Readonly<
    & { [K in keyof MODULES]: MODULES[K] extends ModuleInstance ? MODULES[K]['state'] : never }
    & { [K in keyof ROOTSTATE]: ROOTSTATE[K] }
>

type StoreCommit<MODULES, MUTATIONS> =
  & And<(
    MODULES[keyof MODULES] extends ModuleInstance
      ? ({ <
          K extends keyof FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >,
        >(type: K, payload: FlattenMutations<
          MODULES extends Modules ? MODULES : never
        >[K] extends (...args: any) => any ? Parameters<
          FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >[K]
        >[1] : never): void
        <
          K extends keyof FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >,
        >(input: { type: K } & FlattenMutations<
          MODULES extends Modules ? MODULES : never
        >[K] extends (...args: any) => any ? Parameters<
          FlattenMutations<
            MODULES extends Modules ? MODULES : never
          >[K]
        >[1] : never): void
        })
      : never
    ), {
      <T extends keyof MUTATIONS>(type: T, payload: MUTATIONS[T]): void
      <T extends keyof MUTATIONS>(input: { type: T } & MUTATIONS[T]): void
    }>

type StoreDispatch<MODULES, ACTIONS> =
  And<(MODULES[keyof MODULES] extends ModuleInstance
    ? { <
          K extends keyof FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >,
        >(type: K, payload: Parameters<
          FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >[K] extends (...args: any) => any ? FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >[K] : never
        >[1]): Promise<any>
        <
          K extends keyof FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >,
        >(input: { type: K } & Parameters<
          FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >[K] extends (...args: any) => any ? FlattenActions<
            MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
              ? MODULES
              : never
          >[K] : never
        >[1]): Promise<any>
      }
    : never)
  , {
      <T extends keyof ACTIONS>(type: T, payload: ACTIONS[T]): Promise<any>
      <T extends keyof ACTIONS>(input: { type: T } & ACTIONS[T]): Promise<any>
  }>

type StoreGetters<MODULES, GETTERS> =
  And<(MODULES[keyof MODULES] extends (
    | Module<any, any, any, any>
    | NSModule<any, any, any, any, any>
  ) ? {
        [K in keyof FlattenGetters<
          MODULES extends Record<string, (
            | Module<any, any, any, any>
            | NSModule<any, any, any, any, any>
          )> ? MODULES : never
        >]:
        FlattenGetters<
          MODULES extends Record<string, (
            | Module<any, any, any, any>
            | NSModule<any, any, any, any, any>
          )> ? MODULES : never
        >[K]
      }
    : never),
    { [K in keyof GETTERS]: GETTERS[K] }
  >

// ---

interface MapGetters<GETTERS, MODULES> {
  // 1.without namespace
  // 1.1 accept a list
  <
    GETTERS_KEYS extends keyof GETTERS,
    MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_GETTERS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never),
    KEY_ITEM extends MODULE_GETTERS_KEYS | GETTERS_KEYS,
  >(map: KEY_ITEM[]): {
    [K in MODULE_GETTERS_KEYS]: K extends KEY_ITEM ? ComputedGetter<ReturnType<M extends Module<any, any, any, any> ? M['getters'][K] : never>> : never
  } & {
    [K in GETTERS_KEYS]: K extends GETTERS_KEYS ? ComputedGetter<GETTERS[K]> : never
  }
  // 1.2 accept a object
  <
  /** keys of root getters */
  GETTERS_KEYS extends keyof GETTERS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_GETTERS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never), MAP extends Record<string, MODULE_GETTERS_KEYS | GETTERS_KEYS>,
>(map: MAP): And<{
  [K in keyof MAP]: ComputedGetter<ReturnType<MAP[K] extends GETTERS_KEYS ? never : M extends Module<any, any, any, any> ? M['getters'][MAP[K]] : never>>
}, {
  [K in keyof MAP]: ComputedGetter<MAP[K] extends GETTERS_KEYS ? GETTERS[MAP[K]] : never>
}>
  // 2.with namespace
  <
    /** keys of modules */
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: ComputedGetter<ReturnType<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'][MAP[K]] : never>>
  }
  <
    /** keys of modules */
    MODULES_KEYS extends keyof MODULES, MAP extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'] : never),
  >(namespace: MODULES_KEYS, map: MAP[]): {
    [K in MAP]: ComputedGetter<ReturnType<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['getters'][K] : never>>
  }
}

interface MapMutations<MUTATIONS, MODULES> {
  // 1. without namespace
  // 1.1 accept a object
  <
    /** keys of root mutaions */
    MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never), MAP extends Record<string, MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS>,
  >(map: MAP): And<{
    [K in keyof MAP]: MAP[K] extends MODULE_MUTATIONS_KEYS ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['mutations'][MAP[K]] : never
    >[1]) => void : never
  }, {
    [K in keyof MAP]: MAP[K] extends MUTATIONS_KEYS ? (payload: MUTATIONS[MAP[K]]) => void : never
  }>
  // 1.2 accept a list
  <
  /** keys of root mutaions */
  MUTATIONS_KEYS extends keyof MUTATIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_MUTATIONS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never),
  KEY_ITEM extends MODULE_MUTATIONS_KEYS | MUTATIONS_KEYS,
>(map: KEY_ITEM[]): {
    [K in MODULE_MUTATIONS_KEYS]: K extends KEY_ITEM ? (payload: Parameters<
    M extends Module<any, any, any, any> ? M['mutations'][K] : never
  >[1]) => void : never
  } & {
    [K in MUTATIONS_KEYS]: K extends KEY_ITEM ? (payload: MUTATIONS[K]) => void : never
  }
// 2.with namespace
<
    /** keys of modules */
    MODULES_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'] : never)>,
  >(namespace: MODULES_KEYS, map: MAP): {
    [K in keyof MAP]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'][MAP[K]] extends (...args: any) => any ? MODULES[MODULES_KEYS]['mutations'][MAP[K]] : never : never>[1]) => void
  }
<
    /** keys of modules */
    MODULES_KEYS extends keyof MODULES, MAP_ITEM extends keyof (MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'] : never),
  >(namespace: MODULES_KEYS, map: MAP_ITEM[]): {
  [K in MAP_ITEM]: (payload: Parameters<MODULES[MODULES_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[MODULES_KEYS]['mutations'][K] extends (...args: any) => any ? MODULES[MODULES_KEYS]['mutations'][K] : never : never>[1]) => void
}
}

interface MapActions<ACTIONS, MODULES> {
// 1. without namespace
// 1.1 accept a list
<
    /** keys of root actions */
    ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never),
    MAP_ITEM extends MODULE_ACTIONS_KEYS | ACTIONS_KEYS,
  >(map: MAP_ITEM[]): {
    [K in MODULE_ACTIONS_KEYS]: K extends MAP_ITEM ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['actions'][K] : never
    >[1]) => void : never
  } & {
    [K in ACTIONS_KEYS]: K extends MAP_ITEM ? (payload: ACTIONS[K]) => void : never
  }
// 1.2 accept a object
<
  /** keys of root mutaions */
  ACTIONS_KEYS extends keyof ACTIONS, MODULES_KEYS extends keyof MODULES, M extends (MODULES[MODULES_KEYS] extends ModuleInstance ? MODULES[MODULES_KEYS] : never), MODULE_ACTIONS_KEYS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never), MAP extends Record<string, MODULE_ACTIONS_KEYS | ACTIONS_KEYS>,
>(map: MAP): And<{
  [K in keyof MAP]: MAP[K] extends MODULE_ACTIONS_KEYS ? (payload: Parameters<
    M extends Module<any, any, any, any> ? M['actions'][MAP[K]] : never
  >[1]) => void : never
}, {
  [K in keyof MAP]: MAP[K] extends ACTIONS_KEYS ? (payload: ACTIONS[MAP[K]]) => void : never
}>
// 2. with namespace
<
    /** keys of modules */
    ACTIONS_KEYS extends keyof MODULES, MAP extends Record<string, keyof (MODULES[ACTIONS_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[ACTIONS_KEYS]['actions'] : never)>,
  >(namespace: ACTIONS_KEYS, map: MAP): {
  [K in keyof MAP]: (payload: Parameters<MODULES[ACTIONS_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[ACTIONS_KEYS]['actions'][MAP[K]] extends (...args: any) => any ? MODULES[ACTIONS_KEYS]['actions'][MAP[K]] : never : never>[1]) => void
}
<
    /** keys of modules */
    ACTIONS_KEYS extends keyof MODULES, MAP_ITEM extends keyof (MODULES[ACTIONS_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[ACTIONS_KEYS]['actions'] : never),
  >(namespace: ACTIONS_KEYS, map: MAP_ITEM[]): {
  [K in MAP_ITEM]: (payload: Parameters<MODULES[ACTIONS_KEYS] extends NSModule<any, any, any, any, any> ? MODULES[ACTIONS_KEYS]['actions'][K] extends (...args: any) => any ? MODULES[ACTIONS_KEYS]['actions'][K] : never : never>[1]) => void
}
}

// ---

interface StoreWrap<
  /** modeuls */ MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS,
> {
  store: Omit<InstanceType<typeof VuexStore<StoreState<MODULES, ROOTSTATE>>>, 'state' | 'commit' | 'dispatch' | 'getters'> & {
    state: StoreState<MODULES, ROOTSTATE>
    /** mutations */
    commit: StoreCommit<MODULES, MUTATIONS>
    /** actions */
    dispatch: StoreDispatch<MODULES, ACTIONS>
    /** getters */
    getters: StoreGetters<MODULES, GETTERS>
  }
  mapMutations: MapMutations<MUTATIONS, MODULES>
  mapGetters: MapGetters<GETTERS, MODULES>
  mapActions: MapActions<ACTIONS, MODULES>
}

/**
* 定义 Store 的方法
*/
export function defineStore<
  /** modeuls */ MODULES, ROOTSTATE extends Record<string, any>, MUTATIONS, ACTIONS, GETTERS,
>(options: {
  modules?: { [K in keyof MODULES]:
    MODULES[K] extends ModuleInstance
      ? MODULES[K]
      : never
  }
  state?: ROOTSTATE
  mutations?: { [K in keyof MUTATIONS]:
    /**
     * @param payload 不需要参数时请传 undefined
     */
    (state: ROOTSTATE, payload: MUTATIONS[K]) => void }
  actions?: { [K in keyof ACTIONS]: <
    DISPATCH extends StoreDispatch<MODULES, ACTIONS>,
    ACTIONGETTERS extends GETTERS,
  >(ctx: {
      state: StoreState<MODULES, ROOTSTATE>
      commit: StoreCommit<MODULES, MUTATIONS>
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: ACTIONS[K]) => void }
  getters?: { [K in keyof GETTERS]: (state: StoreState<MODULES, ROOTSTATE>) => GETTERS[K] }

}): StoreWrap<MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS> {
  Vue.use(Vuex)
  // @ts-expect-error
  const store = new Vuex.Store(options)

  return {
    // @ts-expect-error
    store,
    mapMutations: _mapMutations,
    mapActions: _mapActions,
    mapGetters: _mapGetters,
  }
}
