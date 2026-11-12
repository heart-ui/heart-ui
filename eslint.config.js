import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import ts from 'typescript-eslint'

export default defineConfig(
  // The generated folders in .gitignore, which flat config does not read.
  globalIgnores([
    '**/dist/',
    '**/.output/',
    '**/.nuxt/',
    '**/.vitepress/cache/',
    '**/.vitepress/dist/',
    '**/coverage/',
    '**/test-results/',
    '**/playwright-report/',
  ]),
  js.configs.recommended,
  ts.configs.recommended,
  vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // typescript-eslint turns off core rules that misfire on TypeScript only for .ts files.
      // That is safe here only because block-lang makes every .vue script TypeScript.
      ...ts.configs.eslintRecommended.rules,
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    },
  },
  prettier,
)
