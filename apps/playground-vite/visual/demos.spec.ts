import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateTheme, type Knobs } from '@heart-ui/theme'
import { expect, test } from '@playwright/test'
import { demoFiles, registryDir, themeNames, visualWidths } from '../../demo-files'

// A theme missing from presets.css would render as the default, so each test first checks
// that the page holds this theme's primary.
const primary500 = (theme: string) => {
  const knobs = JSON.parse(
    readFileSync(join(registryDir, 'themes', `${theme}.json`), 'utf8'),
  ) as Knobs
  return /--h-raw-primary-500: ([^;]+);/.exec(generateTheme(knobs))![1]!
}

for (const { kind, name } of demoFiles()) {
  for (const theme of themeNames()) {
    for (const mode of ['light', 'dark']) {
      for (const width of visualWidths[kind]) {
        test(`${kind}/${name} ${theme} ${mode} ${width}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 })
          const response = await page.goto(`/demo/${name}?theme=${theme}&mode=${mode}`)
          expect(response?.status()).toBe(200)
          await page.waitForLoadState('networkidle')
          // A blocked host or a missing demo must never become a baseline.
          await expect(page.locator('#app > *').first()).toBeVisible()
          await expect(page.getByText(/No demo at|Blocked request/)).toHaveCount(0)
          // The build minifies the value, so the browser resolves both sides to one color.
          const [shown, expected] = await page.evaluate((value) => {
            const resolve = (color: string) => {
              const probe = document.body.appendChild(document.createElement('i'))
              probe.style.color = color
              const resolved = getComputedStyle(probe).color
              probe.remove()
              return resolved
            }
            return [resolve('var(--h-raw-primary-500)'), resolve(value)]
          }, primary500(theme))
          expect(shown, theme).toBe(expected)
          await expect(page).toHaveScreenshot(`${kind}-${name}-${theme}-${mode}-${width}.png`, {
            fullPage: true,
            animations: 'disabled',
          })
        })
      }
    }
  }
}
