<script setup lang="ts">
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { data } from './landing.data.ts'

// The landing page draws its own header and footer (index.md sets `layout: false`), and shares VitePress's
// appearance setting, so the color mode chosen here is the one the docs pages open in. The server renders
// before the mode is known, so markup that differs by mode is switched in CSS, never by `isDark`.
const { isDark } = useData()

const github = 'https://github.com/heart-ui/heart-ui'
const command = 'npx heart-ui init'

const nav = [
  { text: 'Docs', link: '/start/getting-started' },
  { text: 'Components', link: '/components/' },
  { text: 'Themes', link: '/start/theming' },
  { text: 'GitHub', link: github },
]

const footer = [
  {
    title: 'Product',
    links: [
      { text: 'Components', link: '/components/' },
      { text: 'Themes', link: '/start/theming' },
      { text: 'Dark mode', link: '/start/dark-mode' },
      { text: 'Releases', link: `${github}/releases` },
    ],
  },
  {
    title: 'Docs',
    links: [
      { text: 'Getting started', link: '/start/getting-started' },
      { text: 'Vite', link: '/start/installation-vite' },
      { text: 'Nuxt', link: '/start/installation-nuxt' },
      { text: 'Tokens', link: '/guide/tokens' },
    ],
  },
  {
    title: 'Community',
    links: [
      { text: 'GitHub', link: github },
      { text: 'Issues', link: `${github}/issues` },
      { text: 'Pull requests', link: `${github}/pulls` },
      { text: 'License', link: `${github}/blob/main/LICENSE` },
    ],
  },
]

// What the alpha gives an agent (docs/agent-support.md). The MCP server and the benchmark are not in it yet.
const features = [
  {
    icon: 'doc',
    title: 'AGENTS.md',
    text: 'heart-ui init writes it: where the components live, a step-by-step screen workflow, and the rules, such as token utilities only and one primary action per view.',
  },
  {
    icon: 'code',
    title: 'A Markdown spec per component',
    text: 'When to use it, its props, slots, events, keyboard and accessibility. The examples in it are type-checked against the component.',
  },
  {
    icon: 'check',
    title: 'heart-ui audit',
    text: 'Reads screen files without running them and reports each break of the checklist below, so an agent can fix its own work.',
  },
] as const

const icons = {
  doc: 'M6 2C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V7.41421C16 7.149 15.8946 6.89464 15.7071 6.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H6ZM5 4C5 3.44772 5.44772 3 6 3H10V6.5C10 7.32843 10.6716 8 11.5 8H15V16C15 16.5523 14.5523 17 14 17H6C5.44772 17 5 16.5523 5 16V4ZM14.7929 7H11.5C11.2239 7 11 6.77614 11 6.5V3.20711L14.7929 7Z',
  copy: 'M7 7H5C3.89543 7 3 7.89543 3 9V15C3 16.1046 3.89543 17 5 17H9C10.1046 17 11 16.1046 11 15H12C12 16.6569 10.6569 18 9 18H5C3.34315 18 2 16.6569 2 15V9C2 7.34315 3.34315 6 5 6H7V7ZM15 2C16.6569 2 18 3.34315 18 5V11C18 12.6569 16.6569 14 15 14H11C9.34315 14 8 12.6569 8 11V5C8 3.34315 9.34315 2 11 2H15ZM11 3C9.89543 3 9 3.89543 9 5V11C9 12.1046 9.89543 13 11 13H15C16.1046 13 17 12.1046 17 11V5C17 3.89543 16.1046 3 15 3H11Z',
  code: 'M12.6406 1.02073C12.9053 1.09864 13.0571 1.37606 12.9795 1.64084L7.97947 18.6408C7.90151 18.9055 7.62407 19.0573 7.35935 18.9797C7.09464 18.9018 6.94295 18.6243 7.02048 18.3596L12.0205 1.35959C12.0984 1.09481 12.3758 0.943089 12.6406 1.02073ZM5.12595 5.16819C5.30934 4.9619 5.62562 4.94297 5.83201 5.12619C6.03822 5.30959 6.05718 5.62588 5.874 5.83225L2.16892 10.0002L5.874 14.1682C6.05712 14.3746 6.03825 14.6909 5.83201 14.8742C5.62564 15.0573 5.30931 15.0384 5.12595 14.8322L1.12595 10.3322C0.95789 10.1429 0.95798 9.85755 1.12595 9.66819L5.12595 5.16819ZM14.1679 5.12619C14.3743 4.943 14.6906 4.96189 14.874 5.16819L18.874 9.66819C19.042 9.85754 19.0421 10.1429 18.874 10.3322L14.874 14.8322C14.6906 15.0384 14.3743 15.0573 14.1679 14.8742C13.9617 14.6909 13.9429 14.3746 14.126 14.1682L17.831 10.0002L14.126 5.83225C13.9428 5.6259 13.9618 5.3096 14.1679 5.12619Z',
  arrow:
    'M10.8371 3.13074C10.6332 2.94456 10.3169 2.95895 10.1307 3.16289C9.94456 3.36683 9.95895 3.68309 10.1629 3.86927L16.3307 9.5H2.5C2.22386 9.5 2 9.72386 2 10C2 10.2761 2.22386 10.5 2.5 10.5H16.3279L10.1629 16.1281C9.95895 16.3143 9.94456 16.6305 10.1307 16.8345C10.3169 17.0384 10.6332 17.0528 10.8371 16.8666L17.7535 10.5526C17.8934 10.4248 17.9732 10.2573 17.993 10.0841C17.9976 10.0568 18 10.0287 18 10C18 9.97313 17.9979 9.94675 17.9938 9.92103C17.9756 9.74512 17.8955 9.57446 17.7535 9.44478L10.8371 3.13074Z',
  check:
    'M16.8536 5.14645C17.0488 5.34171 17.0488 5.65829 16.8536 5.85355L7.85355 14.8536C7.65829 15.0488 7.34171 15.0488 7.14645 14.8536L3.14645 10.8536C2.95118 10.6583 2.95118 10.3417 3.14645 10.1464C3.34171 9.95118 3.65829 9.95118 3.85355 10.1464L7.5 13.7929L16.1464 5.14645C16.3417 4.95118 16.6583 4.95118 16.8536 5.14645Z',
  moon: 'M15.4932 13.4967C13.5653 16.8358 9.2957 17.9798 5.95663 16.052C5.20013 15.6152 4.54451 15.0515 4.01047 14.3887C6.8412 13.3015 8.56844 11.9681 9.60339 9.99249C10.651 7.99273 10.9395 5.83183 10.3628 3.08319C11.2605 3.20148 12.1328 3.49537 12.9378 3.96018C16.2769 5.88799 17.421 10.1576 15.4932 13.4967ZM5.45663 16.918C9.27399 19.122 14.1552 17.8141 16.3592 13.9967C18.5631 10.1793 17.2552 5.2981 13.4378 3.09415C12.3371 2.45863 11.1233 2.10173 9.88082 2.03507C9.4801 2.01357 9.17217 2.38477 9.26732 2.77462C9.95545 5.59395 9.70125 7.65076 8.71759 9.52844C7.78322 11.312 6.17301 12.559 3.16661 13.635C2.79667 13.7674 2.65251 14.2143 2.87537 14.538C3.54192 15.5059 4.41706 16.3178 5.45663 16.918Z',
  sun: 'M10 2C10.2761 2 10.5 2.22386 10.5 2.5V3.5C10.5 3.77614 10.2761 4 10 4C9.72386 4 9.5 3.77614 9.5 3.5V2.5C9.5 2.22386 9.72386 2 10 2ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14ZM10 13C8.34315 13 7 11.6569 7 10C7 8.34315 8.34315 7 10 7C11.6569 7 13 8.34315 13 10C13 11.6569 11.6569 13 10 13ZM17.5 10.5C17.7761 10.5 18 10.2761 18 10C18 9.72386 17.7761 9.5 17.5 9.5H16.5C16.2239 9.5 16 9.72386 16 10C16 10.2761 16.2239 10.5 16.5 10.5H17.5ZM10 16C10.2761 16 10.5 16.2239 10.5 16.5V17.5C10.5 17.7761 10.2761 18 10 18C9.72386 18 9.5 17.7761 9.5 17.5V16.5C9.5 16.2239 9.72386 16 10 16ZM3.5 10.5C3.77614 10.5 4 10.2761 4 10C4 9.72386 3.77614 9.5 3.5 9.5H2.46289C2.18675 9.5 1.96289 9.72386 1.96289 10C1.96289 10.2761 2.18675 10.5 2.46289 10.5H3.5ZM4.14645 4.14645C4.34171 3.95118 4.65829 3.95118 4.85355 4.14645L5.85355 5.14645C6.04882 5.34171 6.04882 5.65829 5.85355 5.85355C5.65829 6.04882 5.34171 6.04882 5.14645 5.85355L4.14645 4.85355C3.95118 4.65829 3.95118 4.34171 4.14645 4.14645ZM4.85355 15.8536C4.65829 16.0488 4.34171 16.0488 4.14645 15.8536C3.95118 15.6583 3.95118 15.3417 4.14645 15.1464L5.14645 14.1464C5.34171 13.9512 5.65829 13.9512 5.85355 14.1464C6.04882 14.3417 6.04882 14.6583 5.85355 14.8536L4.85355 15.8536ZM15.8536 4.14645C15.6583 3.95118 15.3417 3.95118 15.1464 4.14645L14.1464 5.14645C13.9512 5.34171 13.9512 5.65829 14.1464 5.85355C14.3417 6.04882 14.6583 6.04882 14.8536 5.85355L15.8536 4.85355C16.0488 4.65829 16.0488 4.34171 15.8536 4.14645ZM15.1464 15.8536C15.3417 16.0488 15.6583 16.0488 15.8536 15.8536C16.0488 15.6583 16.0488 15.3417 15.8536 15.1464L14.8536 14.1464C14.6583 13.9512 14.3417 13.9512 14.1464 14.1464C13.9512 14.3417 13.9512 14.6583 14.1464 14.8536L15.1464 15.8536Z',
  menu: 'M2 4.5C2 4.22386 2.22386 4 2.5 4H17.5C17.7761 4 18 4.22386 18 4.5C18 4.77614 17.7761 5 17.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 9.5C2 9.22386 2.22386 9 2.5 9H17.5C17.7761 9 18 9.22386 18 9.5C18 9.77614 17.7761 10 17.5 10H2.5C2.22386 10 2 9.77614 2 9.5ZM2.5 14C2.22386 14 2 14.2239 2 14.5C2 14.7761 2.22386 15 2.5 15H17.5C17.7761 15 18 14.7761 18 14.5C18 14.2239 17.7761 14 17.5 14H2.5Z',
  close:
    'M4.14645 4.14645C4.34171 3.95118 4.65829 3.95118 4.85355 4.14645L10 9.293L15.1464 4.14645C15.3417 3.95118 15.6583 3.95118 15.8536 4.14645C16.0488 4.34171 16.0488 4.65829 15.8536 4.85355L10.707 10L15.8536 15.1464C16.0488 15.3417 16.0488 15.6583 15.8536 15.8536C15.6583 16.0488 15.3417 16.0488 15.1464 15.8536L10 10.707L4.85355 15.8536C4.65829 16.0488 4.34171 16.0488 4.14645 15.8536C3.95118 15.6583 3.95118 15.3417 4.14645 15.1464L9.293 10L4.14645 4.85355C3.95118 4.65829 3.95118 4.34171 4.14645 4.14645Z',
} as const

const isExternal = (link: string) => link.startsWith('http')

const scrolled = ref(false)
const menuOpen = ref(false)
const copied = ref(false)
const sentinel = ref<HTMLElement>()

let observer: IntersectionObserver | undefined
let wide: MediaQueryList | undefined
let copiedTimer: ReturnType<typeof setTimeout> | undefined
const closeOnWide = (event: MediaQueryListEvent) => {
  if (event.matches) menuOpen.value = false
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    const last = entries[entries.length - 1]
    if (last) scrolled.value = !last.isIntersecting
  })
  if (sentinel.value) observer.observe(sentinel.value)
  wide = window.matchMedia('(min-width: 761px)')
  wide.addEventListener('change', closeOnWide)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  wide?.removeEventListener('change', closeOnWide)
  clearTimeout(copiedTimer)
})

function toggleTheme() {
  isDark.value = !isDark.value
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}

// Workflow band: a glow and a brighter patch of lattice follow a mouse or pen. The position goes straight
// into CSS variables once per frame, so moving the pointer never re-renders the component.
const workflow = ref<HTMLElement>()
const spotOn = ref(false)
let spotFrame = 0

function moveSpot(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  spotOn.value = true
  const { clientX, clientY } = event
  cancelAnimationFrame(spotFrame)
  spotFrame = requestAnimationFrame(() => {
    const el = workflow.value
    if (!el) return
    const box = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${clientX - box.left}px`)
    el.style.setProperty('--my', `${clientY - box.top}px`)
  })
}

function leaveSpot() {
  spotOn.value = false
}

onBeforeUnmount(() => cancelAnimationFrame(spotFrame))
</script>

<template>
  <div class="lp">
    <div ref="sentinel" class="sentinel" aria-hidden="true" />

    <header class="site-header" :class="{ 'is-scrolled': scrolled, 'menu-open': menuOpen }">
      <div class="wrap bar">
        <a href="/" class="brand">
          <svg viewBox="140 230 744 560" width="28" height="21" aria-hidden="true">
            <use href="#lp-mark" />
          </svg>
          <span>heart-ui</span>
        </a>
        <nav class="nav-links" aria-label="Main">
          <a v-for="item in nav" :key="item.text" :href="item.link">{{ item.text }}</a>
        </nav>
        <div class="actions">
          <button
            type="button"
            class="icon-btn hide-sm"
            aria-label="Toggle color mode"
            @click="toggleTheme"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path class="if-light" :d="icons.moon" fill="currentColor" />
              <path class="if-dark" :d="icons.sun" fill="currentColor" />
            </svg>
          </button>
          <a href="/start/getting-started" class="btn btn-inverse btn-sm hide-sm">Get started</a>
          <button
            type="button"
            class="icon-btn show-sm"
            aria-label="Menu"
            aria-controls="lp-mobile-nav"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path :d="menuOpen ? icons.close : icons.menu" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <nav v-show="menuOpen" id="lp-mobile-nav" class="mobile-nav" aria-label="Mobile">
        <a v-for="item in nav" :key="item.text" :href="item.link" @click="menuOpen = false">{{
          item.text
        }}</a>
        <div class="mobile-actions">
          <button type="button" class="btn btn-card btn-lg mobile-theme" @click="toggleTheme">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path class="if-light" :d="icons.moon" fill="currentColor" />
              <path class="if-dark" :d="icons.sun" fill="currentColor" />
            </svg>
            <span class="if-light">Dark mode</span><span class="if-dark">Light mode</span>
          </button>
          <a href="/start/getting-started" class="btn btn-inverse btn-lg">Get started</a>
        </div>
      </nav>
    </header>
    <div class="header-space" aria-hidden="true" />

    <!-- One copy of the logo mark, drawn by every <use href="#lp-mark">. -->
    <svg width="0" height="0" class="defs" aria-hidden="true">
      <defs>
        <g id="lp-mark" fill="none" stroke="#D82A0C" stroke-linecap="round" stroke-linejoin="round">
          <path
            stroke-width="16"
            d="M338.79 268.19L338.79 662.00M512.00 357.98L512.00 755.81M685.21 268.19L685.21 662.00M170.95 365.09L685.21 662.00M170.95 558.91L525.00 354.49M499.00 354.49L853.05 558.91M338.79 662.00L853.05 365.09"
          />
          <path
            stroke-width="26"
            d="M165.59 385.09A40 40 0 0 1 185.59 350.45L318.79 273.55A40 40 0 0 1 358.79 273.55L499.00 354.49A26 26 0 0 0 525.00 354.49L665.21 273.55A40 40 0 0 1 705.21 273.55L838.41 350.45A40 40 0 0 1 858.41 385.09L858.41 538.91A40 40 0 0 1 838.41 573.55L532.00 750.45A40 40 0 0 1 492.00 750.45L185.59 573.55A40 40 0 0 1 165.59 538.91Z"
          />
        </g>
      </defs>
    </svg>

    <main>
      <section class="hero">
        <!-- The pattern and mask live in this svg: the mask's 100% sizes against the svg that holds it. -->
        <svg class="decor" width="100%" height="100%" aria-hidden="true">
          <defs>
            <pattern id="lp-lattice" width="69.28" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 0V40M34.64 0V40M0 0L69.28 40M0 40L69.28 0"
                fill="none"
                stroke="var(--lp-lattice)"
              />
            </pattern>
            <radialGradient id="lp-fade-hero-g" cx="0.5" cy="0.38" r="0.5">
              <stop offset="0" stop-color="#fff" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <mask id="lp-fade-hero">
              <rect width="100%" height="100%" fill="url(#lp-fade-hero-g)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-lattice)" mask="url(#lp-fade-hero)" />
        </svg>
        <div class="wrap center">
          <svg viewBox="140 230 744 560" width="88" height="66" aria-hidden="true">
            <use href="#lp-mark" />
          </svg>
          <span class="pill">Alpha · v{{ data.version }}</span>
          <h1 class="hero-h">The Vue UI library built for coding agents.</h1>
          <p class="lead">
            Source you own, rules your agent follows, and an audit that checks its work.
          </p>
          <div class="cta-row">
            <a href="/start/getting-started" class="btn btn-primary btn-lg">
              Get started
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path :d="icons.arrow" fill="currentColor" />
              </svg>
            </a>
            <a href="/components/" class="btn btn-outline btn-lg">Browse components</a>
          </div>
          <div class="command">
            <code>{{ command }}</code>
            <button
              type="button"
              class="icon-btn muted"
              :aria-label="copied ? 'Copied' : 'Copy command'"
              @click="copyCommand"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path :d="copied ? icons.check : icons.copy" fill="currentColor" />
              </svg>
            </button>
            <span class="sr-only" aria-live="polite">{{
              copied ? 'Copied to clipboard' : ''
            }}</span>
          </div>
        </div>
      </section>

      <section class="band" aria-labelledby="lp-components">
        <div class="wrap stack">
          <div class="heading">
            <h2 id="lp-components">{{ data.components.length }} components</h2>
            <p class="intro">
              Each is a Vue file in <code>components/ui/</code> that you read and change like your
              own code. Its page has a live demo, its props, slots and events, its tokens and its
              keyboard support.
            </p>
          </div>
          <ul class="comp-grid">
            <li v-for="item in data.components" :key="item.name">
              <a :href="`/components/${item.name}`">{{ item.title }}</a>
            </li>
          </ul>
        </div>
      </section>

      <section class="band muted-bg" aria-labelledby="lp-themes">
        <div class="wrap stack">
          <div class="heading">
            <h2 id="lp-themes">{{ data.themes.length }} themes</h2>
            <p class="intro">
              Pick one with <code>npx heart-ui init --theme &lt;name&gt;</code>. A theme sets the
              primary colour, the neutral tint, the corner radius, the density and the shadow.
              <a href="/start/theming">Theming</a>
            </p>
          </div>
          <ul class="theme-grid">
            <li v-for="theme in data.themes" :key="theme.name" class="theme-card">
              <span
                class="swatch"
                :style="{ background: theme.primary, borderRadius: `${theme.radius}rem` }"
                aria-hidden="true"
              />
              <span class="theme-name">{{ theme.name }}</span>
              <span class="meta">{{ theme.radius }}rem radius</span>
              <span class="meta">{{ theme.density }} density</span>
              <span class="meta">{{ theme.shadow === 'none' ? 'no' : theme.shadow }} shadow</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="band" aria-labelledby="lp-agents">
        <div class="wrap stack">
          <div class="heading">
            <h2 id="lp-agents">For coding agents</h2>
            <p class="intro">
              Three things in the alpha are written for an agent to read and follow.
            </p>
          </div>
          <div class="grid3">
            <div v-for="feature in features" :key="feature.title" class="card">
              <div class="tile">
                <svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true">
                  <path :d="icons[feature.icon]" fill="currentColor" />
                </svg>
              </div>
              <h3>{{ feature.title }}</h3>
              <p class="body">{{ feature.text }}</p>
            </div>
          </div>
          <div class="checklist">
            <h3>What <code>heart-ui audit</code> checks</h3>
            <ol>
              <li v-for="check in data.checks" :key="check.id">
                <span class="check-id">{{ check.id }}</span>
                <span>{{ check.text }}</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section
        ref="workflow"
        class="band inv"
        :class="{ 'spot-on': spotOn }"
        @pointermove="moveSpot"
        @pointerleave="leaveSpot"
      >
        <svg class="decor" width="100%" height="100%" aria-hidden="true">
          <defs>
            <pattern id="lp-lattice-inv" width="69.28" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 0V40M34.64 0V40M0 0L69.28 40M0 40L69.28 0"
                fill="none"
                stroke="rgba(245,245,247,.1)"
              />
            </pattern>
            <radialGradient id="lp-fade-cli-g" cx="0.78" cy="0.5" r="0.5">
              <stop offset="0" stop-color="#fff" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <mask id="lp-fade-cli">
              <rect width="100%" height="100%" fill="url(#lp-fade-cli-g)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-lattice-inv)" mask="url(#lp-fade-cli)" />
        </svg>
        <div class="spot-glow" aria-hidden="true" />
        <svg class="decor spot-grid" width="100%" height="100%" aria-hidden="true">
          <defs>
            <pattern id="lp-lattice-hi" width="69.28" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 0V40M34.64 0V40M0 0L69.28 40M0 40L69.28 0"
                fill="none"
                stroke="rgba(255,107,79,.45)"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-lattice-hi)" />
        </svg>
        <div class="wrap cli-grid">
          <div class="cli-copy">
            <h2>{{ data.commands.length }} commands</h2>
            <p class="cli-lead">Run them with <code>npx heart-ui</code> in a Vite or Nuxt 4 app.</p>
            <dl class="cmd-list">
              <div v-for="cmd in data.commands" :key="cmd.name">
                <dt>
                  <code>{{ cmd.name }}</code>
                </dt>
                <dd>{{ cmd.summary }}</dd>
              </div>
            </dl>
            <p class="cli-lead">
              <a href="/start/getting-started">Read the getting started guide</a>
            </p>
          </div>
          <div class="windows">
            <div class="halo halo-a" aria-hidden="true" />
            <div class="halo halo-b" aria-hidden="true" />
            <div class="win win-editor" role="img" aria-label="The rules section of AGENTS.md">
              <div class="win-bar">
                <span class="dots" aria-hidden="true"><span /><span /><span /></span>
                <span>AGENTS.md</span>
              </div>
              <pre class="editor-pre"><span class="t-k">## Rules</span>

<span class="t-p">-</span> Semantic token utilities only.
<span class="t-p">-</span> No raw values.
<span class="t-p">-</span> One primary action per view.
<span class="t-p">-</span> Every data region handles empty,
  loading, error, and long content.

<span class="t-k">## Verify</span>

Run <span class="t-k">`heart-ui audit &lt;files&gt;`</span> on every
screen you change.</pre>
            </div>
            <div class="win win-term" role="img" aria-label="A terminal running heart-ui commands">
              <div class="win-bar">
                <span class="dots" aria-hidden="true"><span /><span /><span /></span>
                <span>Terminal</span>
              </div>
              <pre class="term-pre"><span class="t-p">$</span> npx heart-ui init
<span class="t-p">$</span> npx heart-ui add button dialog
<span class="t-p">$</span> npx heart-ui audit src/pages/Settings.vue</pre>
            </div>
          </div>
        </div>
      </section>

      <section class="band muted-bg" aria-labelledby="lp-status">
        <div class="wrap stack">
          <div class="heading">
            <h2 id="lp-status">Status</h2>
            <p class="intro">
              Heart UI is in alpha. APIs can change before the first stable release.
            </p>
          </div>
          <div class="grid3">
            <div class="card surface">
              <h3>In v{{ data.version }}</h3>
              <ul class="facts">
                <li>{{ data.components.length }} components</li>
                <li>{{ data.themes.length }} theme presets and dark mode</li>
                <li>The heart-ui CLI: {{ data.commands.map((cmd) => cmd.name).join(', ') }}</li>
                <li>AGENTS.md, written by <code>init</code></li>
                <li>@heart-ui/theme, the tokens as CSS</li>
              </ul>
            </div>
            <div class="card surface">
              <h3>Not yet</h3>
              <ul class="facts">
                <li>
                  Layouts. Audit check A1 looks for one, so it fails on every screen until they
                  ship.
                </li>
                <li>Blocks</li>
                <li>The MCP server</li>
                <li>The ESLint plugin as a package</li>
                <li>Charts</li>
              </ul>
            </div>
            <div class="card surface">
              <h3>Requirements</h3>
              <ul class="facts">
                <li>Node 22.18 or later</li>
                <li>Vue 3.5 or later, TypeScript 6</li>
                <li>Tailwind CSS 4</li>
                <li>A Vite or Nuxt 4 app</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="band final">
        <div class="wrap center">
          <h2 class="final-h">Try the alpha.</h2>
          <p class="lead-sm">Set up a Vite or Nuxt 4 app, then add the components you need.</p>
          <a href="/start/getting-started" class="btn btn-primary btn-lg">
            Get started
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path :d="icons.arrow" fill="currentColor" />
            </svg>
          </a>
        </div>
      </section>
    </main>

    <footer class="ft">
      <div class="wrap ft-stack">
        <div class="ft-grid">
          <div class="ft-brand">
            <a href="/" class="brand">
              <svg viewBox="140 230 744 560" width="28" height="21" aria-hidden="true">
                <use href="#lp-mark" />
              </svg>
              <span>heart-ui</span>
            </a>
            <p>Vue and Nuxt components you own, built for coding agents.</p>
          </div>
          <nav v-for="group in footer" :key="group.title" :aria-label="group.title" class="ft-col">
            <p class="ft-title">{{ group.title }}</p>
            <a
              v-for="link in group.links"
              :key="link.text"
              :href="link.link"
              :target="isExternal(link.link) ? '_blank' : undefined"
              :rel="isExternal(link.link) ? 'noreferrer' : undefined"
            >
              {{ link.text }}
            </a>
          </nav>
        </div>
        <div class="ft-bottom">
          <span>© 2026 heart-ui · MIT License</span>
          <span>Made with love by Tam Mai</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* The palette is in landing-tokens.css, shared with the docs pages. */
.lp {
  position: relative;
  min-height: 100vh;
  background: var(--lp-bg);
  color: var(--lp-fg);
  font-family: var(--lp-font-sans);
  -webkit-font-smoothing: antialiased;
}

.lp a {
  color: var(--lp-link);
}
.lp a:hover {
  color: var(--lp-link-hover);
}
.lp :focus-visible {
  outline: 2px solid var(--lp-link);
  outline-offset: 2px;
}
.lp h1,
.lp h2,
.lp h3,
.lp p {
  margin: 0;
}

.sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 8px;
  pointer-events: none;
}
.defs {
  position: absolute;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.wrap {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Header */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  margin-bottom: -6rem;
  border-bottom: 1px solid transparent;
  transition:
    border-color 0.5s var(--lp-ease),
    margin-bottom 0.5s var(--lp-ease);
}
.site-header::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-color: var(--lp-glass);
  backdrop-filter: saturate(140%) blur(20px);
  opacity: 0;
  transition:
    opacity 0.5s var(--lp-ease),
    background-color 0.5s var(--lp-ease);
}
.site-header.is-scrolled,
.site-header.menu-open {
  margin-bottom: -4rem;
  border-bottom-color: var(--lp-glass-line);
}
.site-header.is-scrolled::before,
.site-header.menu-open::before {
  opacity: 1;
}
.site-header.menu-open::before {
  background-color: var(--lp-glass-solid);
}
@supports not (backdrop-filter: blur(1px)) {
  .site-header::before {
    background-color: var(--lp-glass-solid);
  }
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 6rem;
  transition: height 0.5s var(--lp-ease);
}
.is-scrolled .bar,
.menu-open .bar {
  height: 4rem;
}
.header-space {
  height: 6rem;
}
.lp .brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--lp-fg);
  font-weight: 600;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;
}
.lp .nav-links a {
  color: var(--lp-fg);
  text-decoration: none;
}
.lp .nav-links a:hover {
  color: var(--lp-muted-fg);
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.mobile-nav {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.5rem 1.5rem 2rem;
}
.lp .mobile-nav > a {
  display: flex;
  align-items: center;
  min-height: 3.25rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--lp-fg);
  text-decoration: none;
}
.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.mobile-theme {
  justify-content: flex-start;
}

/* Controls */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--lp-fg);
  cursor: pointer;
}
.icon-btn.muted {
  color: var(--lp-muted-fg);
}
.lp .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.125rem;
  border: 0;
  border-radius: 10px;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    box-shadow 0.25s var(--lp-ease),
    background-color 0.25s var(--lp-ease);
}
/* A light lift on hover; the primary button's shadow takes its own hue. */
.lp .btn:hover {
  box-shadow: var(--lp-btn-shadow);
}
.lp .btn-primary:hover {
  box-shadow: var(--lp-btn-shadow-primary);
}
.lp .btn-ghost:hover {
  box-shadow: none;
}
.lp .btn-sm {
  margin-left: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
.lp .btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}
.lp .btn-primary,
.lp .btn-primary:hover {
  background: var(--lp-brand);
  color: var(--lp-on-brand);
}
.lp .btn-primary:hover {
  background: var(--lp-brand-hover);
}
.lp .btn-inverse,
.lp .btn-inverse:hover {
  background: var(--lp-fg);
  color: var(--lp-on-fg);
}
.lp .btn-card,
.lp .btn-card:hover {
  background: var(--lp-card);
  color: var(--lp-fg);
}
/* One step lighter on hover: a paler grey in light mode, the raised surface in dark. */
.lp .btn-card:hover {
  background: var(--lp-card-hover);
}
/* The secondary action: an edge, no fill. The border sits inside the padding, so it is the size of the others. */
.lp .btn-outline,
.lp .btn-outline:hover {
  border: 1px solid var(--lp-input);
  background: transparent;
  color: var(--lp-fg);
}
.lp .btn-outline.btn-lg {
  padding: calc(0.75rem - 1px) calc(1.5rem - 1px);
}
.lp .btn-outline:hover {
  background: var(--lp-muted);
}
.btn-surface {
  background: var(--lp-surface);
  color: var(--lp-fg);
}
.btn-ghost {
  background: transparent;
  color: var(--lp-fg);
}

/* Sections */
section {
  position: relative;
  overflow: hidden;
}
.decor {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.hero {
  padding: 9rem 0 8rem;
}
.band {
  padding: 8rem 0;
}
.muted-bg {
  background: var(--lp-muted);
}
.final {
  padding: 9rem 0;
}
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 4.5rem;
}
.heading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 40rem;
}
.pill {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  background: var(--lp-card);
  font-size: 0.8125rem;
  font-weight: 500;
}
.hero-h {
  max-width: 52rem;
  text-wrap: balance;
  font-size: 4rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.lead {
  max-width: 38rem;
  color: var(--lp-muted-fg);
  font-size: 1.25rem;
  line-height: 1.6;
}
.lead-sm {
  color: var(--lp-muted-fg);
  font-size: 1.25rem;
}
.cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.command {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0 0.25rem 0 1.25rem;
  border-radius: 10px;
  background: var(--lp-card);
}
.command code {
  color: var(--lp-fg);
  font-family: var(--lp-font-mono);
  font-size: 0.9375rem;
}
.lp h2 {
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.lp .final-h {
  font-size: 3rem;
}
.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2.25rem;
  border-radius: 16px;
  background: var(--lp-card);
}
.card.surface {
  background: var(--lp-surface);
}
.card h3 {
  font-size: 1.25rem;
  font-weight: 600;
}
.body {
  color: var(--lp-muted-fg);
  font-size: 1rem;
  line-height: 1.65;
}
.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 1.25rem;
  border-radius: 10px;
  background: var(--lp-tile);
}

/* Section intros and the lists that carry the facts. */
.intro {
  color: var(--lp-muted-fg);
  font-size: 1.125rem;
  line-height: 1.6;
}
.intro code,
.facts code,
.checklist code {
  font-family: var(--lp-font-mono);
  font-size: 0.9em;
  white-space: nowrap;
}
.lp .intro a {
  margin-left: 0.25rem;
  font-weight: 500;
}
.comp-grid,
.theme-grid,
.facts,
.checklist ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.comp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.75rem;
}
.lp .comp-grid a {
  display: flex;
  align-items: center;
  min-height: 3.25rem;
  padding: 0 1.25rem;
  border-radius: 10px;
  background: var(--lp-card);
  color: var(--lp-fg);
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s var(--lp-ease);
}
.lp .comp-grid a:hover {
  background: var(--lp-tile);
  color: var(--lp-fg);
}
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 1rem;
}
.theme-card {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: var(--lp-surface);
}
.swatch {
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 1rem;
}
.theme-name {
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-transform: capitalize;
}
.meta {
  color: var(--lp-muted-fg);
  font-size: 0.875rem;
  line-height: 1.5;
}
.checklist {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.checklist h3 {
  font-size: 1.25rem;
  font-weight: 600;
}
.checklist ol {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(24rem, 100%), 1fr));
  gap: 0 3rem;
}
.checklist li {
  display: flex;
  gap: 1rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--lp-glass-line);
  line-height: 1.5;
}
.check-id {
  flex: none;
  width: 2rem;
  color: var(--lp-muted-fg);
  font-family: var(--lp-font-mono);
  font-size: 0.875rem;
  line-height: 1.7;
}
.facts {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  color: var(--lp-muted-fg);
  line-height: 1.55;
}
.cmd-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0.5rem 0;
}
.cmd-list div {
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: 1rem;
}
.cmd-list dt code {
  color: #ff6b4f;
  font-family: var(--lp-font-mono);
}
.cmd-list dd {
  margin: 0;
  color: #a1a1a6;
  line-height: 1.55;
}

/* CLI band: dark in both modes. */
.inv {
  background: var(--lp-inverse);
  color: #f5f5f7;
}
.lp .inv a {
  color: #ff6b4f;
}
.lp .inv a:hover {
  color: #ff8a73;
}
.spot-glow,
.spot-grid {
  opacity: 0;
  transition: opacity 0.5s var(--lp-ease);
}
.spot-glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
    40rem circle at var(--mx, 70%) var(--my, 50%),
    rgba(255, 107, 79, 0.16),
    rgba(216, 42, 12, 0.06) 35%,
    transparent 65%
  );
}
.spot-grid {
  mask-image: radial-gradient(16rem circle at var(--mx, 70%) var(--my, 50%), #000, transparent);
}
.spot-on .spot-glow,
.spot-on .spot-grid {
  opacity: 1;
}
.cli-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(26rem, 100%), 1fr));
  align-items: center;
  gap: 4.5rem;
}
.cli-copy {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.cli-lead {
  color: #a1a1a6;
  font-size: 1.125rem;
  line-height: 1.55;
}
.cli-lead code {
  color: #f5f5f7;
  font-family: var(--lp-font-mono);
}
.windows {
  position: relative;
  min-width: 0;
  padding-bottom: 4.5rem;
}
.halo {
  position: absolute;
  border-radius: 50%;
  background: var(--lp-halo);
  pointer-events: none;
}
.halo-a {
  top: 0;
  left: 2%;
  width: 96%;
  height: 96%;
  filter: blur(96px);
  opacity: var(--lp-halo-a);
}
.halo-b {
  top: 38%;
  left: 42%;
  width: 56%;
  height: 56%;
  filter: blur(84px);
  opacity: var(--lp-halo-b);
}
.win {
  padding: 6px;
  backdrop-filter: saturate(140%) blur(16px);
}
.win-editor {
  position: relative;
  margin-right: 2.5rem;
  border: 1px solid rgba(245, 245, 247, 0.1);
  border-radius: 20px;
  background: rgba(245, 245, 247, 0.03);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.25),
    0 24px 48px -12px rgba(0, 0, 0, 0.55),
    0 48px 96px -24px rgba(0, 0, 0, 0.45);
}
.win-term {
  position: absolute;
  right: 0;
  bottom: 0;
  width: calc(100% - 4rem);
  border: 1px solid rgba(245, 245, 247, 0.16);
  border-radius: 18px;
  background: rgba(44, 44, 48, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 28px 56px -12px rgba(0, 0, 0, 0.65),
    0 60px 120px -30px rgba(0, 0, 0, 0.55);
  backdrop-filter: saturate(150%) blur(18px);
}
.win-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem 0.625rem 0.875rem;
  color: #a1a1a6;
  font-size: 0.8125rem;
  font-weight: 500;
}
.dots {
  display: flex;
  gap: 6px;
}
.dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(245, 245, 247, 0.18);
}
.win pre {
  margin: 0;
  overflow-x: auto;
  color: #f5f5f7;
  font-family: var(--lp-font-mono);
  font-size: 0.9375rem;
  line-height: 1.75;
  white-space: pre;
}
.editor-pre {
  padding: 1.125rem 1.375rem 5rem;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.2);
}
.term-pre {
  padding: 0.5rem 1rem 1rem;
}
.t-p {
  color: #a1a1a6;
}
.t-k {
  color: #ff6b4f;
}

/* Footer */
.ft {
  padding: 4.5rem 0 2.5rem;
  background: var(--lp-muted);
}
.ft-stack {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}
.ft-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 2.5rem 2rem;
}
.ft-brand {
  display: flex;
  flex-direction: column;
  grid-column: span 2;
  gap: 1rem;
}
.ft-brand p {
  max-width: 18rem;
  color: var(--lp-muted-fg);
  font-size: 0.875rem;
  line-height: 1.6;
}
.ft-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.ft-title {
  margin-bottom: 0.25rem !important;
  font-size: 0.8125rem;
  font-weight: 600;
}
.lp .ft-col a {
  color: var(--lp-muted-fg);
  font-size: 0.875rem;
  text-decoration: none;
}
.lp .ft-col a:hover {
  color: var(--lp-fg);
}
.ft-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  color: var(--lp-muted-fg);
  font-size: 0.8125rem;
}

/* Color mode: VitePress sets html.dark before the page paints. */
:root.dark .if-light,
:root:not(.dark) .if-dark {
  display: none;
}

/* Responsive */
.show-sm {
  display: none !important;
}
@media (max-width: 900px) {
  .ft-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ft-brand {
    grid-column: 1 / -1;
  }
}
@media (min-width: 761px) {
  .mobile-nav {
    display: none !important;
  }
}
@media (max-width: 760px) {
  .hide-sm,
  .nav-links {
    display: none !important;
  }
  .show-sm {
    display: inline-flex !important;
  }
  .hero,
  .band,
  .final {
    padding-top: 5.5rem;
    padding-bottom: 5.5rem;
  }
  .grid3 {
    grid-template-columns: 1fr;
  }
  .hero-h {
    font-size: 2.5rem;
  }
  .win-editor {
    margin-right: 0.75rem;
  }
  .win-term {
    width: calc(100% - 1.25rem);
  }
  .win pre {
    font-size: 0.8125rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}
@media (max-width: 480px) {
  .ft-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .site-header,
  .site-header::before,
  .bar,
  .spot-glow,
  .spot-grid,
  .btn {
    transition: none;
  }
}
</style>
