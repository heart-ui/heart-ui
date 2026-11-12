import type { ESLint } from 'eslint'
import noRawValues from './rules/no-raw-values'
import noRekaOutsideUi from './rules/no-reka-outside-ui'

const plugin = {
  meta: { name: '@trevui/eslint-plugin', version: '0.0.0' },
  rules: {
    'no-raw-values': noRawValues,
    'no-reka-outside-ui': noRekaOutsideUi,
  },
} satisfies ESLint.Plugin

export default plugin
