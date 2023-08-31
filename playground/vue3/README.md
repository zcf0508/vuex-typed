# 给 vuex 补充类型

经过努力，现在已经有了更好的方案来补充 vuex 的类型，那就是 `z-vuex-typed`。以下内容仅作为学习和实践过程的记录，欢迎大家一起交流。

---

## 背景

vuex 的替代者 Pinia 同时支持 vue2 和 vue3 项目，所以如果开发新项目，建议直接使用 Pinia 作为状态管理。如果需要使用 vue2 + options api 的话，推荐另一个项目 [hami-vuex](https://github.com/guyskk/hami-vuex) ，这个项目使得定义和调用 store 非常简单，并且能够提供完备的类型。

今天的讨论针对是基于 vue2 + vuex3 的老项目。给这样的项目做 ts 改造是非常复杂的，这篇文章梳理了一下我在项目改造中的一些新的体验和思考。

## vuex 原生的类型

vuex3 其实是支持类型提示的，在下面这样的写法中，我们的 store 是能够得到部分类型推断的。

```ts
// conterStore.ts

import type { Module } from 'vuex'

interface State {
  num: number
}

const couterStore: Module<State, any> = {
  state: {
    num: 0,
  },
  mutations: {
    SET_NUM(state, payload) {
      // ^ 这里 state 是有类型的
      state.num = payload
    }
  }
}

export default couterStore
```

在上面的例子中，Module 类型接收两个参数 State 和 RootState。顾名思义，第一个 State 就是当前正在定义的 store 的 state，RootState 是指全局的 state 。RootState 的作用是便于 getters 中跨 store 调用数据。比如下面这样

```js
// conterStore.js

const conterStore = {
  state: {
    num: 1
  },
  getters: {
    double(state, getters, rootState, rootGetters) {
      if (rootState.user.userInfo)
        return state.num * 2
      return 0
    }
  }
}
```

但是，在上面的 conterStore 例子中，mutations 方法的第一个参数 state 虽然能正确推断为 State ，但是 payload 在源码中被写死为了 any。同样的，如果写 actions ，那么 actions 的所有返回值也都写死为 any 了。源码中的类型定义如下

```ts
export type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any
export interface ActionObject<S, R> {
  root?: boolean
  handler: ActionHandler<S, R>
}

export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any
export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>
export type Mutation<S> = (state: S, payload?: any) => any
```

这就导致了我们在外部使用，无论是通过 `$store`​ 或者使用方法 `mapGetters`​ `mapActions`​ 等获取 store 时无法获取到正确的类型，因为他们的类型全都被写死为 any 了。

## 解决方案

我们的思路其实很简单，那就是绕过 vuex 默认的类型定义，重新定义我们自己的类型。

### 定义 module

首先，我们不能使用 vuex 提供的 Module 类型来定义我们的 store ，需要改写成下面的写法。

```ts
// @/store/modelus/couter.ts

import type { ActionContext } from 'vuex'
import type { RootState } from '@/store'

const state = {
  num: 0
}

export type State = typeof state

const mutations = {
  SET_NUM(state: State, payload: number) {
    state.num = payload
  }
}

const actions = {
  addNum({ state, commit }: ActionContext<State, RootState>, payload: number) {
    commit('SET_NUM', state.num + payload)
    // ^ 这里 commit 其实类型并不完备，它无法直接获取我们上面定义的 mutations
  }
}

const getters = {
  double(state: State) {
    return state.num * 2
  }
}

const couterStore: Module<State, RootState> = {
  state,
  mutations,
  actions,
  getters
}

export default couterStore
```

```ts
// @store/index.ts
import Vuex from 'vuex'
import type { Store } from 'vuex'
import couter from './modules/couter'
import type { State as CouterState } from './modules/couter'

interface RootState {
  couter: CouterState
}

const store: Store<RootState> = new Vuex.Store({
  modules: {
    couter,
  }
})

export default store
```

通过上面的改写，我们已经摆脱 Module 类的限制，我们可以自由对 `mutations`​ `actions`​ 做类型定义。但是这样还是存在问题，那就是我们在外部访问时依然无法正确获取类型，这是因为我们导出的 store 依然是默认的 Store 类型。

```ts
export interface Dispatch {
  (type: string, payload?: any, options?: DispatchOptions): Promise<any>
  <P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>
}

export interface Commit {
  (type: string, payload?: any, options?: CommitOptions): void
  <P extends Payload>(payloadWithType: P, options?: CommitOptions): void
}

export declare class Store<S> {
  constructor(options: StoreOptions<S>)

  readonly state: S
  readonly getters: any

  dispatch: Dispatch
  commit: Commit
}
```

可以看到，`getters`​ 以及 `dispatch`​ `commit`​ 的类型，都被限制为了 `any`​。

### 改写默认方法

所以我们在定义 module 时摆脱默认的类型还不够彻底，我们需要更完整的类型定义。接下来会有一些难度，但是我们可以慢慢来。

1. 为 module 增加辅助类型

为了能定义更完备的 module 类型，我们需要完成几个辅助类型

```ts
// @/store/helper.d.ts
import type { ActionContext, CommitOptions } from 'vuex'
import type { RootState } from '@/store'

// mutation
type BaseMutation<S, P, R> = (state: S, [string]: P) => R

// actions
interface MyActionContext<S, RootState, MS> extends ActionContext<S, RootState> {
  commit: {
    <T extends keyof MS>(type: T, payload: Parameters<MS[T]>[1], options?: CommitOptions): void
    //  ^ 取 key 作为type的类型               ^ 这里实际上就是 BaseMutation 中 payload 的类型
  }
}

type BaseAction<S, MS, P, R> = (injectee: MyActionContext<S, RootState, MS>, [string]: P) => R
// 四个泛型分别是 S-State   MS-Record<string, BaseMutation>   P-payload类型   R-返回值类型
```

在上面的定义中，我们为 Action 引入了 mutation 的类型，使得我们在定义 actions 时调用 commit 可以正确获取类型。

```ts
// @/store/modelus/couter.ts

import type { ActionContext } from 'vuex'
import type { RootState } from '@/store'
import type { BaseAction, BaseMutation } from '@/stote/helper'

const state = {
  num: 0
}

export type State = typeof state

export const mutations = {
  /**
   * @type {BaseMutation<State, number, void>}
   */
  SET_NUM(state, payload) {
    // ^ State  ^ number
    state.num = payload
  }
}

export const actions = {
  /**
   * @type {BaseAction<State, typeof mutations, number, void>}
   *                            ^ 传入 mutations 的类型
   */
  addNum({ state, commit }, payload) {
    commit('SET_NUM', state.num + payload)
    // ^ 这里 commit 因为获取到了前面定义的 mutations 的类型，所以能够正确推断类型了
  }
}

export const getters = {
  double(state: State) {
    return state.num * 2
  }
}

const couterStore: Module<State, RootState> = {
  state,
  mutations,
  actions,
  getters
}

export default couterStore
```

2. 改写 map 函数

通过第一步，我们的 mutation 、 actions 、 getters 都能够正确获取类型了。接下来我们需要改写 map 函数的类型。

```ts
// @/store/helper.d.ts
import { ComputedGetter } from 'vue'
import {
  actions as couterActions,
  getters as couterGetters,
  mutations as couterMutations,
} from '@/store/modules/couter'

// mapMutaions

type AllMutations =
  & typeof couterMutations

type AllMutationsKeys = keyof AllMutations

export type MapMutationsFun<
  T extends AllMutationsKeys,
> = {
  [K in T]: (payload: Parameters<AllMutations[K]>[1]) => ReturnType<AllMutations[K]>
}

// mapActions

type AllActions =
  & typeof couterActions

type AllActionsKeys = keyof AllActions

export type MapActionFun<
  T extends AllActionsKeys,
> = {
  [K in T]: (payload: Parameters<AllActions[K]>[1]) => ReturnType<AllActions[K]>
}

// mapGetters

type AllGetters =
  & typeof couterGetters

type AllGettersKeys = keyof AllGetters

export interface MapGetter<T extends AllGettersKeys> {
  T: ComputedGetter<ReturnType<AllGetters[T]>>
  //   ^ 这里转成 computed 函数的类型，便于结构到 vue 中时正确获取类型
}

export type MapGetterFun<
  T extends AllGettersKeys,
> = {
  [K in T]: ComputedGetter<ReturnType<AllGetters[K]>>
}

// store.getters
interface MyStore extends Store<RootState> {
  getters: {
    [K in keyof AllGetters]: ReturnType<AllGetters[K]>
  }
}
```

在上面的定义中，我们分别定义了 map 函数以及 getters 的类型，接下来我们只需要用它们覆盖 vuex 的原始类型就可以了。

```ts
// @/store/index.ts
import {
  mapActions as _mapActions,
  mapGetters as _mapGetters,
  mapMutations as _mapMutations,
} from 'vuex'
import type {
  MapActionFun,
  MapGetterFun,
  MapMutationsFun,
  MyGettersKeys,
  MyMutationsKeys,
  MyStore,
} from './helper'

const store = new Vuex.Store({
  // ...
})

/** @type {MyStore} */
export default store

/** @returns {MyStore} */
export const useStore = () => store

export function mapMutations<T extends AllMutationsKeys>(...map: T[]): MapMutationsFun<T> {
  // @ts-expect-error
  return _mapMutations(map)
}

export function mapActions<T extends AllActionsKeys>(...map: T[]): MapActionFun<T> {
  // @ts-expect-error
  return _mapActions(map)
}

export function mapGetters<T extends AllGettersKeys>(...map: T[]): MapGetterFun<T> {
  // @ts-expect-error
  return _mapGetters(map)
}
```

通过上面的定义，当我们在 vue 组件中使用 map 函数时，便能够正确获取到类型了。

```html
<script lang="ts">
import { mapGetters, mapActions } from '@/store'

export default {
  computed:{
    ...mapGetters('double'),
    //            ^ 这里如果传入了未定义的 getter 会报错
    // 其他计算属性
  }，
  mounted() {
    console.log(this.double)
             //      ^ 这里 double 的类型是 number
    this.addNum(2)
            //  ^ 这里参数会有类型提示
  },
  methods: {
    ...mapActions('addNum'),
    //            ^ 这里如果传入了未定义的 action 会报错
    // 其他方法
  }
}
</script>
```

3. 改写 $store 的类型

由于 vuex 的类型定义限制，我们没有办法直接修改 $store 的类型，但是我们可以采取一个折中的方法，那就是直接注释掉 vuex 中的类型定义，使用我们自己的类型。可以采用 `patch-package`​ ，如果项目使用 `pnpm`​ 的话使用 `pnpm patch`​ 命令。

我们直接将 vuex 源码中的 `vuex/types/vue.d.ts`​ 全部注释，然后在src的根目录下创建 `shims-vuex.d.ts`​ 文件定义 Store 类型。

```ts
// vuex/types/vue.d.ts

/**
 * Extends interfaces in Vue.js
 */

// import Vue, { ComponentOptions } from "vue";
// import { Store } from "./index";

// declare module "vue/types/options" {
//   interface ComponentOptions<V extends Vue> {
//     store?: Store<any>;
//   }
// }

// declare module "vue/types/vue" {
//   interface Vue {
//     $store: Store<any>;
//   }
// }
```

```ts
// src/shims-vuex.d.ts

import Vue, { ComponentOptions } from 'vue'
import type { MyStore } from './store/helper'

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: MyStore
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: MyStore
  }
}
```

由于我们前面已经改写了 MyStore 的 getters ，修改了 $store 类型之后，我们就可以愉快的使用调用 getters 了。

## 尾巴

这篇文章简单分析了一下为什么 vuex 会丢失类型，同时针对比较常见的 vuex 编程模式给出了类型较为完备的定义。当然这篇文章覆盖的内容还不完全，比如 $store 的 dispatch 和 commit 方法并没有重新定义，也不支持在 modules 中声明 `namespace: true`​。

如果你手里刚好有 vue2 + vuex3 的项目，那么不妨着手开始改造吧。

如果你对这篇文章感兴趣，或者在改造的过程中有任何问题，欢迎随时联系我。

‍
