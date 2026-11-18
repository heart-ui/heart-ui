import { join } from 'node:path'
import { CliError } from './errors.ts'
import { isObject, readJsonFile, writeFileAtomic } from './fs.ts'

/** The project config `init` writes (docs/registry.md, Project config). */
export type Config = {
  $schema?: string
  framework: 'nuxt' | 'vite'
  css: string
  aliases: { ui: string; blocks: string; layouts: string; lib: string }
  iconSet: string
  /** Registry name (`@scope`) to item URL template containing `{name}`. */
  registries: Record<string, string>
}

export const CONFIG_FILE = 'heart-ui.json'

const keys = ['$schema', 'framework', 'css', 'aliases', 'iconSet', 'registries']
const aliasKeys = ['ui', 'blocks', 'layouts', 'lib'] as const
/** The namespace pattern of the shadcn CLI. */
export const registryName = /^@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?$/
const importPath = /^[^\s'"`\\]+$/

/** Reads `heart-ui.json` from `cwd`; `null` when there is none. */
export async function readConfig(cwd: string): Promise<Config | null> {
  const path = join(cwd, CONFIG_FILE)
  const value = await readJsonFile(path)
  return value === undefined ? null : parseConfig(value, path)
}

/** Validates `config` and writes it to `heart-ui.json` in `cwd`. */
export async function writeConfig(cwd: string, config: Config): Promise<void> {
  const path = join(cwd, CONFIG_FILE)
  parseConfig(config, path)
  try {
    await writeFileAtomic(path, `${JSON.stringify(config, null, 2)}\n`)
  } catch {
    throw new CliError(`Could not write ${path}.`)
  }
}

function parseConfig(value: unknown, path: string): Config {
  if (!isObject(value)) throw new CliError(`${path} must hold a JSON object.`)
  const fail = (message: string) => new CliError(`${path}: ${message}`)
  const nonEmpty = (key: string) => {
    if (typeof value[key] !== 'string' || value[key] === '') {
      throw fail(`"${key}" must be a non-empty string.`)
    }
  }

  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw fail(`Unknown key "${key}".`)
  }
  if ('$schema' in value && typeof value.$schema !== 'string') {
    throw fail('"$schema" must be a string.')
  }
  if (value.framework !== 'nuxt' && value.framework !== 'vite') {
    throw fail('"framework" must be "nuxt" or "vite".')
  }
  nonEmpty('css')
  nonEmpty('iconSet')

  const { aliases, registries } = value
  if (!isObject(aliases)) throw fail('"aliases" must be an object.')
  for (const key of Object.keys(aliases)) {
    if (!(aliasKeys as readonly string[]).includes(key)) throw fail(`Unknown key "aliases.${key}".`)
  }
  for (const key of aliasKeys) {
    const alias = aliases[key]
    if (typeof alias !== 'string' || !importPath.test(alias) || alias.endsWith('/')) {
      throw fail(`"aliases.${key}" must be an import path without a trailing slash.`)
    }
  }

  if (!isObject(registries)) throw fail('"registries" must be an object.')
  for (const [name, template] of Object.entries(registries)) {
    if (!registryName.test(name)) {
      throw fail(`"registries.${name}" is not a registry name (like "@acme").`)
    }
    // fetch refuses URLs with credentials, so they could only ever fail later, as a network error.
    if (typeof template === 'string' && hasCredentials(template)) {
      throw fail(`"registries.${name}" must not hold a user name or password.`)
    }
    if (typeof template !== 'string' || !isItemUrlTemplate(template)) {
      throw fail(
        `"registries.${name}" must be an https URL (http only for localhost) containing {name}.`,
      )
    }
  }
  return value as Config
}

function isItemUrlTemplate(template: string): boolean {
  if (!template.includes('{name}')) return false
  try {
    return isSecureUrl(new URL(template.replaceAll('{name}', 'item')))
  } catch {
    return false
  }
}

function hasCredentials(template: string): boolean {
  try {
    const url = new URL(template.replaceAll('{name}', 'item'))
    return url.username !== '' || url.password !== ''
  } catch {
    return false
  }
}

const loopbackHosts = ['localhost', '127.0.0.1', '[::1]']

/** https, or plain http to this machine: registry items are source copied into the project. */
export function isSecureUrl(url: URL): boolean {
  return (
    url.protocol === 'https:' || (url.protocol === 'http:' && loopbackHosts.includes(url.hostname))
  )
}
