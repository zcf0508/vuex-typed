/* eslint-disable vue/one-component-per-file */
import { assertType, describe, expect, it } from 'vitest'
import Vuex from 'vuex'
import Vue, { defineComponent } from 'vue'
import { defineModule, defineStore } from '../../src'
import { userModule } from '../modules/user'
import { user33Module as user22Module } from '../modules/user3'
import { countModule } from '../modules/count2'

const { store, mapGetters, mapMutations, mapActions, mapState } = defineStore({
  state: () => ({ // state is a function
    gUsername: '123',
  }),
  modules: {
    user: userModule,
    user22: user22Module,
    count: countModule,
  },
  mutations: {
    SET_G_USERNAME_DEFAULT(state) {
      state.gUsername = 'default'
    },
    SET_G_USERNAME(state, payload?: string) {
      state.gUsername = payload || ''
    },
  },
  actions: {
    setGUsernameDefault({ commit }) {
      commit('SET_G_USERNAME_DEFAULT')
    },
    setGUsername({ commit }, payload?: string) {
      commit('SET_G_USERNAME', payload)
    },
  },
  getters: {
    gUsername: state => state.gUsername,
  },
}, Vue)

// @ts-ignore
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: typeof store
  }
}

// @ts-ignore
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

    const newStore3 = defineStore({
      state: () => ({ // state is a function
        name: '123123',
        age: 18,
      }),
      mutations: {
        SET_AGE(state, age: number) {
          state.age = age
        },
        Add_AGE(state, payload: unknown) {
          state.age++
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
        setAge({ commit, dispatch, state }, age: number) {
          commit('SET_AGE', state.age)
          commit('SET_AGE', age)
          dispatch('addAge')
        },
        addAge({ commit }, payload: unknown) {
          commit('Add_AGE', payload)
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
          state: { a: '1', b: 2 },
          mutations: {
            UPDATE(state, payload?: string) {
              state.a = payload || ''
            },
            UPDATE2(state, payload: number) {
              state.b = payload
            },
            ADD_B(state) {
              state.b++
            },
          },
          actions: {
            update({ commit, dispatch }) {
              commit('UPDATE')
              commit('UPDATE', '2')
              dispatch('add_b')
              dispatch('update2')
              return 2
            },
            update2({ commit }, payload?: string) {
              commit('UPDATE', payload)
            },
            add_b({ commit }) {
              commit('ADD_B')
            },
          },
          getters: {
            nsga: state => state.a,
            nsgb: state => state.b,
          },
        }),
        m2: defineModule({
          state: { a: '1' },
          mutations: {
            UPDATE(state, payload: string) {
              state.a = payload
            },
          },
          actions: {
            update2({ commit }) {
              commit('UPDATE', '2')
            },
          },
        }),
        m3: defineModule({
          namespaced: true,
          state: () => ({ a: '1', b: 2 }), // state is a function
          mutations: {
            UPDATE(state, payload?: string) {
              state.a = payload || ''
            },
            UPDATE2(state, payload: number) {
              state.b = payload
            },
            ADD_B(state) {
              state.b++
            },
          },
          actions: {
            update({ commit, dispatch, state }) {
              commit('UPDATE', state.a)
              commit('UPDATE', '2')
              dispatch('add_b')
              dispatch('update2')
              return 2
            },
            update2({ commit }, payload?: string) {
              commit('UPDATE', payload)
            },
            add_b({ commit }) {
              commit('ADD_B')
            },
          },
          getters: {
            nsga: state => state.a,
            nsgb: state => state.b,
          },
        }),
      },
    }, Vue)

    const testStore3 = newStore3.store

    assertType<string>(testStore3.getters.username)
    assertType<number>(testStore3.getters['m1/nsgb'])
    assertType<string>(testStore3.getters['m3/nsga'])
    assertType<string>(testStore3.state.name)
    assertType<string>(testStore3.state.m3.a)

    expect(testStore1.state.name).toBe(testStore3.state.name)
    expect(testStore1.getters.username).toBe(testStore3.getters.username)

    testStore3.commit('SET_NAME', '222')

    expect(testStore3.getters.username).toBe('222')

    testStore3.commit({
      type: 'SET_USER' as const,
      name: '333',
      age: 20,
    })

    expect(testStore3.getters.username).toBe('333')

    testStore3.commit('SET_NAME', '222')
    testStore3.commit('m1/UPDATE')
    testStore3.commit('m1/UPDATE', '333')
    testStore3.commit('m1/UPDATE2', 2)

    testStore3.dispatch('setName', '333')
    testStore3.dispatch('m1/update')
    testStore3.dispatch('m1/update2')
    testStore3.dispatch('m1/update2', '2')
    testStore3.dispatch('update2')

    expect(testStore3.getters.username).toBe('333')

    testStore3.dispatch({
      type: 'setUser' as const,
      name: '444',
      age: 21,
    })

    expect(testStore3.getters.username).toBe('444')
  })

  it('test mapGetters', () => {
    const vm = new Vue(defineComponent({
      store,
      computed: {
        ...mapGetters(['userinfo', 'gUsername', 'userinfo22']),
        ...mapGetters({
          newGUsername: 'gUsername',
        }),
        ...mapGetters('count', {
          newDouble: 'double',
        }),
        ...mapGetters('count', ['double']),
      },
    }))

    //  ↓ not export by mapGetters
    assertType<any>(vm.username)
    assertType<any>(vm.double2)

    assertType<string>(vm.gUsername)
    assertType<{ uname22: string; uage22: number }>(vm.userinfo22)
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
    const vm = new Vue(defineComponent({
      store,
      computed: {
        ...mapGetters(['username', 'gUsername']),
        ...mapGetters('count', {
          double: 'double',
        }),
      },
      methods: {
        ...mapMutations(['SET_NAME', 'ADD_AGE', 'SET_G_USERNAME_DEFAULT', 'SET_G_USERNAME']),
        ...mapMutations({
          NEW_SET_G_USERNAME: 'SET_G_USERNAME',
          NEW_SET_NAME: 'SET_NAME',
          NEW_ADD_AGE: 'ADD_AGE',
          NEW_SET_G_USERNAME_DEFAULT: 'SET_G_USERNAME_DEFAULT',
        }),
        ...mapMutations('count', {
          NEW_SET_NUM: 'SET_NUM',
          NEW_ADD_NUM: 'ADD_NUM',
        }),
        ...mapMutations('count', ['SET_NUM', 'ADD_NUM']),
      },
    }))

    //  ↓ not export by mapMutations
    assertType<any>(vm.SET_AGE)

    assertType<string>(vm.username)
    assertType<string>(vm.gUsername)
    assertType<number>(vm.double)
    assertType<(p: string) => any>(vm.SET_NAME)
    assertType<(p: string) => any>(vm.NEW_SET_NAME)
    assertType<(p: number) => any>(vm.SET_NUM)
    assertType<(p?: string) => any>(vm.NEW_SET_G_USERNAME)
    assertType<(p?: string) => any>(vm.SET_G_USERNAME)
    assertType<(p?: unknown) => any>(vm.SET_G_USERNAME_DEFAULT)
    assertType<(p?: unknown) => any>(vm.ADD_AGE)
    assertType<(p?: unknown) => any>(vm.NEW_ADD_AGE)
    assertType<(p?: unknown) => any>(vm.NEW_SET_G_USERNAME_DEFAULT)
    assertType<(p?: unknown) => any>(vm.NEW_ADD_NUM)
    assertType<(p?: unknown) => any>(vm.ADD_NUM)

    vm.SET_NAME('222')
    expect(vm.username).toBe('222')

    vm.NEW_SET_NUM(222)
    expect(vm.username).toBe('222')

    vm.SET_G_USERNAME('333')
    expect(vm.gUsername).toBe('333')

    vm.NEW_SET_NUM(2)
    vm.SET_NUM(2)
    expect(vm.double).toBe(4)
  })

  it('test mapActions', () => {
    const vm = new Vue(defineComponent({
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
        ...mapActions(['setName', 'addAge', 'setGUsername', 'setGUsernameDefault']),
        ...mapActions({
          newAddAge: 'addAge',
          newSetGUsername: 'setGUsername',
          newSetGUsernameDefault: 'setGUsernameDefault',
        }),
        ...mapActions('count', {
          newAdd: 'add',
          newAddNum: 'addNum',
        }),
        ...mapActions('count', ['add', 'addNum']),
      },
    }))

    //  ↓ not export by mapActions
    assertType<any>(vm.setAge)

    assertType<string>(vm.username)
    assertType<string>(vm.gUsername)
    assertType<string>(vm.newGUsernam)
    assertType<number>(vm.newDouble)
    assertType<number>(vm.double)
    assertType<(p: string) => any>(vm.setName)
    assertType<(p?: string) => any>(vm.setGUsername)
    assertType<(p?: string) => any>(vm.newSetGUsername)
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
    const vm = new Vue(defineComponent({
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
    }))

    //  ↓ not export by mapState
    assertType<any>(vm.uage)

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
