import { readdir, readFile, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative, sep } from 'node:path'
import type { Knobs } from '@heart-ui/theme'
import defaultPreset from '../../../../registry/themes/default.json' with { type: 'json' }
import { agentsBlock, AGENTS_MARKER } from '../agents.ts'
import { aliasPath, rewriteImports } from '../aliases.ts'
import type { Command, Io } from '../cli.ts'
import { CONFIG_FILE, formatConfig, type Config } from '../config.ts'
import { detectProject, findVersion, type Project } from '../detect.ts'
import { CliError, quoted } from '../errors.ts'
import { exists, isFile } from '../fs.ts'
import { checkSpecs, install, missingDependencies, type Installer } from '../install.ts'
import { createRegistryClient, DEFAULT_REGISTRY_URL } from '../registry.ts'
import { refuseOutside, writeSteps, type Step } from '../write.ts'

export type InitDeps = {
  fetch?: typeof globalThis.fetch
  install?: Installer
  nodeVersion?: string
  cacheDir?: string
  registryUrl?: string
}

const presets: Record<string, Knobs> = { default: defaultPreset as Knobs }
const helpers = ['utils', 'icon']
const defaultAliases: Config['aliases'] = {
  ui: '@/components/ui',
  blocks: '@/components/blocks',
  layouts: '@/layouts',
  lib: '@/lib',
}
const tailwindImport = /^([ \t]*)@import\s+(["'])tailwindcss\2[ \t]*;?[ \t]*$/m
/** The `init` command; `deps` replaces the network, the installer and the Node version in tests. */
export function createInit(deps: InitDeps = {}): Command {
  return {
    summary: 'Set up Heart UI in a Nuxt or Vite project.',
    usage: 'heart-ui init [--theme <preset>] [--registry <url>] [--yes]',
    options: {
      theme: { type: 'string', description: `Theme preset: ${Object.keys(presets).join(', ')}.` },
      yes: { type: 'boolean', description: 'Write without asking.' },
      registry: {
        type: 'string',
        description: 'The @heart-ui item URL, with {name} for the item (a mirror, say).',
      },
    },
    run: (ctx) => init(ctx.cwd, ctx.options, ctx.io, deps),
  }
}

type Write = { path: string; content: string }
type Edit = Write & { original: string }

async function init(
  cwd: string,
  options: Record<string, string | boolean>,
  io: Io,
  deps: InitDeps,
): Promise<number> {
  if (options.yes !== true && !io.confirm) {
    throw new CliError('stdin is not a terminal, so init cannot ask. Run heart-ui init --yes.', 2)
  }
  const project = await detectProject(cwd)
  const { root } = project
  const show = (path: string) => relative(root, path).split(sep).join('/')
  const configPath = join(root, CONFIG_FILE)
  if (exists(configPath)) {
    throw new CliError(`${CONFIG_FILE} already exists in ${root}; Heart UI is already set up here.`)
  }
  await checkVersions(project, deps.nodeVersion ?? process.versions.node)

  const themeName = typeof options.theme === 'string' ? options.theme : 'default'
  const knobs = Object.hasOwn(presets, themeName) ? presets[themeName] : undefined
  if (!knobs) {
    throw new CliError(
      `No theme preset "${themeName}". Presets: ${Object.keys(presets).join(', ')}.`,
    )
  }

  const src = project.aliases['@']
  if (src === undefined) {
    throw new CliError(
      'The import alias "@" points nowhere. Add "@/*": ["./src/*"] to compilerOptions.paths in tsconfig.json, and the same alias to your Vite config.',
    )
  }
  const aliasDir = (alias: string) => aliasPath(alias, project.aliases)
  const cssDir = join(src, 'assets', 'css')
  const themePath = join(cssDir, 'theme.css')
  const config: Config = {
    framework: project.framework === 'nuxt' ? 'nuxt' : 'vite',
    css: show(themePath),
    aliases: defaultAliases,
    iconSet: 'fluent',
    registries: {
      '@heart-ui':
        typeof options.registry === 'string'
          ? options.registry
          : (deps.registryUrl ?? DEFAULT_REGISTRY_URL),
    },
  }
  // Checked now, before a fetch uses the registry URL, and named as the flag the user typed.
  let configText: string
  try {
    configText = formatConfig(config, configPath)
  } catch (error) {
    // Only a refusal of the registry URL is about the flag; config.ts's message says why.
    const about = error instanceof CliError && error.message.includes('"registries.@heart-ui"')
    if (typeof options.registry !== 'string' || !about) throw error
    throw new CliError(
      `--registry: ${(error as CliError).message.replace(/^.*"registries\.@heart-ui" /, '')}`,
    )
  }

  const client = createRegistryClient({
    registries: config.registries,
    cacheDir: deps.cacheDir,
    fetch: deps.fetch,
    onWarn: (message) => io.stderr(`heart-ui: ${message}\n`),
  })
  const items = await Promise.all(helpers.map((name) => client.fetchItem(name)))
  for (const item of items) checkSpecs(item, '@heart-ui')

  // Loaded here, not at startup, so other commands don't pay for the colour library.
  const { generateTheme } = await import('@heart-ui/theme')
  const theme = await readFile(
    createRequire(import.meta.url).resolve('@heart-ui/theme/theme.css'),
    'utf8',
  )
  const creates: Write[] = [
    { path: themePath, content: theme },
    { path: join(cssDir, 'tokens.css'), content: generateTheme(knobs) },
  ]
  for (const item of items) {
    for (const file of item.files) {
      const prefix = 'registry/lib/'
      if (!file.path.startsWith(prefix) || file.path === prefix) {
        throw new CliError(
          `@heart-ui sent ${item.name} with a file outside registry/lib/: ${quoted(file.path)}.`,
        )
      }
      creates.push({
        path: join(aliasDir(config.aliases.lib), file.path.slice(prefix.length)),
        content: rewriteImports(file.content, config.aliases),
      })
    }
  }
  for (const { path } of creates) {
    if (exists(path)) {
      throw new CliError(`${show(path)} already exists. Move it away and run heart-ui init again.`)
    }
  }

  const agents = await agentFiles(root, config, aliasDir, show)
  for (const { path } of agents.edits) await refuseOutside(root, path, show, 'init')
  creates.push(...agents.creates)
  const entry = await cssEntry(src, themePath)
  const edits = [...agents.edits, ...(entry ? [entry] : [])]
  const installs = await missingDependencies(root, items)

  const plan = [
    ...creates.map(({ path }) => show(path)),
    ...edits.map(({ path }) => show(path)),
    CONFIG_FILE,
  ]
  const installLine = installs.length ? `and install:\n  ${installs.join('\n  ')}\n` : ''
  if (options.yes !== true) {
    io.stdout(
      `heart-ui init will write or edit:\n${plan.map((path) => `  ${path}\n`).join('')}${installLine}`,
    )
    if (!(await io.confirm?.('Continue?'))) throw new CliError('Cancelled; nothing was written.')
  }

  // heart-ui.json goes last: until it exists, init can run again after a failure.
  const steps: Step[] = [
    ...creates.map(({ path, content }) => ({ kind: 'create' as const, path, content })),
    ...edits.map((edit) => ({ kind: 'edit' as const, ...edit })),
    { kind: 'create', path: configPath, content: configText },
  ]
  await writeSteps(steps, show, 'init', 'nothing was set up')

  await install(project.packageManager, installs, root, deps.install)

  io.stdout(`Wrote:\n${plan.map((path) => `  ${path}\n`).join('')}`)
  if (installs.length) io.stdout(`Installed:\n  ${installs.join('\n  ')}\n`)
  if (!entry) {
    io.stdout(
      `Import ${show(themePath)} from your app's CSS entry in place of tailwindcss (it imports Tailwind itself).\n`,
    )
  }
  return 0
}

async function checkVersions(project: Project, nodeVersion: string): Promise<void> {
  const nodeMajor = Number(nodeVersion.split('.')[0])
  if (!(nodeMajor >= 22)) {
    throw new CliError(`Node ${nodeVersion} found; Heart UI needs Node 22 or later.`)
  }
  if (project.framework === null) {
    throw new CliError(`No Nuxt or Vite project in ${project.root}; Heart UI works with either.`)
  }
  type Need = readonly [string, string, number, number, 'required' | 'optional']
  const needs: Need[] = [
    // Nuxt brings its own Vue, so Vue is only required in a Vite project.
    ['vue', 'Vue', 3, 5, project.framework === 'vite' ? 'required' : 'optional'],
    ...(project.framework === 'nuxt' ? [['nuxt', 'Nuxt', 4, 0, 'required'] as const] : []),
    ['tailwindcss', 'Tailwind CSS', 4, 0, 'required'],
  ]
  for (const [pkg, label, major, minor, mode] of needs) {
    const wanted = minor ? `${major}.${minor}` : `${major}`
    const found = await findVersion(project.root, pkg)
    if (found === null) {
      if (mode === 'optional') continue
      const hint =
        pkg === 'tailwindcss' ? ' Set it up first: https://tailwindcss.com/docs/installation' : ''
      throw new CliError(`${label} not found; Heart UI needs ${label} ${wanted} or later.${hint}`)
    }
    // A range like `latest` names no version; the package manager's install decides.
    if (found === 'unknown') continue
    // `^3.4` or `>=3.4` lets the install pick 3.5 or later, so only the major has to fit.
    const tooOld = found.open
      ? found.major < major
      : found.major < major || (found.major === major && found.minor < minor)
    if (tooOld) {
      throw new CliError(
        `${label} ${found.major}.${found.minor} found; Heart UI needs ${label} ${wanted} or later.`,
      )
    }
  }
}

// AGENTS.md gets the Heart UI block unless it holds one; CLAUDE.md, when present and not the same
// file, a pointer to it. Edits go to a link's target, so a CLAUDE.md -> AGENTS.md link survives.
async function agentFiles(
  root: string,
  config: Config,
  aliasDir: (alias: string) => string,
  show: (path: string) => string,
): Promise<{ creates: Write[]; edits: Edit[] }> {
  const creates: Write[] = []
  const edits: Edit[] = []
  const block = agentsBlock(config, (alias) => show(aliasDir(alias)))
  const agentsPath = join(root, 'AGENTS.md')
  const agents = await readText(agentsPath)
  if (agents === undefined) {
    if (exists(agentsPath)) {
      throw new CliError(
        'AGENTS.md is not a readable file. Move it away and run heart-ui init again.',
      )
    }
    creates.push({ path: agentsPath, content: block })
  } else if (!agents.includes(AGENTS_MARKER)) {
    edits.push({ path: agentsPath, content: `${withNewline(agents)}\n${block}`, original: agents })
  }
  const claudePath = join(root, 'CLAUDE.md')
  const claude = await readText(claudePath)
  const sameFile =
    claude !== undefined &&
    agents !== undefined &&
    (await realpath(claudePath)) === (await realpath(agentsPath))
  if (claude !== undefined && !sameFile && !claude.includes('AGENTS.md')) {
    edits.push({
      path: claudePath,
      content: `${withNewline(claude)}\nFor UI work, follow the Heart UI rules in AGENTS.md.\n`,
      original: claude,
    })
  }
  return { creates, edits }
}

const withNewline = (text: string) => (text.endsWith('\n') || text === '' ? text : `${text}\n`)

async function readText(path: string): Promise<string | undefined> {
  if (!isFile(path)) return undefined
  try {
    return await readFile(path, 'utf8')
  } catch {
    throw new CliError(`Could not read ${path}.`)
  }
}

// The one CSS file under the source folder that imports Tailwind, rewritten to import the theme
// (which imports Tailwind itself). None or several: the user decides, so nothing is edited.
async function cssEntry(src: string, themePath: string): Promise<Edit | undefined> {
  const found: Edit[] = []
  for (const path of await cssFiles(src)) {
    const text = await readText(path)
    // Block comments are blanked out, keeping offsets, so a commented-out import never counts.
    const masked = text?.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, ' '))
    const match = masked === undefined ? null : tailwindImport.exec(masked)
    if (text === undefined || !match) continue
    let target = relative(dirname(path), themePath).split(sep).join('/')
    if (!target.startsWith('.')) target = `./${target}`
    found.push({
      path,
      // A function, so `$` in a folder name is not read as a replacement pattern.
      content: `${text.slice(0, match.index)}${match[1]}@import ${match[2]}${target}${match[2]};${text.slice(match.index + match[0].length)}`,
      original: text,
    })
  }
  return found.length === 1 ? found[0] : undefined
}

async function cssFiles(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await cssFiles(path)))
    else if (entry.isFile() && entry.name.endsWith('.css')) files.push(path)
  }
  return files
}
