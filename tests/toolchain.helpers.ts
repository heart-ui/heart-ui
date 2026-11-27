import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export const root = join(import.meta.dirname, '..')
export const timeout = 120_000

export const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}

export function run(script: string, cwd = root) {
  const result = spawnSync('pnpm', ['run', '--silent', script], { cwd, encoding: 'utf8' })
  if (result.error) throw result.error
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

export const toolchainFiles = [
  'package.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'eslint.config.js',
  '.prettierrc.json',
  '.prettierignore',
  '.gitignore',
  'vitest.config.ts',
  'registry/tsconfig.json',
]

// Seeded problems go into a throwaway copy of the toolchain, never the working tree, so a
// killed run or a concurrent lint can't see them.
export function sandbox(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'heart-ui-seeded-'))
  for (const file of toolchainFiles) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    cpSync(join(root, file), join(dir, file))
  }
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'))
  // A copy of the plugin, so the sandbox's lint rebuilds its own dist, not the working tree's.
  const plugin = join(dir, 'packages/eslint-plugin')
  mkdirSync(plugin, { recursive: true })
  cpSync(join(root, 'packages/eslint-plugin/package.json'), join(plugin, 'package.json'))
  cpSync(join(root, 'packages/eslint-plugin/src'), join(plugin, 'src'), { recursive: true })
  symlinkSync(join(root, 'packages/eslint-plugin/node_modules'), join(plugin, 'node_modules'))
  for (const [file, code] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), code)
  }
  return dir
}

export const vueTypeError =
  '<script setup lang="ts">\nconst m: number = \'y\'\n</script>\n\n<template><p>{{ m }}</p></template>\n'

export async function lint(file: string, code: string) {
  const { ESLint } = await import('eslint')
  const [result] = await new ESLint({ cwd: root }).lintText(code, {
    filePath: join(root, file),
  })
  return result!.messages
}

export const generated: [string, boolean][] = [
  ['apps/docs/.vitepress/config.ts', false],
  ['apps/docs/.vitepress/theme/index.ts', false],
  ['apps/docs/.vitepress/cache/deps/a.js', true],
  ['apps/docs/.vitepress/dist/a.js', true],
  ['test-results/a.js', true],
  ['playwright-report/trace/a.js', true],
  ['apps/playground-nuxt/.nuxt/a.js', true],
  ['packages/cli/dist/index.js', true],
]
