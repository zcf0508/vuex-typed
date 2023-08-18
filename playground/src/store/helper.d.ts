import type { ComputedGetter } from 'vue'
import type { ActionContext, CommitOptions } from 'vuex'
import {
  mutations as userMutations,
  actions as userActions,
} from '@/store/modules/user'
import getters from './getters'
import { state as rootState } from './index'

// mutation

type BaseMutation<S, P, R> = (state: S, [string]: P) => R

type AllMutations = 
  & typeof userMutations

type AllMutationsKeys = keyof AllMutations

export type MapMutationsFun<
  T extends AllMutationsKeys,
> = {
  [K in T]: (payload: Parameters<AllMutations[K]>[1]) => ReturnType<AllMutations[K]>
};

// actions

interface MyActionContext<S, RootState, MS> extends ActionContext<S, RootState> {
  commit: {
    <T extends keyof MS>(type: T, payload: Parameters<MS[T]>[1], options?: CommitOptions): void;
    //  ^ 取 key 作为type的类型               ^ 这里实际上就是 BaseMutation 中 payload 的类型
  }
}

type BaseAction<S, MS, P, R> = (injectee: MyActionContext<S, RootState, MS>, [string]: P) => R
// 四个泛型分别是 S-State   MS-Record<string, BaseMutation>   P-payload类型   R-返回值类型

type AllActions = 
  & typeof userActions

type AllActionsKeys = keyof AllActions

export type MapActionFun<
  T extends AllActionsKeys,
> = {
  [K in T]: (payload: Parameters<AllActions[K]>[1]) => ReturnType<AllActions[K]>
};

// getters

type AllGetters = 
  & typeof getters

type AllGettersKeys = keyof AllGetters

export type MapGetter<T extends AllGettersKeys> = {
  T: ComputedGetter<ReturnType<AllGetters[T]>>;
    //   ^ 这里转成 computed 函数的类型，便于结构到 vue 中时正确获取类型
};

export type MapGetterFun<
  T extends AllGettersKeys,
> = {
  [K in T]: ComputedGetter<ReturnType<AllGetters[K]>>
};


// store.getters
interface MyStore extends Store<typeof rootState> {
  getters: {
    [K in keyof AllGetters]: ReturnType<AllGetters[K]>
  },
}
