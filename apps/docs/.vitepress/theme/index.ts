import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DemoPreview from './DemoPreview.vue'
import HomeLanding from './HomeLanding.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DemoPreview', DemoPreview)
    app.component('HomeLanding', HomeLanding)
  },
} satisfies Theme
