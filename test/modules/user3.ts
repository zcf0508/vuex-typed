import { defineModule } from '../../src'

export const user33Module = defineModule({
  state: () => ({
    uname33: '123123',
    uage33: 18,
  }),
  mutations: {
    SET_AGE33(state, age: number) {
      state.uage33 = age
    },
    SET_NAME33(state, payload: string) {
      state.uname33 = payload
    },
    SET_USER33(state, user: { name: string; age: number }) {
      state.uname33 = user.name
      state.uage33 = user.age
    },
  },
  actions: {
    setAge33({ commit }, age: number) {
      commit('SET_AGE33', age)
    },
    setName33({ commit }, payload: string) {
      commit('SET_NAME33', payload)
    },
    setUser33({ commit }, user: { name: string; age: number }) {
      commit('SET_USER33', user)
    },
  },
  getters: {
    username33(state) {
      return state.uname33
    },
    userinfo33(state) {
      return state
    },
  },
})
