import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
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

function check(...args: string[]) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/check.ts'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

// The dry-run plan: one `step: command` line per step.
function plan(...args: string[]) {
  const result = check('--dry-run', ...args)
  expect(result.status, result.output).toBe(0)
  return result.output
    .trim()
    .split('\n')
    .map((line) => {
      const at = line.indexOf(': ')
      return { step: line.slice(0, at), command: line.slice(at + 2) }
    })
}

describe('check', () => {
  it('plans every step in order, each as its standalone script', () => {
    const planned = plan()
    expect(planned.map((entry) => entry.step)).toEqual(steps)
    for (const { step, command } of planned) expect(command).toBe(`pnpm run ${step}`)
  })

  it('is what pnpm check and check:item run', () => {
    const scripts = (
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>
      }
    ).scripts
    expect(scripts.check).toBe('node scripts/check.ts')
    expect(scripts['check:item']).toBe('node scripts/check.ts --item')
    for (const step of steps) expect(scripts[step], step).toBeDefined()
  })
})

describe('check:item', () => {
  it('scopes every step to the item', () => {
    const planned = Object.fromEntries(
      plan('--item', 'placeholder').map(({ step, command }) => [step, command]),
    )
    expect(Object.keys(planned)).toEqual(steps)
    expect(planned.lint).toContain('eslint --max-warnings 0 registry/ui/placeholder')
    expect(planned.lint).toContain('prettier --check registry/ui/placeholder')
    expect(planned.typecheck).toMatch(
      /vue-tsc -p \S+ --noEmit \(includes registry\/ui\/placeholder only\)/,
    )
    expect(planned['test:unit']).toBe('skipped: no unit test references registry/ui/placeholder')
    expect(planned['test:browser']).toBe(
      'HEART_UI_ITEM=placeholder pnpm run test:browser test/demos.browser.test.ts',
    )
    expect(planned['test:visual']).toBe('pnpm run test:visual --grep (^|\\s)ui/placeholder\\s')
    expect(planned['test:ssr']).toBe('HEART_UI_ITEM=placeholder pnpm run test:ssr')
    expect(planned['registry:build']).toMatch(
      /pnpm run registry:build --out \S+ \(placeholder is a fixture: no item\.json\)/,
    )
  })

  it('runs the unit tests that reference the item, and skips demo steps without a demo', () => {
    const planned = Object.fromEntries(
      plan('--item', 'utils').map(({ step, command }) => [step, command]),
    )
    expect(planned['test:unit']).toBe('pnpm run test:unit tests/registry-helpers.test.ts')
    expect(planned['test:browser']).toBe('skipped: registry/lib/utils has no demo or browser test')
    expect(planned['test:visual']).toBe('skipped: registry/lib/utils has no demo')
    expect(planned['test:ssr']).toBe('skipped: registry/lib/utils has no demo')
    expect(planned['registry:build']).toMatch(/\(checks r\/utils\.json\)/)
    expect(planned['test:cli-e2e']).toBe(
      'skipped: runs every Tier 1 item through the CLI in pnpm check',
    )
  })

  it('rejects an unknown item before running any step', () => {
    const result = check('--item', 'no-such-item')
    expect(result.status).toBe(1)
    expect(result.output).toMatch(/no-such-item/)
    expect(result.output).not.toMatch(/^lint:/m)
  })
})

describe('CI workflow', () => {
  const workflow = readFileSync(join(root, '.github/workflows/check.yml'), 'utf8')

  it('runs pnpm check on pull requests with Chromium and Docker available', () => {
    expect(workflow).toMatch(/on:\s*\n\s+pull_request:/)
    expect(workflow).toMatch(/runs-on: ubuntu-/)
    expect(workflow).toMatch(/pnpm install --frozen-lockfile/)
    expect(workflow).toMatch(/pnpm test:install --with-deps/)
    expect(workflow).toMatch(/run: pnpm check\n/)
  })

  it('pins every action to a commit and keeps no token in the checkout', () => {
    const uses = [...workflow.matchAll(/uses: (\S+)/g)].map((match) => match[1]!)
    expect(uses.length).toBeGreaterThan(0)
    for (const action of uses) expect(action, action).toMatch(/@[0-9a-f]{40}$/)
    expect(workflow).toMatch(/persist-credentials: false/)
  })
})

describe('changesets', () => {
  it('reads the config', () => {
    // --since HEAD reads the config without needing a local main branch (CI checks out a PR ref).
    const result = spawnSync('pnpm', ['exec', 'changeset', 'status', '--since', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0)
    const config = JSON.parse(readFileSync(join(root, '.changeset/config.json'), 'utf8')) as {
      access: string
      baseBranch: string
    }
    expect(config).toMatchObject({ access: 'public', baseBranch: 'main' })
  })
})
