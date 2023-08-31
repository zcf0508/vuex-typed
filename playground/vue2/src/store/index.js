import Vue from 'vue'

import { defineStore } from 'z-vuex-typed'

import userStore from './modules/user'

const {
  store,
  mapState,
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
}, Vue)

export default store

export const useStore = () => store

export {
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
}
