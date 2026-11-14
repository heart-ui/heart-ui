import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DemoPreview from './DemoPreview.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DemoPreview', DemoPreview)
  },
} satisfies Theme
