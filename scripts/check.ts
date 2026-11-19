// The full gate (docs/conventions.md, Checks): every step in order, stopping at the first failure.
// Usage: node scripts/check.ts [--item <name>] [--dry-run]
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const kinds = ['ui', 'blocks', 'layouts', 'lib']
const steps = [
  'lint',
  'typecheck',
  'test:unit',
  'test:browser',
  'test:visual',
  'test:ssr',
  'registry:build',
  'test:cli-e2e',
]

type Step = {
  name: string
  // Run in order without a shell; empty when the step has nothing to check for this item.
  commands: string[][]
  // Why the step is skipped, or what it covers beyond its commands.
  note?: string
  env?: Record<string, string>
  before?: () => void
  // A problem found after the commands passed, or undefined.
  after?: () => string | undefined
}

class CheckError extends Error {}

function fail(message: string): never {
  throw new CheckError(message)
}

function parse(args: string[]) {
  let item: string | undefined
  let dryRun = false
  for (let at = 0; at < args.length; at++) {
    if (args[at] === '--dry-run') dryRun = true
    else if (args[at] === '--item') {
      item = args[++at]
      if (!item || item.startsWith('--')) fail('--item needs an item name')
    } else fail(`unknown argument ${args[at]}; use [--item <name>] [--dry-run]`)
  }
  return { item, dryRun }
}

function fullPlan(): Step[] {
  return steps.map((name) => ({ name, commands: [['pnpm', 'run', name]] }))
}

// Unit test files that import from the item's folder (`from '../registry/lib/utils/utils'`).
function unitTestsFor(folder: string) {
  const pattern = new RegExp(`(?:from|import\\()\\s*['"][^'"]*${folder}(?:/[^'"]*)?['"]`)
  const roots = ['tests', ...readdirSync(join(repo, 'packages')).map((p) => `packages/${p}/test`)]
  return roots
    .filter((dir) => existsSync(join(repo, dir)))
    .flatMap((dir) =>
      readdirSync(join(repo, dir), { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.test.ts'))
        .map((file) => join(dir, file)),
    )
    .filter((file) => pattern.test(readFileSync(join(repo, file), 'utf8')))
    .sort()
}

// Each step narrowed to one item. A step with nothing to check for the item is skipped and says why.
function itemPlan(name: string, temp: () => string): Step[] {
  const kind = kinds.find((k) => existsSync(join(repo, 'registry', k, name)))
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(name) || !kind) {
    fail(`no item named "${name}" under registry/{${kinds.join(',')}}`)
  }
  const folder = `registry/${kind}/${name}`
  const files = readdirSync(join(repo, folder))
  const hasDemo = files.some((file) => file.endsWith('.demo.vue'))
  // The browser config runs item tests under ui, blocks and layouts only.
  const hasBrowserTest = kind !== 'lib' && files.some((file) => file.endsWith('.test.ts'))
  const isItem = files.includes('item.json')
  // Block and layout demos run on the shared demo support, so its checks run with them.
  // Every `_` folder the registry build skips as demo support (scripts/registry-build.ts).
  const support =
    kind === 'blocks' || kind === 'layouts'
      ? ['blocks', 'layouts'].flatMap((k) =>
          existsSync(join(repo, 'registry', k))
            ? readdirSync(join(repo, 'registry', k), { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && entry.name.startsWith('_'))
                .map((entry) => `registry/${k}/${entry.name}`)
            : [],
        )
      : []
  const unitTests = [...new Set([folder, ...support].flatMap(unitTestsFor))].sort()
  const env = { HEART_UI_ITEM: name }
  const skip = (step: string, note: string): Step => ({ name: step, commands: [], note })
  const tsconfig = () => join(temp(), 'tsconfig.json')
  const registryOut = () => join(temp(), 'registry')
  return [
    {
      // The root `lint` script, narrowed to the item folder.
      name: 'lint',
      commands: [
        ['pnpm', '--dir', 'packages/eslint-plugin', 'run', 'build'],
        ['pnpm', 'exec', 'eslint', '--max-warnings', '0', folder, ...support],
        ['pnpm', 'exec', 'prettier', '--check', folder, ...support],
      ],
    },
    {
      name: 'typecheck',
      commands: [['pnpm', 'exec', 'vue-tsc', '-p', tsconfig(), '--noEmit']],
      note: `includes ${folder} only`,
      // The registry's compiler settings, only this item's files.
      before: () =>
        writeFileSync(
          tsconfig(),
          JSON.stringify({
            extends: join(repo, 'registry/tsconfig.json'),
            include: [join(repo, folder, '**/*.ts'), join(repo, folder, '**/*.vue')],
          }),
        ),
    },
    unitTests.length > 0
      ? { name: 'test:unit', commands: [['pnpm', 'run', 'test:unit', ...unitTests]] }
      : skip('test:unit', `no unit test references ${folder}`),
    hasDemo || hasBrowserTest || support.length > 0
      ? {
          name: 'test:browser',
          commands: [
            [
              'pnpm',
              'run',
              'test:browser',
              ...(hasDemo ? ['test/demos.browser.test.ts'] : []),
              ...(hasBrowserTest ? [`${folder}/`] : []),
              ...support.map((dir) => `${dir}/`),
            ],
          ],
          env,
        }
      : skip('test:browser', `${folder} has no demo or browser test`),
    hasDemo
      ? {
          name: 'test:visual',
          commands: [['pnpm', 'run', 'test:visual', '--grep', `(^|\\s)${kind}/${name}\\s`]],
        }
      : skip('test:visual', `${folder} has no demo`),
    hasDemo
      ? { name: 'test:ssr', commands: [['pnpm', 'run', 'test:ssr']], env }
      : skip('test:ssr', `${folder} has no demo`),
    {
      // The whole registry: registryDependencies need the other items to validate.
      name: 'registry:build',
      commands: [['pnpm', 'run', 'registry:build', '--out', registryOut()]],
      note: isItem ? `checks r/${name}.json` : `${name} is a fixture: no item.json`,
      after: () =>
        isItem && !existsSync(join(registryOut(), 'r', `${name}.json`))
          ? `${name} is not in the built registry`
          : undefined,
    },
    // The CLI end to end sets up whole apps with every Tier 1 item, so it belongs to the full gate.
    skip('test:cli-e2e', 'runs every Tier 1 item through the CLI in pnpm check'),
  ]
}

const print = (text: string) => process.stdout.write(`${text}\n`)
let tempDir: string | undefined
const temp = () => (tempDir ??= mkdtempSync(join(tmpdir(), 'heart-ui-check-')))
const cleanUp = () => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true })
}
for (const [signal, code] of [
  ['SIGINT', 130],
  ['SIGTERM', 143],
] as const) {
  process.once(signal, () => {
    cleanUp()
    process.exit(code)
  })
}

try {
  const { item, dryRun } = parse(process.argv.slice(2))
  const plan = item ? itemPlan(item, temp) : fullPlan()
  for (const step of plan) {
    const env = Object.entries(step.env ?? {}).map(([key, value]) => `${key}=${value} `)
    const shown = step.commands.map((command) => `${env.join('')}${command.join(' ')}`).join(' && ')
    const skipped = step.commands.length === 0
    if (dryRun) {
      print(
        `${step.name}: ${skipped ? `skipped: ${step.note}` : step.note ? `${shown} (${step.note})` : shown}`,
      )
      continue
    }
    print(
      `\ncheck: ${step.name}${item ? ` (${item})` : ''}${skipped ? `: skipped, ${step.note}` : ''}`,
    )
    step.before?.()
    for (const command of step.commands) {
      const result = spawnSync(command[0]!, command.slice(1), {
        cwd: repo,
        stdio: 'inherit',
        env: { ...process.env, ...step.env },
      })
      if (result.error)
        fail(`${step.name}: ${command[0]} could not start (${result.error.message})`)
      if (result.status !== 0) fail(`${step.name} failed`)
    }
    const problem = step.after?.()
    if (problem) fail(`${step.name}: ${problem}`)
  }
  if (!dryRun) {
    const skipped = plan.filter((step) => step.commands.length === 0).map((step) => step.name)
    print(
      `\ncheck: all ${plan.length} steps passed${item ? ` for ${item}` : ''}` +
        (skipped.length > 0 ? ` (skipped: ${skipped.join(', ')})` : ''),
    )
  }
} catch (error) {
  if (!(error instanceof CheckError)) throw error
  process.stderr.write(`check: ${error.message}\n`)
  process.exitCode = 1
} finally {
  cleanUp()
}
