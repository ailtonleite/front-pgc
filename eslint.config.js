import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist/**'] },
  ...pluginVue.configs['flat/recommended'],
]
