import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    dts: {
      respectExternal: false,
    },
  },
  externals: ['vue', 'vuex'],
  failOnWarn: false,
})
