import { defineStore } from 'z-vuex-typed'

import userStore from './modules/user'

const {
  store,
  mapMutations,
  mapActions,
  mapGetters,
} = defineStore({
  modules: {
    user: userStore,
  },
  getters: {
    username: state => state.user.name,
    userage: state => state.user.age,
  },
})

export default store

export const useStore = () => store

export {
  mapMutations,
  mapActions,
  mapGetters,
}
