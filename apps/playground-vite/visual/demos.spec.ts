import { expect, test } from '@playwright/test'
import { demoFiles, themeNames } from '../../demo-files'

// The playgrounds load only the default theme's tokens.css (docs/questions.md, P0-07), so any
// other theme would render as the default and its baselines would be wrong.
const renderable = ['default']
const unrenderable = themeNames().filter((theme) => !renderable.includes(theme))
if (unrenderable.length > 0) {
  throw new Error(
    `The playgrounds can't render theme ${unrenderable.join(', ')} yet; load its tokens first`,
  )
}

// Blocks and layouts reflow, so they are pinned at phone, tablet and desktop widths.
const widths = { ui: [1024], blocks: [375, 768, 1280], layouts: [375, 768, 1280] }

for (const { kind, name } of demoFiles()) {
  for (const theme of themeNames()) {
    for (const mode of ['light', 'dark']) {
      for (const width of widths[kind]) {
        test(`${kind}/${name} ${theme} ${mode} ${width}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 })
          const response = await page.goto(`/demo/${name}?theme=${theme}&mode=${mode}`)
          expect(response?.status()).toBe(200)
          await page.waitForLoadState('networkidle')
          // A blocked host or a missing demo must never become a baseline.
          await expect(page.locator('#app > *').first()).toBeVisible()
          await expect(page.getByText(/No demo at|Blocked request/)).toHaveCount(0)
          await expect(page).toHaveScreenshot(`${kind}-${name}-${theme}-${mode}-${width}.png`, {
            fullPage: true,
            animations: 'disabled',
          })
        })
      }
    }
  }
}
