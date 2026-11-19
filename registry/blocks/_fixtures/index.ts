// Sample data for block and layout demos: fixed values, so screenshots never change between runs.

export type Customer = {
  id: string
  name: string
  email: string
  company: string
  plan: 'free' | 'team' | 'enterprise'
  status: 'active' | 'trial' | 'churned'
}

export type Order = {
  id: string
  customerId: string
  totalCents: number
  currency: 'EUR' | 'USD'
  status: 'paid' | 'pending' | 'refunded'
  placedAt: string
}

export type ActivityEvent = {
  id: string
  customerId: string
  kind: 'signed-up' | 'upgraded' | 'invited' | 'commented' | 'exported'
  summary: string
  at: string
}

export type Stat = {
  id: string
  label: string
  value: number
  unit: 'count' | 'cents' | 'percent'
  change: number
}

const people = [
  ['Ada Lovelace', 'Analytical Engines'],
  ['Grace Hopper', 'Cobol Works'],
  ['Alan Turing', 'Bletchley Labs'],
  ['Katherine Johnson', 'Orbital Math'],
  ['Edsger Dijkstra', 'Shortest Path'],
  ['Barbara Liskov', 'Substitution Co'],
  ['Donald Knuth', 'Literate Press'],
  ['Margaret Hamilton', 'Apollo Software'],
  ['Linus Torvalds', 'Kernel House'],
  ['Radia Perlman', 'Spanning Tree'],
  ['Ken Thompson', 'Unix Studio'],
  ['Frances Allen', 'Optimizing Compilers'],
  ['John Backus', 'Formula Translation'],
  ['Hedy Lamarr', 'Frequency Hop'],
  ['Tim Berners-Lee', 'Hypertext Inc'],
  ['Shafi Goldwasser', 'Zero Knowledge'],
  ['Leslie Lamport', 'Paxos Partners'],
  ['Adele Goldberg', 'Smalltalk Group'],
  ['Niklaus Wirth', 'Pascal Systems'],
  ['Annie Easley', 'Centaur Rockets'],
  ['Bjarne Stroustrup', 'Classes Ltd'],
  ['Sophie Wilson', 'Acorn Design'],
  ['Guido van Rossum', 'Python Place'],
  ['Jean Bartik', 'Eniac Group'],
  ['Dennis Ritchie', 'C Language Co'],
  ['Evelyn Berezin', 'Word Processing'],
  ['Vint Cerf', 'Packet Network'],
  ['Mary Kenneth Keller', 'Basic Learning'],
  ['Brian Kernighan', 'Awk Tools'],
  ['Joan Clarke', 'Cipher Bureau'],
  ['Yukihiro Matsumoto', 'Gem Factory'],
  ['Karen Sparck Jones', 'Inverse Document'],
  ['James Gosling', 'Coffee Runtime'],
  ['Lynn Conway', 'Chip Design'],
  ['Anders Hejlsberg', 'Typed Scripts'],
  ['Carol Shaw', 'River Raid Games'],
] as const

const plans = ['free', 'team', 'enterprise'] as const
const customerStatuses = ['active', 'active', 'trial', 'active', 'churned'] as const
const pad = (n: number) => String(n).padStart(3, '0')

export const customers: Customer[] = people.map(([name, company], at) => ({
  id: `cus_${pad(at + 1)}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  company,
  plan: plans[at % plans.length]!,
  status: customerStatuses[at % customerStatuses.length]!,
}))

const orderStatuses = ['paid', 'paid', 'pending', 'paid', 'refunded'] as const

// Dates walk back from 2026-11-18, one day per row, at an hour that shifts by `hourStep`.
const start = Date.UTC(2026, 10, 18, 0, 15)
const hours = 3_600_000
const dateAt = (at: number, hourStep: number) =>
  new Date(start - at * 24 * hours + ((9 + at * hourStep) % 24) * hours)
    .toISOString()
    .replace('.000Z', 'Z')

export const orders: Order[] = Array.from({ length: 36 }, (_, at) => ({
  id: `ord_${pad(at + 1)}`,
  customerId: customers[(at * 7) % customers.length]!.id,
  totalCents: 1900 + ((at * 4733) % 98000),
  currency: at % 4 === 0 ? 'USD' : 'EUR',
  status: orderStatuses[at % orderStatuses.length]!,
  placedAt: dateAt(at, 5),
}))

const kinds = ['signed-up', 'upgraded', 'invited', 'commented', 'exported'] as const
const summaries: Record<ActivityEvent['kind'], string> = {
  'signed-up': 'Signed up for a free plan',
  upgraded: 'Upgraded to the team plan',
  invited: 'Invited two teammates',
  commented: 'Commented on the quarterly report',
  exported: 'Exported orders as CSV',
}

export const activity: ActivityEvent[] = Array.from({ length: 32 }, (_, at) => {
  const kind = kinds[at % kinds.length]!
  return {
    id: `evt_${pad(at + 1)}`,
    customerId: customers[(at * 5) % customers.length]!.id,
    kind,
    summary: summaries[kind],
    at: dateAt(at, 3),
  }
})

export const stats: Stat[] = [
  { id: 'revenue', label: 'Revenue', value: 4821000, unit: 'cents', change: 12.4 },
  { id: 'customers', label: 'Active customers', value: 1284, unit: 'count', change: 3.1 },
  { id: 'orders', label: 'Orders', value: 342, unit: 'count', change: -4.6 },
  { id: 'churn', label: 'Churn', value: 2.3, unit: 'percent', change: -0.4 },
]
