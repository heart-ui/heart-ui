import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'
import { docsItems, escapeHtml } from '../scripts/items.ts'
import { itemLinks } from './links.ts'

const registry = fileURLToPath(new URL('../../../registry', import.meta.url))
const items = docsItems()

export default defineConfig({
  title: 'Heart UI',
  description: 'Vue 3 components on Reka UI, copied into your project as source you own.',
  cleanUrls: true,
  themeConfig: {
    nav: [{ text: 'Components', link: '/components/' }],
    sidebar: {
      '/components/': [
        {
          text: 'Components',
          link: '/components/',
          items: items.map((item) => ({
            // VitePress renders sidebar text as HTML.
            text: escapeHtml(item.title),
            link: `/components/${item.name}`,
          })),
        },
      ],
    },
  },
  markdown: { config: (md) => md.use(itemLinks) },
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
