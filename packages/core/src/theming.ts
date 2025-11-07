/**
 * Theming system with semantic tokens and CSS variables
 */

import type { DesignConfig } from './types.js'
import type { SemanticTokens, SemanticTokenValue, ThemeConfig } from './types-extended.js'

export type ThemeMode = 'light' | 'dark'

/**
 * Resolve semantic token value based on current theme
 */
export function resolveSemanticToken(
  token: SemanticTokenValue | string,
  mode: ThemeMode
): string {
  if (typeof token === 'string') return token

  // Try to get mode-specific value
  const modeValue = token[mode]
  if (modeValue) return modeValue

  // Fallback to DEFAULT
  return token.DEFAULT || ''
}

/**
 * Flatten semantic tokens for CSS variable generation
 */
export function flattenSemanticTokens(
  tokens: SemanticTokens,
  mode: ThemeMode,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(tokens)) {
    const path = prefix ? `${prefix}-${key}` : key

    if (value && typeof value === 'object') {
      // Check if this is a SemanticTokenValue (has light/dark/DEFAULT as string values)
      const isSemanticValue =
        ('light' in value && typeof value.light === 'string') ||
        ('dark' in value && typeof value.dark === 'string') ||
        ('DEFAULT' in value && typeof value.DEFAULT === 'string')

      if (isSemanticValue) {
        // This is a semantic token value - resolve it
        result[path] = resolveSemanticToken(value as SemanticTokenValue, mode)
      } else {
        // Nested object, recurse
        Object.assign(result, flattenSemanticTokens(value as SemanticTokens, mode, path))
      }
    }
  }

  return result
}

/**
 * Generate CSS variables from config
 */
export function generateCSSVariables<C extends DesignConfig & ThemeConfig>(
  config: C,
  options: {
    mode?: ThemeMode
    prefix?: string
    includeSemanticTokens?: boolean
  } = {}
): Record<string, string> {
  const { mode = 'light', prefix = 'silk', includeSemanticTokens = true } = options
  const variables: Record<string, string> = {}

  // Helper to add variables with prefix
  const addVar = (path: string, value: string) => {
    variables[`--${prefix}-${path}`] = value
  }

  // Process regular tokens
  const processTokens = (
    tokens: Record<string, any> | undefined,
    category: string
  ) => {
    if (!tokens) return

    for (const [key, value] of Object.entries(tokens)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Nested tokens (e.g., colors: { red: { 500: '#xxx' } })
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          addVar(`${category}-${key}-${nestedKey}`, String(nestedValue))
        }
      } else {
        // Flat tokens (e.g., spacing: { 4: '1rem' })
        addVar(`${category}-${key}`, String(value))
      }
    }
  }

  // Process all token categories
  processTokens(config.colors, 'colors')
  processTokens(config.spacing, 'spacing')
  processTokens(config.sizes, 'sizes')
  processTokens(config.fontSizes, 'fontSizes')
  processTokens(config.fontWeights, 'fontWeights')
  processTokens(config.lineHeights, 'lineHeights')
  processTokens(config.radii, 'radii')
  processTokens(config.shadows, 'shadows')

  // Process semantic tokens
  if (includeSemanticTokens && config.semanticTokens) {
    const flattened = flattenSemanticTokens(config.semanticTokens, mode)
    for (const [path, value] of Object.entries(flattened)) {
      addVar(`semantic-${path}`, value)
    }
  }

  return variables
}

/**
 * Generate CSS variable stylesheet
 */
export function generateCSSVariableStylesheet<C extends DesignConfig & ThemeConfig>(
  config: C,
  options: {
    selector?: string
    prefix?: string
    modes?: ThemeMode[]
  } = {}
): string {
  const { selector = ':root', prefix = 'silk', modes = ['light', 'dark'] } = options

  const stylesheets: string[] = []

  for (const mode of modes) {
    const variables = generateCSSVariables(config, { mode, prefix })
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')

    if (mode === 'light') {
      // Light mode on root
      stylesheets.push(`${selector} {\n${cssVars}\n}`)
    } else {
      // Dark mode with selector
      stylesheets.push(`${selector}[data-theme="${mode}"],\n${selector}.${mode} {\n${cssVars}\n}`)
    }
  }

  return stylesheets.join('\n\n')
}

/**
 * Theme controller for runtime theme switching
 */
export class ThemeController {
  private mode: ThemeMode = 'light'
  private listeners: Set<(mode: ThemeMode) => void> = new Set()

  constructor(initialMode: ThemeMode = 'light') {
    this.mode = initialMode
    if (typeof document !== 'undefined') {
      this.applyTheme(initialMode)
    }
  }

  getMode(): ThemeMode {
    return this.mode
  }

  setMode(mode: ThemeMode): void {
    this.mode = mode
    this.applyTheme(mode)
    this.notifyListeners()
  }

  toggle(): void {
    this.setMode(this.mode === 'light' ? 'dark' : 'light')
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return

    document.documentElement.setAttribute('data-theme', mode)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(mode)
  }

  subscribe(listener: (mode: ThemeMode) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.mode)
    }
  }

  /**
   * Sync with system preference
   */
  syncWithSystem(): void {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.setMode(mediaQuery.matches ? 'dark' : 'light')

    mediaQuery.addEventListener('change', (e) => {
      this.setMode(e.matches ? 'dark' : 'light')
    })
  }
}

/**
 * Create theme controller
 */
export function createTheme(initialMode: ThemeMode = 'light'): ThemeController {
  return new ThemeController(initialMode)
}
