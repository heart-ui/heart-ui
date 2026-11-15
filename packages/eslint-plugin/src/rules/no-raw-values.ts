import type { Rule } from 'eslint'
import { findProblems, hasNamedColor, isColorProperty, type Problem } from '../raw-values'

type AnyNode = { type: string; parent?: AnyNode } & Record<string, unknown>

type TemplateServices = {
  defineTemplateBodyVisitor?: (
    templateVisitor: Record<string, (node: never) => void>,
    scriptVisitor: Rule.RuleListener,
  ) => Rule.RuleListener
}

// Where a string ends up: the template attribute it is bound to, and the property names on the way
// there, nearest first (`:to="{ hash: '#add' }"` → attribute `to`, properties `hash`), and
// whether it is an argument of a class helper such as `cn()`.
type Context = { attribute?: string; properties: string[]; classHelper?: boolean }

// Hex in these is an anchor or id (`href="#add"`), not a color.
const hexFreeAttributes = new Set(['href', 'xlink:href', 'to', 'id', 'for'])
const hexFreeProperties = new Set(['href', 'hash', 'id'])
const classHelpers = new Set(['cn', 'clsx', 'cva', 'cx', 'tv', 'twMerge', 'twJoin'])

function isClassName(name: string) {
  return /^(?:class|classes|class-name|ui)$|-class(?:es)?$/.test(name)
}

function inClassContext(context: Context) {
  if (context.classHelper) return true
  if (context.attribute !== undefined && isClassName(kebab(context.attribute))) return true
  return context.properties.some((name) => isClassName(kebab(name)))
}

// Nodes a value passes through unchanged on its way to the attribute or property that uses it.
const passThrough = new Set([
  'ConditionalExpression',
  'LogicalExpression',
  'ArrayExpression',
  'ObjectExpression',
  'TemplateLiteral',
  'ChainExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
])

function kebab(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function nameOf(node: unknown): string | undefined {
  const n = node as AnyNode | null | undefined
  if (n?.type === 'Identifier') return n.name as string
  // vue-eslint-parser lowercases directive arguments in `name`; `rawName` keeps `activeClass`.
  if (n?.type === 'VIdentifier') return (n.rawName ?? n.name) as string
  if (n?.type === 'Literal' && typeof n.value === 'string') return n.value
  return undefined
}

function attributeName(attribute: AnyNode) {
  const key = attribute.key as AnyNode
  if (attribute.directive) return nameOf(key.argument)
  return (key.rawName ?? key.name) as string
}

function contextOf(node: AnyNode): Context {
  const properties: string[] = []
  let child = node
  let parent = node.parent
  while (parent) {
    if (parent.type === 'ConditionalExpression' && parent.test === child) break
    if (parent.type === 'Property') {
      if (parent.key === child) break
      const name = nameOf(parent.key)
      if (name) properties.push(name)
    } else if (parent.type === 'VExpressionContainer') {
      const attribute = parent.parent
      return {
        attribute: attribute?.type === 'VAttribute' ? attributeName(attribute) : undefined,
        properties,
      }
    } else if (parent.type === 'VariableDeclarator' || parent.type === 'AssignmentPattern') {
      const name = nameOf(parent.type === 'VariableDeclarator' ? parent.id : parent.left)
      if (name) properties.push(name)
      break
    } else if (parent.type === 'AssignmentExpression') {
      const target = parent.left as AnyNode
      const object = target.object as AnyNode | undefined
      if (parent.right === child && object?.type === 'MemberExpression') {
        if (nameOf(object.property) === 'style') properties.push(nameOf(target.property) ?? '')
      }
      break
    } else if (parent.type === 'CallExpression') {
      const callee = parent.callee as AnyNode
      const args = parent.arguments as AnyNode[]
      if (callee.type === 'Identifier' && classHelpers.has(callee.name as string)) {
        return { properties, classHelper: true }
      }
      const method = callee.type === 'MemberExpression' ? nameOf(callee.property) : undefined
      const name = args[1] === child ? nameOf(args[0]) : undefined
      if (name && method === 'setAttribute') return { attribute: name, properties }
      if (name && method === 'setProperty') properties.push(name)
      break
    } else if (parent.type === 'BinaryExpression') {
      // `n + 'px' + ' wide'`: a concatenation lands where the whole expression does.
      if (parent.operator !== '+') break
    } else if (parent.type === 'ArrowFunctionExpression') {
      // `const sizeLabel = (n) => \`${n}px wide\``: the returned value lands where the function does.
      if (parent.body !== child) break
    } else if (!passThrough.has(parent.type)) {
      break
    }
    child = parent
    parent = parent.parent
  }
  return { properties }
}

// The name that decides how a string is read: the nearest property, past a runtime prop's
// `default`, or else the attribute.
function nearestName(context: Context) {
  return context.properties.find((name) => name !== 'default') ?? context.attribute
}

// CLAUDE.md allows English text only in `*Label` props: those carry words, not styles.
function isLabel(context: Context) {
  const name = nearestName(context)
  return name !== undefined && (/[a-z0-9]Label$/.test(name) || /-label$/.test(name))
}

function problemsIn(text: string, context: Context, keyOfClassMap = false): Set<Problem> {
  if (isLabel(context)) return new Set()
  const attribute = context.attribute === undefined ? undefined : kebab(context.attribute)
  const classes = keyOfClassMap || attribute === undefined || inClassContext(context)
  const nearestProperty = context.properties.find((name) => name !== 'default')
  const skipHex =
    nearestProperty !== undefined
      ? hexFreeProperties.has(kebab(nearestProperty))
      : attribute !== undefined && hexFreeAttributes.has(attribute)
  const problems = new Set(findProblems(text, { classes, skipHex }))
  const nearest = nearestName(context)
  const colorName = nearest === undefined ? undefined : kebab(nearest)
  if (colorName && !isClassName(colorName) && isColorProperty(colorName) && hasNamedColor(text)) {
    problems.add('rawColor')
  }
  return problems
}

// An object key names a class only in a class context: `:class="{ 'bg-x': on }"` or `cn({ … })`.
function classMapKey(node: AnyNode): Context | undefined {
  const property = node.parent
  if (property?.type !== 'Property' || property.key !== node || property.computed) return undefined
  const context = contextOf(property)
  return inClassContext(context) ? context : undefined
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
  return /^(?:Import|Export(?:Named|All))Declaration$|^ImportExpression$|^TSExternalModuleReference$|^TSLiteralType$|^TSImportType$|^TSModuleDeclaration$/.test(
    parent?.type ?? '',
  )
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow raw colors, lengths, palette and arbitrary classes, and dark:' },
    schema: [],
    messages: {
      rawColor: 'Raw color: use a color token utility (docs/tokens.md).',
      paletteClass: 'Tailwind palette class: use a semantic color utility such as bg-primary.',
      arbitraryValue: 'Arbitrary-value class: use a token utility instead.',
      rawToken: '--h-raw-* is internal to the theme: use a semantic token.',
      darkVariant: 'dark: variant: tokens switch for dark mode, so style once.',
      rawLength: 'Pixel or rem literal: use a token or spacing utility.',
    },
  },
  create(context) {
    function report(node: unknown, problems: Iterable<Problem>) {
      for (const messageId of problems) context.report({ node: node as Rule.Node, messageId })
    }

    const scriptVisitor: Rule.RuleListener = {
      Literal(node) {
        const n = node as unknown as AnyNode
        if (typeof node.value !== 'string') return
        const keyContext = classMapKey(n)
        if (keyContext) report(node, problemsIn(node.value, keyContext, true))
        else if (!isSkipped(n)) report(node, problemsIn(node.value, contextOf(n)))
      },
      TemplateLiteral(node) {
        const n = node as unknown as AnyNode
        if (isSkipped(n)) return
        const quasis = node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw)
        const context = contextOf(n)
        if (isLabel(context)) return
        // `x` stands in for each expression: it can't complete a hex color or a number.
        const problems = problemsIn(quasis.join('x'), context)
        if (
          !problems.has('arbitraryValue') &&
          quasis.slice(1).some((quasi) => /^(?:px|rem)(?![\w-])/i.test(quasi))
        ) {
          problems.add('rawLength')
        }
        report(node, problems)
      },
      BinaryExpression(node) {
        const right = node.right
        const unit =
          right.type === 'Literal' && typeof right.value === 'string'
            ? right.value
            : right.type === 'TemplateLiteral' && right.expressions.length === 0
              ? right.quasis[0]?.value.cooked
              : undefined
        if (
          node.operator === '+' &&
          unit != null &&
          /^(?:px|rem)(?![\w-])/i.test(unit) &&
          !isLabel(contextOf(node as unknown as AnyNode))
        ) {
          report(node, ['rawLength'])
        }
      },
    }

    const services = context.sourceCode.parserServices as TemplateServices | undefined
    if (!services?.defineTemplateBodyVisitor) return scriptVisitor

    return services.defineTemplateBodyVisitor(
      {
        ...(scriptVisitor as Record<string, (node: never) => void>),
        VAttribute(node: AnyNode) {
          const value = node.value as AnyNode | null
          if (node.directive || value?.type !== 'VLiteral') return
          const attribute = attributeName(node)
          report(value, problemsIn(value.value as string, { attribute, properties: [] }))
        },
      },
      scriptVisitor,
    )
  },
}

export default rule
