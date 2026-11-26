import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import DemoPreview from './DemoPreview.vue'
import HomeLanding from './HomeLanding.vue'
import PageHeader from './PageHeader.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'doc-before': () => h(PageHeader) }),
  enhanceApp({ app }) {
    app.component('DemoPreview', DemoPreview)
    app.component('HomeLanding', HomeLanding)
  },
} satisfies Theme
