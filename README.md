# vuex-typed

[![NPM version](https://img.shields.io/npm/v/z-vuex-typed?color=a1b858&label=)](https://www.npmjs.com/package/z-vuex-typed)

This is a typed vuex@3.

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
    /**
     * @param {string} payload
     */
    SET_NAME(state, payload) {
      //      ^ type of `state` is `{name: string}`
      state.name = payload
    },
  },
  actions: {
    /**
     * @param {number} payload
     */
    async setName({ commit }, payload) {
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
  // mapState,  <- this is not work for now
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
import { store } from '@/store'

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
} from '@/store'

export default defineComponent({
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['username', 'gUsername']),
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

## License

[MIT](./LICENSE) License © 2023
