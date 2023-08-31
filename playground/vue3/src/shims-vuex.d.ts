import { ComponentCustomOptions, ComponentCustomProperties } from 'vue'
import store from '@/store'

declare module '@vue/runtime-core' {
  interface ComponentCustomOptions {
    store?: typeof store
  }
  interface ComponentCustomProperties {
    $store: typeof store
  }
}