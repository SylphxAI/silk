/**
 * CallExpression visitor for css() transformation
 */

import type { NodePath } from '@babel/core'
import type * as t from '@babel/types'
import type { PluginState } from '../types'
import { extractStaticStyles } from '../extractors/static-extractor'
import { generateAtomicCSS } from '../generators/css-generator'

/**
 * Check if a CallExpression is a css() call from @sylphx/silk
 */
function isSilkCssCall(
  path: NodePath<t.CallExpression>,
  t: typeof import('@babel/types'),
  importSources: string[]
): boolean {
  const callee = path.get('callee')

  // Must be an identifier named 'css'
  if (!callee.isIdentifier()) {
    return false
  }

  if (callee.node.name !== 'css') {
    return false
  }

  // Check if it's imported from one of the configured sources
  for (const source of importSources) {
    if (callee.referencesImport(source, 'css')) {
      return true
    }
  }

  return false
}

/**
 * Handle full compilation (all static styles)
 */
function handleFullCompilation(
  path: NodePath<t.CallExpression>,
  styles: Record<string, any>,
  state: PluginState,
  t: typeof import('@babel/types')
) {
  // Generate atomic CSS
  const { classNames, cssRules, className } = generateAtomicCSS(
    styles,
    state.opts
  )

  // Store CSS rules for metadata emission
  for (const [cls, rule] of cssRules) {
    state.cssRules.set(cls, rule)
    state.classNames.add(cls)
  }

  // Replace css() call with string literal
  path.replaceWith(t.stringLiteral(className))

  // Skip traversing the replacement to avoid infinite loop
  path.skip()
}

/**
 * Handle partial compilation (mix of static and dynamic)
 */
function handlePartialCompilation(
  path: NodePath<t.CallExpression>,
  styles: Record<string, any>,
  dynamicProps: Array<NodePath<t.ObjectProperty | t.SpreadElement>>,
  state: PluginState,
  t: typeof import('@babel/types')
) {
  // Generate CSS for static properties
  const { classNames, cssRules, className } = generateAtomicCSS(
    styles,
    state.opts
  )

  // Store CSS rules
  for (const [cls, rule] of cssRules) {
    state.cssRules.set(cls, rule)
    state.classNames.add(cls)
  }

  // Build object with only dynamic properties
  const dynamicObj = t.objectExpression(
    dynamicProps.map((prop) => prop.node as t.ObjectProperty | t.SpreadElement)
  )

  // Replace first argument with dynamic object
  const args = path.get('arguments')
  args[0].replaceWith(dynamicObj)

  // Add static class name as second argument
  if (className) {
    path.node.arguments.push(t.stringLiteral(className))
  }

  // Skip traversal
  path.skip()
}

/**
 * CallExpression visitor handler
 */
export function handleCallExpression(
  path: NodePath<t.CallExpression>,
  state: PluginState,
  t: typeof import('@babel/types')
) {
  // Get import sources from options (default: ['@sylphx/silk'])
  const importSources = state.opts.importSources || ['@sylphx/silk']

  // Check if this is a css() call from Silk
  if (!isSilkCssCall(path, t, importSources)) {
    return
  }

  // Must have exactly 1 or 2 arguments
  const args = path.get('arguments')
  if (args.length === 0 || args.length > 2) {
    return
  }

  // Try to extract static styles
  const extracted = extractStaticStyles(args[0], t)

  if (!extracted) {
    // Cannot extract - leave as runtime call
    return
  }

  // Check if we have any static styles
  const hasStaticStyles = Object.keys(extracted.styles).length > 0
  const hasDynamicProps = extracted.dynamicProps.length > 0

  if (!hasStaticStyles && !hasDynamicProps) {
    // Empty object - replace with empty string
    path.replaceWith(t.stringLiteral(''))
    path.skip()
    return
  }

  if (hasStaticStyles && !hasDynamicProps) {
    // Fully static - compile everything
    handleFullCompilation(path, extracted.styles, state, t)
  } else if (hasStaticStyles && hasDynamicProps) {
    // Partial compilation
    handlePartialCompilation(
      path,
      extracted.styles,
      extracted.dynamicProps,
      state,
      t
    )
  }
  // else: Only dynamic props - leave as runtime call
}
