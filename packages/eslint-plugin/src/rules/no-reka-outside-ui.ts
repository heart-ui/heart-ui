import type { Rule } from 'eslint'

type AnyNode = { type: string } & Record<string, unknown>

function sourceOf(node: unknown): string | undefined {
  const n = node as AnyNode | null | undefined
  if (n?.type === 'Literal' && typeof n.value === 'string') return n.value
  if (n?.type === 'TemplateLiteral') {
    // `reka-ui/${name}` still names reka-ui: its first part is enough.
    const [quasi] = n.quasis as { value: { cooked: string | null } }[]
    return quasi?.value.cooked ?? undefined
  }
  if (n?.type === 'TSLiteralType') return sourceOf(n.literal)
  return undefined
}

function isReka(source: string | undefined) {
  return source === 'reka-ui' || source?.startsWith('reka-ui/') === true
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Allow reka-ui imports only inside registry/ui/' },
    schema: [],
    messages: {
      rekaOutsideUi:
        'reka-ui is imported only inside registry/ui/: use the TrevUI component instead.',
    },
  },
  create(context) {
    // The nearest registry/ folder decides, whatever the cwd, so a checkout under some other
    // registry/ui/ isn't exempt and a component in this one always is.
    const path = `/${context.filename.replaceAll('\\', '/')}`
    if (path.startsWith('/registry/ui/', path.lastIndexOf('/registry/'))) return {}

    function check(node: unknown, source: unknown) {
      if (isReka(sourceOf(source))) {
        context.report({ node: node as Rule.Node, messageId: 'rekaOutsideUi' })
      }
    }

    const listener: Rule.RuleListener = {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
          check(node, node.arguments[0])
        }
      },
    }
    // TypeScript nodes, outside ESTree's types: `import('reka-ui').Props`, `import x = require('reka-ui')`.
    return Object.assign(listener, {
      TSImportType: (node: AnyNode) => check(node, node.argument ?? node.source),
      TSExternalModuleReference: (node: AnyNode) => check(node, node.expression),
    })
  },
}

export default rule
