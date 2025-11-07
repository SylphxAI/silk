/**
 * Modern CSS Features Support
 * - Container Queries (93% browser support)
 * - @scope (85% browser support)
 * - @starting-style (88% browser support)
 * - View Transitions (75% browser support, Interop 2025)
 */

import type { DesignConfig, TypedStyleProps } from './types.js'

export interface ModernCSSConfig {
  /** Enable container queries (default: true) */
  containerQueries?: boolean
  /** Enable @scope (default: true) */
  scope?: boolean
  /** Enable @starting-style (default: true) */
  startingStyle?: boolean
  /** Enable view transitions (default: false, experimental) */
  viewTransitions?: boolean
}

export const defaultModernCSSConfig: Required<ModernCSSConfig> = {
  containerQueries: true,
  scope: true,
  startingStyle: true,
  viewTransitions: false,
}

/**
 * Check if browser supports container queries
 */
export function supportsContainerQueries(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports === 'undefined') {
    return true // Assume supported in build environments
  }
  return CSS.supports('container-type', 'inline-size')
}

/**
 * Check if browser supports @scope
 */
export function supportsScope(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports === 'undefined') {
    return true
  }
  return CSS.supports('selector(@scope)')
}

/**
 * Check if browser supports @starting-style
 */
export function supportsStartingStyle(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports === 'undefined') {
    return true
  }
  return CSS.supports('@starting-style')
}

/**
 * Generate container query CSS
 *
 * @example
 * generateContainerQuery('card', '(min-width: 400px)', 'display: flex;')
 * → '@container card (min-width: 400px) { .x0 { display: flex; } }'
 */
export function generateContainerQuery(
  className: string,
  containerName: string | undefined,
  query: string,
  styles: string
): string {
  const name = containerName ? `${containerName} ` : ''
  return `@container ${name}${query}{${className}{${styles}}}`
}

/**
 * Generate @scope CSS
 *
 * @example
 * generateScopeCSS('.card', '.footer', '.btn', 'color: blue;')
 * → '@scope (.card) to (.footer) { .btn { color: blue; } }'
 */
export function generateScopeCSS(
  root: string,
  limit: string | undefined,
  className: string,
  styles: string
): string {
  const limitClause = limit ? ` to (${limit})` : ''
  return `@scope (${root})${limitClause}{${className}{${styles}}}`
}

/**
 * Generate @starting-style CSS
 *
 * @example
 * generateStartingStyle('.btn', 'opacity: 0;')
 * → '@starting-style { .btn { opacity: 0; } }'
 */
export function generateStartingStyle(className: string, styles: string): string {
  return `@starting-style{${className}{${styles}}}`
}

/**
 * Parse container query string
 * Extracts container name and query condition
 *
 * @example
 * parseContainerQuery('@container card (min-width: 400px)')
 * → { name: 'card', query: '(min-width: 400px)' }
 *
 * parseContainerQuery('@container (min-width: 400px)')
 * → { name: undefined, query: '(min-width: 400px)' }
 */
export function parseContainerQuery(queryString: string): {
  name: string | undefined
  query: string
} {
  // Remove '@container' prefix
  const cleaned = queryString.replace(/^@container\s+/, '')

  // Check if it starts with a name (identifier followed by space and parenthesis)
  const nameMatch = cleaned.match(/^([a-zA-Z][\w-]*)\s+(\(.+\))$/)

  if (nameMatch && nameMatch[1] && nameMatch[2]) {
    return {
      name: nameMatch[1],
      query: nameMatch[2],
    }
  }

  // No name, just query
  return {
    name: undefined,
    query: cleaned,
  }
}

/**
 * Check if a key is a container query
 */
export function isContainerQuery(key: string): boolean {
  return key.startsWith('@container')
}

/**
 * Check if a key is @scope
 */
export function isScope(key: string): boolean {
  return key === '@scope'
}

/**
 * Check if a key is @starting-style
 */
export function isStartingStyle(key: string): boolean {
  return key === '@starting-style'
}

/**
 * Get all modern CSS features from style props
 */
export function extractModernCSSFeatures<C extends DesignConfig>(
  props: TypedStyleProps<C>
): {
  containerQueries: Array<{ key: string; styles: TypedStyleProps<C> }>
  scope: { root?: string; limit?: string; styles: TypedStyleProps<C> } | null
  startingStyle: TypedStyleProps<C> | null
  baseProps: Record<string, any>
  containerSetup: { type?: string; name?: string }
} {
  const containerQueries: Array<{ key: string; styles: TypedStyleProps<C> }> = []
  let scope: { root?: string; limit?: string; styles: TypedStyleProps<C> } | null = null
  let startingStyle: TypedStyleProps<C> | null = null
  const baseProps: Record<string, any> = {}
  const containerSetup: { type?: string; name?: string } = {}

  for (const [key, value] of Object.entries(props)) {
    if (isContainerQuery(key)) {
      containerQueries.push({ key, styles: value as TypedStyleProps<C> })
    } else if (isScope(key)) {
      scope = value as any
    } else if (isStartingStyle(key)) {
      startingStyle = value as TypedStyleProps<C>
    } else if (key === 'containerType') {
      containerSetup.type = value as string
    } else if (key === 'containerName') {
      containerSetup.name = value as string
    } else {
      baseProps[key] = value
    }
  }

  return {
    containerQueries,
    scope,
    startingStyle,
    baseProps,
    containerSetup,
  }
}

/**
 * Generate modern CSS compatibility report
 */
export function generateCompatibilityReport(): string {
  const features = [
    {
      name: 'Container Queries',
      support: '93%',
      enabled: defaultModernCSSConfig.containerQueries,
      check: supportsContainerQueries,
    },
    {
      name: '@scope',
      support: '85%',
      enabled: defaultModernCSSConfig.scope,
      check: supportsScope,
    },
    {
      name: '@starting-style',
      support: '88%',
      enabled: defaultModernCSSConfig.startingStyle,
      check: supportsStartingStyle,
    },
    {
      name: 'View Transitions',
      support: '75%',
      enabled: defaultModernCSSConfig.viewTransitions,
      check: () => false,
    },
  ]

  const lines = [
    '🚀 Modern CSS Features Compatibility',
    '─'.repeat(50),
    '',
    ...features.map((f) => {
      const supported = typeof window !== 'undefined' ? f.check() : true
      const status = supported ? '✅' : '❌'
      const enabledText = f.enabled ? 'enabled' : 'disabled'
      return `${status} ${f.name} (${f.support} support) - ${enabledText}`
    }),
    '',
    'All features gracefully degrade for unsupported browsers',
  ]

  return lines.join('\n')
}
