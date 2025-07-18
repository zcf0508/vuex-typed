import { defineModule } from '../../src'

export const countModule = defineModule({
  namespaced: true,
  state: () => ({
    num: 1,
    num2: 1,
  }),
  mutations: {
    SET_NUM(state, payload: number) {
      state.num = payload
    },
    ADD_NUM(state) {
      state.num++
    },
    SET_NUM2(state, payload: number) {
      state.num2 = payload
    },
  },
  actions: {
    add({ commit, state }, payload: number) {
      commit('SET_NUM', state.num + payload)
    },
    addNum({ commit }) {
      commit('ADD_NUM')
    },
    add2({ commit, state }, payload: number) {
      commit('SET_NUM2', state.num2 + payload)
    },
  },
  getters: {
    double(state) {
      return state.num * 2
    },
    double2(state) {
      return state.num2 * 2
    },
  },
  // modules: {
  //     city : defineModule({
  //         namespace: true,
  //         state: {},
  //     })
  // }
})
