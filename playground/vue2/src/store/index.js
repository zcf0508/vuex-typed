import Vue from 'vue'
import Vuex from 'vuex'

import { defineStore } from 'z-vuex-typed'

import userStore from './modules/user'

Vue.use(Vuex)

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
})

export default store

export const useStore = () => store

export {
  mapState,
  mapMutations,
  mapActions,
  mapGetters,
}
