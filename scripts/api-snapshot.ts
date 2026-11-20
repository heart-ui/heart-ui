// A registry item's component API, read from its `.vue` files with vue-component-meta: the
// docs build renders it into each page's tables, and `registry:api` commits it as
// `<name>.api.json` (docs/conventions.md, Docs site).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ComponentMeta, createChecker, type PropertyMetaSchema } from 'vue-component-meta'

/** What reads component meta: either of vue-component-meta's checkers. */
export type Checker = Pick<ReturnType<typeof createChecker>, 'getComponentMeta'>

export type ApiComponent = { name: string } & Pick<ComponentMeta, 'props' | 'slots' | 'events'>

/** A prop as the docs and the snapshot show it. `default` is the raw default from the types. */
export interface ApiProp {
  name: string
  type: string
  required: boolean
  default?: string
  boolean: boolean
  description: string
}
export interface ApiSlot {
  name: string
  description: string
}
export interface ApiEvent {
  name: string
  payload: string
  description: string
}

/** `<name>.api.json`: what users rely on, in source order. */
export interface ApiSnapshot {
  name: string
  version: string
  components: {
    name: string
    props: {
      name: string
      type: string
      required: boolean
      default?: string
      description?: string
    }[]
    slots: { name: string; description?: string }[]
    events: { name: string; payload: string; description?: string }[]
  }[]
}

/** A type checker over the registry, through its tsconfig: the path aliases decide the types. */
export function apiChecker(registry: string): Checker {
  const tsconfig = join(registry, 'tsconfig.json')
  if (!existsSync(tsconfig)) throw new Error(`${tsconfig} is missing`)
  return createChecker(tsconfig, { schema: true })
}

/**
 * The components an item's `index.ts` re-exports as `export { default as X } from './X.vue'`.
 * vue-component-meta can't follow that re-export, so each file is read on its own.
 */
export function componentExports(index: string) {
  const source = index.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  return [...source.matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/([^']+\.vue)'/g)].flatMap(
    (match) => {
      const name = /(?:^|,)\s*default\s+as\s+(\w+)\s*(?:,|$)/.exec(match[1] as string)?.[1]
      return name ? [{ name, file: match[2] as string }] : []
    },
  )
}

/** The components an item folder exports, or none when it has no `index.ts` re-exporting one. */
export function itemExports(dir: string) {
  const index = join(dir, 'index.ts')
  return existsSync(index) ? componentExports(readFileSync(index, 'utf8')) : []
}

/** Each exported component's meta, named as the item exports it. */
export function itemComponents(checker: Checker, dir: string): ApiComponent[] {
  return itemExports(dir).map(({ name, file }) => ({
    ...checker.getComponentMeta(join(dir, file)),
    name,
  }))
}

export function apiProps(component: ApiComponent): ApiProp[] {
  return component.props
    .filter((prop) => !prop.global)
    .map((prop) => {
      const members = unionMembers(prop.schema)
      return {
        name: prop.name,
        type: typeText(prop.schema, prop.type),
        required: prop.required,
        default: prop.default,
        boolean: members.includes('true') && members.includes('false'),
        description: prop.description,
      }
    })
}

export function apiSlots(component: ApiComponent): ApiSlot[] {
  return component.slots.map(({ name, description }) => ({ name, description }))
}

export function apiEvents(component: ApiComponent): ApiEvent[] {
  return component.events.map(({ name, type, description }) => ({
    name,
    payload: payloadText(type),
    description,
  }))
}

const unquote = (text: string) => text.replace(/^(['"])(.*)\1$/, '$2')

/**
 * A prop's default without quotes, for comparing with a spec; null when it has none. Vue casts an
 * absent prop whose type includes boolean to `false`.
 */
export function defaultValue(prop: { default?: string; boolean?: boolean }) {
  if (prop.default === undefined) return prop.boolean ? 'false' : null
  return prop.default === 'undefined' ? null : unquote(prop.default)
}

/** A prop's default as the docs print it (`'md'`, `false`); undefined when it has none. */
export function defaultText(prop: { default?: string; boolean?: boolean }) {
  return defaultValue(prop) === null ? undefined : quotes(prop.default ?? 'false')
}

/** The snapshot of one item; null when it exports no component. */
export function itemSnapshot(
  checker: () => Checker,
  item: { name: string; version: string; dir: string },
): ApiSnapshot | null {
  if (itemExports(item.dir).length === 0) return null
  const components = itemComponents(checker(), item.dir).map((component) => ({
    name: component.name,
    props: apiProps(component).map((prop) => {
      const shown = defaultText(prop)
      return {
        name: prop.name,
        type: prop.type,
        required: prop.required,
        ...(shown === undefined ? {} : { default: shown }),
        ...(prop.description ? { description: prop.description } : {}),
      }
    }),
    slots: apiSlots(component).map(({ name, description }) => ({
      name,
      ...(description ? { description } : {}),
    })),
    events: apiEvents(component).map(({ name, payload, description }) => ({
      name,
      payload,
      ...(description ? { description } : {}),
    })),
  }))
  return { name: item.name, version: item.version, components }
}

/** The file's exact text, so a rebuild with nothing changed rewrites the same bytes. */
export function snapshotText(snapshot: ApiSnapshot) {
  return `${JSON.stringify(snapshot, null, 2)}\n`
}

/** What a change takes away from users: removed components and members, newly required props. */
export function breakingChanges(before: ApiSnapshot, after: ApiSnapshot): string[] {
  const changes: string[] = []
  for (const old of before.components) {
    const next = after.components.find((component) => component.name === old.name)
    if (!next) {
      changes.push(`${old.name}: component removed`)
      continue
    }
    const names = (list: { name: string }[]) => new Set(list.map((member) => member.name))
    for (const [kind, was, now] of [
      ['prop', old.props, next.props],
      ['slot', old.slots, next.slots],
      ['event', old.events, next.events],
    ] as const) {
      const kept = names(now)
      for (const member of was) {
        if (!kept.has(member.name)) changes.push(`${old.name}: ${kind} ${member.name} removed`)
      }
    }
    for (const prop of next.props) {
      const was = old.props.find((entry) => entry.name === prop.name)
      if (prop.required && !was?.required) {
        changes.push(`${old.name}: prop ${prop.name} is now required`)
      }
    }
  }
  return changes
}

/** Whether `next` raises `previous` at the breaking position: the minor while 0.x, else the major. */
export function isBreakingBump(previous: string, next: string) {
  const parse = (version: string) => version.split(/[.+-]/).slice(0, 3).map(Number)
  const [major = 0, minor = 0] = parse(previous)
  const [nextMajor = 0, nextMinor = 0] = parse(next)
  if (major === 0) return nextMajor > 0 || nextMinor > minor
  return nextMajor > major
}

/**
 * The type as the docs print it. Unions come back wrapped (`NonNullable<"sm" | "md" | null |
 * undefined> | undefined`) and the schema holds the members: only a union of literals is spelled
 * out, since a named type such as `AsTag | Component` reads better as written.
 */
export function typeText(schema: PropertyMetaSchema, type: string): string {
  const members = unionMembers(schema).filter(
    (member) => member !== 'undefined' && member !== 'null',
  )
  const unique = [...new Set(members)]
  if (unique.length === 2 && unique.includes('true') && unique.includes('false')) return 'boolean'
  if (
    unique.length > 0 &&
    unique.every((member) => /^("[^"]*"|-?\d+(\.\d+)?|true|false)$/.test(member))
  ) {
    return quotes(unique.join(' | '))
  }
  return quotes(type.replace(/ \| undefined$/, ''))
}

function unionMembers(schema: PropertyMetaSchema): string[] {
  if (typeof schema === 'string') return [schema]
  if (schema.kind === 'enum' && schema.schema) return schema.schema.flatMap(unionMembers)
  return [schema.type]
}

// Emits come back as argument tuples: `[]` is no payload, `[value: T]` reads as `T`. More than one
// argument, or a rest argument, is shown as written.
export function payloadText(type: string) {
  const inner = /^\[([\s\S]*)\]$/.exec(type.trim())?.[1]?.trim()
  if (inner === undefined) return quotes(type)
  if (inner === '') return ''
  const args = topLevelSplit(inner)
  const single = args.length === 1 && !inner.startsWith('...')
  return quotes(single ? inner.replace(/^\w+\??:\s*/, '') : type)
}

// Splits on commas outside brackets, braces, parentheses and angle brackets.
function topLevelSplit(text: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (const [index, char] of [...text].entries()) {
    if ('[{(<'.includes(char)) depth++
    else if (']})>'.includes(char)) depth--
    else if (char === ',' && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  return [...parts, text.slice(start)]
}

export function quotes(text: string) {
  return text.replace(/"([^"\\]*)"/g, "'$1'")
}
