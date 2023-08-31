export default {
  test: {
    globals: true,
    environment: 'happy-dom',
    deps: {
      inline: [/^(?!.*vitest).*$/],
    },
  },
}
