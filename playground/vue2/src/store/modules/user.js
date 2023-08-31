import { defineModule } from 'z-vuex-typed'

const userStore = defineModule({
  state: {
    name: 'huali',
    age: 18,
  },
  mutations: {
    /**
     * @param {string} payload
     */
    SET_NAME(state, payload) {
      state.name = payload
    },
    /**
     * @param {number} payload
     */
    SET_AGE(state, payload) {
      state.age = payload
    },
  },
  actions: {
    updateUser({ commit }, /** @type {{name: string, age: number}} */ payload) {
      commit('SET_NAME', payload.name)
      commit('SET_AGE', payload.age)
    },
  },
})

export default userStore
