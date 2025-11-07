/**
 * Static value extraction from AST
 */

import type { NodePath } from '@babel/core'
import type * as t from '@babel/types'
import type { ExtractedStyles } from '../types'

/**
 * Extract static styles from a css() call argument
 *
 * @param path - NodePath to the first argument of css()
 * @param t - Babel types
 * @returns Extracted styles and dynamic properties, or null if cannot extract
 */
export function extractStaticStyles(
  path: NodePath,
  t: typeof import('@babel/types')
): ExtractedStyles | null {
  // Must be an ObjectExpression
  if (!path.isObjectExpression()) {
    return null
  }

  const styles: Record<string, any> = {}
  const dynamicProps: Array<NodePath<t.ObjectProperty | t.SpreadElement>> = []

  const properties = path.get('properties')

  for (const prop of properties) {
    // Handle spread elements
    if (prop.isSpreadElement()) {
      const arg = prop.get('argument') as NodePath
      const evaluation = arg.evaluate()

      if (evaluation.confident && typeof evaluation.value === 'object') {
        // Static spread - inline the values
        Object.assign(styles, evaluation.value)
      } else {
        // Dynamic spread - cannot compile
        return null
      }

      continue
    }

    // Must be ObjectProperty
    if (!prop.isObjectProperty()) {
      continue
    }

    const propertyNode = prop as NodePath<t.ObjectProperty>

    // Get property key
    const keyPath = propertyNode.get('key') as NodePath
    let key: string | null = null

    if (propertyNode.node.computed) {
      // Computed property: { [key]: value }
      const keyEval = keyPath.evaluate()
      if (keyEval.confident && typeof keyEval.value === 'string') {
        key = keyEval.value
      } else {
        // Dynamic computed key
        dynamicProps.push(propertyNode)
        continue
      }
    } else {
      // Regular property
      if (t.isIdentifier(keyPath.node)) {
        key = keyPath.node.name
      } else if (t.isStringLiteral(keyPath.node)) {
        key = keyPath.node.value
      } else {
        dynamicProps.push(propertyNode)
        continue
      }
    }

    if (!key) {
      dynamicProps.push(propertyNode)
      continue
    }

    // Get property value
    const valuePath = propertyNode.get('value') as NodePath
    const valueEval = valuePath.evaluate()

    if (valueEval.confident) {
      // Static value
      styles[key] = valueEval.value
    } else {
      // Dynamic value
      dynamicProps.push(propertyNode)
    }
  }

  return { styles, dynamicProps }
}

/**
 * Check if a css() call can be fully compiled (no dynamic values)
 *
 * @param path - NodePath to CallExpression
 * @param t - Babel types
 * @returns True if fully compilable
 */
export function canFullyCompile(
  path: NodePath<t.CallExpression>,
  t: typeof import('@babel/types')
): boolean {
  const args = path.get('arguments')
  if (args.length !== 1) {
    return false
  }

  const extracted = extractStaticStyles(args[0], t)
  return extracted !== null && extracted.dynamicProps.length === 0
}

/**
 * Determine compilation level for a css() call
 *
 * @param path - NodePath to CallExpression
 * @param t - Babel types
 * @returns 'full', 'partial', or 'none'
 */
export function getCompilationLevel(
  path: NodePath<t.CallExpression>,
  t: typeof import('@babel/types')
): 'full' | 'partial' | 'none' {
  const args = path.get('arguments')
  if (args.length !== 1) {
    return 'none'
  }

  const extracted = extractStaticStyles(args[0], t)

  if (!extracted) {
    return 'none'
  }

  if (extracted.dynamicProps.length === 0) {
    return 'full'
  }

  if (Object.keys(extracted.styles).length > 0) {
    return 'partial'
  }

  return 'none'
}
