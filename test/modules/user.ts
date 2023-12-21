import { defineModule } from '../../src'

export const userModule = defineModule({
  state: {
    uname: '123123',
    uage: 18,
  },
  mutations: {
    SET_AGE(state, age: number) {
      state.uage = age
    },
    ADD_AGE(state) {
      state.uage++
    },
    SET_NAME(state, payload: string) {
      state.uname = payload
    },
    SET_USER(state, user: { name: string; age: number }) {
      state.uname = user.name
      state.uage = user.age
    },
  },
  actions: {
    setAge({ commit }, age: number) {
      commit('SET_AGE', age)
    },
    addAge({ commit }) {
      commit('ADD_AGE')
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
      return state.uname
    },
    userinfo(state) {
      return state
    },
  },
})
