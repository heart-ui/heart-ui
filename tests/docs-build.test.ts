import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Builds the docs site the way the task's check does: `pnpm --filter docs build`.
const root = join(import.meta.dirname, '..')
const docs = join(root, 'apps/docs')
const dist = join(docs, '.vitepress/dist')
const html = (path: string) => readFileSync(join(dist, path), 'utf8')

describe('docs build', () => {
  beforeAll(() => {
    execFileSync('pnpm', ['--filter', 'docs', 'build'], { cwd: root, stdio: 'pipe' })
  }, 300_000)

  it('pilot pages: previews in frames, API tables, demos rendered', () => {
    const demoText = { button: 'primary sm', input: 'Email', dialog: 'Rename' }
    for (const [name, text] of Object.entries(demoText)) {
      const page = html(`components/${name}.html`)
      expect(page).toMatch(new RegExp(`<iframe[^>]+src="/demo/${name}"`))
      // The API table is the Props section's table, merged with the types.
      expect(page).toContain('id="props"')
      expect(page).toMatch(/<th>Prop<\/th>[\s\S]*<th>Notes<\/th>/)
      const demo = html(`demo/${name}.html`)
      expect(demo).toContain(text)
      expect(demo).not.toContain('class="VPNav')
    }
    const dialog = html('components/dialog.html')
    expect(dialog).not.toContain('role="dialog"')
    expect(existsSync(join(dist, 'components/placeholder.html'))).toBe(false)
    const index = html('components/index.html')
    for (const name of Object.keys(demoText)) expect(index).toContain(`href="/components/${name}"`)
  })

  it('guide pages: layout rules and tokens, linked from the nav, the sidebar and item pages', () => {
    for (const [name, heading, body] of [
      ['layout-rules', 'Layout rules', 'Screen workflow'],
      ['tokens', 'Tokens', '--h-'],
    ] as const) {
      const guide = html(`guide/${name}.html`)
      const content = guide.slice(guide.indexOf('class="vp-doc'))
      expect(content).toMatch(new RegExp(`<h1 id="${name}"[^>]*>${heading}`))
      expect(content).toContain(body)
      expect(guide).toMatch(new RegExp(`class="VPSidebarItem[\\s\\S]*?href="/guide/${name}"`))
    }
    for (const page of ['components/button.html', 'guide/tokens.html']) {
      expect(html(page)).toMatch(
        /class="[^"]*VPNavBarMenuLink[^"]*"[^>]*href="\/guide\/layout-rules"/,
      )
    }
    // The Guides entry is active on every guide page, not only the one it links to.
    expect(html('guide/tokens.html')).toMatch(
      /class="[^"]*VPNavBarMenuLink active"[^>]*href="\/guide\/layout-rules"/,
    )
    expect(html('components/dialog.html')).toContain(
      '<a href="/guide/layout-rules#detail-and-editing">layout-rules.md</a>',
    )
  })

  it('cloudflare pages config: output folder set, nothing deploys', () => {
    const config = readFileSync(join(docs, 'wrangler.toml'), 'utf8')
    expect(config).toMatch(/^pages_build_output_dir = "\.vitepress\/dist"$/m)
    expect(config).toMatch(/^name = "[a-z0-9-]+"$/m)
    expect(config).toMatch(/^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m)
    const manifest = JSON.parse(readFileSync(join(docs, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(Object.values(manifest.scripts).join(' ')).not.toMatch(/wrangler|deploy/)
    expect(manifest.devDependencies).not.toHaveProperty('wrangler')
  })

  it('includes Open Graph, Twitter Card and canonical metadata, and noindex on demo frames', () => {
    expect(existsSync(join(dist, 'og-image.png'))).toBe(true)
    for (const [page, expectedUrl] of [
      ['index.html', 'https://heart.tammai.me/'],
      ['components/button.html', 'https://heart.tammai.me/components/button'],
    ] as const) {
      const content = html(page)
      expect(content).toContain(
        'property="og:image" content="https://heart.tammai.me/og-image.png"',
      )
      expect(content).toContain('name="twitter:card" content="summary_large_image"')
      expect(content).toContain(
        'name="twitter:image" content="https://heart.tammai.me/og-image.png"',
      )
      expect(content).toContain(`rel="canonical" href="${expectedUrl}"`)
      expect(content).toContain(`property="og:url" content="${expectedUrl}"`)
    }
    expect(html('demo/button.html')).toContain('name="robots" content="noindex"')
  })
})

// Serves the built site with clean URLs, as Cloudflare Pages does.
function serve(dir: string) {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
  }
  return createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname))
    const file = [join(dir, path), join(dir, `${path}.html`), join(dir, path, 'index.html')].find(
      (candidate) =>
        candidate.startsWith(dir) && existsSync(candidate) && extname(candidate) !== '',
    )
    if (!file) return response.writeHead(404).end()
    response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    response.end(readFileSync(file))
  })
}

describe('docs previews in a browser', () => {
  let server: Server
  let base = ''
  let browser: Browser

  beforeAll(async () => {
    if (!existsSync(join(dist, 'components/button.html'))) {
      execFileSync('pnpm', ['--filter', 'docs', 'build'], { cwd: root, stdio: 'pipe' })
    }
    server = serve(dist)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
    browser = await chromium.launch()
  }, 300_000)

  afterAll(async () => {
    await browser?.close()
    server?.close()
  })

  const frameState = (page: Page) =>
    page.evaluate(() => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe.demo-preview')
      const body = frame?.contentDocument?.body
      return {
        frame: frame?.getBoundingClientRect().height ?? 0,
        inner: frame?.clientHeight ?? 0,
        content: body ? Math.ceil(body.getBoundingClientRect().height) : 0,
        dark: frame?.contentDocument?.documentElement.classList.contains('dark') ?? false,
      }
    })

  it('sizes the frame to its demo on a cached reload, and shrinks it with the demo', async () => {
    const page = await browser.newPage()
    await page.goto(`${base}/components/input`)
    await page.reload()
    await expect
      .poll(async () => (await frameState(page)).frame, { timeout: 10_000 })
      .toBeGreaterThan(600)
    // The frame's inside, not its border box, holds the whole demo, so nothing scrolls in it.
    const before = await frameState(page)
    expect(before.inner).toBe(before.content)
    await page
      .frameLocator('iframe.demo-preview')
      .locator('.heart-demo > *')
      .evaluate((demo: Element) => {
        ;[...demo.children].slice(1).forEach((child) => child.remove())
      })
    // One field is left, far shorter than the frame's minimum, so the frame falls to that minimum.
    const minimum = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('iframe.demo-preview') as Element)
      return parseFloat(style.minHeight) + 2 * parseFloat(style.borderTopWidth)
    })
    await expect
      .poll(async () => (await frameState(page)).frame, { timeout: 10_000 })
      .toBeLessThanOrEqual(minimum + 1)
    await page.close()
  })

  it('fits the column and styles the demo as in an app, at phone width too', async () => {
    for (const width of [1280, 360]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      await page.goto(`${base}/components/button`)
      await expect.poll(async () => (await frameState(page)).content).toBeGreaterThan(0)
      const fit = await page.evaluate(() => {
        const frame = document.querySelector('iframe.demo-preview') as HTMLIFrameElement
        const column = frame.parentElement as HTMLElement
        const body = frame.contentDocument?.body as HTMLElement
        const style = getComputedStyle(body)
        return {
          overflow: frame.getBoundingClientRect().right - column.getBoundingClientRect().right,
          sideways: body.scrollWidth - body.clientWidth,
          minWidth: style.minWidth,
          lineHeight: style.lineHeight,
          font: style.fontFamily,
        }
      })
      expect(fit.overflow, `${width}px`).toBeLessThanOrEqual(0)
      expect(fit.sideways, `${width}px`).toBe(0)
      expect(fit.minWidth).not.toBe('320px')
      expect(fit.lineHeight).not.toBe('24px')
      // The theme's `--h-font-sans`, not VitePress's `--vp-font-family-base`.
      expect(fit.font).toBe('Inter, system-ui, sans-serif')
      await page.close()
    }
  })

  it('follows the dark mode of the site', async () => {
    const page = await browser.newPage({ colorScheme: 'light' })
    await page.goto(`${base}/components/button`)
    await expect.poll(async () => (await frameState(page)).content).toBeGreaterThan(0)
    expect((await frameState(page)).dark).toBe(false)
    await page.locator('.VPNavBarAppearance button').click()
    await expect.poll(async () => (await frameState(page)).dark).toBe(true)
    await page.close()
  })

  it('shows the modal of the dialog demo whole, inside the frame, without taking focus from the page', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(`${base}/components/dialog`)
    const dialog = page.frameLocator('iframe.demo-preview').getByRole('dialog')
    await expect.poll(() => dialog.count(), { timeout: 10_000 }).toBe(1)
    const box = await dialog.boundingBox()
    const frame = await page.locator('iframe.demo-preview').boundingBox()
    expect(box && frame).toBeTruthy()
    expect(box!.y).toBeGreaterThanOrEqual(frame!.y)
    expect(box!.y + box!.height).toBeLessThanOrEqual(frame!.y + frame!.height)
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('IFRAME')
    await page.close()
  })

  it('hands focus the demo takes back to where the reader was, until the reader uses the frame', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(`${base}/components/input`)
    await expect.poll(async () => (await frameState(page)).content).toBeGreaterThan(0)
    const demoField = page.frameLocator('iframe.demo-preview').locator('input').first()
    const active = () =>
      page.evaluate(
        () => document.activeElement?.getAttribute('href') ?? document.activeElement?.tagName,
      )

    // A click elsewhere on the page is not use of the frame.
    await page.locator('h1').click()
    await page.locator('.VPSidebar a[href="/components/button"]').focus()
    await demoField.evaluate((field: HTMLElement) => field.focus())
    await expect.poll(active).toBe('/components/button')

    // Clicking into the frame is.
    await demoField.click()
    await demoField.evaluate((field: HTMLElement) => field.focus())
    expect(await active()).toBe('IFRAME')
    await page.close()
  })
})
