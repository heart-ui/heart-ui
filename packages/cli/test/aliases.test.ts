import { describe, expect, it } from 'vitest'
import { rewriteImports } from '../src/aliases.ts'
import type { Config } from '../src/config.ts'

const aliases: Config['aliases'] = {
  ui: '~/ui',
  blocks: '#blocks',
  layouts: '@/app/layouts',
  lib: '~/utils/$lib',
}

describe('AC-011 alias rewriting', () => {
  it.each([
    [
      'ui',
      "import { Button } from '@/components/ui/button'",
      "import { Button } from '~/ui/button'",
    ],
    ['blocks', "import Grid from '@/components/blocks/grid'", "import Grid from '#blocks/grid'"],
    [
      'layouts',
      "import Shell from '@/layouts/app-shell/Shell.vue'",
      "import Shell from '@/app/layouts/app-shell/Shell.vue'",
    ],
    [
      'lib',
      "import { cn } from '@/lib/utils/utils'",
      "import { cn } from '~/utils/$lib/utils/utils'",
    ],
  ])('rewrites the %s alias', (_, source, expected) => {
    expect(rewriteImports(source, aliases)).toBe(expected)
  })

  it('rewrites every import form', () => {
    const source = [
      "import Icon from '@/lib/icon'",
      "import type { Size } from '@/components/ui/button'",
      'import {',
      '  a,',
      '  b,',
      "} from '@/components/ui/input'",
      'import "@/lib/styles.css"',
      "export * from '@/components/blocks/grid'",
      "export { c } from '@/lib'",
      "const page = () => import('@/layouts/page.vue')",
      'const lazy = import( "@/components/ui/dialog" )',
    ].join('\n')
    expect(rewriteImports(source, aliases)).toBe(
      [
        "import Icon from '~/utils/$lib/icon'",
        "import type { Size } from '~/ui/button'",
        'import {',
        '  a,',
        '  b,',
        "} from '~/ui/input'",
        'import "~/utils/$lib/styles.css"',
        "export * from '#blocks/grid'",
        "export { c } from '~/utils/$lib'",
        "const page = () => import('@/app/layouts/page.vue')",
        'const lazy = import( "~/ui/dialog" )',
      ].join('\n'),
    )
  })

  it('rewrites imports in a .vue file', () => {
    const source = `<script setup lang="ts">
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Button :class="cn('a')">@/lib/utils stays in the template</Button>
</template>
`
    expect(rewriteImports(source, aliases)).toBe(`<script setup lang="ts">
import { cn } from '~/utils/$lib/utils/utils'
import { Button } from '~/ui/button'
</script>

<template>
  <Button :class="cn('a')">@/lib/utils stays in the template</Button>
</template>
`)
  })

  it('leaves lookalikes and other strings alone', () => {
    const source = [
      "import x from '@/library/x'",
      "import y from '@/components/uikit/y'",
      "import z from '@/layoutsx'",
      "import { Icon } from '@iconify/vue'",
      "import w from './lib/w'",
      "const path = '@/lib/utils'",
      "transform('@/components/ui/button')",
    ].join('\n')
    expect(rewriteImports(source, aliases)).toBe(source)
  })

  it('changes nothing with the default aliases', () => {
    const source = "import { cn } from '@/lib/utils/utils'\nimport B from '@/components/ui/button'"
    expect(
      rewriteImports(source, {
        ui: '@/components/ui',
        blocks: '@/components/blocks',
        layouts: '@/layouts',
        lib: '@/lib',
      }),
    ).toBe(source)
  })
})

describe('AC-011 template-literal imports', () => {
  it('rewrites a dynamic import written with backticks', () => {
    const source = 'const m = await import(`@/lib/icons/${name}`)'
    expect(rewriteImports(source, aliases)).toBe(
      'const m = await import(`~/utils/$lib/icons/${name}`)',
    )
  })
})
