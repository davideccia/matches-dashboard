import antfu from '@antfu/eslint-config'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import vuetify from 'eslint-plugin-vuetify'

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  { formatters: true, imports: false, ignores: ['docs/**', 'postman/**', 'pnpm-workspace.yaml'] },
)
  .append(withNuxt())
  .append(vuetify.configs['flat/base'])
  .append(vueI18n.configs['flat/recommended'])
  .append({
    rules: {
      // js
      'no-alert': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'node/prefer-global/process': 'off',

      // vue
      'vue/block-order': ['error', {
        order: ['template', 'style', 'script'],
      }],
      'vue/custom-event-name-casing': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': ['error', {
        singleline: 4,
        multiline: {
          max: 1,
        },
      }],

      // style
      'curly': ['error', 'all'],
      'style/max-statements-per-line': ['error', { max: 2 }],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],

      // i18n
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/no-raw-text': 'off',

      // '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'warn', // TODO to enable in future

      '@intlify/vue-i18n/no-html-messages': 'off', // TODO to enable in future
      '@intlify/vue-i18n/no-v-html': 'off', // TODO to enable in future

      // others
      'vue/no-unused-refs': 'off', // ogni tanto viene usata la ref nei mixin
      'vue/no-multiple-template-root': 'off', // Vue 3 supporta i fragment
      // 'unused-imports/no-unused-vars': 'off',
    },
    settings: {
      'vue-i18n': {
        localeDir: './i18n/locales/*.json',
        messageSyntaxVersion: '^11.0.0',
      },
    },
  })
  .append({
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  })
