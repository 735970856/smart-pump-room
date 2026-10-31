import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist/**', 'node_modules/**', 'public/**', 'data/**',
      // 原版 Three.js 建模及场景引擎保留在 JS 兼容层，不参与新 TS/Vue 的规则检查。
      'src/legacy-dashboard.js', 'src/*.js', 'build.mjs', 'serve.mjs',
      'src/views/DashboardPage.vue',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] } },
  },
  {
    files: ['**/*.{ts,vue,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
)
