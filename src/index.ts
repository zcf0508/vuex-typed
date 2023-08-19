import Vuex, {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
} from 'vuex'
import type { Store as VuexStore } from 'vuex'
import Vue from 'vue'
import type { ComputedGetter } from 'vue'
import type { And } from './utils'

/**
 * 普通 Module 实例
 */
interface Module<S, MS, AS, GS> {
  namespaced: false
  state: S
  mutations: { [K in keyof MS]: (state: S, payload: MS[K]) => void }
  actions: { [K in keyof AS]: (store: {
    state: S
    commit: <T extends keyof MS>(type: T, payload: MS[T]) => Promise<any>
  }, payload: AS[K]) => void }
  getters: { [K in keyof GS]: (state: S) => GS[K] }
  modules: never
}

/**
 * Namespacing Module 实例
 */
interface NSModule<S, MS, AS, GS, MDS> {
  namespaced: true
  state: S
  mutations: { [K in keyof MS]: (state: S, payload: MS[K]) => void }
  actions: { [K in keyof AS]: (store: {
    state: S
    commit: <T extends keyof MS>(type: T, payload: MS[T]) => void
  }, payload: AS[K]) => void }
  getters: { [K in keyof GS]: (state: S) => GS[K] }
  modules: MDS
}

/**
 * 用于定义 Module 的方法
 */
export function defineModule<
  S, MS, AS, GS, NS extends boolean = false,
>(options: {
  namespaced?: NS
  state: S
  mutations?: { [K in keyof MS]:
    /**
     * @param payload 不需要参数时请传 undefined
     */
    (state: S, payload: MS[K]) => void }
  actions?: { [K in keyof AS]: (store: {
    state: S
    commit: <T extends keyof MS>(type: T, payload: MS[T]) => void
  }, payload: AS[K]) => void }
  /** 不能使用 getters 和 rootState */
  getters?: { [K in keyof GS]: (state: S,) => GS[K] }
  // modules?: NS extends true
  //     ? MDS extends Record<string, NSModule<any,any,any,any, any>>
  //         ? MDS
  //         : never
  //     : never
  modules?: never // <- 不允许嵌套
}): NS extends true
    ? NSModule<
      S,
      MS,
      AS,
      GS,
      never
  >
    : Module<
      S,
      MS,
      AS,
      GS
  > {
  // @ts-expect-error
  return options
}

/**
 * 用于展开 getters 的辅助类型
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
 * 用于展开 mutations 的辅助类型
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
 * 用于展开 actions 的辅助类型
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

interface Store<
  /** modeuls */ MS, RS, MUS, AS, GS,
> {
  store: Omit<InstanceType<typeof VuexStore<
  And<
    { [K in keyof MS]: MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MS[K]['state'] : never }, RS>
  >>, 'state' | 'commit' | 'dispatch' | 'getters'> & ({
    state: And<{ [K in keyof MS]: MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MS[K]['state'] : never }, { [K in keyof RS]: RS[K] }>
    /** mutations */
    commit: And<(MS[keyof MS] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
      ? ({
          <K extends keyof FlattenMutations<
              MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                ? MS
                : never
          >>(type: K, payload: Parameters<
              FlattenMutations<
                  MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                    ? MS
                    : never
              >[K]
          >[1]): void
        })
      : never)
    , {
        <T extends keyof MUS>(type: T, payload: MUS[T]): void
    }>
    /** actions */
    dispatch: And<(MS[keyof MS] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
      ? {
          <K extends keyof FlattenActions<
              MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                ? MS
                : never
          >>(type: K, payload: Parameters<
              FlattenActions<
                  MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                    ? MS
                    : never
              >[K]
          >[1]): Promise<any>
        }
      : never)
    , {
        <T extends keyof AS>(type: T, payload: AS[T]): Promise<any>
    }>
    /** getters */
    getters: And<(MS[keyof MS] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
      ? {
          [K in keyof FlattenGetters<
                  MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                    ? MS
                    : never
              >]:
          FlattenGetters<
                  MS extends Record<string, Module<any, any, any, any> | NSModule<any, any, any, any, any>>
                    ? MS
                    : never
              >[K]
        }
      : never), GS>
  })
  mapMutations:
  // 1. without namespace
  // 1.1 accept a object
  (<
      /** keys of root mutaions */
      T extends keyof MUS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never), KMAP extends Record<string, MKS | T>,
    >(map: KMAP) => And<{
      [K in keyof KMAP]: KMAP[K] extends MKS ? (payload: Parameters<
        M extends Module<any, any, any, any> ? M['mutations'][KMAP[K]] : never
      >[1]) => void : never
    }, {
      [KMAPT in keyof KMAP]: KMAP[KMAPT] extends T ? (payload: MUS[KMAP[KMAPT]]) => void : never
    }>)
  // 1.2 accept a list
  & (<
    /** keys of root mutaions */
    T extends keyof MUS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['mutations'] : never),
  >(map: (MKS | T)[]) => And<{
    [K in MKS]: K extends keyof MUS ? never : (payload: Parameters<
      M extends Module<any, any, any, any> ? M['mutations'][K] : never
    >[1]) => void
  }, {
    [MUST in T]: (payload: MUS[MUST]) => void
  }>)
  // 2.with namespace
  & (<
      /** keys of modules */
      T extends keyof MS, KMAP extends Record<string, keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['mutations'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: (payload: Parameters<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['mutations'][KMAP[K]] extends (...args: any) => any ? MS[T]['mutations'][KMAP[K]] : never : never>[1]) => void
    })
  & (<
      /** keys of modules */
      T extends keyof MS, KI extends keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['mutations'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: (payload: Parameters<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['mutations'][K] extends (...args: any) => any ? MS[T]['mutations'][K] : never : never>[1]) => void
    })
  mapGetters:
  // 1.without namespace
  // 1.1 accept a list
  (<
      /** keys of root getters */
      T extends keyof GS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), GKS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never),
    >(map: (GKS | T)[]) => And<{
      [K in GKS]: ComputedGetter<ReturnType<K extends T ? never : M extends Module<any, any, any, any> ? M['getters'][K] : never>>
    }, {
      [GST in T]: ComputedGetter<GS[GST]>
    }>)
  // 1.2 accept a object
  & (<
    /** keys of root getters */
    T extends keyof GS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), GKS extends keyof (M extends Module<any, any, any, any> ? M['getters'] : never), KMAP extends Record<string, GKS | T>,
  >(map: KMAP) => And<{
    [K in keyof KMAP]: ComputedGetter<ReturnType<KMAP[K] extends T ? never : M extends Module<any, any, any, any> ? M['getters'][KMAP[K]] : never>>
  }, {
    [GST in keyof KMAP]: ComputedGetter<KMAP[GST] extends T ? GS[KMAP[GST]] : never>
  }>
  )
  // 2.with namespace
  & (<
      /** keys of modules */
      T extends keyof MS, KMAP extends Record<string, keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['getters'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: ComputedGetter<ReturnType<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['getters'][KMAP[K]] : never>>
    })
  & (<
      /** keys of modules */
      T extends keyof MS, KI extends keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['getters'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: ComputedGetter<ReturnType<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['getters'][K] : never>>
    })
  mapActions:
  // 1. without namespace
  // 1.1 accept a list
  (<
      /** keys of root actions */
      T extends keyof AS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), AKS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never),
    >(map: (AKS | T)[]) => And<{
      [K in AKS]: (payload: Parameters<
        M extends Module<any, any, any, any> ? M['actions'][K] : never
      >[1]) => void
    }, {
      [T in keyof AS]: (payload: AS[T]) => void
    }>)
  // 1.2 accept a object
  & (<
    /** keys of root mutaions */
    T extends keyof AS, MSK extends keyof MS, M extends (MS[MSK] extends (Module<any, any, any, any> | NSModule<any, any, any, any, any>) ? MS[MSK] : never), MKS extends keyof (M extends Module<any, any, any, any> ? M['actions'] : never), KMAP extends Record<string, MKS | T>,
  >(map: KMAP) => And<{
    [K in keyof KMAP]: KMAP[K] extends MKS ? (payload: Parameters<
      M extends Module<any, any, any, any> ? M['actions'][KMAP[K]] : never
    >[1]) => void : never
  }, {
    [KMAPT in keyof KMAP]: KMAP[KMAPT] extends T ? (payload: AS[KMAP[KMAPT]]) => void : never
  }>)
  // 2. with namespace
  & (<
      /** keys of modules */
      T extends keyof MS, KMAP extends Record<string, keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['actions'] : never)>,
    >(namespace: T, map: KMAP) => {
      [K in keyof KMAP]: (payload: Parameters<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['actions'][KMAP[K]] extends (...args: any) => any ? MS[T]['actions'][KMAP[K]] : never : never>[1]) => void
    })
  & (<
      /** keys of modules */
      T extends keyof MS, KI extends keyof (MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['actions'] : never),
    >(namespace: T, map: KI[]) => {
      [K in KI]: (payload: Parameters<MS[T] extends NSModule<any, any, any, any, any> ? MS[T]['actions'][K] extends (...args: any) => any ? MS[T]['actions'][K] : never : never>[1]) => void
    })
}

/**
* 定义 Store 的方法
*/
export function defineStore<
  /** modeuls */ MS, RS extends Record<string, any>, MUS, AS, GS,
>(options: {
  modules?: { [K in keyof MS]:
    MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any>
      ? MS[K]
      : never
  }
  state?: RS
  mutations?: { [K in keyof MUS]:
    /**
     * @param payload 不需要参数时请传 undefined
     */
    (state: ({ [K in keyof MS]: MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MS[K]['state'] : never } & RS), payload: MUS[K]) => void }
  actions?: { [K in keyof AS]: (store: {
    state: Readonly<({ [K in keyof MS]: MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MS[K]['state'] : never } & RS)>
    commit: <T extends keyof MUS>(type: T, payload: MUS[T]) => void
  }, payload: AS[K]) => void }
  getters?: { [K in keyof GS]: (state: { [K in keyof MS]: MS[K] extends Module<any, any, any, any> | NSModule<any, any, any, any, any> ? MS[K]['state'] : never } & RS) => GS[K] }

}): Store<MS, RS, MUS, AS, GS> {
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
