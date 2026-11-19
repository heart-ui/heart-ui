import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { activity, customers, orders, stats } from '../registry/blocks/_fixtures'

describe('block fixtures', () => {
  it('holds enough rows for a long state, and four stats', () => {
    expect(customers.length).toBeGreaterThanOrEqual(30)
    expect(orders.length).toBeGreaterThanOrEqual(30)
    expect(activity.length).toBeGreaterThanOrEqual(30)
    expect(stats).toHaveLength(4)
  })

  it('uses unique ids and points at real customers', () => {
    for (const list of [customers, orders, activity, stats]) {
      const ids = list.map((entry) => entry.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    const known = new Set(customers.map((customer) => customer.id))
    for (const order of orders) expect(known.has(order.customerId), order.id).toBe(true)
    for (const event of activity) expect(known.has(event.customerId), event.id).toBe(true)
  })

  it('fills every field with a usable value', () => {
    for (const customer of customers) {
      expect(customer.name.length).toBeGreaterThan(0)
      expect(customer.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/)
    }
    for (const order of orders) {
      expect(Number.isInteger(order.totalCents)).toBe(true)
      expect(Number.isNaN(Date.parse(order.placedAt))).toBe(false)
    }
    for (const event of activity) expect(Number.isNaN(Date.parse(event.at))).toBe(false)
  })

  it('walks dates back one day per row, with no gaps', () => {
    const day = 86_400_000
    for (const list of [orders.map((o) => o.placedAt), activity.map((e) => e.at)]) {
      const times = list.map((at) => Date.parse(at))
      times.slice(1).forEach((time, at) => {
        const gap = times[at]! - time
        expect(gap, list[at + 1]).toBeGreaterThan(0)
        expect(gap, list[at + 1]).toBeLessThan(2 * day)
      })
    }
  })

  it('is deterministic: no clock or random values', () => {
    const source = readFileSync(
      join(import.meta.dirname, '../registry/blocks/_fixtures/index.ts'),
      'utf8',
    )
    expect(source).not.toMatch(/Date\.now|new Date\(\)|Math\.random/)
  })
})
