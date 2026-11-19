// Writes css/tokens.css from registry/themes/default.json, and css/presets.css from every
// preset scoped under its [data-heart-theme], with the built generator.
// The pin tests compare against these files, so review their diff before committing.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateTheme } from '../dist/index.mjs'

const here = import.meta.dirname
const themes = join(here, '../../../registry/themes')
const knobs = (file) => JSON.parse(readFileSync(join(themes, file), 'utf8'))
writeFileSync(join(here, '../css/tokens.css'), generateTheme(knobs('default.json')))
const presets = readdirSync(themes)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => generateTheme(knobs(file), { scoped: true }))
writeFileSync(join(here, '../css/presets.css'), presets.join('\n'))
