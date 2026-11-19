import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { isSecureUrl, registryName } from './config.ts'
import { CliError, isControl } from './errors.ts'
import { isObject, writeFileAtomic } from './fs.ts'

export type RegistryFile = { path: string; type: string; content: string; target?: string }

/** A registry item as the shadcn registry-item schema describes it. */
export type RegistryItem = {
  name: string
  type: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  meta?: Record<string, unknown>
}

/** One entry of a registry's index: an item without its file contents. */
export type IndexItem = {
  name: string
  type: string
  title?: string
  description?: string
  categories?: string[]
  [field: string]: unknown
}
export type RegistryIndex = { items: IndexItem[] }

export type RegistryClientOptions = {
  /** Registry name to item URL template, from `heart-ui.json`. */
  registries: Record<string, string>
  cacheDir?: string
  fetch?: typeof globalThis.fetch
  onWarn?: (message: string) => void
}

const DEFAULT_REGISTRY = '@heart-ui'

/** The `@heart-ui` item URL: the R2 bucket's public host (docs/registry.md, Hosting). */
export const DEFAULT_REGISTRY_URL = 'https://registry.heart.tammai.me/r/{name}.json'
const TIMEOUT_MS = 30_000
const MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 5
const itemName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const version = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

/** `$XDG_CACHE_HOME/heart-ui`, else `~/.cache/heart-ui`; a relative value is ignored, as XDG says. */
export function defaultCacheDir(env: Record<string, string | undefined> = process.env): string {
  const xdg = env.XDG_CACHE_HOME
  return join(xdg && isAbsolute(xdg) ? xdg : join(homedir(), '.cache'), 'heart-ui')
}

/** The URL without credentials, query or fragment, safe to print. */
function shown(url: string): string {
  const copy = new URL(url)
  copy.username = ''
  copy.password = ''
  copy.search = ''
  copy.hash = ''
  return copy.href
}

class TooLarge extends Error {}

// What fetch throws when the network fails or the timeout fires; anything else is a bug to report.
function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
  )
}

// The body as text, refusing more than MAX_BYTES so a hostile registry cannot exhaust memory.
async function readBody(response: Response): Promise<string> {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body?.cancel()
    throw new TooLarge()
  }
  if (!response.body) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
    size += chunk.byteLength
    if (size > MAX_BYTES) throw new TooLarge()
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Fetches items by name (`button`, `@acme/data-grid`), optionally pinned to a version, and the
 * registry's index, which follows the unpinned rule. A pinned
 * item never changes, so it comes from the cache when there; an unpinned one is always fetched and
 * falls back to the cache only when the registry cannot give a usable answer.
 */
export function createRegistryClient(options: RegistryClientOptions) {
  const {
    registries,
    cacheDir = defaultCacheDir(),
    fetch = globalThis.fetch,
    onWarn = () => {},
  } = options

  // What one fetch is about, worded for its messages.
  type Subject<T> = {
    scope: string
    url: string
    check: (value: unknown) => value is T
    // `"button"` or `its index`, after "for".
    about: string
    // The cache, named in warnings: `the cached copy` or `the cached index`.
    cached: string
    // The same, where the warning does not name the subject yet: `the cached copy of "button"`.
    cachedOf: string
    // `an invalid item for "button"` or `an invalid index`.
    invalid: string
    notFound: string
  }

  async function readCache<T>(file: string, check: (value: unknown) => value is T) {
    try {
      const value: unknown = JSON.parse(await readFile(file, 'utf8'))
      return check(value) ? value : undefined
    } catch {
      return undefined
    }
  }

  async function writeCache(file: string, value: unknown): Promise<void> {
    try {
      await mkdir(cacheDir, { recursive: true })
      await writeFileAtomic(file, JSON.stringify(value))
    } catch {
      onWarn(`Could not write the cache in ${cacheDir}.`)
    }
  }

  const cacheFileFor = (url: string) =>
    join(cacheDir, `${createHash('sha256').update(url).digest('hex')}.json`)

  // Fetches and checks one JSON document, caching it; the cached copy stands in, with a warning,
  // only when the registry gives no usable answer.
  async function getJson<T>(subject: Subject<T>): Promise<T> {
    const { scope, url, check } = subject
    const cacheFile = cacheFileFor(url)
    const fallback = async (error: string, warning: string) => {
      const cached = await readCache(cacheFile, check)
      if (cached === undefined) throw new CliError(error)
      onWarn(warning)
      return cached
    }
    const invalid = `${scope} sent ${subject.invalid}`

    // Redirects are followed by hand so that every hop, not only the last, must be https.
    const request = async () => {
      const signal = AbortSignal.timeout(TIMEOUT_MS)
      let current = url
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const response = await fetch(current, { signal, redirect: 'manual' })
        const location = response.headers.get('location')
        if (response.status < 300 || response.status > 399 || location === null) return response
        await response.body?.cancel()
        const next = new URL(location, current)
        if (!isSecureUrl(next)) {
          throw new CliError(`${scope} redirected to ${shown(next.href)}, which is not https.`)
        }
        current = next.href
      }
      throw new CliError(`${scope} redirected too many times for ${shown(url)}.`)
    }

    let response: Response
    let text: string
    try {
      response = await request()
      text = await readBody(response)
    } catch (error) {
      if (error instanceof TooLarge) {
        const tooLarge = `${scope} sent more than 5 MB for ${subject.about}`
        return fallback(`${tooLarge}.`, `${tooLarge}; using ${subject.cached}.`)
      }
      if (!isNetworkError(error)) throw error
      return fallback(
        `Could not reach ${scope} (${shown(url)}). Check your connection.`,
        `Could not reach ${scope}; using ${subject.cachedOf}.`,
      )
    }
    const { status } = response
    if (status === 404) throw new CliError(subject.notFound)
    if (status >= 500) {
      return fallback(
        `${scope} answered ${status} for ${shown(url)}.`,
        `${scope} answered ${status}; using ${subject.cachedOf}.`,
      )
    }
    if (status < 200 || status > 299) {
      throw new CliError(`${scope} answered ${status} for ${shown(url)}.`)
    }

    let value: unknown
    try {
      value = JSON.parse(text)
    } catch {
      value = undefined
    }
    // A captive portal answers 200 with its own page: as unusable as no answer.
    if (!check(value)) return fallback(`${invalid}.`, `${invalid}; using ${subject.cached}.`)
    await writeCache(cacheFile, value)
    return value
  }

  const templateFor = (scope: string) => {
    const template = Object.hasOwn(registries, scope) ? registries[scope] : undefined
    if (template === undefined) {
      throw new CliError(`Unknown registry "${scope}". Add it under "registries" in heart-ui.json.`)
    }
    return template
  }

  async function fetchItem(ref: string, pinned?: string): Promise<RegistryItem> {
    const scoped = /^(@[^/]+)\/(.*)$/.exec(ref)
    const scope = scoped?.[1] ?? DEFAULT_REGISTRY
    const name = scoped ? (scoped[2] ?? '') : ref
    if ((scoped && !registryName.test(scope)) || !itemName.test(name)) {
      throw new CliError(`"${ref}" is not a valid item name.`)
    }
    if (pinned !== undefined && !version.test(pinned)) {
      throw new CliError(`"${pinned}" is not a valid version.`)
    }
    const url = templateFor(scope).replaceAll('{name}', pinned ? `${name}@${pinned}` : name)
    const check = (value: unknown): value is RegistryItem => isItem(value, name)
    if (pinned) {
      const cached = await readCache(cacheFileFor(url), check)
      if (cached) return cached
    }
    return getJson({
      scope,
      url,
      check,
      about: `"${name}"`,
      cached: 'the cached copy',
      cachedOf: `the cached copy of "${name}"`,
      invalid: `an invalid item for "${name}"`,
      notFound: `Item "${name}" not found in ${scope} (${shown(url)}).`,
    })
  }

  /**
   * The default registry's index: `registry.json` beside the `r/` folder that holds the items
   * (docs/registry.md, Hosting), or beside the items when they sit in another folder.
   */
  async function fetchIndex(): Promise<RegistryIndex> {
    const scope = DEFAULT_REGISTRY
    const template = templateFor(scope)
    const marked = new URL(template.replaceAll('{name}', 'heart-ui-item-name'))
    const file = marked.pathname.slice(marked.pathname.lastIndexOf('/') + 1)
    if (!file.includes('heart-ui-item-name') || marked.search.includes('heart-ui-item-name')) {
      throw new CliError(
        `The ${scope} template names items outside its file name, so list cannot find its index.`,
      )
    }
    const folder = new URL('.', marked)
    const index = new URL(
      'registry.json',
      folder.pathname.endsWith('/r/') ? new URL('..', folder) : folder,
    )
    // A private registry's token travels in the query; relative resolution would drop it.
    index.search = marked.search
    const url = index.href
    return getJson({
      scope,
      url,
      check: isIndex,
      about: 'its index',
      cached: 'the cached index',
      cachedOf: 'the cached index',
      invalid: 'an invalid index',
      notFound: `${scope} has no index at ${shown(url)}.`,
    }).then((index) => ({ items: index.items.filter(isIndexItem) }))
  }

  return { fetchItem, fetchIndex }
}

const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')
const optional = (value: unknown, check: (value: unknown) => boolean) =>
  value === undefined || check(value)
const isString = (value: unknown) => typeof value === 'string'

// Registries are untrusted and `add` writes these paths: each must stay inside the folder it is
// written to (relative, or `~/` for the project root), with no `..`, no dot folder or file (`.git`,
// `.husky`, `.github`, `.npmrc`, whose contents run code) and no `node_modules`. Case-insensitive
// disks read `.Git` and `Node_Modules` as the same names, Windows drops trailing dots and spaces,
// `GIT~1` is a Windows short name, and NTFS reads `x:stream` as a stream, so all of those count
// too. An empty segment (`a//b`, a trailing `/`) hides which file is meant.
function isSafeSegment(segment: string): boolean {
  const name = segment.replace(/[. ]+$/, '').toLowerCase()
  return (
    segment !== '' &&
    !segment.startsWith('.') &&
    name !== 'node_modules' &&
    !/~\d/.test(segment) &&
    // `:` names an NTFS stream (`node_modules::$INDEX_ALLOCATION` opens the folder).
    !segment.includes(':')
  )
}

// Terminal control characters in a path would reach the screen and the file system.
const hasControl = (text: string) => [...text].some(isControl)

function isContainedPath(value: unknown): boolean {
  if (typeof value !== 'string' || hasControl(value)) return false
  const path = value.startsWith('~/') ? value.slice(2) : value
  if (path === '' || /^([/\\]|[A-Za-z]:)/.test(path)) return false
  return path.split(/[/\\]/).every(isSafeSegment)
}

function isItem(value: unknown, name: string): value is RegistryItem {
  return (
    isObject(value) &&
    value.name === name &&
    typeof value.type === 'string' &&
    optional(value.title, isString) &&
    optional(value.description, isString) &&
    optional(value.meta, isObject) &&
    optional(value.dependencies, isStringArray) &&
    optional(value.registryDependencies, isStringArray) &&
    Array.isArray(value.files) &&
    value.files.every(
      (file) =>
        isObject(file) &&
        isContainedPath(file.path) &&
        typeof file.type === 'string' &&
        typeof file.content === 'string' &&
        optional(file.target, isContainedPath),
    )
  )
}

// The index is a list; one malformed entry is skipped, not a reason to refuse the rest.
function isIndex(value: unknown): value is RegistryIndex {
  return isObject(value) && Array.isArray(value.items)
}

function isIndexItem(item: unknown): item is IndexItem {
  return (
    isObject(item) &&
    typeof item.name === 'string' &&
    typeof item.type === 'string' &&
    optional(item.title, isString) &&
    optional(item.description, isString) &&
    optional(item.categories, isStringArray)
  )
}
