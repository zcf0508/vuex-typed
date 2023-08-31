import Vuex from 'vuex'

export function isNil(value: any) {
  return value === null || value === undefined
}

// @ts-ignore
export const IS_VUEX_3 = isNil(Vuex.createStore)

export function createVuexStore(options: any) {
  if (IS_VUEX_3)
    return new Vuex.Store(options)
  // @ts-ignore
  return Vuex.createStore(options)
}
