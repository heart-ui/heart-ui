/** The states a block or layout demo can show: its normal view, then meta.states. */
export type DemoState = 'default' | 'empty' | 'loading' | 'error' | 'long'

/** What a gallery hands a demo: the `?state=` asked for, and the states its item renders. */
export type ProvidedDemoState = { state: string | undefined; states: DemoState[] }

/** The provide/inject key for ProvidedDemoState. */
export const demoStateKey = 'heart-demo-state'
