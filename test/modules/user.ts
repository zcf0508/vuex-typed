import { defineModule } from '../../src'

export const userModule = defineModule({
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
})
