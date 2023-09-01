import { assertType, describe, expect, it } from 'vitest'
import { createStore } from 'vuex'
import { createApp, defineComponent } from 'vue'
import { defineModule, defineStore } from '../src'
import { userModule } from './modules/user'
import { user22Module } from './modules/user2'
import { countModule } from './modules/count'

const { store, mapGetters, mapMutations, mapActions, mapState } = defineStore({
  state: {
    gUsername: '123',
  },
  modules: {
    user: userModule,
    user22: user22Module,
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

declare module '@vue/runtime-core' {
  interface ComponentCustomOptions {
    store?: typeof store
  }
  interface ComponentCustomProperties {
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

    const testStore1 = createStore(testStore1Options)

    const { store: testStore2 } = defineStore({
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
          state: { a: '1' },
          mutations: {
            UPDATE(state, payload: string) {
              state.a = payload
            },
          },
          actions: {
            update({ commit }) {
              commit('UPDATE', '2')
            },
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
      },
    })

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
    const app = createApp(defineComponent({
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
    app.use(store)
    const vm = app.mount(document.createElement('div'))

    //  ↓ not export by mapGetters
    assertType<any>(vm.username)
    assertType<any>(vm.double2)

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
    const app = createApp(defineComponent({
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
    }))
    app.use(store)
    const vm = app.mount(document.createElement('div'))

    //  ↓ not export by mapMutations
    assertType<any>(vm.SET_AGE)

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
    const app = createApp(defineComponent({
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
    }))
    app.use(store)
    const vm = app.mount(document.createElement('div'))

    //  ↓ not export by mapActions
    assertType<any>(vm.setAge)

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
    const app = createApp(defineComponent({
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
    app.use(store)
    const vm = app.mount(document.createElement('div'))

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
