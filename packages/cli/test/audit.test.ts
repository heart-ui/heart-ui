import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { run } from '../src/cli.ts'
import { capture } from './helpers/project.ts'

type Finding = { line: number; message: string }
type Check = { id: string; pass: boolean; findings: Finding[] }
type Report = { ok: boolean; files: { file: string; checks: Check[] }[] }

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

// Writes `files` into a fresh folder and returns it.
function project(files: Record<string, string>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-audit-')))
  roots.push(root)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

async function audit(files: Record<string, string>, args: string[], cwd = '.') {
  const root = project(files)
  const { io, out, err } = capture(join(root, cwd))
  const code = await run(['audit', ...args], io)
  return { code, out: out(), err: err() }
}

// The checks of `path` (the only file, `Screen.vue`, by default), by id.
async function checks(
  files: Record<string, string> | string,
  path = 'Screen.vue',
): Promise<Record<string, Check>> {
  const all = typeof files === 'string' ? { [path]: files } : files
  const { out, err } = await audit(all, ['--json', path])
  expect(err).toBe('')
  const report = JSON.parse(out) as Report
  return Object.fromEntries(report.files[0]!.checks.map((check) => [check.id, check]))
}

const imports = `<script setup lang="ts">
import { ListFilters } from '@/layouts/list-filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
const { data: customers, pending, error } = useCustomers()
</script>
`

// A screen that passes all eight checks; `data` replaces its data region.
function screen(data = '', extra = '', root = 'ListFilters'): string {
  return `${imports}
<template>
  <${root}>
    <template #header>
      <h1 class="text-2xl text-foreground">Customers</h1>
      <Button variant="primary">Add customer</Button>
    </template>
    <template #filters>
      <Label for="search">Search</Label>
      <Input id="search" v-model="query" />
    </template>
    <template #data>
      ${
        data ||
        `<div v-if="pending" aria-busy="true">Loading customers</div>
      <ErrorState v-else-if="error" />
      <NoResultsState v-else-if="!customers.length" />
      <ul v-else class="flex flex-col gap-gap-sm">
        <li v-for="customer in customers" :key="customer.id">{{ customer.name }}</li>
      </ul>`
      }
      ${extra}
    </template>
  </${root}>
</template>
`
}

// The 1-based line of the first `needle` in `source`.
function lineOf(source: string, needle: string): number {
  return source.slice(0, source.indexOf(needle)).split('\n').length
}

const ids = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']

describe('audit', () => {
  it('passes every check on the reference screen', async () => {
    const result = await checks(screen())
    expect(Object.keys(result)).toEqual(ids)
    for (const id of ids) expect(result[id], id).toMatchObject({ pass: true, findings: [] })
  })

  it('AC-001 A1 layout root', async () => {
    expect((await checks(screen())).A1?.pass).toBe(true)
    expect((await checks(screen('', '', 'list-filters'))).A1?.pass).toBe(true)
    const divRoot = screen('', '', 'div')
    const failing = (await checks(divRoot)).A1!
    expect(failing.pass).toBe(false)
    expect(failing.findings[0]?.line).toBe(lineOf(divRoot, '<div>'))
    expect(failing.findings[0]?.message).toMatch(/layout/)

    const page = `<template>\n  <div><h1>Order</h1></div>\n</template>\n`
    const shell = `<template>\n  <AppShell><slot /></AppShell>\n</template>\n`
    const under = await checks(
      { 'app/pages/orders/[id].vue': page, 'app/layouts/default.vue': shell },
      'app/pages/orders/[id].vue',
    )
    expect(under.A1?.pass).toBe(true)

    const parent = `<template>\n  <ListDetail><NuxtPage /></ListDetail>\n</template>\n`
    const nested = await checks(
      { 'app/pages/orders/[id].vue': page, 'app/pages/orders.vue': parent },
      'app/pages/orders/[id].vue',
    )
    expect(nested.A1?.pass).toBe(true)

    const noLayout = `<script setup lang="ts">\ndefinePageMeta({ layout: false })\n</script>\n${page}`
    const out = await checks(
      { 'app/pages/orders/[id].vue': noLayout, 'app/layouts/default.vue': shell },
      'app/pages/orders/[id].vue',
    )
    expect(out.A1?.pass).toBe(false)
    const plain = await checks({ 'app/pages/orders/[id].vue': page }, 'app/pages/orders/[id].vue')
    expect(plain.A1?.pass).toBe(false)

    for (const tag of ['dashboard', 'settings', 'auth']) {
      expect((await checks(screen('', '', tag))).A1?.pass, tag).toBe(true)
    }

    const nestedMeta = `<script setup lang="ts">\ndefinePageMeta({ meta: { x: 1 }, layout: false })\n</script>\n${page}`
    const meta = await checks(
      { 'app/pages/orders/[id].vue': nestedMeta, 'app/layouts/default.vue': shell },
      'app/pages/orders/[id].vue',
    )
    expect(meta.A1?.pass).toBe(false)

    const component = (await checks(screen('', '', 'div'), 'src/components/Table.vue')).A1!
    expect(component.findings[0]?.message).not.toMatch(/parent route/)
    expect(plain.A1?.findings[0]?.message).toMatch(/parent route/)
  })

  it('AC-001 A1 reads parent routes only inside the project', async () => {
    const page = `<template>\n  <div><h1>Order</h1></div>\n</template>\n`
    const shell = `<template>\n  <AppShell><slot /></AppShell>\n</template>\n`
    // A `pages` folder above the working directory is not this project's.
    const above = await audit(
      { 'pages/proj/src/Foo.vue': page, 'pages/proj.vue': shell, 'layouts/default.vue': shell },
      ['--json', 'src/Foo.vue'],
      'pages/proj',
    )
    expect((JSON.parse(above.out) as Report).files[0]?.checks[0]?.pass).toBe(false)

    const root = project({ 'app/pages/index.vue': page, 'outside/shell.vue': shell })
    mkdirSync(join(root, 'app/layouts'))
    symlinkSync(join(root, 'outside/shell.vue'), join(root, 'app/layouts/default.vue'))
    symlinkSync('/dev/zero', join(root, 'app/pages.vue'))
    const { io, out } = capture(join(root, 'app'))
    expect(await run(['audit', '--json', 'pages/index.vue'], io)).toBe(1)
    expect((JSON.parse(out()) as Report).files[0]?.checks[0]?.pass).toBe(false)
  })

  it('AC-002 A2 raw values', async () => {
    const clean = screen(
      '',
      `<a href="#main" class="p-page-px">Skip</a>
      <Pager next-label="Page 2 of 16px" />`,
    )
    expect((await checks(clean)).A2?.pass).toBe(true)

    for (const raw of [
      '<p class="bg-red-500">x</p>',
      '<p class="w-[13px]">x</p>',
      '<p style="padding: 16px">x</p>',
      `<p :class="['text-blue-600']">x</p>`,
    ]) {
      const source = screen('', raw)
      const result = (await checks(source)).A2!
      expect(result.pass, raw).toBe(false)
      expect(result.findings[0]?.line, raw).toBe(lineOf(source, raw))
    }
    const styled = `${screen()}\n<style scoped>\n.note {\n  color: #fff;\n}\n</style>\n`
    const result = (await checks(styled)).A2!
    expect(result.pass).toBe(false)
    expect(result.findings[0]?.line).toBe(lineOf(styled, 'color: #fff'))
    const script = (await checks(`const tone = 'bg-rose-500'\n`, 'tone.ts')).A2!
    expect(script.pass).toBe(false)

    const named = (await checks(screen('', `<p :style="{ color: 'red' }">x</p>`))).A2!
    expect(named.pass).toBe(false)
    const variable = (await checks(`const color = 'red'\nel.style.background = 'blue'\n`, 'c.ts'))
      .A2!
    expect(variable.findings).toHaveLength(2)
    const words = (await checks(`const tone = 'red'\n`, 'words.ts')).A2!
    expect(words.pass).toBe(true)

    const label = (await checks('const sizeLabel = (n) => `${n}px wide`\n', 'label.ts')).A2!
    expect(label.pass).toBe(true)
    const arbitrary = (await checks('const c = `w-[${n}px]`\n', 'w.ts')).A2!
    expect(arbitrary.findings).toHaveLength(1)
  })

  it('AC-003 A3 bare HTML', async () => {
    const clean = screen('', '<input type="hidden" name="token" value="x" />')
    expect((await checks(clean)).A3?.pass).toBe(true)
    const source = screen(
      '',
      '<button type="button">Export</button>\n      <table><tr><td>1</td></tr></table>',
    )
    const result = (await checks(source)).A3!
    expect(result.pass).toBe(false)
    expect(result.findings.map((finding) => finding.line)).toEqual([
      lineOf(source, '<button'),
      lineOf(source, '<table'),
    ])
    expect(result.findings[0]?.message).toMatch(/<button>.*Button/)
  })

  it('AC-004 A4 one primary', async () => {
    const twice = screen('', '<Button variant="primary">Import</Button>')
    const two = (await checks(twice)).A4!
    expect(two.pass).toBe(false)
    expect(two.findings[0]?.line).toBe(lineOf(twice, 'Import'))

    const bound = (await checks(screen('', `<Button :variant="'primary'">Import</Button>`))).A4!
    expect(bound.pass).toBe(false)

    const dialog = `<Dialog>
        <DialogContent>
          <Button variant="primary">Save</Button>
        </DialogContent>
      </Dialog>`
    expect((await checks(screen('', dialog))).A4?.pass).toBe(true)

    const page = screen().replace(
      '<Button variant="primary">Add customer</Button>',
      `<Button v-if="mode === 'edit'" variant="primary">Save</Button>
      <Button v-else variant="primary">Create</Button>`,
    )
    expect((await checks(page)).A4?.pass).toBe(true)

    const third = screen().replace(
      '<Button variant="primary">Add customer</Button>',
      `<Button v-if="a" variant="primary">One</Button>
      <Button v-else variant="primary">Two</Button>
      <Button variant="primary">Three</Button>`,
    )
    expect((await checks(third)).A4?.findings[0]?.line).toBe(lineOf(third, 'Three'))
  })

  it('AC-005 A5 states', async () => {
    const bare = `<ul>
        <li v-for="customer in customers" :key="customer.id">{{ customer.name }}</li>
      </ul>`
    const source = screen(bare)
    const result = (await checks(source)).A5!
    expect(result.pass).toBe(false)
    expect(result.findings[0]?.line).toBe(lineOf(source, '<li v-for'))
    expect(result.findings[0]?.message).toMatch(/no loading, error or empty state/)

    const partial = `<p v-if="pending" aria-busy="true">Loading</p>
      <ErrorState v-else-if="error" />
      ${bare}`
    const onlyEmpty = (await checks(screen(partial))).A5!
    expect(onlyEmpty.findings[0]?.message).toMatch(/no empty state/)

    expect((await checks(screen())).A5?.pass).toBe(true)
    const skeleton = `<div v-for="n in 5" :key="n" class="h-control-md bg-muted" />`
    expect((await checks(screen(skeleton))).A5?.pass).toBe(true)

    const fixed = `<script setup lang="ts">
const sizes: readonly string[] = ['sm', 'md'] as const
const { data: actions } = useActions()
</script>
<template>
  <ListFilters>
    <p v-for="size in sizes" :key="size">{{ size }}</p>
    <Button v-for="action in actions" :key="action.id">{{ action.name }}</Button>
  </ListFilters>
</template>
`
    expect((await checks(fixed)).A5?.pass).toBe(true)

    const unrelated = `<p v-if="error">Couldn't load.</p>
      <p v-else-if="!customers.length">None yet.</p>
      <img src="/logo.svg" alt="" loading="lazy" />
      <Button :loading="saving">Save</Button>
      <p aria-busy="false">Idle</p>
      ${bare}`
    const noLoading = (await checks(screen(unrelated))).A5!
    expect(noLoading.findings[0]?.message).toMatch(/no loading state/)
    const onTable = `<Table :loading="pending" :error="failed"><TableRow v-if="!rows.length" /></Table>`
    expect((await checks(screen(onTable))).A5?.pass).toBe(true)

    for (const wrapper of ['Tabs><TabsContent value="a"', 'SidebarInset']) {
      const tag = wrapper.split(/[ >]/)[0]
      const close = wrapper.includes('TabsContent') ? '</TabsContent></Tabs>' : `</${tag}>`
      const wrapped = (await checks(screen(`<${wrapper}>${bare}${close}`))).A5!
      expect(wrapped.pass, wrapper).toBe(false)
    }

    const flags = `<p v-if="isLoading">Loading</p>
      <p v-else-if="hasError">Couldn't load.</p>
      <p v-else-if="noResults">None.</p>
      ${bare}`
    expect((await checks(screen(flags))).A5?.pass).toBe(true)
  })

  it('AC-006 A6 reka-ui', async () => {
    const vue = screen().replace(
      "import { Label } from '@/components/ui/label'",
      "import { Label } from '@/components/ui/label'\nimport { DialogRoot } from 'reka-ui'",
    )
    const result = (await checks(vue)).A6!
    expect(result.pass).toBe(false)
    expect(result.findings[0]?.line).toBe(lineOf(vue, "from 'reka-ui'"))

    const ts = (await checks(`export * from 'reka-ui/date'\n`, 'dates.ts')).A6!
    expect(ts.pass).toBe(false)
    const dynamic = (await checks(`const reka = await import("reka-ui")\n`, 'lazy.ts')).A6!
    expect(dynamic.pass).toBe(false)

    const comment = screen().replace(
      '<script setup lang="ts">',
      "<script setup lang=\"ts\">\n// Don't import { DialogRoot } from 'reka-ui' here.\n/* import 'reka-ui' */",
    )
    expect((await checks(comment)).A6?.pass).toBe(true)
  })

  it('AC-007 A7 names', async () => {
    const iconOnly = screen('', '<Button variant="ghost"><Icon name="dismiss" /></Button>')
    const icon = (await checks(iconOnly)).A7!
    expect(icon.pass).toBe(false)
    expect(icon.findings[0]?.line).toBe(lineOf(iconOnly, '<Button variant="ghost"'))

    const field = (await checks(screen('', '<Input id="note" />'))).A7!
    expect(field.pass).toBe(false)

    const named = `<Button variant="ghost" aria-label="Close"><Icon name="dismiss" /></Button>
      <Label>Note <Textarea v-model="note" /></Label>
      <Checkbox v-model="all">Select all</Checkbox>
      <Switch v-model="on" aria-label="Notify" />
      <DialogTrigger as-child><Button>Open</Button></DialogTrigger>
      <RouterLink to="/x">{{ customer.name }}</RouterLink>`
    expect((await checks(screen('', named))).A7?.pass).toBe(true)
  })

  it('AC-008 A8 nested modal', async () => {
    const nested = `<Dialog>
        <DialogContent>
          <ConfirmDialog title-label="Delete?" />
        </DialogContent>
      </Dialog>`
    const source = screen('', nested)
    const result = (await checks(source)).A8!
    expect(result.pass).toBe(false)
    expect(result.findings[0]?.line).toBe(lineOf(source, '<ConfirmDialog'))

    const siblings = `<Dialog><DialogContent>One</DialogContent></Dialog>
      <ConfirmDialog title-label="Delete?" />`
    expect((await checks(screen('', siblings))).A8?.pass).toBe(true)
  })

  it('AC-009 output and exit codes', async () => {
    const bad = screen('', '<button type="button">Export</button>')
    const failing = await audit({ 'Bad.vue': bad, 'Good.vue': screen() }, ['Bad.vue', 'Good.vue'])
    expect(failing.code).toBe(1)
    expect(failing.err).toBe('')
    const line = lineOf(bad, '<button')
    expect(failing.out).toContain(`Bad.vue:${line}  A3  `)
    expect(failing.out).not.toContain('Good.vue:')
    expect(failing.out.trimEnd().split('\n').at(-1)).toBe('1 failure in 1 of 2 files.')

    const clean = await audit({ 'src/Good.vue': screen() }, ['src/Good.vue'])
    expect(clean).toEqual({ code: 0, out: 'No failures in 1 file.\n', err: '' })

    const json = await audit({ 'Bad.vue': bad }, ['--json', 'Bad.vue'])
    expect(json.code).toBe(1)
    expect(json.out.trimEnd().split('\n')).toHaveLength(1)
    const report = JSON.parse(json.out) as Report
    expect(report.ok).toBe(false)
    expect(report.files[0]?.file).toBe('Bad.vue')
    expect(report.files[0]?.checks.map((check) => check.id)).toEqual(ids)
    expect(report.files[0]?.checks.find((check) => check.id === 'A3')).toMatchObject({
      pass: false,
      findings: [{ line, message: expect.any(String) }],
    })

    // Malformed source never crashes the scanner.
    const broken =
      '<template>\n  <ListFilters>\n    <div class="x\n    </span>\n<script>const s = "'
    const malformed = await audit({ 'Broken.vue': broken }, ['Broken.vue'])
    expect([0, 1]).toContain(malformed.code)
    expect(malformed.err).toBe('')

    for (const args of [[], ['Missing.vue'], ['notes.txt']]) {
      const usage = await audit({ 'notes.txt': 'hi' }, args)
      expect(usage.code, args.join(' ')).toBe(2)
      expect(usage.err, args.join(' ')).toMatch(/^heart-ui: [^\n]+\n$/)
    }

    const help = await audit({}, ['--help'])
    expect(help.out).toContain('heart-ui audit')

    const upper = await audit({ 'Page.VUE': bad }, ['--json', 'Page.VUE'])
    const a3 = (JSON.parse(upper.out) as Report).files[0]?.checks.find((c) => c.id === 'A3')
    expect(a3?.pass).toBe(false)
  })

  it('AC-009 hostile input stays bounded', async () => {
    const cases: Record<string, string> = {
      'Deep.vue': `<template>${'<div>'.repeat(20000)}</template>`,
      'deep.ts': `const s = ${'`${'.repeat(5000)}`,
      'Big.vue': `<template><div>${'x'.repeat(1_100_000)}</div></template>`,
    }
    for (const [name, text] of Object.entries(cases)) {
      const result = await audit({ [name]: text }, [name])
      expect(result.code, name).toBe(2)
      expect(result.err, name).toMatch(/^heart-ui: Can't audit [^\n]+\n$/)
    }

    const slow: Record<string, string> = {
      'comment.ts': `import /*${' '.repeat(200_000)}*/\n`,
      'imports.ts': 'import '.repeat(70_000),
      'Styles.vue': '<style></style>'.repeat(33_000),
      'Digits.vue': `<template><ListFilters /></template>\n<style>\n.a { width: ${'1'.repeat(200_000)} }\n</style>\n`,
      'Loops.vue': `<script setup lang="ts">\n${'const items: X\n'.repeat(20_000)}</script>\n<template><ListFilters>${'<p v-for="i in items" />'.repeat(5000)}</ListFilters></template>\n`,
      'Meta.vue': `<script setup lang="ts">\n${'definePageMeta({\n'.repeat(30_000)}</script>\n`,
    }
    for (const [name, text] of Object.entries(slow)) {
      const start = performance.now()
      const result = await audit({ [name]: text }, [name])
      expect(result.err, name).toBe('')
      expect(performance.now() - start, name).toBeLessThan(3000)
    }
  }, 60_000)

  it('AC-010 control characters', async () => {
    const esc = String.fromCharCode(0x1b)
    const bidi = String.fromCharCode(0x202e)
    const clean = (text: string) => !text.includes(esc) && !text.includes(bidi)
    const name = `Bad${esc}[2J${bidi}.vue`
    const bad = screen('', '<button type="button">Export</button>')
    const text = await audit({ [name]: bad }, [name])
    expect(text.out).toContain(`Bad[2J.vue:${lineOf(bad, '<button')}  A3`)
    expect(clean(text.out)).toBe(true)

    const json = await audit({ [name]: bad }, ['--json', name])
    expect(clean(json.out)).toBe(true)
    expect((JSON.parse(json.out) as Report).files[0]?.file).toBe(name)

    const tag = screen('', `<button${esc}[31m type="button">x</button>`)
    const tagged = await audit({ 'Tag.vue': tag }, ['Tag.vue'])
    expect(clean(tagged.out)).toBe(true)
  })
  it('AC-001 A1 reads Nuxt page meta and route folders', async () => {
    const page = (script = '') =>
      `${script ? `<script setup lang="ts">\n${script}\n</script>\n` : ''}<template>\n  <div>x</div>\n</template>\n`
    const shell = `<template>\n  <AppShell><slot /></AppShell>\n</template>\n`
    const bare = `<template>\n  <main><slot /></main>\n</template>\n`
    const a1 = async (files: Record<string, string>, path = 'app/pages/x.vue') =>
      (await checks(files, path)).A1!
    expect(
      (
        await a1({
          'app/pages/x.vue': page("definePageMeta({ title: 'Hi :)', layout: false })"),
          'app/layouts/default.vue': shell,
        })
      ).pass,
    ).toBe(false)
    expect(
      (
        await a1({
          'app/pages/x.vue': page("definePageMeta({ meta: { layout: 'bare' }, layout: false })"),
          'app/layouts/bare.vue': shell,
          'app/layouts/default.vue': shell,
        })
      ).pass,
    ).toBe(false)
    expect(
      (
        await a1({
          'app/pages/x.vue': page('definePageMeta({ layout: `admin` })'),
          'app/layouts/default.vue': shell,
          'app/layouts/admin.vue': bare,
        })
      ).pass,
    ).toBe(false)
    expect(
      (
        await a1({
          'app/pages/x.vue': page("definePageMeta({ layout: 'admin' })"),
          'app/layouts/admin.vue': shell,
        })
      ).pass,
    ).toBe(true)

    const cms = await a1(
      { 'app/pages/admin/pages/[id].vue': page(), 'app/layouts/default.vue': shell },
      'app/pages/admin/pages/[id].vue',
    )
    expect(cms.pass).toBe(true)

    const top = await a1({ 'app/pages/x.vue': page('definePageMeta({ layout: false })') })
    expect(top.findings[0]?.message).not.toMatch(/parent route|Nuxt layout/)
    const looked = await a1({ 'app/pages/x.vue': page() })
    expect(looked.findings[0]?.message).toMatch(/Nuxt layout/)
    expect(looked.findings[0]?.message).not.toMatch(/parent route/)
  })

  it('AC-002 A2 reads script strings like no-raw-values', async () => {
    const a2 = async (code: string) => (await checks(code, 'x.ts')).A2!.findings.length
    const vue = async (markup: string) => (await checks(screen('', markup))).A2!.findings.length
    // Allowed by the lint rule.
    expect(await vue(`<RouterLink :to="ok ? '#add' : '#fed'">x</RouterLink>`)).toBe(0)
    expect(await a2("const sizeLabel = big ? '16px wide' : 'small'\n")).toBe(0)
    expect(await a2("const sizeLabel = n + 'px wide'\n")).toBe(0)
    expect(await a2('const sizeLabel = (n: number): string => `${n}px wide`\n')).toBe(0)
    expect(await a2("const href = ok ? '#add' : '#bad'\n")).toBe(0)
    expect(await a2("defineProps({ nextLabel: { type: String, default: 'Page 16px' } })\n")).toBe(0)
    expect(await a2("state.color = 'red'\n")).toBe(0)
    expect(await vue(`<p @click="color = 'red'">x</p>`)).toBe(0)
    expect(await a2("type Size = '16px' | '24px'\n")).toBe(0)
    expect(await a2("defineProps<{ tone: 'bg-red-500' }>()\n")).toBe(0)
    expect(await a2("const map = { 'w-[1px]': 1 }\n")).toBe(0)
    // Reported by the lint rule.
    expect(await a2("const color = ok ? 'red' : 'blue'\n")).toBe(2)
    expect(await a2("const color = ['red']\n")).toBe(1)
    expect(await vue(`<p :style="{ color: on ? 'red' : 'blue' }">x</p>`)).toBe(2)
    expect(await a2("defineProps({ color: { type: String, default: 'red' } })\n")).toBe(1)
    expect(await a2("el.style.color = 'red'\n")).toBe(1)
    expect(await a2("const c = cn({ 'w-[1px]': on })\n")).toBe(1)
    expect(await vue(`<p :class="{ 'bg-red-500': on }">x</p>`)).toBe(1)
    expect(await a2("const width = n + 'px'\n")).toBe(1)
  })

  it('AC-005 A5 regions and state signals', async () => {
    const list = `<ul>
        <li v-for="d in data" :key="d.id">{{ d.name }}</li>
      </ul>`
    const busyElsewhere = screen(
      `<p v-if="error">Couldn't load.</p>
      <p v-else-if="!data.length">None.</p>
      ${list}`,
      '<Button :aria-busy="saving">Save</Button>',
    )
    expect((await checks(busyElsewhere)).A5?.findings[0]?.message).toMatch(/no loading state/)
    const busyFalse = screen(`<ErrorState v-if="error" /><NoResultsState v-else-if="!data.length" />
      <ul :aria-busy="false"><li v-for="d in data" :key="d.id">{{ d.name }}</li></ul>`)
    expect((await checks(busyFalse)).A5?.findings[0]?.message).toMatch(/no loading state/)
    const busyRegion =
      screen(`<ErrorState v-if="error" /><NoResultsState v-else-if="!data.length" />
      <ul :aria-busy="pending"><li v-for="d in data" :key="d.id">{{ d.name }}</li></ul>`)
    expect((await checks(busyRegion)).A5?.pass).toBe(true)

    const links = screen(
      '<NuxtLink v-for="order in orders" :key="order.id" :to="order.url">{{ order.name }}</NuxtLink>',
    )
    expect((await checks(links)).A5?.pass).toBe(false)

    const lower = screen(`<skeleton v-if="p" />
      <ErrorState v-else-if="failed" />
      <NoResultsState v-else-if="!data.length" />
      ${list}`)
    expect((await checks(lower)).A5?.pass).toBe(true)
  })

  it('AC-006 A6 finds a specifier after a long comment', async () => {
    const code = `import { Primitive } from /* ${'x'.repeat(60)} */ 'reka-ui'\n`
    expect((await checks(code, 'x.ts')).A6?.pass).toBe(false)
    const spaced = `import {\n  Primitive,\n} from\n${' '.repeat(60)}'reka-ui'\n`
    expect((await checks(spaced, 'y.ts')).A6?.pass).toBe(false)
  })

  it('AC-007 A7 resolves lowercase single-word components', async () => {
    expect((await checks(screen('', '<checkbox v-model="all" />'))).A7?.pass).toBe(false)
    expect((await checks(screen('', '<checkbox v-model="all">All</checkbox>'))).A7?.pass).toBe(true)
  })

  it('AC-009 long lines, chains, class lists and tag names stay bounded', async () => {
    const slow: Record<string, string> = {
      'OneLine.vue': `<script setup lang="ts">${'const a:'.repeat(60_000)}</script><template><ListFilters><p v-for="i in a" /></ListFilters></template>`,
      'Chain.vue': `<template><ListFilters><Button v-if="a" variant="primary" />${'<Button v-else-if="a" variant="primary" />'.repeat(11_000)}<Button variant="primary" /></ListFilters></template>`,
      'Classes.vue': `<template><ListFilters><p class="${'w-[1] '.repeat(80_000)}">x</p></ListFilters></template>`,
      'Tags.vue': `<template><nav>${`<${'a'.repeat(1500)}>`.repeat(250)}${'<p v-for="i in x" />'.repeat(5_000)}</nav></template>`,
    }
    for (const [name, text] of Object.entries(slow)) {
      const start = performance.now()
      const result = await audit({ [name]: text }, [name])
      expect(result.err, name).toBe('')
      expect(performance.now() - start, name).toBeLessThan(3000)
    }

    const root = project({})
    symlinkSync('/dev/zero', join(root, 'Zero.vue'))
    const { io, err } = capture(root)
    expect(await run(['audit', 'Zero.vue'], io)).toBe(2)
    expect(err()).toMatch(/^heart-ui: Can't audit Zero\.vue: [^\n]+\n$/)

    const dotted = `<script>${'İ'.repeat(200)}</script><template><ListFilters><button>x</button></ListFilters></template>`
    expect((await checks(dotted)).A3?.pass).toBe(false)
  }, 60_000)
  it('AC-002 A2 follows the lint rule through any expression', async () => {
    const a2 = async (code: string) => (await checks(code, 'x.ts')).A2!.findings.length
    const vue = async (markup: string) => (await checks(screen('', markup))).A2!.findings.length
    expect(await vue(`<a :href="mode === 'a' ? '#add' : '#bad'">x</a>`)).toBe(0)
    expect(await vue(`<a :href="!open ? '#add' : '#bad'">x</a>`)).toBe(0)
    expect(await a2("const s = { color: a === b ? 'red' : 'blue' }\n")).toBe(2)
    expect(await a2("const fooLabel = a === b ? 'Save 10px' : 'x'\n")).toBe(0)
    expect(await vue(`<p :class="n<2 ? 'bg-red-500' : 'p-2'">x</p>`)).toBe(1)
    expect(await a2("el.style.setProperty('color', 'red')\n")).toBe(1)
    expect(await a2("el.setAttribute('href', '#abc')\n")).toBe(0)
    expect(await a2("const { color = 'red' } = props\n")).toBe(1)
    expect(await a2("el.style['color'] = 'red'\n")).toBe(1)
    expect(await a2("function f(el: HTMLElement, size: '16px' | '24px') {}\n")).toBe(0)
    expect(await a2("type P = { size?: '16px' | '24px' }\n")).toBe(0)
    expect(await a2("interface P extends Q { size: '16px' }\n")).toBe(0)
    expect(await a2("function f(): '16px' { return x }\n")).toBe(0)
    expect(await a2("class A { size: '16px' = x }\n")).toBe(0)
    expect(await a2("const m = { ['bg-red-500']: 1 }\n")).toBe(0)
    const keys = Array.from({ length: 60 }, (_, k) => `'gap-gap-sm-${k}': a`).join(', ')
    expect(await vue(`<p :class="{ ${keys}, 'bg-red-500': on }">x</p>`)).toBe(1)
    const broken = (await checks('const = (\n', 'broken.ts')).A2!
    expect(broken.pass).toBe(false)
    expect(broken.findings[0]?.message).toMatch(/parse/)
  })

  it('AC-001 A1 reads definePageMeta as code', async () => {
    const page = (script: string) =>
      `<script setup lang="ts">\n${script}\n</script>\n<template>\n  <div>x</div>\n</template>\n`
    const shell = `<template>\n  <AppShell><slot /></AppShell>\n</template>\n`
    const bare = `<template>\n  <main><slot /></main>\n</template>\n`
    for (const script of [
      "definePageMeta({ 'layout': 'admin' })",
      "definePageMeta({ validate: (r) => /\\)/.test(r.path), layout: 'admin' })",
    ]) {
      const files = {
        'app/pages/x.vue': page(script),
        'app/layouts/admin.vue': shell,
        'app/layouts/default.vue': bare,
      }
      expect((await checks(files, 'app/pages/x.vue')).A1?.pass, script).toBe(true)
    }
    const noTemplate = (await checks("<script setup>\ndefineRender(() => h('div'))\n</script>\n"))
      .A1!
    expect(noTemplate.findings[0]?.message).toMatch(/^The file has no template/)
  })

  it('AC-009 crafted scripts stay bounded', async () => {
    const fill = (unit: string) => unit.repeat(Math.floor(500_000 / unit.length))
    const slow: Record<string, string> = {
      'templates.ts': fill("`${''}`;"),
      'arrows.ts': fill("x=>''"),
      'parens.ts': fill("(''"),
      'ternaries.ts': fill("a?'':"),
      'sums.ts': `const s = ${fill("'a' + ")}'a'\n`,
      'octal.ts': `${'01;'.repeat(85_000)}${'a<b;'.repeat(64_000)}`,
      'comments.ts': '/**/a<b;'.repeat(56_000),
      'nested.ts': `const o = ${'{a:'.repeat(1500)}{${"'b':'',".repeat(60_000)}}${'}'.repeat(1500)}\n`,
      'Mustaches.vue': `<template><ListFilters><p>${'{{(}}'.repeat(100_000)}</p></ListFilters></template>`,
      'Names.vue': `<template><ListFilters><p>${'{{a}}'.repeat(100_000)}</p></ListFilters></template>`,
    }
    for (const [name, text] of Object.entries(slow)) {
      const start = performance.now()
      const result = await audit({ [name]: text }, [name])
      expect(result.err, name).toMatch(/^(?:|heart-ui: Can't audit [^\n]+\n)$/)
      expect(result.err, name).not.toMatch(/nests deeper/)
      expect(performance.now() - start, name).toBeLessThan(3000)
    }
  }, 60_000)
  it('AC-002 A2 reads every template form the lint rule reads', async () => {
    const a2 = async (source: string, path = 'Screen.vue') =>
      (await checks(source, path)).A2!.findings.map((finding) => finding.message)
    const vue = (markup: string) => a2(screen('', markup))
    expect(await a2(`<template>{{ 'bg-red-500' }}</template>\n`)).toHaveLength(1)
    expect(
      await a2(
        "<script setup lang=\"ts\">\n@Component({ name: 'bg-red-500' }) class X {}\nclass A { accessor x = '12px' }\nimport defer * as ns from 'x'\n</script>\n<template><ListFilters /></template>\n",
      ),
    ).toHaveLength(2)
    expect(
      await a2(
        '<script setup lang="tsx">\nconst el = <div class="p-2" />\n</script>\n<template><ListFilters /></template>\n',
      ),
    ).toEqual([])
    expect(await vue(`<div :[name]="'bg-red-500'">x</div>`)).toHaveLength(1)
    expect(
      await vue('<div v-pre>{{ this is not js }}<span :class="\'bg-red-500\'" /></div>'),
    ).toEqual([])
    expect(await vue(`<div .style="{ color: 'red' }">x</div>`)).toHaveLength(1)
    expect(await vue('<div title="&#35;fff">x</div>')).toHaveLength(1)
    expect(await vue('<div :class="&quot;bg-red-500&quot;">x</div>')).toHaveLength(1)
    expect(await vue(`<Comp #default="{ cls = 'bg-red-500' }">x</Comp>`)).toHaveLength(1)
    expect(
      await vue(`<p v-for="({ a = 'bg-red-500' }) in rows" :key="a">{{ a }}</p>`),
    ).toHaveLength(1)
  })

  it('AC-005 A5 reads const arrays from the script tree', async () => {
    const fixed = `<script setup lang="ts">
const items: {
  label: string
}[] = [{ label: 'a' }]
</script>
<template>
  <ListFilters>
    <p v-for="i in items" :key="i.label">{{ i.label }}</p>
  </ListFilters>
</template>
`
    expect((await checks(fixed)).A5?.pass).toBe(true)
  })

  it('AC-001 A1 reads any layout value definePageMeta can hold', async () => {
    const page = (script: string) =>
      `<script setup lang="ts">\n${script}\n</script>\n<template>\n  <div>x</div>\n</template>\n`
    const shell = `<template>\n  <AppShell><slot /></AppShell>\n</template>\n`
    for (const script of [
      'definePageMeta({ layout: `admin` })',
      "definePageMeta({ layout: 'x', layout: 'admin' })",
    ]) {
      const files = { 'app/pages/x.vue': page(script), 'app/layouts/admin.vue': shell }
      expect((await checks(files, 'app/pages/x.vue')).A1?.pass, script).toBe(true)
    }
  })
  it('AC-002 A2 parses the script as written, not as the lexer reads it', async () => {
    const a2 = async (code: string, path: string) => (await checks(code, path)).A2!.findings
    expect(await a2('const link = <a href="x">https://example.com</a>\n', 'link.tsx')).toEqual([])
    const missed = await a2(
      'const el = (\n  <p>\n    see http://x <b className="bg-red-500" />\n  </p>\n)\n',
      'missed.tsx',
    )
    expect(missed.map((finding) => finding.message)).toEqual([
      'Tailwind palette class: use a semantic color utility such as bg-primary.',
    ])
    expect(await a2('function f(s: string) {\n  return /\\/*$/.test(s)\n}\n', 'regex.ts')).toEqual(
      [],
    )
  })
})
