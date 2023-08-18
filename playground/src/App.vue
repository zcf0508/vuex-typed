<script>
import { mapActions, mapGetters } from '@/store/index'

export default {
  name: 'App',
  computed: {
    ...mapGetters(['username']),
  },
  methods: {
    ...mapActions(['updateUser']),
    update() {
      this.updateUser({
        name: 'John Doe',
        age: 20,
      })
    },
  },
}
</script>

<template>
  <div>
    <div>This is {{ username }}, and I'm {{ $store.getters.userage }}.</div>
    <button @click="update">
      update
    </button>
  </div>
</template>

<style scoped>
</style>
