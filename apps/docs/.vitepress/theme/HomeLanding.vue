<script setup lang="ts">
// The docs' own appearance switches (aliased in config.ts), so color mode toggles exactly as in the docs.
import VPNavScreenAppearance from 'vitepress-appearance/screen'
import VPSwitchAppearance from 'vitepress-appearance/switch'
import { type DefaultTheme, useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { data } from './landing.data.ts'

// The landing page draws its own header and footer (index.md sets `layout: false`) and shares VitePress's
// appearance setting, so the color mode chosen here is the one the docs pages open in.

const github = 'https://github.com/heart-ui/heart-ui'
// The GitHub mark (simple-icons), as the docs header shows it.
const githubMark =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

// The docs header's links (config.ts), so the landing page and the docs pages list the same ones.
const { theme: site } = useData<DefaultTheme.Config>()
const nav = (site.value.nav ?? []).flatMap((item) =>
  'link' in item ? [{ text: item.text, link: item.link }] : [],
)

// The first section's prompt for a coding agent: paste it and the agent runs the rest.
const prompt =
  'Set up Heart UI in this project with npx heart-ui init, then build the UI as AGENTS.md says.'
// The audit card shows what the CLI prints for a screen in the Settings layout with a raw class and two
// primary buttons.
const auditCommand = 'npx heart-ui audit pages/Settings.vue'
const auditLines = [
  {
    at: 'pages/Settings.vue:6',
    id: 'A2',
    text: 'Arbitrary-value class: use a token utility instead.',
  },
  {
    at: 'pages/Settings.vue:8',
    id: 'A4',
    text: '2 primary buttons in one view: keep one and make the rest secondary or ghost.',
  },
]

// Where "Create your own theme" goes: the theming guide's section on changing values, until the custom
// theme page exists.
const customThemeLink = '/start/theming#change-a-value'

// The showcase's theme; the frame applies it as data-heart-theme (presets.css).
const theme = ref(data.themes[0]?.name ?? 'default')

const icons = {
  doc: 'M6 2C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V7.41421C16 7.149 15.8946 6.89464 15.7071 6.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H6ZM5 4C5 3.44772 5.44772 3 6 3H10V6.5C10 7.32843 10.6716 8 11.5 8H15V16C15 16.5523 14.5523 17 14 17H6C5.44772 17 5 16.5523 5 16V4ZM14.7929 7H11.5C11.2239 7 11 6.77614 11 6.5V3.20711L14.7929 7Z',
  copy: 'M7 7H5C3.89543 7 3 7.89543 3 9V15C3 16.1046 3.89543 17 5 17H9C10.1046 17 11 16.1046 11 15H12C12 16.6569 10.6569 18 9 18H5C3.34315 18 2 16.6569 2 15V9C2 7.34315 3.34315 6 5 6H7V7ZM15 2C16.6569 2 18 3.34315 18 5V11C18 12.6569 16.6569 14 15 14H11C9.34315 14 8 12.6569 8 11V5C8 3.34315 9.34315 2 11 2H15ZM11 3C9.89543 3 9 3.89543 9 5V11C9 12.1046 9.89543 13 11 13H15C16.1046 13 17 12.1046 17 11V5C17 3.89543 16.1046 3 15 3H11Z',
  code: 'M12.6406 1.02073C12.9053 1.09864 13.0571 1.37606 12.9795 1.64084L7.97947 18.6408C7.90151 18.9055 7.62407 19.0573 7.35935 18.9797C7.09464 18.9018 6.94295 18.6243 7.02048 18.3596L12.0205 1.35959C12.0984 1.09481 12.3758 0.943089 12.6406 1.02073ZM5.12595 5.16819C5.30934 4.9619 5.62562 4.94297 5.83201 5.12619C6.03822 5.30959 6.05718 5.62588 5.874 5.83225L2.16892 10.0002L5.874 14.1682C6.05712 14.3746 6.03825 14.6909 5.83201 14.8742C5.62564 15.0573 5.30931 15.0384 5.12595 14.8322L1.12595 10.3322C0.95789 10.1429 0.95798 9.85755 1.12595 9.66819L5.12595 5.16819ZM14.1679 5.12619C14.3743 4.943 14.6906 4.96189 14.874 5.16819L18.874 9.66819C19.042 9.85754 19.0421 10.1429 18.874 10.3322L14.874 14.8322C14.6906 15.0384 14.3743 15.0573 14.1679 14.8742C13.9617 14.6909 13.9429 14.3746 14.126 14.1682L17.831 10.0002L14.126 5.83225C13.9428 5.6259 13.9618 5.3096 14.1679 5.12619Z',
  arrow:
    'M10.8371 3.13074C10.6332 2.94456 10.3169 2.95895 10.1307 3.16289C9.94456 3.36683 9.95895 3.68309 10.1629 3.86927L16.3307 9.5H2.5C2.22386 9.5 2 9.72386 2 10C2 10.2761 2.22386 10.5 2.5 10.5H16.3279L10.1629 16.1281C9.95895 16.3143 9.94456 16.6305 10.1307 16.8345C10.3169 17.0384 10.6332 17.0528 10.8371 16.8666L17.7535 10.5526C17.8934 10.4248 17.9732 10.2573 17.993 10.0841C17.9976 10.0568 18 10.0287 18 10C18 9.97313 17.9979 9.94675 17.9938 9.92103C17.9756 9.74512 17.8955 9.57446 17.7535 9.44478L10.8371 3.13074Z',
  check:
    'M16.8536 5.14645C17.0488 5.34171 17.0488 5.65829 16.8536 5.85355L7.85355 14.8536C7.65829 15.0488 7.34171 15.0488 7.14645 14.8536L3.14645 10.8536C2.95118 10.6583 2.95118 10.3417 3.14645 10.1464C3.34171 9.95118 3.65829 9.95118 3.85355 10.1464L7.5 13.7929L16.1464 5.14645C16.3417 4.95118 16.6583 4.95118 16.8536 5.14645Z',
  menu: 'M2 4.5C2 4.22386 2.22386 4 2.5 4H17.5C17.7761 4 18 4.22386 18 4.5C18 4.77614 17.7761 5 17.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 9.5C2 9.22386 2.22386 9 2.5 9H17.5C17.7761 9 18 9.22386 18 9.5C18 9.77614 17.7761 10 17.5 10H2.5C2.22386 10 2 9.77614 2 9.5ZM2.5 14C2.22386 14 2 14.2239 2 14.5C2 14.7761 2.22386 15 2.5 15H17.5C17.7761 15 18 14.7761 18 14.5C18 14.2239 17.7761 14 17.5 14H2.5Z',
  close:
    'M4.14645 4.14645C4.34171 3.95118 4.65829 3.95118 4.85355 4.14645L10 9.293L15.1464 4.14645C15.3417 3.95118 15.6583 3.95118 15.8536 4.14645C16.0488 4.34171 16.0488 4.65829 15.8536 4.85355L10.707 10L15.8536 15.1464C16.0488 15.3417 16.0488 15.6583 15.8536 15.8536C15.6583 16.0488 15.3417 16.0488 15.1464 15.8536L10 10.707L4.85355 15.8536C4.65829 16.0488 4.34171 16.0488 4.14645 15.8536C3.95118 15.6583 3.95118 15.3417 4.14645 15.1464L9.293 10L4.14645 4.85355C3.95118 4.65829 3.95118 4.34171 4.14645 4.14645Z',
} as const

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

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(prompt)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}
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
          <VPSwitchAppearance class="hide-sm appearance" />
          <a :href="github" class="icon-btn hide-sm" aria-label="Heart UI on GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="githubMark" fill="currentColor" />
            </svg>
          </a>
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
        <a :href="github">GitHub</a>
        <div class="mobile-actions">
          <VPNavScreenAppearance />
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
        <!-- The pattern and mask live in this svg: the mask's 100% sizes against the svg that holds it.
             The lattice is the mark's own grid: the mark is drawn at 0.12 scale, where its lines are 20.78
             apart and its rows 24 high, and the tile starts on the page's centre line (x 50%) at a point where
             the mark's lines cross (15.84 below its top, which is the hero's top padding, a multiple of 24). -->
        <svg class="decor" width="100%" height="100%" aria-hidden="true">
          <defs>
            <pattern
              id="lp-lattice"
              x="50%"
              y="15.84"
              width="41.569"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 0V24M20.785 0V24M0 0L41.569 24M0 24L41.569 0"
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
          <svg viewBox="140 230 744 560" width="89.28" height="67.2" aria-hidden="true">
            <use href="#lp-mark" />
          </svg>
          <span class="pill">Alpha · v{{ data.version }}</span>
          <h1 class="hero-h">The Vue UI library built for coding agents.</h1>
          <p class="lead">
            Rules your agent follows, source you own, and an audit that checks its work.
          </p>
          <div class="cta-row">
            <a href="/start/getting-started" class="btn btn-primary btn-lg">
              Get started
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path :d="icons.arrow" fill="currentColor" />
              </svg>
            </a>
            <a href="/components/" class="btn btn-neutral btn-lg">Browse components</a>
          </div>
        </div>
      </section>

      <section class="prompt-band" aria-labelledby="lp-prompt">
        <div class="wrap quick-stack">
          <div class="section-head center-head">
            <p class="eyebrow">Quick start for agents</p>
            <h2 id="lp-prompt">One prompt sets it up.</h2>
            <p class="section-lead">Paste it into your coding agent. It runs the rest.</p>
          </div>
          <!-- The whole box copies the prompt; the icon on the right shows whether it has. -->
          <button type="button" class="prompt" @click="copyPrompt">
            <span class="prompt-tip" aria-hidden="true">{{
              copied ? 'Copied' : 'Click to copy'
            }}</span>
            <span class="sr-only">Copy the prompt: </span>
            <code>{{ prompt }}</code>
            <span class="copy-mark" :class="{ 'is-copied': copied }" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20">
                <path :d="copied ? icons.check : icons.copy" fill="currentColor" />
              </svg>
            </span>
          </button>
          <span class="sr-only" aria-live="polite">{{ copied ? 'Copied to clipboard' : '' }}</span>
        </div>
      </section>

      <section class="showcase-band" aria-labelledby="lp-showcase">
        <div class="wrap showcase-stack">
          <div class="section-head">
            <p class="eyebrow">Components</p>
            <h2 id="lp-showcase">
              {{ data.components }} components. {{ data.themes.length }} themes.
            </h2>
          </div>
          <div class="theme-bar">
            <div class="theme-chips" role="group" aria-label="Theme">
              <button
                v-for="item in data.themes"
                :key="item.name"
                type="button"
                class="theme-chip"
                :aria-pressed="theme === item.name"
                @click="theme = item.name"
              >
                <span class="chip-dot" :style="{ background: item.primary }" aria-hidden="true" />
                {{ item.name }}
              </button>
            </div>
            <a :href="customThemeLink" class="more">
              Create your own theme
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                <path :d="icons.arrow" fill="currentColor" />
              </svg>
            </a>
          </div>
          <DemoPreview
            name="showcase"
            title="Heart UI components"
            path="/showcase/components"
            :theme="theme"
            overlay
          />
        </div>
      </section>

      <section class="band" aria-labelledby="lp-loop">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow">How it works</p>
            <h2 id="lp-loop">Made for the agent loop.</h2>
          </div>
          <div class="loop-grid">
            <article class="feature">
              <div class="feature-copy">
                <code class="feature-cmd">heart-ui init</code>
                <h3>Rules your agent follows</h3>
                <p>AGENTS.md gives the agent the workflow and the rules for every screen.</p>
              </div>
              <div class="win" role="img" aria-label="The rules section of AGENTS.md">
                <div class="win-bar">
                  <span class="dots" aria-hidden="true"><span /><span /><span /></span>
                  <span>AGENTS.md</span>
                </div>
                <pre class="win-pre"><span class="t-k">## Rules</span>

<span class="t-p">-</span> Semantic token utilities only.
<span class="t-p">-</span> No raw values.
<span class="t-p">-</span> One primary action per view.</pre>
              </div>
            </article>
            <article class="feature">
              <div class="feature-copy">
                <code class="feature-cmd">heart-ui add</code>
                <h3>Source you own</h3>
                <p>Components land in your project as plain Vue files the agent reads and edits.</p>
              </div>
              <div
                class="win"
                role="img"
                aria-label="components/ui with the button files and a dialog folder"
              >
                <div class="win-bar">
                  <span class="dots" aria-hidden="true"><span /><span /><span /></span>
                  <span>components/ui</span>
                </div>
                <pre class="win-pre"><span class="t-p">├─</span> button/
<span class="t-p">│  ├─</span> Button.vue
<span class="t-p">│  ├─</span> button.variants.ts
<span class="t-p">│  └─</span> index.ts
<span class="t-p">└─</span> dialog/</pre>
              </div>
            </article>
            <article class="feature feature-wide">
              <div class="feature-copy">
                <code class="feature-cmd">heart-ui audit</code>
                <h3>An audit that checks its work</h3>
                <p>
                  {{ data.checks.length }} rules run on each screen. Every finding names a line and
                  a fix, so the agent corrects itself.
                </p>
              </div>
              <div
                class="win"
                role="img"
                aria-label="Audit output: two failures, each with a line, a rule and a fix"
              >
                <div class="win-bar">
                  <span class="dots" aria-hidden="true"><span /><span /><span /></span>
                  <span>Terminal</span>
                </div>
                <div class="term">
                  <div class="term-line full"><span class="t-p">$</span> {{ auditCommand }}</div>
                  <div v-for="line in auditLines" :key="line.id" class="term-line">
                    <span class="t-p">{{ line.at }}</span>
                    <span class="t-k">{{ line.id }}</span>
                    <span>{{ line.text }}</span>
                  </div>
                  <div class="term-line full">2 failures in 1 of 1 file.</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="band quick" aria-labelledby="lp-start">
        <div class="wrap quick-stack">
          <div class="section-head center-head">
            <h2 id="lp-start">Try it in your next project.</h2>
            <p class="section-lead">
              Add it to your Vite or Nuxt 4 app with one command. It's free and open source.
            </p>
          </div>
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
      <div class="wrap">
        <p class="ft-note">
          Built by Tam Mai. Released under the
          <a :href="`${github}/blob/main/LICENSE`">MIT License</a>. The source is on
          <a :href="github">GitHub</a>.
        </p>
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
  flex: 1 1 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}
/* The brand and the actions share the spare width equally, so the links sit at the page's true centre. */
.bar > .brand {
  flex: 1 1 0;
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
/* The docs' own appearance switch, with the room the icon button had beside it. */
.appearance {
  margin: 0 0.5rem 0 0.75rem;
}
.lp .actions a.icon-btn,
.lp .actions a.icon-btn:hover {
  color: var(--lp-fg);
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
/* The secondary action: white with a hairline edge and no shadow (the lift comes on hover) in light mode, light grey in dark mode (as the header's
   Get started), a shade deeper on hover. The edge is an inset shadow, so the button keeps its size. */
.lp .btn-neutral,
.lp .btn-neutral:hover {
  background: var(--lp-surface);
  color: var(--lp-fg);
  box-shadow: inset 0 0 0 1px var(--lp-glass-line);
}
.lp .btn-neutral:hover {
  background: var(--lp-muted);
  box-shadow:
    inset 0 0 0 1px var(--lp-glass-line),
    var(--lp-btn-shadow);
}
:root.dark .lp .btn-neutral,
:root.dark .lp .btn-neutral:hover {
  background: var(--lp-fg);
  color: var(--lp-on-fg);
  box-shadow: none;
}
:root.dark .lp .btn-neutral:hover {
  background: color-mix(in srgb, var(--lp-fg) 88%, var(--lp-bg));
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
  padding: 9rem 0 7rem;
}
.band {
  padding: 0 0 8rem;
}
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
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
.cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.lp h2 {
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
.lp h3 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Section heads: a small label over the heading. */
.section-head {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}
.center-head {
  align-items: center;
  text-align: center;
}
.eyebrow {
  color: var(--lp-link);
  font-size: 0.875rem;
  font-weight: 600;
}
.section-lead {
  max-width: 34rem;
  color: var(--lp-muted-fg);
  font-size: 1.125rem;
  line-height: 1.55;
}

/* Showcase: the real components, with the theme chips that restyle them. */
.showcase-band {
  padding: 8rem 0;
}
.showcase-stack {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.showcase-stack .section-head {
  margin-bottom: 0;
}
/* The chips on the left, the call to make a theme on the right. */
.theme-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
}
.lp .more {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
}
.lp .more:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.theme-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.theme-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0 0.875rem;
  border: 1px solid var(--lp-glass-line);
  border-radius: 999px;
  background: var(--lp-surface);
  color: var(--lp-muted-fg);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  cursor: pointer;
  transition:
    color 0.2s var(--lp-ease),
    border-color 0.2s var(--lp-ease),
    box-shadow 0.25s var(--lp-ease);
}
.theme-chip:hover {
  color: var(--lp-fg);
  box-shadow: var(--lp-btn-shadow);
}
.theme-chip[aria-pressed='true'] {
  border-color: var(--lp-fg);
  color: var(--lp-fg);
}
.chip-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}
.lp :deep(.demo-preview) {
  /* No card: the tiles sit on the page. The frame reaches past the column by the showcase's padding, which
     is only room for focus rings, so the tiles line up with the heading. */
  inline-size: calc(100% + 0.5rem);
  margin: 0 -0.25rem;
  border: 0;
  border-radius: 0;
  background-color: transparent;
}

/* The agent loop: three tiles, the audit across the full width. */
.loop-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}
.feature {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 2rem;
  border: 1px solid var(--lp-glass-line);
  border-radius: 20px;
  background: var(--lp-muted);
}
.feature-wide {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  align-items: center;
  gap: 2.5rem;
}
.feature-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
}
.feature-copy p {
  color: var(--lp-muted-fg);
  line-height: 1.55;
}
.feature-cmd {
  margin-bottom: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--lp-glass-line);
  background: var(--lp-surface);
  color: var(--lp-fg);
  font-family: var(--lp-font-mono);
  font-size: 0.8125rem;
}
.feature > .win {
  margin-top: auto;
}

/* A window: a title bar over a code panel. */
.win {
  min-width: 0;
  padding: 6px;
  border: 1px solid var(--lp-glass-line);
  border-radius: 16px;
  background: var(--lp-card-hover);
  box-shadow: var(--lp-btn-shadow);
}
.win-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.625rem 0.625rem;
  color: var(--lp-muted-fg);
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
  background: var(--lp-input);
}
.win-pre,
.term {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  border: 1px solid var(--lp-glass-line);
  border-radius: 11px;
  background: var(--lp-surface);
  color: var(--lp-fg);
  font-family: var(--lp-font-mono);
  font-size: 0.875rem;
  line-height: 1.75;
  white-space: pre;
}
.term {
  overflow: visible;
  white-space: normal;
}
/* A finding: where, which rule, then the message, which wraps under itself. */
.term-line {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 0 0.75rem;
}
.term-line.full {
  display: block;
}
.t-p {
  color: var(--lp-muted-fg);
}
.t-k {
  color: var(--lp-link);
}

/* The first section: the prompt to paste into a coding agent, on a light grey band. */
.prompt-band {
  padding: 6rem 0;
  background: var(--lp-muted);
}

/* The closing call to action. */
.quick-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}
.quick-stack .section-head {
  margin-bottom: 0;
}
.prompt {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 46rem;
  padding: 1rem 1rem 1rem 1.5rem;
  text-align: left;
  border: 1px solid var(--lp-glass-line);
  position: relative;
  border-radius: 16px;
  background: var(--lp-surface);
  font: inherit;
  cursor: pointer;
  box-shadow: var(--lp-btn-shadow);
  transition:
    box-shadow 0.3s var(--lp-ease),
    border-color 0.3s var(--lp-ease);
}
/* On hover (or keyboard focus): a soft brand glow round the box, and a tooltip above it. */
.prompt:hover,
.prompt:focus-visible {
  border-color: color-mix(in srgb, var(--lp-brand) 35%, transparent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--lp-brand) 8%, transparent),
    0 12px 40px -8px color-mix(in srgb, var(--lp-brand) 35%, transparent);
}
.prompt-tip {
  position: absolute;
  bottom: calc(100% + 0.625rem);
  left: 50%;
  padding: 0.375rem 0.625rem;
  border-radius: 8px;
  background: var(--lp-fg);
  color: var(--lp-on-fg);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 0.25rem);
  transition:
    opacity 0.2s var(--lp-ease),
    transform 0.2s var(--lp-ease);
}
.prompt:hover .prompt-tip,
.prompt:focus-visible .prompt-tip {
  opacity: 1;
  transform: translate(-50%, 0);
}
.prompt code {
  flex: 1;
  color: var(--lp-fg);
  font-family: var(--lp-font-mono);
  font-size: 0.9375rem;
  line-height: 1.6;
}
/* The copy state: a copy icon, then a check in brand red once the prompt is on the clipboard. */
.copy-mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: var(--lp-tile);
  color: var(--lp-muted-fg);
  transition:
    color 0.2s var(--lp-ease),
    background-color 0.2s var(--lp-ease);
}
.prompt:hover .copy-mark {
  color: var(--lp-fg);
}
.prompt .copy-mark.is-copied {
  background: color-mix(in srgb, var(--lp-brand) 12%, transparent);
  color: var(--lp-link);
}

/* Footer: one line of credit, on the content column's left edge. */
.ft {
  padding: 2rem 0;
  border-top: 1px solid var(--lp-glass-line);
}
.ft-note {
  color: var(--lp-muted-fg);
  font-size: 0.875rem;
}
.lp .ft-note a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

/* Responsive */
.show-sm {
  display: none !important;
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
  /* A whole number of lattice rows (24px), so the lattice still meets the mark. */
  .hero {
    padding-top: 6rem;
    padding-bottom: 5.5rem;
  }
  .showcase-band,
  .band {
    padding-bottom: 5.5rem;
  }
  .prompt-band {
    padding: 4rem 0;
  }
  .showcase-band {
    padding-top: 5.5rem;
  }
  .hero-h {
    font-size: 2.5rem;
  }
  .lp h2 {
    font-size: 2rem;
  }
  .loop-grid,
  .feature-wide {
    grid-template-columns: minmax(0, 1fr);
  }
  .feature {
    padding: 1.5rem;
  }
  .win-pre,
  .term {
    font-size: 0.8125rem;
  }
  .win-pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .term {
    overflow-wrap: anywhere;
  }
  .term-line {
    display: block;
  }
}
@media (prefers-reduced-motion: reduce) {
  .site-header,
  .site-header::before,
  .bar,
  .btn,
  .theme-chip {
    transition: none;
  }
  .prompt,
  .prompt-tip {
    transition: none;
  }
}
</style>
