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

// VitePress renders sidebar text as HTML.
const sidebar: DefaultTheme.SidebarItem[] = [
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
      { text: 'Guides', link: `/guide/${guides[0]}`, activeMatch: '^/guide/' },
      { text: 'Components', link: '/components/', activeMatch: '^/components/' },
    ],
    sidebar: { '/components/': sidebar, '/guide/': sidebar },
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
