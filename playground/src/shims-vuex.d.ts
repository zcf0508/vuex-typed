import Vue, { ComponentOptions } from "vue";
import type store from "./store";

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    store?: typeof store;
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $store: typeof store;
  }
}
