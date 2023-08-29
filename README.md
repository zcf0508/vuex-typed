# vuex-typed

[![NPM version](https://img.shields.io/npm/v/z-vuex-typed?color=a1b858&label=)](https://www.npmjs.com/package/z-vuex-typed)

This is a typed vuex@3.

## Motive

1. Provide comprehensive type hints

Comprehensive type hints include sufficient type hints for the function parameters of mutations, actions, and getters when defining Modules and Stores. It also includes providing optional values for parameters when using mapX functions, and ensuring that components can correctly identify the types of imported data and methods when using mapX functions within components.

2. Simplify migration process as much as possible

I do not want to introduce too many changes to the original project by incorporating this project. This is why I chose not to use pinia to refactor the project. This project only introduces two new methods, defineModule and defineStore, as wrappers in order to obtain correct type inference.

3. Do not change vuex behavior

This project only covers default vuex types. Even if there are errors in types, it will not cause any abnormal behavior in vuex. This ensures that adding types to vuex will not have any side effects.

## Install

```bash
npm install z-vuex-typed
```

## Usage

1. add a `defineModule` function to get type of module

```js
// src/store/modules/user.js
import { defineModule } from 'z-vuex-typed'

const userModule = defineModule({
  state: {
    name: 'John',
  },
  mutaions: {
    SET_NAME(state, /** @type {string} */payload) {
      //      ^ type of `state` is `{name: string}`
      state.name = payload
    },
  },
  actions: {
    async setName({ commit }, /** @type {string} */ payload) {
      commit('SET_NAME', await getUserById(payload))
      //  ^ commit type and `payload` type are specific
    },
  },
  getters: {
    usernam: state => state.name
    //  ^ the return type is `string`
  }
})

export default userModule
```

2. add a `defineStore` function to hook the types of `store` and `mapX` functions.

```js
// src/store/index.js
import { defineStore } from 'z-vuex-typed'
import user from './modules/usre'

const {
  store,
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
} = defineStore({
  modules: {
    user
  },
  getters: {
    gUsername: state => state.user.name
    //  ^  type of state is specific
  }
})

export default store
export {
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
}
```
3. install the `store`

First, **change store type declare** .

```ts
// src/shims-vuex.d.ts
import Vue, { ComponentOptions } from 'vue'
import store from '@/store'

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: typeof store
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: typeof store
  }
}
```
Then, install as usual.
```js
// main.js
import App from './App.vue'
import store from '@/store'

const app = new Vue({
  store,
  render: h => h(App)
})
```

4. use `mapX`

```vue
<script>
import { defineComponent } from 'vue'
import {
  mapActions,
  mapGetters,
  mapMutations,
  mapState,
} from '@/store'

export default defineComponent({
  data() {
    return {}
  },
  computed: {
    ...mapState(['gUsername']),
    ...mapGetters(['username']),
    //                ^ the param of mapGetters is specific
  },
  created() {
    console.log(this.username)
    //                ^ this `username` is `string`
    this.setName(1)
    //       ^ the type of param is `number`
    this.SET_NAME('Tom')
    //       ^ the type of param is `string`
  },
  methods: {
    ...mapActions(['setName']),
    //                 ^ the param of mapActions is specific
    ...mapMutations(['SET_NAME']),
    //                  ^ the param of mapMutations is specific
  },
})
</script>
```

## Sponsor Me

If you like this project, please consider to sponsor me. I will keep working on this project and add more features.

![sponsor](./images/sponsor.png)

## License

[MIT](./LICENSE) License © 2023
