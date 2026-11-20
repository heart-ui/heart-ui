// Type-checks the `vue` examples under `## Usage` and `## Do` in each item's `<name>.md` against
// the registry, so a spec can't show a prop, event or component that doesn't exist
// (docs/conventions.md, Docs site). `## Do not` examples are mistakes on purpose and are skipped.
// Usage: node scripts/spec-examples.ts [--item <name>] [--md <file>...] [--raw]
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileTemplate, parse } from 'vue/compiler-sfc'
import { type ApiSnapshot, itemExports } from './api-snapshot.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = join(repo, 'registry')
const checked = new Set(['Usage', 'Do'])

/** Where each kind's items land in a project (docs/registry.md, Project config). */
export const kindAliases: Record<string, string> = {
  ui: '@/components/ui',
  blocks: '@/components/blocks',
  layouts: '@/layouts',
  lib: '@/lib',
}

class ExamplesError extends Error {}

/** One `vue` block of a spec, and where it sits in the Markdown. */
export interface Example {
  /** The Markdown file, relative to the repo. */
  file: string
  section: string
  /** The 1-based line of the block's first code line. */
  line: number
  code: string
}

/**
 * The `vue` blocks under the checked headings of one spec's Markdown. Every fence is tracked, so
 * a heading inside a code block doesn't change the section; a fence may be indented (in a list)
 * and carry an info string (```` ```vue{2} ````).
 */
export function examples(markdown: string, file: string): Example[] {
  const found: Example[] = []
  const lines = markdown.split('\n')
  let section = ''
  for (let at = 0; at < lines.length; at++) {
    const text = lines[at] ?? ''
    const heading = /^## (.+?)\s*$/.exec(text)
    if (heading) {
      section = heading[1] ?? ''
      continue
    }
    const fence = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(text)
    if (!fence) continue
    const [, indent = '', marks = '', info = ''] = fence
    // A close is the same character, at least as long, with nothing after it.
    const closing = new RegExp(`^\\s*\\${marks[0]}{${marks.length},}\\s*$`)
    const close = lines.findIndex((next, index) => index > at && closing.test(next))
    const end = close < 0 ? lines.length : close
    if (/^vue\b/.test(info.trim()) && checked.has(section)) {
      const code = lines
        .slice(at + 1, end)
        .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
        .join('\n')
      found.push({ file, section, line: at + 2, code })
    }
    at = end
  }
  return found
}

// A registry component as the check needs it: the import that brings it in; whether a native
// field takes its `$attrs` (so form attributes reach it); the attributes its code reads itself
// (`attrs.required`); and the props and events it declares, which are never fallthrough.
interface RegistryComponent {
  from: string
  formControl: boolean
  reads: Set<string>
  declared: Set<string>
}

const camelize = (name: string) => name.replace(/-(\w)/g, (_, char: string) => char.toUpperCase())

// The declared props and events (`onClick` form) of one component, from its item's snapshot.
function declaredApi(itemDir: string, name: string, component: string): Set<string> {
  const path = join(itemDir, `${name}.api.json`)
  if (!existsSync(path)) return new Set()
  const snapshot = JSON.parse(readFileSync(path, 'utf8')) as ApiSnapshot
  const api = snapshot.components.find((entry) => entry.name === component)
  return new Set([
    ...(api?.props.map((prop) => prop.name) ?? []),
    ...(api?.events.map(
      (event) => `on${event.name[0]?.toUpperCase() ?? ''}${event.name.slice(1)}`,
    ) ?? []),
  ])
}

// Each component a registry item exports: the `.vue` re-exports, and a `lib` item's capitalised
// value exports (`Icon`).
function registryComponents(): Map<string, RegistryComponent> {
  const components = new Map<string, RegistryComponent>()
  for (const [kind, alias] of Object.entries(kindAliases)) {
    const dir = join(registry, kind)
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const itemDir = join(dir, name)
      for (const { name: component, file } of itemExports(itemDir)) {
        const source = readFileSync(join(itemDir, file), 'utf8')
        const reads = [...source.matchAll(/\battrs(?:\.(\w+)|\[['"]([\w-]+)['"]\])/g)].map(
          (match) => match[1] ?? match[2]!,
        )
        components.set(component, {
          from: `${alias}/${name}`,
          formControl: /<(?:input|textarea|select)\b[^>]*v-bind="\$attrs"/.test(source),
          reads: new Set(reads),
          declared: declaredApi(itemDir, name, component),
        })
      }
      const index = join(itemDir, 'index.ts')
      if (kind !== 'lib' || !existsSync(index)) continue
      for (const list of readFileSync(index, 'utf8').matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
        for (const part of (list[1] ?? '').split(',')) {
          const exported = /^\s*(?!type\s)(?:\w+\s+as\s+)?([A-Z]\w*)\s*$/.exec(part)?.[1]
          if (exported) {
            components.set(exported, {
              from: `${alias}/${name}`,
              formControl: false,
              reads: new Set(),
              declared: new Set(),
            })
          }
        }
      }
    }
  }
  return components
}

// Components an example may show without importing them: the router's, Nuxt's and Vue's own.
const frameworkComponents = [
  'RouterView',
  'RouterLink',
  'NuxtLink',
  'NuxtPage',
  'NuxtLayout',
  'Transition',
  'TransitionGroup',
  'KeepAlive',
  'Teleport',
  'Suspense',
]

// What Vue passes through to a component's root element. Form attributes and events reach a
// native field only on a component that renders one; field state (`value`, `checked`,
// `selected`) is a component's own prop or `v-model`, never fallthrough.
const globalAttributes = new Set(
  (
    'accesskey autocapitalize autofocus contenteditable dir draggable enterkeyhint hidden id ' +
    'inert lang nonce popover role spellcheck tabindex title translate'
  ).split(' '),
)
const formAttributes = new Set(
  (
    'accept autocomplete capture cols dirname form formaction inputmode list max maxlength min ' +
    'minlength multiple name pattern placeholder readonly required rows size step type wrap'
  ).split(' '),
)
const elementEvents = new Set(
  (
    'click dblclick auxclick contextmenu mousedown mouseup mouseenter mouseleave mousemove ' +
    'mouseover mouseout pointerdown pointerup pointermove pointerenter pointerleave pointercancel ' +
    'keydown keyup keypress focus blur focusin focusout wheel scroll touchstart touchend ' +
    'touchmove touchcancel dragstart drag dragend dragenter dragleave dragover drop copy cut ' +
    'paste animationstart animationend transitionend'
  ).split(' '),
)
const formEvents = new Set(
  'input change select invalid compositionstart compositionupdate compositionend'.split(' '),
)

/** Whether an attribute or event (`onClick`) on a component falls through to its root element. */
export function isFallthrough(name: string, formControl: boolean) {
  if (/^(?:aria|data)-[\w-]+$/.test(name) || globalAttributes.has(name)) return true
  if (formControl && formAttributes.has(name)) return true
  const event = /^on([A-Z]\w*)$/.exec(name)?.[1]?.toLowerCase()
  if (event === undefined) return false
  return elementEvents.has(event) || (formControl && formEvents.has(event))
}

const pascal = (tag: string) =>
  tag
    .split('-')
    .map((part) => (part[0] ?? '').toUpperCase() + part.slice(1))
    .join('')

type TemplateProp = {
  type: number
  name: string
  arg?: { content?: string; isStatic?: boolean }
  loc: { start: { offset: number }; end: { offset: number } }
}
type TemplateNode = {
  type: number
  tag?: string
  props?: TemplateProp[]
  children?: TemplateNode[]
}

// The name Vue gives a component attribute or directive (`aria-label`, `:id` → `id`, `@click`
// → `onClick`); undefined for anything else (`v-model`, a dynamic `:[name]`).
function propName(prop: TemplateProp) {
  if (prop.type === 6) return prop.name
  const arg = prop.arg?.isStatic ? prop.arg.content : undefined
  if (!arg) return undefined
  if (prop.name === 'bind') return arg
  if (prop.name === 'on') return `on${arg[0]?.toUpperCase() ?? ''}${arg.slice(1)}`
  return undefined
}

/**
 * An example as a single-file component: its template with the attributes that fall through to
 * a component's root blanked out (they would hide the next unknown prop, since TypeScript reports
 * one unknown key per element), the registry components it uses imported, and every name it
 * reads from the page declared `any` (the spec leaves the page's own state out). Returns the file
 * and the line its template starts on.
 */
export function exampleComponent(example: Example, components: Map<string, RegistryComponent>) {
  // A whole component has a `<script>` or a bare `<template>` at the top level; a slot's
  // `<template #x>` sits inside a component and is fine.
  if (
    /^<script\b/m.test(example.code) ||
    /^<template(?:\s+lang="[^"]*")?\s*>/m.test(example.code)
  ) {
    throw new ExamplesError(
      `${example.file}:${example.line}: examples are template-only; leave out <script> and <template>`,
    )
  }
  const compiled = compileTemplate({
    source: example.code,
    filename: 'example.vue',
    id: 'example',
    compilerOptions: { prefixIdentifiers: true },
  })
  // The template as written (compileTemplate's own AST has v-if chains folded into branches).
  const wrapper = '<template>'
  const written = parse(`${wrapper}${example.code}\n</template>`).descriptor.template?.ast
  const blanked = example.code.split('')
  const visit = (node: TemplateNode) => {
    const component = node.type === 1 && node.tag ? components.get(pascal(node.tag)) : undefined
    for (const prop of component ? (node.props ?? []) : []) {
      const name = propName(prop)
      if (name === undefined || component!.declared.has(camelize(name))) continue
      const passes =
        isFallthrough(name, component!.formControl) ||
        component!.reads.has(name) ||
        component!.reads.has(camelize(name))
      if (!passes) continue
      for (let at = prop.loc.start.offset; at < prop.loc.end.offset; at++) {
        const index = at - wrapper.length
        if (blanked[index] !== '\n') blanked[index] = ' '
      }
    }
    for (const child of node.children ?? []) visit(child)
  }
  if (written) visit(written as unknown as TemplateNode)
  const names = [
    ...new Set([...compiled.code.matchAll(/_ctx\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]!)),
  ]
  const tags = new Set([...example.code.matchAll(/<([A-Za-z][\w-]*)/g)].map((m) => pascal(m[1]!)))
  const imports = new Map<string, string[]>()
  for (const tag of tags) {
    const from = components.get(tag)?.from
    if (from) imports.set(from, [...(imports.get(from) ?? []), tag])
  }
  const script = [
    '<script setup lang="ts">',
    ...[...imports].map(([from, list]) => `import { ${list.sort().join(', ')} } from '${from}'`),
    ...names.filter((name) => !tags.has(name)).map((name) => `let ${name}: any`),
    ...frameworkComponents
      .filter((name) => tags.has(name))
      .map((name) => `const ${name}: any = null`),
    '</script>',
    '',
    '<template>',
  ]
  return {
    source: `${script.join('\n')}\n${blanked.join('')}\n</template>\n`,
    templateLine: script.length + 1,
  }
}

// Every spec Markdown in the registry.
function allSpecs(): string[] {
  return Object.keys(kindAliases).flatMap((kind) => {
    const dir = join(registry, kind)
    if (!existsSync(dir)) return []
    return readdirSync(dir)
      .map((name) => join(dir, name, `${name}.md`))
      .filter((path) => existsSync(path))
  })
}

/**
 * The specs an item's change can break: its own, and every spec whose examples use one of its
 * components. Throws when no item has that name.
 */
export function specFilesFor(item: string): string[] {
  const dir = Object.keys(kindAliases)
    .map((kind) => join(registry, kind, item))
    .find((path) => existsSync(join(path, 'item.json')))
  if (!dir) throw new ExamplesError(`no item named "${item}" under registry/`)
  const own = join(dir, `${item}.md`)
  const tags = itemExports(dir).map(({ name }) => name)
  return allSpecs().filter(
    (path) =>
      path === own ||
      (tags.length > 0 &&
        examples(readFileSync(path, 'utf8'), path).some((example) =>
          tags.some((tag) =>
            new RegExp(
              `<(?:${tag}|${tag.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()})[\\s/>]`,
            ).test(example.code),
          ),
        )),
  )
}

/** A generated component's example and the line its template starts on, by real path. */
export type Generated = Map<string, { example: Example; templateLine: number }>

/**
 * The example problems in vue-tsc's output, one line each. Strict mode also reports the
 * registry's own components (checked by `pnpm typecheck` already), and those are left out; any
 * other error, or a failure with no error at all (a missing binary, a crash), is the check
 * failing, never a pass.
 */
export function problemsFrom(
  output: string,
  status: number | null,
  generated: Generated,
  raw = false,
): string[] {
  const problems: string[] = []
  const unexplained: string[] = []
  const registryRoot = realpathSync(registry)
  let errors = 0
  for (const line of output.split('\n')) {
    if (!/\berror TS\d+:/.test(line)) continue
    errors++
    const match = /^(.+?\.vue)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(line)
    const absolute = match ? (isAbsolute(match[1]!) ? match[1]! : join(repo, match[1]!)) : ''
    const path = absolute && existsSync(absolute) ? realpathSync(absolute) : ''
    const source = generated.get(path)
    if (!match || !source) {
      // Strict mode flags the registry's own components, which `pnpm typecheck` checks already.
      // A module that doesn't resolve there under the generated config would loosen the types
      // the examples are checked against, so that is the check failing.
      const unresolved = new Set(['TS2305', 'TS2306', 'TS2307', 'TS2614', 'TS2724', 'TS7016'])
      const strictNoise =
        path.startsWith(registryRoot) && match !== null && !unresolved.has(match[4]!)
      if (!strictNoise) unexplained.push(line.trim())
      continue
    }
    const offset = Number(match[2]) - source.templateLine
    const header = offset < 0
    const at = source.example.line + (header ? 0 : offset)
    const text = raw ? `${match[4]} ${match[5]}` : message(match[5]!)
    problems.push(
      `${source.example.file}:${at}: ${text}${header ? ' (in the generated header)' : ''}`,
    )
  }
  if (unexplained.length > 0) {
    throw new ExamplesError(`vue-tsc failed:\n${unexplained.slice(0, 5).join('\n')}`)
  }
  if (status !== 0 && errors === 0) {
    const shown = output.trim().split('\n').slice(0, 5).join('\n')
    throw new ExamplesError(`vue-tsc failed (exit ${status ?? 'signal'}):\n${shown}`)
  }
  return problems
}

/** Type-checks the examples; returns one line per problem, `<file>:<line>: <message>`. */
export function checkExamples(markdownFiles: string[], raw = false): string[] {
  const components = registryComponents()
  const all = markdownFiles.flatMap((path) =>
    examples(readFileSync(path, 'utf8'), relative(repo, path)),
  )
  if (all.length === 0) return []
  mkdirSync(join(repo, 'dist'), { recursive: true })
  const work = join(repo, 'dist', `spec-examples-${process.pid}`)
  rmSync(work, { recursive: true, force: true })
  mkdirSync(work, { recursive: true })
  try {
    const generated: Generated = new Map()
    all.forEach((example, index) => {
      const { source, templateLine } = exampleComponent(example, components)
      const path = join(work, `Example${index}.vue`)
      writeFileSync(path, source)
      generated.set(realpathSync(path), { example, templateLine })
    })
    // Absolute targets, since `paths` here replaces the registry's own whole.
    const paths = Object.fromEntries(
      Object.entries(kindAliases).map(([kind, alias]) => [
        `${alias}/*`,
        [join(registry, kind, '*')],
      ]),
    )
    writeFileSync(
      join(work, 'tsconfig.json'),
      JSON.stringify({
        extends: join(registry, 'tsconfig.json'),
        compilerOptions: { paths },
        include: [join(work, '*.vue')],
        vueCompilerOptions: { strictTemplates: true },
      }),
    )
    const result = spawnSync(
      'pnpm',
      ['exec', 'vue-tsc', '-p', join(work, 'tsconfig.json'), '--noEmit', '--pretty', 'false'],
      { cwd: repo, encoding: 'utf8' },
    )
    if (result.error) throw new ExamplesError(`vue-tsc could not start (${result.error.message})`)
    return problemsFrom(`${result.stdout}${result.stderr}`, result.status, generated, raw)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

// TypeScript's wording, cut to what the spec author needs: the name, not the component's type.
function message(text: string) {
  const unknown = /may only specify known properties, and '+([^']+)'+ does not exist/.exec(
    text,
  )?.[1]
  if (unknown !== undefined) {
    const event = /^on([A-Z][\w:-]*)$/.exec(unknown)?.[1]
    return event
      ? `unknown event ${event[0]!.toLowerCase()}${event.slice(1)}`
      : `unknown prop ${unknown}`
  }
  const component = /^Property '([A-Z][\w$]*)' does not exist on type/.exec(text)?.[1]
  if (component) return `unknown component <${component}>`
  return text.length > 200 ? `${text.slice(0, 200)}…` : text
}

function options(args: string[]) {
  let item: string | undefined
  let raw = false
  const md: string[] = []
  for (let at = 0; at < args.length; at++) {
    const flag = args[at]
    if (flag === '--raw') raw = true
    else if (flag === '--item') {
      item = args[++at]
      if (!item || item.startsWith('--')) throw new ExamplesError('--item needs an item name')
    } else if (flag === '--md') {
      const file = args[++at]
      if (!file || file.startsWith('--')) throw new ExamplesError('--md needs a file')
      md.push(file)
    } else throw new ExamplesError(`unknown argument ${flag}; use [--item <name>] [--md <file>]`)
  }
  return { item, raw, md }
}

const entry = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : ''
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { item, raw, md } = options(process.argv.slice(2))
    if (item && md.length > 0) throw new ExamplesError('use --item or --md, not both')
    const files =
      md.length > 0
        ? md.map((file) => resolve(process.cwd(), file))
        : item
          ? specFilesFor(item)
          : allSpecs()
    const problems = checkExamples(files, raw)
    if (problems.length > 0) throw new ExamplesError(problems.join('\n'))
    process.stdout.write(`spec-examples: ${files.length} specs, every example type-checks\n`)
  } catch (error) {
    const text = error instanceof ExamplesError ? error.message : `failed: ${String(error)}`
    process.stderr.write(`spec-examples: ${text.split('\n').join('\nspec-examples: ')}\n`)
    process.exit(1)
  }
}
