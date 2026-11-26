<script setup lang="ts">
import { type DefaultTheme, useData } from 'vitepress'
import { computed, onBeforeUnmount, ref } from 'vue'

// Above each docs page's title: the sidebar section the page belongs to, and actions on the page. A component
// page links to its source folder; every page can be copied as Markdown, for pasting into a coding agent.
const { page, theme } = useData<DefaultTheme.Config>()

const repo = 'https://github.com/heart-ui/heart-ui'

const section = computed(() => {
  const sidebar = theme.value.sidebar
  const groups = Array.isArray(sidebar) ? sidebar : Object.values(sidebar ?? {})[0]
  const link = `/${page.value.relativePath.replace(/(index)?\.md$/, '')}`
  const group = (Array.isArray(groups) ? groups : groups?.items)?.find((item) =>
    item.items?.some((child) => child.link === link || child.link === link.replace(/\/$/, '')),
  )
  return group?.text
})

const component = computed(() => /^components\/(.+)\.md$/.exec(page.value.relativePath)?.[1])

// Each page's Markdown, loaded only when it is copied. Component pages are generated, so their Markdown
// holds the preview's tag and v-pre fences, which mean nothing outside the site.
const sources = import.meta.glob<string>('../../{start,guide,components}/*.md', {
  query: '?raw',
  import: 'default',
})

function markdown(raw: string) {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n+/, '')
    .replace(/^<DemoPreview [^>]*\/>\n+/gm, '')
    .replace(/^:{3,} v-pre\n+/gm, '')
    .replace(/^:{3,}\n+/gm, '')
    .trim()
}

const copied = ref(false)
let reset: ReturnType<typeof setTimeout> | undefined

async function copyPage() {
  const load = sources[`../../${page.value.relativePath}`]
  if (!load) return
  await navigator.clipboard.writeText(`${markdown(await load())}\n`)
  copied.value = true
  clearTimeout(reset)
  reset = setTimeout(() => (copied.value = false), 2000)
}

onBeforeUnmount(() => clearTimeout(reset))

const icons = {
  copy: 'M8 8h11v11H8z M5 16H4V5h11v1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
}
</script>

<template>
  <section class="page-header" aria-label="Page">
    <p v-if="section" class="page-section">{{ section }}</p>
    <div class="page-actions">
      <a
        v-if="component"
        class="page-action"
        :href="`${repo}/tree/main/registry/ui/${component}`"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"
          />
        </svg>
        GitHub
        <span class="sr-only">(source, opens in a new tab)</span>
      </a>
      <button type="button" class="page-action" @click="copyPage">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="copied ? icons.check : icons.copy" />
        </svg>
        {{ copied ? 'Copied' : 'Copy page' }}
      </button>
      <span class="sr-only" aria-live="polite">{{ copied ? 'Page copied as Markdown' : '' }}</span>
    </div>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}
.page-section {
  margin: 0;
  color: var(--lp-link);
  font-size: 0.9375rem;
  font-weight: 600;
}
.page-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}
.page-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-block-size: 2rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  background: var(--lp-surface);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lp-fg) 14%, transparent);
  color: var(--lp-fg);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.page-action:hover {
  background: color-mix(in srgb, var(--lp-surface) 92%, var(--lp-fg));
}
.page-action:focus-visible {
  outline: 2px solid var(--lp-link);
  outline-offset: 2px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
