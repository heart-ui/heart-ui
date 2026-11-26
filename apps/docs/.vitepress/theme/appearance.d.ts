// The docs' appearance switches, aliased in config.ts. Declared here so the type check reads this, not
// VitePress's untyped internals behind them.
declare module 'vitepress-appearance/switch' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module 'vitepress-appearance/screen' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}
