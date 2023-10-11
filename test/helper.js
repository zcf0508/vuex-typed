import VueDefault, * as VueAll from 'vue'
import { IS_VUEX_3, isNil } from '../src/helper'

export const Vue = isNil(VueDefault) ? VueAll : VueDefault

export function createVueApp(options) {
  if (IS_VUEX_3)
    return new Vue(options)

  else
    return Vue.createApp(options)
}

export function mount(store, component) {
  const el = createElement()

  component.render = component.render || (() => {})

  const app = Vue.createApp(component)

  app.use(store)

  return app.mount(el)
}

function createElement() {
  const el = document.createElement('div')

  document.body.appendChild(el)

  return el
}
