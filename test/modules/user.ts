import { defineModule } from "../../src"

export const userModule = defineModule({
  state: {
    name: '123123',
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
    username(state) {
      return state.name
    },
  },
})