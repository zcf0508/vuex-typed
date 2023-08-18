import Vue, { ComponentOptions } from "vue";
import { store } from "./index";

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
