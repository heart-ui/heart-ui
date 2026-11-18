import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { docsItems, escapeHtml, guides, markdownTitle, sitePages } from '../scripts/items.ts'
import { siteLinks } from './links.ts'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const registry = `${repo}registry`
const items = docsItems()
const guideTitle = (name: string) =>
  markdownTitle(readFileSync(`${repo}docs/${name}.md`, 'utf8')) ?? name

// The pages a new user reads first, in order; written for the site, in start/.
const start: DefaultTheme.SidebarItem = {
  text: 'Get started',
  items: [
    { text: 'Getting started', link: '/start/getting-started' },
    { text: 'Installation with Vite', link: '/start/installation-vite' },
    { text: 'Installation with Nuxt', link: '/start/installation-nuxt' },
    { text: 'Theming', link: '/start/theming' },
    { text: 'Dark mode', link: '/start/dark-mode' },
  ],
}

// VitePress renders sidebar text as HTML.
const sidebar: DefaultTheme.SidebarItem[] = [
  start,
  {
    text: 'Guides',
    items: guides.map((name) => ({
      text: escapeHtml(guideTitle(name)),
      link: `/guide/${name}`,
    })),
  },
  {
    text: 'Components',
    link: '/components/',
    items: items.map((item) => ({
      text: escapeHtml(item.title),
      link: `/components/${item.name}`,
    })),
  },
]

export default defineConfig({
  title: 'Heart UI',
  description: 'Vue 3 components on Reka UI, copied into your project as source you own.',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Get started', link: '/start/getting-started', activeMatch: '^/start/' },
      { text: 'Guides', link: `/guide/${guides[0]}`, activeMatch: '^/guide/' },
      { text: 'Components', link: '/components/', activeMatch: '^/components/' },
    ],
    sidebar: { '/start/': sidebar, '/components/': sidebar, '/guide/': sidebar },
  },
  markdown: { config: (md) => md.use(siteLinks, { pages: sitePages(items) }) },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@registry': registry,
        // Registry items import shared code as the CLI writes it: `@/lib/...`, `@/components/ui/...`.
        '@/lib': `${registry}/lib`,
        '@/components/ui': `${registry}/ui`,
      },
      // registry/ resolves vue from the root node_modules; dedupe keeps one copy if versions drift.
      dedupe: ['vue'],
    },
  },
})
