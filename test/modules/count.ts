import { defineModule } from '../../src'

export const countModule = defineModule({
  namespaced: true,
  state: {
    num: 1,
  },
  mutations: {
    SET_NUM(state, payload: number) {
      state.num = payload
    },
  },
  actions: {
    add({ commit, state }, payload: number) {
      commit('SET_NUM', state.num + payload)
    },
  },
  getters: {
    double(state) {
      return state.num * 2
    },
  },
  // modules: {
  //     city : defineModule({
  //         namespace: true,
  //         state: {},
  //     })
  // }
})
