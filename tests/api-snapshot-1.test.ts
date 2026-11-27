import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderPages } from '../apps/docs/scripts/pages.ts'
import {
  root,
  timeout,
  type Snapshot,
  run,
  sample,
  twoProps,
  fixture,
} from './api-snapshot.helpers.ts'

describe('API snapshots', () => {
  it(
    'AC-001 writes a snapshot per component item',
    () => {
      const reg = fixture()
      const first = reg.api()
      expect(first.status, first.output).toBe(0)
      const snapshot = reg.read()
      expect(snapshot).toEqual({
        name: 'sample',
        version: '0.1.0',
        components: [
          {
            name: 'Sample',
            props: [
              {
                name: 'tone',
                type: "'a' | 'b'",
                required: false,
                default: "'a'",
                description: 'Tone.',
              },
              { name: 'size', type: "'sm' | 'md'", required: false },
            ],
            slots: [{ name: 'default' }],
            events: [{ name: 'close', payload: '' }],
          },
        ],
      })
      expect(readFileSync(reg.snapshotPath, 'utf8').endsWith('}\n')).toBe(true)
      expect(existsSync(join(reg.registry, 'lib/utils/utils.api.json'))).toBe(false)
      const text = readFileSync(reg.snapshotPath, 'utf8')
      expect(reg.api().status).toBe(0)
      expect(readFileSync(reg.snapshotPath, 'utf8')).toBe(text)
    },
    timeout,
  )

  it(
    'AC-002 snapshot matches the docs page',
    () => {
      const snapshot = JSON.parse(
        readFileSync(join(root, 'registry/ui/button/button.api.json'), 'utf8'),
      ) as Snapshot
      const page = renderPages().find((entry) => entry.name === 'button')!.item
      const props = page.slice(page.indexOf('\n## Props\n'), page.indexOf('\n## Slots\n'))
      const row = (name: string) =>
        props.split('\n').find((line) => line.startsWith(`| \`${name}\` |`)) ?? ''
      const button = snapshot.components.find((component) => component.name === 'Button')!
      expect(button.props.length).toBeGreaterThan(3)
      const dialog = JSON.parse(
        readFileSync(join(root, 'registry/ui/dialog/dialog.api.json'), 'utf8'),
      ) as Snapshot
      const dialogPage = renderPages().find((entry) => entry.name === 'dialog')!.item
      const events = dialogPage.slice(dialogPage.indexOf('\n## Events\n'))
      const open = dialog.components
        .flatMap((component) => component.events)
        .find((event) => event.name === 'update:open')!
      expect(open.payload).toBe('boolean')
      expect(events).toMatch(/\| `update:open` \| `boolean` \|/)
      for (const prop of button.props) {
        expect(row(prop.name), prop.name).toContain(`\`${prop.type!.replace(/\|/g, '\\|')}\``)
        if (prop.default !== undefined) {
          expect(row(prop.name), prop.name).toContain(`\`${prop.default}\``)
        }
      }
    },
    timeout,
  )

  it(
    'AC-003 build fails on a missing or orphaned snapshot, the check on a stale one',
    () => {
      const reg = fixture()
      const missing = reg.build()
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/ui\/sample\/sample\.api\.json.*pnpm registry:api/)

      expect(reg.api().status).toBe(0)
      expect(reg.build().status).toBe(0)

      reg.setItem(sample(twoProps).replace("{ tone: 'a' }", "{ tone: 'b' }"))
      const stale = reg.api(['--check'])
      expect(stale.status).toBe(1)
      expect(stale.output).toMatch(/sample\.api\.json is stale.*pnpm registry:api/)

      expect(reg.api().status).toBe(0)
      writeFileSync(join(reg.registry, 'lib/utils/utils.api.json'), '{}\n')
      const orphan = reg.build()
      expect(orphan.status).toBe(1)
      expect(orphan.output).toMatch(/lib\/utils\/utils\.api\.json.*pnpm registry:api/)
    },
    timeout,
  )

  it(
    'AC-004 build publishes the snapshot',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      expect(reg.build().status).toBe(0)
      const published = join(reg.dir, 'out/docs/sample.api.json')
      expect(readFileSync(published, 'utf8')).toBe(readFileSync(reg.snapshotPath, 'utf8'))
      const marker = JSON.parse(
        readFileSync(join(reg.dir, 'out/.heart-ui-registry-build.json'), 'utf8'),
      ) as { files: string[] }
      expect(marker.files).toContain('docs/sample.api.json')
      // The real publish, dry: it builds the repo's registry and lists what it would upload.
      const publish = run('registry-publish.ts', ['--dry-run'])
      expect(publish.status, publish.output).toBe(0)
      expect(publish.output).toContain('docs/button.api.json')
    },
    timeout,
  )

  it(
    'AC-005 breaking changes need a version and a changeset',
    () => {
      const reg = fixture()
      expect(reg.api().status).toBe(0)
      const before = readFileSync(reg.snapshotPath, 'utf8')
      const dropped = sample("  /** Tone. */\n  tone?: 'a' | 'b'\n  label: string")

      reg.setItem(dropped)
      const refused = reg.api()
      expect(refused.status).toBe(1)
      expect(refused.output).toMatch(/Sample: prop size removed/)
      expect(refused.output).toMatch(/Sample: prop label is now required/)
      expect(readFileSync(reg.snapshotPath, 'utf8')).toBe(before)

      reg.setItem(dropped, '0.1.1')
      expect(reg.api().status).toBe(1)
      reg.setItem(dropped, '0.2.0')
      expect(reg.api().status).toBe(1)
      writeFileSync(
        join(reg.dir, 'changesets/sample.md'),
        'BREAKING: the `sample` item drops size.\n',
      )
      const accepted = reg.api()
      expect(accepted.status).toBe(0)
      expect(reg.read().version).toBe('0.2.0')
      expect(reg.read().components[0]!.props.map((prop) => prop.name)).toEqual(['tone', 'label'])
    },
    timeout,
  )
})
