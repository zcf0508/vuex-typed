import Vuex, {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
} from 'vuex'
import type { Store as VuexStore } from 'vuex'
import Vue from 'vue'
import type { ComputedGetter } from 'vue'
import type { And } from './utils'

type ModuleCommit<MUTATIONS> = <T extends keyof MUTATIONS>(type: T, payload: MUTATIONS[T]) => void
type ModuleDispatch<ACTIONS> = <T extends keyof ACTIONS>(type: T, payload: ACTIONS[T]) => Promise<any>

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
    ACTIONSTATE extends STATE,
    COMMIT extends ModuleCommit<MUTATIONS>,
    DISPATCH extends ModuleDispatch<ACTIONS>,
    ACTIONGETTERS extends GETTERS,
    >(ctx: {
      state: ACTIONSTATE
      commit: COMMIT
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

/**
 * A helper type for expanding `getters`.
 */
type FlattenGetters<T extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>> = {
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
type FlattenMutations<T extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>> = {
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
type FlattenActions<T extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>> = {
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

type StoreState<MODULES, ROOTSTATE> = Readonly<And<{ [K in keyof MODULES]: MODULES[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MODULES[K]['state'] : never }, ROOTSTATE>>

type StoreCommit<MODULES, MUTATIONS> = And<(MODULES[keyof MODULES] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
  ? ({
      <FM extends FlattenMutations<
          MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>> ? MODULES : never>,
        K extends keyof FM,
      >(type: K, payload: Parameters<
        FM[K] extends (...args: any) => any ? FM[K] : never
      >[1]): void
    })
  : never)
, {
    <T extends keyof MUTATIONS>(type: T, payload: MUTATIONS[T]): void
}>

type StoreDispatch<MODULES, ACTIONS> = And<(MODULES[keyof MODULES] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
  ? {
      <FA extends FlattenActions<
          MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
            ? MODULES
            : never
        >,
        K extends keyof FA,
      >(type: K, payload: Parameters<
        FA[K] extends (...args: any) => any ? FA[K] : never
      >[1]): Promise<any>
    }
  : never)
, {
    <T extends keyof ACTIONS>(type: T, payload: ACTIONS[T]): Promise<any>
}>

type StoreGetters<MODULES, GETTERS> = Readonly<And<(MODULES[keyof MODULES] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
  ? {
      [K in keyof FlattenGetters<
                MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                  ? MODULES
                  : never
            >]:
      FlattenGetters<
                MODULES extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                  ? MODULES
                  : never
            >[K]
    }
  : never), GETTERS>>

// ---

interface Store<
  /** modeuls */ MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS,
> {
  store: Omit<InstanceType<typeof VuexStore<StoreState<MODULES, ROOTSTATE>>>, 'state' | 'commit' | 'dispatch' | 'getters'> & ({
    state: StoreState<MODULES, ROOTSTATE>
    /** mutations */
    commit: StoreCommit<MODULES, MUTATIONS>
    /** actions */
    dispatch: StoreDispatch<MODULES, ACTIONS>
    /** getters */
    getters: StoreGetters<MODULES, GETTERS>
  })
  mapMutations:
  // 1. without namespace
  // 1.1 accept a object
  (<
      /** keys of root mutaions */
      T extends keyof MUTATIONS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never), KMAP extends Record<string, MKS | T>,
    >(map: KMAP) => And<{
      [K in keyof KMAP]: KMAP[K] extends MKS ? (payload: Parameters<
        M extends Module<any, any, any, any> ? M['mutations'][KMAP[K]] : never
      >[1]) => void : never
    }, {
      [KMAPT in keyof KMAP]: KMAP[KMAPT] extends T ? (payload: MUTATIONS[KMAP[KMAPT]]) => void : never
    }>)
  // 1.2 accept a list
  & (<
    /** keys of root mutaions */
    T extends keyof MUTATIONS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never),
  >(map: (MKS | T)[]) => And<{
    [K in MKS]: K extends keyof MUTATIONS ? never : (payload: Parameters<
      M extends Module<any, any, any, any> ? M['mutations'][K] : never
    >[1]) => void
  }, {
    [MUST in T]: (payload: MUTATIONS[MUST]) => void
  }>)
  // 2.with namespace
  & (<
      /** keys of modules */
      T extends keyof MODULES, KMAP extends Record<string, keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['mutations'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: (payload: Parameters<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['mutations'][KMAP[K]] extends (...args: any) => any ? MODULES[T]['mutations'][KMAP[K]] : never : never>[1]) => void
    })
  & (<
      /** keys of modules */
      T extends keyof MODULES, KI extends keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['mutations'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: (payload: Parameters<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['mutations'][K] extends (...args: any) => any ? MODULES[T]['mutations'][K] : never : never>[1]) => void
    })
  mapGetters:
  // 1.without namespace
  // 1.1 accept a list
  (<
      /** keys of root getters */
      T extends keyof GETTERS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), GKS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never),
    >(map: (GKS | T)[]) => And<{
      [K in GKS]: ComputedGetter<ReturnType<K extends T ? never : M extends Module<any, any, any, any> ? M['getters'][K] : never>>
    }, {
      [GST in T]: ComputedGetter<GETTERS[GST]>
    }>)
  // 1.2 accept a object
  & (<
    /** keys of root getters */
    T extends keyof GETTERS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), GKS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never), KMAP extends Record<string, GKS | T>,
  >(map: KMAP) => And<{
    [K in keyof KMAP]: ComputedGetter<ReturnType<KMAP[K] extends T ? never : M extends Module<any, any, any, any> ? M['getters'][KMAP[K]] : never>>
  }, {
    [GST in keyof KMAP]: ComputedGetter<KMAP[GST] extends T ? GETTERS[KMAP[GST]] : never>
  }>
  )
  // 2.with namespace
  & (<
      /** keys of modules */
      T extends keyof MODULES, KMAP extends Record<string, keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['getters'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: ComputedGetter<ReturnType<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['getters'][KMAP[K]] : never>>
    })
  & (<
      /** keys of modules */
      T extends keyof MODULES, KI extends keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['getters'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: ComputedGetter<ReturnType<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['getters'][K] : never>>
    })
  mapActions:
  // 1. without namespace
  // 1.1 accept a list
  (<
      /** keys of root actions */
      T extends keyof ACTIONS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), AKS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never),
    >(map: (AKS | T)[]) => And<{
      [K in AKS]: (payload: Parameters<
        M extends Module<any, any, any, any> ? M['actions'][K] : never
      >[1]) => void
    }, {
      [T in keyof ACTIONS]: (payload: ACTIONS[T]) => void
    }>)
  // 1.2 accept a object
  & (<
    /** keys of root mutaions */
    T extends keyof ACTIONS, MSK extends keyof MODULES, M extends (MODULES[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MODULES[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never), KMAP extends Record<string, MKS | T>,
  >(map: KMAP) => And<{
    [K in keyof KMAP]: KMAP[K] extends MKS ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['actions'][KMAP[K]] : never
    >[1]) => void : never
  }, {
    [KMAPT in keyof KMAP]: KMAP[KMAPT] extends T ? (payload: ACTIONS[KMAP[KMAPT]]) => void : never
  }>)
  // 2. with namespace
  & (<
      /** keys of modules */
      T extends keyof MODULES, KMAP extends Record<string, keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['actions'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: (payload: Parameters<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['actions'][KMAP[K]] extends (...args: any) => any ? MODULES[T]['actions'][KMAP[K]] : never : never>[1]) => void
    })
  & (<
      /** keys of modules */
      T extends keyof MODULES, KI extends keyof (MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['actions'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: (payload: Parameters<MODULES[T] extends NSModule<any, any, any, any, any> ? MODULES[T]['actions'][K] extends (...args: any) => any ? MODULES[T]['actions'][K] : never : never>[1]) => void
    })
}

/**
* 定义 Store 的方法
*/
export function defineStore<
  /** modeuls */ MODULES, ROOTSTATE extends Record<string, any>, MUTATIONS, ACTIONS, GETTERS,
>(options: {
  modules?: { [K in keyof MODULES]:
    MODULES[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
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
    ACTIONSTATE extends StoreState<MODULES, ROOTSTATE>,
    COMMIT extends StoreCommit<MODULES, MUTATIONS>,
    DISPATCH extends StoreDispatch<MODULES, ACTIONS>,
    ACTIONGETTERS extends StoreGetters<MODULES, GETTERS>,
    >(ctx: {
      state: ACTIONSTATE
      commit: COMMIT
      dispatch: DISPATCH
      getters: ACTIONGETTERS
    }, payload: ACTIONS[K]) => void }
  getters?: { [K in keyof GETTERS]: (state: StoreState<MODULES, ROOTSTATE>) => GETTERS[K] }

}): Store<MODULES, ROOTSTATE, MUTATIONS, ACTIONS, GETTERS> {
  Vue.use(Vuex)
  // @ts-expect-error
  const store = new Vuex.Store(options)

  return {
    // @ts-expect-error
    store,
    // @ts-expect-error
    mapMutations: _mapMutations,
    // @ts-expect-error
    mapActions: _mapActions,
    // @ts-expect-error
    mapGetters: _mapGetters,
  }
}
