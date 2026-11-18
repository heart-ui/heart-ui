import type { Config } from './config.ts'

// The prefixes registry source imports with, as the repo's own build resolves them.
const prefixes: Record<string, keyof Config['aliases']> = {
  '@/components/ui': 'ui',
  '@/components/blocks': 'blocks',
  '@/layouts': 'layouts',
  '@/lib': 'lib',
}

// A module specifier after `from`, a side-effect `import`, or `import(` (a template literal too, for
// lazy imports), whose path is a registry prefix followed by `/` or the closing quote, so
// `@/library` and plain strings stay as they are.
const specifier = new RegExp(
  `(\\bfrom\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s*)(['"\`])(${Object.keys(prefixes)
    .map((prefix) => prefix.replace(/[/]/g, '\\/'))
    .join('|')})(?=\\/|\\2)`,
  'g',
)

/** Rewrites registry import prefixes in `source` to the project's aliases. */
export function rewriteImports(source: string, aliases: Config['aliases']): string {
  return source.replace(
    specifier,
    (_, lead: string, quote: string, prefix: string) =>
      // The pattern matches only the keys of `prefixes`.
      `${lead}${quote}${aliases[prefixes[prefix] as keyof Config['aliases']]}`,
  )
}
