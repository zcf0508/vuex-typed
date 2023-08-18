import { describe, expect, it } from 'vitest'
import Vuex from 'vuex'
import Vue from 'vue'
import { defineStore } from '../src'
import { storeOptions } from './index'

describe('vuex', () => {
  it('test defineStore', () => {
    const testStore1Options = {
      state: {
        name: '111',
      },
      mutations: {
        SET_NAME(state: any, payload: string) {
          state.name = payload
        },
      },
      actions: {
        setName({ commit }: any, payload: string) {
          commit('SET_NAME', payload)
        },
      },
      getters: {
        testName: (state: any) => state.name,
      },
    }
    Vue.use(Vuex)
    const testStore1 = new Vuex.Store(testStore1Options)

    const { store: testStore2 } = defineStore({
      state: {
        name: '111',
      },
      mutations: {
        SET_NAME(state, payload: string) {
          state.name = payload
        },
      },
      actions: {
        setName({ commit }, payload: string) {
          commit('SET_NAME', payload)
        },
      },
      getters: {
        testName: state => state.name,
      },
    })

    expect(testStore1.state.name).toBe(testStore2.state.name)
    expect(testStore1.getters.testName).toBe(testStore2.getters.testName)

    testStore2.commit('SET_NAME', '222')

    expect(testStore2.getters.testName).toBe('222')

    testStore2.dispatch('setName', '333')

    expect(testStore2.getters.testName).toBe('333')
  })

  it('test mapGetters', () => {
    const { store, mapGetters } = defineStore(storeOptions)

    const vm = new Vue({
      store,
      computed: {
        ...mapGetters(['username', 'gUsername']),
        ...mapGetters('count', {
          double: 'double',
        }),
      },
    })

    expect(vm.username).toBe('123123')
    expect(vm.gUsername).toBe('123')
    expect(vm.double).toBe(2)
  })

  it('test mapMutations', () => {
    const { store, mapGetters, mapMutations } = defineStore(storeOptions)

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
        ...mapMutations('count', {
          SET_NUM: 'SET_NUM',
        }),
      },
    })

    vm.SET_NAME('222')
    expect(vm.username).toBe('222')

    vm.SET_NUM(222)
    expect(vm.username).toBe('222')

    vm.SET_G_USERNAME('333')
    expect(vm.gUsername).toBe('333')

    vm.SET_NUM(2)
    expect(vm.double).toBe(4)
  })

  it('test mapActions', () => {
    const { store, mapActions, mapGetters, mapMutations } = defineStore(storeOptions)

    const vm = new Vue({
      store,
      computed: {
        ...mapGetters(['username', 'gUsername']),
        ...mapGetters('count', {
          double: 'double',
        }),
      },
      methods: {
        ...mapMutations('count', {
          SET_NUM: 'SET_NUM',
        }),
        ...mapActions(['setName', 'setGUsername']),
        ...mapActions('count', {
          add: 'add',
        }),
      },
    })

    // @ts-expect-error
    vm.setName(1)

    vm.setName('333')
    expect(vm.username).toBe('333')

    vm.setGUsername('444')
    expect(vm.gUsername).toBe('444')

    vm.SET_NUM(1)
    vm.add(1)
    expect(store.state.count.num).toBe(2)
    expect(vm.double).toBe(4)
  })
})
