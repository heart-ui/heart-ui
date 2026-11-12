import { afterEach, describe, expect, it } from 'vitest'
import { expectNoAxeViolations, focused, press, shiftTab, tab, unmountAll } from './harness'

afterEach(unmountAll)

function fixture(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.append(root)
  return root
}

describe('expectNoAxeViolations', () => {
  it('passes on accessible markup', async () => {
    await expectNoAxeViolations(fixture('<main><h1>Title</h1><button>Save</button></main>'))
  })

  it('fails naming the rule on an inaccessible element', async () => {
    const root = fixture('<main><button></button></main>')
    await expect(expectNoAxeViolations(root)).rejects.toThrow(/button-name/)
  })
})

describe('keyboard helpers', () => {
  it('tab and shiftTab move focus in document order', async () => {
    fixture('<button>One</button><button>Two</button>')
    await tab()
    expect(focused()?.textContent).toBe('One')
    await tab()
    expect(focused()?.textContent).toBe('Two')
    await shiftTab()
    expect(focused()?.textContent).toBe('One')
  })

  it('press sends a key to the focused element', async () => {
    const root = fixture('<input aria-label="Name" />')
    const keys: string[] = []
    const input = root.querySelector('input')!
    input.addEventListener('keydown', (event) => keys.push(event.key))
    input.focus()
    await press('Enter')
    await press('ArrowDown')
    expect(keys).toEqual(['Enter', 'ArrowDown'])
  })

  it('press sends single characters, descriptor characters included', async () => {
    const root = fixture('<input aria-label="Name" />')
    const input = root.querySelector('input')!
    input.focus()
    await press('{')
    await press('[')
    await press('}')
    await press('a')
    expect(input.value).toBe('{[}a')
  })
})
