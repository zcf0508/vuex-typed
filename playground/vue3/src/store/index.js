import { defineStore } from 'z-vuex-typed'

import userStore from './modules/user'

const {
  store,
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
  useStore,
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

export {
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
  useStore,
}
