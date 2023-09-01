import { defineModule } from '../../src'

export const user22Module = defineModule({
  state: {
    uname22: '123123',
    uage22: 18,
  },
  mutations: {
    SET_AGE22(state, age: number) {
      state.uage22 = age
    },
    SET_NAME22(state, payload: string) {
      state.uname22 = payload
    },
    SET_USER22(state, user: { name: string; age: number }) {
      state.uname22 = user.name
      state.uage22 = user.age
    },
  },
  actions: {
    setAge22({ commit }, age: number) {
      commit('SET_AGE22', age)
    },
    setName22({ commit }, payload: string) {
      commit('SET_NAME22', payload)
    },
    setUser22({ commit }, user: { name: string; age: number }) {
      commit('SET_USER22', user)
    },
  },
  getters: {
    username22(state) {
      return state.uname22
    },
    userinfo22(state) {
      return state
    },
  },
})
