import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { demoFiles, registryDir } from '../apps/demo-files'
import { run } from '../packages/cli/src/cli.ts'
import { capture } from '../packages/cli/test/helpers/project.ts'

type Report = { ok: boolean; files: { checks: { id: string; pass: boolean }[] }[] }

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

// Recipe B: every layout's demo is a screen that passes the audit (docs/agent-support.md).
describe('layout demos', () => {
  const layouts = demoFiles().filter((entry) => entry.kind === 'layouts')

  it('include app-shell', () => {
    expect(layouts.map((entry) => entry.name)).toContain('app-shell')
  })

  it.each(layouts.map((entry) => entry.name))('pass heart-ui audit: %s', async (name) => {
    const dir = join(registryDir, 'layouts', name)
    const demo = readdirSync(dir).find((file) => file.endsWith('.demo.vue'))!
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'heart-ui-layout-audit-')))
    roots.push(root)
    writeFileSync(join(root, 'Screen.vue'), readFileSync(join(dir, demo), 'utf8'))
    const { io, out } = capture(root)
    const code = await run(['audit', '--json', 'Screen.vue'], io)
    const report = JSON.parse(out()) as Report
    const failed = report.files.flatMap((file) => file.checks.filter((check) => !check.pass))
    expect(failed.map((check) => check.id)).toEqual([])
    expect(code).toBe(0)
  })
})
