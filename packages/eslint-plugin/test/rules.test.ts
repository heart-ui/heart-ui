import { RuleTester, type Linter } from 'eslint'
import ts from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import plugin from '../src/index'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser: vueParser, ecmaVersion: 'latest', sourceType: 'module' },
})

const noRawValues = plugin.rules['no-raw-values']
const vue = 'registry/ui/sample/Sample.vue'
const tsFile = 'registry/ui/sample/sample.variants.ts'

function template(markup: string) {
  return { code: `<template>${markup}</template>`, filename: vue }
}
function script(code: string) {
  return { code, filename: tsFile }
}
function sfcScript(code: string) {
  return { code: `<script setup>\n${code}\n</script>`, filename: vue }
}
function invalid(
  base: { code: string; filename: string; languageOptions?: Linter.LanguageOptions },
  ...messageIds: string[]
) {
  return { ...base, errors: messageIds.map((messageId) => ({ messageId })) }
}

describe('no-raw-values', () => {
  describe('hex colors', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div id="app-root" class="bg-primary"><a href="#add">Add</a></div>'),
        template('<svg><use xlink:href="#add" /><rect fill="url(#fade)" /></svg>'),
        template('<a :href="\'#add\'">Add</a>'),
        script("export const anchor = '#app-root'"),
        script("export const mask = 'url(#fade)'"),
      ],
      invalid: [
        invalid(template('<div style="border-color: #0f172a"></div>'), 'rawColor'),
        invalid(template('<div :title="\'#fff\'"></div>'), 'rawColor'),
        invalid(template('<svg fill="#fff"></svg>'), 'rawColor'),
        invalid(script("export const brand = '#0f172a'"), 'rawColor'),
        invalid(sfcScript("const brand = '#abcdef80'"), 'rawColor'),
      ],
    })
  })

  describe('color functions', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div style="color: var(--h-primary)"></div>'),
        script("export const fill = 'var(--h-primary)'"),
        script("export const hint = 'Select color(s)'"),
      ],
      invalid: [
        invalid(template('<div style="color: rgb(0 0 0)"></div>'), 'rawColor'),
        invalid(template('<div style="color: oklch(0.5 0.1 200)"></div>'), 'rawColor'),
        invalid(template('<div :style="{ color: \'hsl(0 0% 0%)\' }"></div>'), 'rawColor'),
        invalid(script("export const fill = 'oklch(0.5 0.1 200)'"), 'rawColor'),
        invalid(script("export const fill = 'rgb(0 0 0)'"), 'rawColor'),
        invalid(script("export const fill = 'hsl(0 0% 0%)'"), 'rawColor'),
        invalid(script("export const fill = 'color(display-p3 1 0 0)'"), 'rawColor'),
        invalid(sfcScript("const fill = 'rgba(0, 0, 0, 0.5)'"), 'rawColor'),
      ],
    })
  })

  describe('named colors', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<p title="red">Red</p>'),
        template('<svg fill="currentColor" stroke="none"></svg>'),
        script("export const label = 'red'"),
        script("export const style = { color: 'var(--h-foreground)' }"),
        sfcScript("const props = withDefaults(defineProps(), { colorLabel: 'Color: red' })"),
      ],
      invalid: [
        invalid(template('<div style="background: red"></div>'), 'rawColor'),
        invalid(template('<div :style="{ backgroundColor: \'white\' }"></div>'), 'rawColor'),
        invalid(template('<svg fill="white" stroke="black"></svg>'), 'rawColor', 'rawColor'),
        invalid(template('<svg><stop stop-color="red" /></svg>'), 'rawColor'),
        invalid(template('<Icon color="red" />'), 'rawColor'),
        invalid(template('<div :fill="\'red\'"></div>'), 'rawColor'),
        invalid(
          template('<div style="background-image: linear-gradient(red, blue)"></div>'),
          'rawColor',
        ),
        invalid(template('<div style="color: var(--x, red)"></div>'), 'rawColor'),
        invalid(template('<div style="--h-x: white"></div>'), 'rawColor'),
        invalid(template('<div style="text-decoration: underline red"></div>'), 'rawColor'),
        invalid(script("export const style = { color: 'white' }"), 'rawColor'),
        invalid(script('export const style = { color: `red` }'), 'rawColor'),
        invalid(
          script("export const style = (on) => ({ color: on ? 'red' : 'blue' })"),
          'rawColor',
          'rawColor',
        ),
        invalid(script("export function paint(el) { el.style.color = 'red' }"), 'rawColor'),
        invalid(
          script("export function paint(el) { el.style.setProperty('background', 'white') }"),
          'rawColor',
        ),
        invalid(sfcScript("const css = 'color: rebeccapurple'"), 'rawColor'),
      ],
    })
  })

  describe('palette classes', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div class="bg-primary text-muted-foreground border-border"></div>'),
        script("export const base = 'bg-surface text-foreground hover:bg-primary/90'"),
      ],
      invalid: [
        invalid(template('<div class="p-4 bg-blue-500"></div>'), 'paletteClass'),
        invalid(template('<div :class="[\'hover:text-gray-700\']"></div>'), 'paletteClass'),
        invalid(template('<div class="bg-black/2.5"></div>'), 'paletteClass'),
        invalid(script("export const base = 'text-white'"), 'paletteClass'),
        invalid(script("export const base = 'drop-shadow-red-500'"), 'paletteClass'),
        invalid(script("export const base = 'text-shadow-blue-500'"), 'paletteClass'),
        invalid(sfcScript("const tone = 'border-red-500/50'"), 'paletteClass'),
      ],
    })
  })

  describe('arbitrary values', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div class="w-full data-[state=open]:bg-surface [&>svg]:size-4"></div>'),
        template('<div data-x="a-[0]"></div>'),
        script("export const base = 'aria-[invalid=true]:border-danger w-full'"),
      ],
      invalid: [
        invalid(template('<div class="w-[13rem]"></div>'), 'arbitraryValue'),
        invalid(template('<div class="bg-[#fff]"></div>'), 'arbitraryValue'),
        invalid(template('<div :class="\'hover:w-(--width)\'"></div>'), 'arbitraryValue'),
        invalid(template('<div class="bg-primary/[0.5]"></div>'), 'arbitraryValue'),
        invalid(script("export const base = 'bg-[--brand]'"), 'arbitraryValue'),
        invalid(
          script("export const base = 'bg-(color:--brand) text-(length:--x)'"),
          'arbitraryValue',
        ),
        invalid(script('export const width = (n) => `w-[${n}px]`'), 'arbitraryValue'),
        invalid(sfcScript("const base = '[mask-type:luminance]'"), 'arbitraryValue'),
      ],
    })
  })

  describe('raw token references', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div style="color: var(--h-primary)"></div>'),
        script("export const fill = 'var(--h-primary-foreground)'"),
      ],
      invalid: [
        invalid(template('<div style="color: var(--h-raw-blue-500)"></div>'), 'rawToken'),
        invalid(template('<div :style="{ color: \'var(--h-raw-gray-50)\' }"></div>'), 'rawToken'),
        invalid(script("export const fill = 'var(--h-raw-gray-50)'"), 'rawToken'),
        invalid(sfcScript("const name = '--h-raw-red-600'"), 'rawToken'),
      ],
    })
  })

  describe('dark variant', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div class="text-foreground" data-mode="dark"></div>'),
        script("export const mode = 'dark'"),
        sfcScript("const props = withDefaults(defineProps(), { themeLabel: 'Theme dark:light' })"),
      ],
      invalid: [
        invalid(template('<div class="dark:bg-surface"></div>'), 'darkVariant'),
        invalid(template('<div :class="\'md:dark:text-foreground\'"></div>'), 'darkVariant'),
        invalid(template('<div class="[.dark_&]:bg-surface"></div>'), 'darkVariant'),
        invalid(script("export const base = 'bg-surface dark:bg-surface-raised'"), 'darkVariant'),
        invalid(script("export const base = 'not-dark:bg-muted'"), 'darkVariant'),
        invalid(script("export const base = 'group-[.dark]:text-foreground'"), 'darkVariant'),
        invalid(sfcScript("const base = 'hover:dark:bg-muted'"), 'darkVariant'),
      ],
    })
  })

  describe('length literals', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<div class="p-4 gap-2 h-control-md"></div>'),
        script("export const base = 'px-2 py-0.5 gap-gap-md'"),
      ],
      invalid: [
        invalid(template('<div style="width: 13px"></div>'), 'rawLength'),
        invalid(template('<div style="width: 13PX"></div>'), 'rawLength'),
        invalid(template('<div :style="{ height: \'1.5rem\' }"></div>'), 'rawLength'),
        invalid(template('<div :style="{ width: `${size}rem` }"></div>'), 'rawLength'),
        invalid(script("export const width = '320px'"), 'rawLength'),
        invalid(script('export const width = (n) => `${n}px`'), 'rawLength'),
        invalid(script("export const width = (n) => n + 'px'"), 'rawLength'),
        invalid(sfcScript("const gap = '0.25rem'"), 'rawLength'),
      ],
    })
  })
})

describe('no-reka-outside-ui', () => {
  const rule = plugin.rules['no-reka-outside-ui']
  const typescript = { languageOptions: { parser: ts.parser } }
  tester.run('no-reka-outside-ui', rule, {
    valid: [
      { code: "import { DialogRoot } from 'reka-ui'", filename: 'registry/ui/dialog/dialog.ts' },
      {
        code: "<script setup>\nimport { DialogRoot } from 'reka-ui'\n</script>",
        filename: 'registry/ui/dialog/Dialog.vue',
      },
      { code: "import { cn } from '../utils'", filename: 'registry/blocks/login/login.ts' },
    ],
    invalid: [
      {
        code: "<script setup>\nimport { DialogRoot } from 'reka-ui'\n</script>",
        filename: 'registry/blocks/login/LoginForm.vue',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        code: "export { Primitive } from 'reka-ui'",
        filename: 'registry/lib/utils/index.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        code: "export const load = () => import('reka-ui/date')",
        filename: 'registry/layouts/app-shell/load.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        code: 'export const load = () => import(`reka-ui`)',
        filename: 'registry/layouts/app-shell/load.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        code: "const reka = require('reka-ui')\nexport { reka }",
        filename: 'registry/lib/utils/index.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        ...typescript,
        code: "export type Props = import('reka-ui').DialogRootProps",
        filename: 'registry/blocks/login/types.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        ...typescript,
        code: "import reka = require('reka-ui')\nexport { reka }",
        filename: 'registry/blocks/login/legacy.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
      {
        code: "import { DialogRoot } from 'reka-ui'\nexport { DialogRoot }",
        filename: '/work/registry/ui/heart-ui/registry/blocks/login/login.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
    ],
  })
})

describe('no-raw-values in context', () => {
  describe('class-list attributes and props', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [template('<RouterLink active-class="bg-primary text-primary-foreground" />')],
      invalid: [
        invalid(template('<RouterLink active-class="text-blue-500" />'), 'paletteClass'),
        invalid(template('<Transition enter-active-class="duration-[200ms]" />'), 'arbitraryValue'),
        invalid(template('<X :content-class="\'dark:bg-muted\'" />'), 'darkVariant'),
        invalid(template('<X contentClass="bg-red-500" />'), 'paletteClass'),
      ],
    })
  })

  describe('values behind ternaries, defaults and TypeScript wrappers', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template("<a :href=\"on ? '#add' : '#bed'\">Add</a>"),
        template('<RouterLink :to="{ hash: \'#add\' }" />'),
        sfcScript("defineProps({ closeLabel: { type: String, default: 'Theme dark:light' } })"),
        sfcScript("const labels = { closeLabel: on ? 'Close: red' : 'Close' }"),
      ],
      invalid: [
        invalid(
          template("<svg><rect :fill=\"on ? 'red' : 'blue'\" /></svg>"),
          'rawColor',
          'rawColor',
        ),
        invalid(template('<svg><rect :stroke="color ?? \'black\'" /></svg>'), 'rawColor'),
        invalid(template('<Icon backgroundColor="red" />'), 'rawColor'),
        invalid(template('<Icon :stopColor="\'red\'" />'), 'rawColor'),
        invalid(template('<svg FILL="red"></svg>'), 'rawColor'),
        invalid(
          {
            code: "export const s = { color: 'red' as const }",
            filename: tsFile,
            languageOptions: { parser: ts.parser },
          },
          'rawColor',
        ),
        invalid(script("export function paint(el) { el.setAttribute('fill', 'red') }"), 'rawColor'),
      ],
    })
  })

  describe('near misses', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        template('<svg><rect fill="url(\'#fade\')" /></svg>'),
        script('export const mask = \'url("#fade")\''),
        script("export const route = '/docs/[slug]'"),
        script("export const route = '/users/(id)'"),
        script("export const map = { 'a-[0]': 1 }"),
        script("export const base = (b) => b + 'px-4'"),
        script("export const base = 'peer-[.darker]:bg-muted data-[variant=darkened]:bg-muted'"),
        script('export const id = (p) => `#${p}add`'),
      ],
      invalid: [
        invalid(script("export const base = '[[data-theme=dark]_&]:bg-muted'"), 'darkVariant'),
        invalid(script("export const mix = 'color-mix(in srgb, red 50%, blue)'"), 'rawColor'),
        invalid(script("export const swap = 'light-dark(white, black)'"), 'darkVariant'),
        invalid(script("export const style = { filter: 'drop-shadow(0 0 0 red)' }"), 'rawColor'),
      ],
    })
  })
})

describe('no-reka-outside-ui by path', () => {
  const rule = plugin.rules['no-reka-outside-ui']
  tester.run('no-reka-outside-ui', rule, {
    valid: [
      {
        code: "import { DialogRoot } from 'reka-ui'\nexport { DialogRoot }",
        filename: '/elsewhere/checkout/registry/ui/dialog/dialog.ts',
      },
    ],
    invalid: [
      {
        code: 'export const load = (m) => import(`reka-ui/${m}`)',
        filename: 'registry/blocks/login/load.ts',
        errors: [{ messageId: 'rekaOutsideUi' }],
      },
    ],
  })
})

describe('no-raw-values class maps and nearest names', () => {
  describe('object keys in class contexts', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        script("export const map = { 'a-[0]': 1 }"),
        template('<div :class="{ \'bg-primary\': on }"></div>'),
      ],
      invalid: [
        invalid(template('<div :class="{ \'bg-red-500\': on }"></div>'), 'paletteClass'),
        invalid(template('<div :class="[{ \'dark:bg-muted\': on }]"></div>'), 'darkVariant'),
        invalid(script("export const c = (on) => cn({ 'w-[13px]': on })"), 'arbitraryValue'),
        invalid(template('<RouterLink :activeClass="\'bg-red-500\'" />'), 'paletteClass'),
        invalid(template('<div :ui="{ root: \'bg-red-500\' }"></div>'), 'paletteClass'),
        invalid(template('<X className="bg-red-500" />'), 'paletteClass'),
        invalid(template('<X :enterActiveClasses="\'bg-red-500\'" />'), 'paletteClass'),
      ],
    })
  })

  describe('only the nearest name decides', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [
        sfcScript("defineProps({ closeLabel: { type: String, default: 'Close: red' } })"),
        script('export const sizeLabel = (n) => `${n}px wide`'),
        script("export const widthLabel = (w) => w + 'px'"),
        script(
          "export const style = { color: 'color-mix(in oklab, var(--h-primary) 50%, transparent)' }",
        ),
        script("export const r = 'docs/[slug]'"),
        script("export const base = 'data-[variant=dark]:bg-foreground'"),
      ],
      invalid: [
        invalid(
          script("export const v = cva('p-2', { variants: { part: { label: 'text-blue-500' } } })"),
          'paletteClass',
        ),
        invalid(script("export const label = 'bg-red-500'"), 'paletteClass'),
        invalid(
          script("export const g = { from: '#ffffff', to: '#000000' }"),
          'rawColor',
          'rawColor',
        ),
        invalid(script("export const base = 'group-dark:bg-muted'"), 'darkVariant'),
        invalid(script("export const base = 'peer-dark:text-foreground'"), 'darkVariant'),
        invalid(
          script("export const base = '[@media(prefers-color-scheme:dark)]:bg-muted'"),
          'darkVariant',
        ),
        invalid(
          script("export const mix = 'color-mix(in srgb, var(--h-primary) 50%, red)'"),
          'rawColor',
        ),
        invalid(script('export const w = (n) => n + `px`'), 'rawLength'),
      ],
    })
  })

  describe('module paths', () => {
    tester.run('no-raw-values', noRawValues, {
      valid: [script("const m = require('./w-[13px]')\nexport { m }")],
      invalid: [],
    })
  })
})

describe('no-raw-values closing fixes', () => {
  const typescript = { languageOptions: { parser: ts.parser } }
  tester.run('no-raw-values', noRawValues, {
    valid: [
      { ...typescript, code: "export type P = import('./12px').P", filename: tsFile },
      { ...typescript, code: "declare module './12px' {}", filename: tsFile },
      script("export const sizeLabel = (n) => n + 'px' + ' wide'"),
      script("export const sizeLabel = (n) => 'Max 12px, now ' + n"),
      sfcScript("defineProps({ href: { type: String, default: '#add' } })"),
      template('<RouterLink :to="{ params: { id: \'#abc\' } }" />'),
      script("export const r = 'blog-posts/[slug]'"),
    ],
    invalid: [
      invalid(script("export const base = 'group-dark/item:bg-primary'"), 'darkVariant'),
      invalid(script("export const rootClass = { 'bg-red-500': true }"), 'paletteClass'),
      invalid(template('<X :item-props="{ class: \'bg-red-500\' }" />'), 'paletteClass'),
      invalid(template('<X :pt="{ root: { class: \'w-[13px]\' } }" />'), 'arbitraryValue'),
      invalid(script("export const c = h('div', { class: { 'bg-red-500': on } })"), 'paletteClass'),
    ],
  })
})
