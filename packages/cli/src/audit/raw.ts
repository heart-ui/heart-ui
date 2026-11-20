import { parse, parseExpression, type ParserPlugin } from '@babel/parser'
import {
  classHelpers,
  inClassLanding,
  isClassName,
  isLabelLanding,
  kebab,
  type Landing,
  passThrough,
  type Problem,
  problemsWhere,
} from '../../../eslint-plugin/src/raw-values.ts'
import { TooDeepError } from './scan.ts'

// A2 is the no-raw-values rule (packages/eslint-plugin/src/rules/no-raw-values.ts) run on an
// ESTree from @babel/parser instead of ESLint's: the walk, the skips and the three visitors below
// follow that file step for step, and both read strings through the same raw-values helpers.

/** An ESTree node from @babel/parser, with the `parent` link `nodes` sets. */
export type AnyNode = { type: string; start?: number | null; parent?: AnyNode | null } & Record<
  string,
  unknown
>

const skippedParents =
  /^(?:Import|Export(?:Named|All))Declaration$|^ImportExpression$|^TSExternalModuleReference$|^TSLiteralType$|^TSImportType$|^TSModuleDeclaration$/

function nameOf(node: unknown): string | undefined {
  const n = node as AnyNode | null | undefined
  if (n?.type === 'Identifier') return n.name as string
  if (n?.type === 'Literal' && typeof n.value === 'string') return n.value
  return undefined
}

/** The raw-value problems in a static attribute's value. */
export function attributeProblems(text: string, attribute: string): Set<Problem> {
  return problemsWhere(text, { attribute })
}

// One step of the rule's walk from `child` up to `parent`: stop where the string lands, or go
// on (after naming a property).
type Step = { stop: Landing } | { push?: string }

const named = (name: string | undefined): Landing =>
  name === undefined
    ? {}
    : {
        property: name === 'default' ? undefined : name,
        classProperty: isClassName(kebab(name)),
      }

function step(child: AnyNode, parent: AnyNode): Step {
  if (parent.type === 'ConditionalExpression' && parent.test === child) return { stop: {} }
  if (parent.type === 'Property') {
    if (parent.key === child) return { stop: {} }
    return { push: nameOf(parent.key) }
  }
  if (parent.type === 'VariableDeclarator' || parent.type === 'AssignmentPattern') {
    return { stop: named(nameOf(parent.type === 'VariableDeclarator' ? parent.id : parent.left)) }
  }
  if (parent.type === 'AssignmentExpression') {
    const target = parent.left as AnyNode
    const object = target.object as AnyNode | undefined
    if (parent.right === child && object?.type === 'MemberExpression') {
      if (nameOf(object.property) === 'style') return { stop: named(nameOf(target.property) ?? '') }
    }
    return { stop: {} }
  }
  if (parent.type === 'CallExpression') {
    const callee = parent.callee as AnyNode
    const args = parent.arguments as AnyNode[]
    if (callee.type === 'Identifier' && classHelpers.has(callee.name as string)) {
      return { stop: { classHelper: true } }
    }
    const method = callee.type === 'MemberExpression' ? nameOf(callee.property) : undefined
    const name = args[1] === child ? nameOf(args[0]) : undefined
    if (name && method === 'setAttribute') return { stop: { attribute: name } }
    if (name && method === 'setProperty') return { stop: named(name) }
    return { stop: {} }
  }
  if (parent.type === 'BinaryExpression') return parent.operator === '+' ? {} : { stop: {} }
  if (parent.type === 'ArrowFunctionExpression') return parent.body === child ? {} : { stop: {} }
  return passThrough.has(parent.type) ? {} : { stop: {} }
}

// A nearer name is pushed in front of the landing found further up. Only the nearest
// non-`default` name and whether any is a class name matter, so each push is O(1).
function pushName(base: Landing, name: string): Landing {
  return {
    ...base,
    property: name === 'default' ? base.property : name,
    classProperty: base.classProperty || isClassName(kebab(name)),
  }
}

// The rule's contextOf, memoised per node and walked without recursion, so a long chain
// (`'a' + 'a' + …`) costs one pass rather than one walk per string.
function landingFinder(rootAttribute: string | undefined) {
  const cache = new WeakMap<AnyNode, Landing>()
  return (node: AnyNode): Landing => {
    const path: { node: AnyNode; push?: string }[] = []
    let current = node
    let base: Landing
    for (;;) {
      const known = cache.get(current)
      if (known) {
        base = known
        break
      }
      const parent = current.parent
      // The expression's root is the rule's VExpressionContainer: the attribute applies.
      if (!parent || parent.type === 'File') {
        base = { attribute: rootAttribute }
        cache.set(current, base)
        break
      }
      const next = step(current, parent)
      if ('stop' in next) {
        base = next.stop
        cache.set(current, base)
        break
      }
      path.push({ node: current, push: next.push })
      current = parent
    }
    for (let k = path.length - 1; k >= 0; k--) {
      const { node: at, push } = path[k]!
      if (push) base = pushName(base, push)
      cache.set(at, base)
    }
    return base
  }
}

function isSkipped(node: AnyNode) {
  const parent = node.parent
  if (parent?.type === 'Property' && parent.key === node) return true
  const callee = parent?.callee as AnyNode | undefined
  if (
    parent?.type === 'CallExpression' &&
    callee?.type === 'Identifier' &&
    callee.name === 'require'
  ) {
    return true
  }
  return skippedParents.test(parent?.type ?? '')
}

const unit = /^(?:px|rem)(?![\w-])/i

/** A string's problems, at its offset in the parsed code. */
export type Located = { offset: number; problems: Set<Problem> }

/** Every node below `root`, each given its parent, without recursion. */
export function nodes(root: AnyNode): AnyNode[] {
  const found: AnyNode[] = []
  const stack: AnyNode[] = [root]
  while (stack.length) {
    const node = stack.pop()!
    found.push(node)
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'loc' || key === 'extra' || /comments$/i.test(key)) continue
      const value = node[key]
      for (const child of Array.isArray(value) ? value : [value]) {
        if (child && typeof child === 'object' && typeof (child as AnyNode).type === 'string') {
          ;(child as AnyNode).parent = node
          stack.push(child as AnyNode)
        }
      }
    }
  }
  return found
}

/** The raw-value problems in a parsed tree; `attribute` is where a template expression lands. */
export function rawStrings(root: AnyNode, attribute?: string): Located[] {
  const landingOf = landingFinder(attribute)
  const results: Located[] = []
  const report = (node: AnyNode, problems: Set<Problem>) => {
    if (problems.size) results.push({ offset: node.start ?? 0, problems })
  }
  for (const node of nodes(root)) {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const property = node.parent
      if (property?.type === 'Property' && property.key === node && !property.computed) {
        const landing = landingOf(property)
        if (inClassLanding(landing)) report(node, problemsWhere(node.value, landing, true))
      } else if (!isSkipped(node)) {
        report(node, problemsWhere(node.value, landingOf(node)))
      }
    } else if (node.type === 'TemplateLiteral') {
      if (isSkipped(node)) continue
      const quasis = (node.quasis as AnyNode[]).map((quasi) => {
        const value = quasi.value as { cooked?: string | null; raw: string }
        return value.cooked ?? value.raw
      })
      const landing = landingOf(node)
      if (isLabelLanding(landing)) continue
      // `x` stands in for each expression: it can't complete a hex color or a number.
      const problems = problemsWhere(quasis.join('x'), landing)
      if (!problems.has('arbitraryValue') && quasis.slice(1).some((quasi) => unit.test(quasi))) {
        problems.add('rawLength')
      }
      report(node, problems)
    } else if (node.type === 'BinaryExpression' && node.operator === '+') {
      const right = node.right as AnyNode
      const quasis = right.quasis as AnyNode[] | undefined
      const text =
        right.type === 'Literal' && typeof right.value === 'string'
          ? right.value
          : right.type === 'TemplateLiteral' && (right.expressions as unknown[]).length === 0
            ? (quasis?.[0]?.value as { cooked?: string } | undefined)?.cooked
            : undefined
      if (text != null && unit.test(text) && !isLabelLanding(landingOf(node))) {
        report(node, new Set(['rawLength']))
      }
    }
  }
  return results
}

/** A parsed script or expression, or null when it isn't valid code. */
export type Tree = AnyNode | null

function plugins(jsx: boolean): ParserPlugin[] {
  const base: ParserPlugin[] = [
    'estree',
    'typescript',
    'decorators',
    'decoratorAutoAccessors',
    'deferredImportEvaluation',
  ]
  return jsx ? [...base, 'jsx'] : base
}

// Babel counts the lines a block comment spans by searching from its start for the next line
// break anywhere in the input (skipBlockComment), so many block comments on one long line cost
// O(comments × line length). This is that cost, worked out in one pass before parsing.
const MAX_COMMENT_SCAN = 20_000_000

function blockCommentScan(code: string): number {
  let total = 0
  let nextBreak = code.length
  for (let i = code.length - 1; i >= 0; i--) {
    const char = code[i]
    if (char === '\n' || char === '\r' || char === '\u2028' || char === '\u2029') nextBreak = i
    else if (char === '/' && code[i + 1] === '*') total += nextBreak - i
  }
  return total
}

// No error recovery, as ESLint's parser has none, and no comment attachment, which nothing
// reads: both make Babel copy growing lists at each TypeScript `<` lookahead.
function parsed(code: string, run: () => unknown): Tree {
  if (blockCommentScan(code) > MAX_COMMENT_SCAN) throw new TooDeepError('comments')
  // Babel reports bad code by throwing; a stack trace per throw is most of its cost.
  const limit = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  try {
    return run() as AnyNode
  } catch (error) {
    // Babel recurses on nesting: crafted code overflows its stack.
    if (error instanceof RangeError) throw new TooDeepError('code')
    // Any other failure is Babel rejecting the code; it isn't the user's file system or ours.
    return null
  } finally {
    Error.stackTraceLimit = limit
  }
}

/** Parses a script block or file. */
export function parseScript(code: string, jsx = false): Tree {
  return parsed(code, () =>
    parse(code, {
      sourceType: 'module',
      attachComment: false,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
      plugins: plugins(jsx),
    }),
  )
}

// A bare name or member path holds no string: no parse needed.
const plainPath = /^\s*[\w$]+(?:\s*\??\.\s*[\w$]+)*\s*$/

/** Whether a template expression needs a parse (it isn't a bare name or member path). */
export const needsParse = (code: string) => !plainPath.test(code)

/** Parses a template expression; `statements` for a `v-on` handler. */
export function parseTemplateCode(code: string, statements: boolean): Tree {
  if (plainPath.test(code)) return { type: 'Identifier', name: code.trim(), start: 0 }
  if (statements) return parseScript(code)
  return parsed(code, () =>
    parseExpression(code, { attachComment: false, plugins: plugins(false) }),
  )
}
