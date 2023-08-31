import VueDefault, * as VueAll from 'vue'
import { IS_VUEX_3, isNil } from '../src/helper'

export const Vue = isNil(VueDefault) ? VueAll : VueDefault

export function createVueApp(options: any) {
  if (IS_VUEX_3)
    return new Vue(options)

  else
    return Vue.createApp(options)
}
