// Writes css/tokens.css from registry/themes/default.json with the built generator.
// The pin test compares against this file, so review its diff before committing.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateTheme } from '../dist/index.mjs'

const here = import.meta.dirname
const knobs = JSON.parse(readFileSync(join(here, '../../../registry/themes/default.json'), 'utf8'))
writeFileSync(join(here, '../css/tokens.css'), generateTheme(knobs))
