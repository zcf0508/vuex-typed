import { assertType, describe, expect, it } from 'vitest'
import Vuex from 'vuex'
import Vue from 'vue'
import { defineModule, defineStore } from '../src'
import { userModule } from './modules/user'
import { countModule } from './modules/count'

const { store, mapGetters, mapMutations, mapActions, mapState } = defineStore({
  state: {
    gUsername: '123',
  },
  modules: {
    user: userModule,
    count: countModule,
  },
  mutations: {
    SET_G_USERNAME(state, payload: string) {
      state.gUsername = payload
    },
  },
  actions: {
    setGUsername({ commit }, payload: string) {
      commit('SET_G_USERNAME', payload)
    },
  },
  getters: {
    gUsername: state => state.gUsername,
  },
})

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

describe('vuex', () => {
  it('test defineStore', () => {
    const testStore1Options = {
      state: {
        name: '123123',
        age: 18,
      },
      mutations: {
        SET_AGE(state, age: number) {
          state.age = age
        },
        SET_NAME(state, payload: string) {
          state.name = payload
        },
        SET_USER(state, user: { name: string; age: number }) {
          state.name = user.name
          state.age = user.age
        },
      },
      actions: {
        setAge({ commit }, age: number) {
          commit('SET_AGE', age)
        },
        setName({ commit }, payload: string) {
          commit('SET_NAME', payload)
        },
        setUser({ commit }, user: { name: string; age: number }) {
          commit('SET_USER', user)
        },
      },
      getters: {
        username(state) {
          return state.name
        },
        userinfo(state) {
          return state
        },
      },
    }
    Vue.use(Vuex)
    const testStore1 = new Vuex.Store(testStore1Options)

    const newStore = defineStore({
      state: {
        name: '123123',
        age: 18,
      },
      mutations: {
        SET_AGE(state, age: number) {
          state.age = age
        },
        SET_NAME(state, payload: string) {
          state.name = payload
        },
        SET_USER(state, user: { name: string; age: number }) {
          state.name = user.name
          state.age = user.age
        },
      },
      actions: {
        setAge({ commit }, age: number) {
          commit('SET_AGE', age)
        },
        setName({ commit }, payload: string) {
          commit('SET_NAME', payload)
        },
        setUser({ commit }, user: { name: string; age: number }) {
          commit('SET_USER', user)
        },
      },
      getters: {
        username(state) {
          return state.name
        },
        userinfo(state) {
          return state
        },
      },
      modules: {
        m1: defineModule({
          namespaced: true,
          state: {a: '1'},
          mutations: {
            UPDATE(state, payload: string) {
              state.a = payload
            }
          },
          actions: {
            update({commit}) {
              commit('UPDATE', '2')
            }
          }
        }),
        m2: defineModule({
          state: {a: '1'},
          mutations: {
            UPDATE(state, payload: string) {
              state.a = payload
            }
          },
          actions: {
            update2({commit}) {
              commit('UPDATE', '2')
            }
          }
        })
      }
    })

    const testStore2 = newStore.store

    testStore2.dispatch

    assertType<string>(testStore2.getters.username)
    assertType<string>(testStore2.state.name)

    expect(testStore1.state.name).toBe(testStore2.state.name)
    expect(testStore1.getters.username).toBe(testStore2.getters.username)

    testStore2.commit('SET_NAME', '222')

    expect(testStore2.getters.username).toBe('222')

    testStore2.commit({
      type: 'SET_USER',
      name: '333',
      age: 20,
    })

    expect(testStore2.getters.username).toBe('333')

    testStore2.commit('SET_NAME', '222')


    testStore2.dispatch('setName', '333')
    testStore2.dispatch('m1/update', '2')
    testStore2.dispatch('update2', '2')

    expect(testStore2.getters.username).toBe('333')

    testStore2.dispatch({
      type: 'setUser',
      name: '444',
      age: 21,
    })

    expect(testStore2.getters.username).toBe('444')
  })

  it('test mapGetters', () => {
    const a = mapGetters(['userinfo', 'gUsername'])
    const vm = new Vue({
      store,
      computed: {
        ...mapGetters(['userinfo', 'gUsername']),
        ...mapGetters({
          newGUsername: 'gUsername',
        }),
        ...mapGetters('count', {
          newDouble: 'double',
        }),
        ...mapGetters('count', ['double']),
      },
    })

    // @ts-expect-error
    const name = vm.username
    assertType<{ uname: string; uage: number }>(vm.userinfo)
    assertType<string>(vm.newGUsername)
    assertType<string>(vm.gUsername)
    assertType<number>(vm.newDouble)
    assertType<number>(vm.double)

    expect(vm.userinfo.uname).toBe('123123')
    expect(vm.newGUsername).toBe('123')
    expect(vm.gUsername).toBe('123')
    expect(vm.newDouble).toBe(2)
    expect(vm.double).toBe(2)
  })

  it('test mapMutations', () => {
    const vm = new Vue({
      store,
      computed: {
        ...mapGetters(['username', 'gUsername']),
        ...mapGetters('count', {
          double: 'double',
        }),
      },
      methods: {
        ...mapMutations(['SET_NAME', 'SET_G_USERNAME']),
        ...mapMutations({
          NEW_SET_G_USERNAME: 'SET_G_USERNAME',
        }),
        ...mapMutations('count', {
          NEW_SET_NUM: 'SET_NUM',
        }),
        ...mapMutations('count', ['SET_NUM']),
      },
    })

    assertType<string>(vm.username)
    assertType<string>(vm.gUsername)
    assertType<number>(vm.double)
    assertType<(p: string) => any>(vm.SET_NAME)
    assertType<(p: number) => any>(vm.NEW_SET_NUM)
    assertType<(p: string) => any>(vm.NEW_SET_G_USERNAME)
    assertType<(p: string) => any>(vm.SET_G_USERNAME)

    vm.SET_NAME('222')
    expect(vm.username).toBe('222')

    vm.NEW_SET_NUM(222)
    expect(vm.username).toBe('222')

    vm.SET_G_USERNAME('333')
    expect(vm.gUsername).toBe('333')

    vm.NEW_SET_NUM(2)
    expect(vm.double).toBe(4)
  })

  it('test mapActions', () => {
    const vm = new Vue({
      store,
      computed: {
        ...mapGetters(['username', 'gUsername']),
        ...mapGetters({
          newGUsernam: 'gUsername',
        }),
        ...mapGetters('count', {
          newDouble: 'double',
        }),
        ...mapGetters('count', ['double']),
      },
      methods: {
        ...mapMutations('count', {
          SET_NUM: 'SET_NUM',
        }),
        ...mapActions(['setName', 'setGUsername']),
        ...mapActions({
          newSetGUsername: 'setGUsername',
        }),
        ...mapActions('count', {
          newAdd: 'add',
        }),
        ...mapActions('count', ['add']),
      },
    })

    assertType<string>(vm.username)
    assertType<string>(vm.gUsername)
    assertType<string>(vm.newGUsernam)
    assertType<number>(vm.newDouble)
    assertType<number>(vm.double)
    assertType<(p: string) => any>(vm.setName)
    assertType<(p: string) => any>(vm.setGUsername)
    assertType<(p: string) => any>(vm.newSetGUsername)
    assertType<(p: number) => any>(vm.SET_NUM)
    assertType<(p: number) => any>(vm.newAdd)
    assertType<(p: number) => any>(vm.add)

    vm.setName('333')
    expect(vm.username).toBe('333')

    vm.setGUsername('444')
    expect(vm.gUsername).toBe('444')

    vm.newSetGUsername('4445')
    expect(vm.gUsername).toBe('4445')

    vm.SET_NUM(1)
    vm.newAdd(1)
    expect(store.state.count.num).toBe(2)
    vm.add(1)
    expect(vm.double).toBe(6)
  })

  it('test mapState', () => {
    const vm = new Vue({
      store,
      computed: {
        ...mapState(['uname', 'gUsername']),
        ...mapState({
          newGUsername: 'gUsername',
        }),
        ...mapState({
          newUname: state => state.user.uname,
        }),
        ...mapState('count', ['num']),
        ...mapState('count', {
          newNum: 'num',
        }),
      },
    })

    // vuex not support
    assertType<undefined>(vm.uname)
    assertType<string>(vm.newGUsername)
    assertType<string>(vm.newUname)
    assertType<string>(vm.gUsername)
    assertType<number>(vm.newNum)
    assertType<number>(vm.num)

    expect(vm.newGUsername).toBe('4445')
    expect(vm.uname).toBe(undefined)
    expect(vm.newUname).toBe('333')
    expect(vm.gUsername).toBe('4445')
    expect(vm.newNum).toBe(3)
    expect(vm.num).toBe(3)
  })
})
