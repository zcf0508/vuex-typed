// @ts-nocheck
import { userModule } from './modules/user'
import { countModule } from './modules/count'

export const storeOptions = {
  state: {
    gUsername: '123',
  },
  modules: {
    user: userModule,
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
}
