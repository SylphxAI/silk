/**
 * Runtime CSS generation and atomic class management
 * Build-time: Extracts static CSS
 * Runtime: Handles dynamic styles
 */

import type { DesignConfig, TypedStyleProps, StyleObject } from './types'

// CSS rule storage for build-time extraction
export const cssRules = new Map<string, string>()

// Atomic class counter
let atomicCounter = 0

// Property name mapping (shorthand -> full)
const propertyMap: Record<string, string> = {
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginInline',
  my: 'marginBlock',
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingInline',
  py: 'paddingBlock',
  w: 'width',
  h: 'height',
  minW: 'minWidth',
  maxW: 'maxWidth',
  minH: 'minHeight',
  maxH: 'maxHeight',
  bg: 'backgroundColor',
  rounded: 'borderRadius',
  shadow: 'boxShadow',
}

// Pseudo selector mapping
const pseudoMap: Record<string, string> = {
  _hover: ':hover',
  _focus: ':focus',
  _active: ':active',
  _disabled: ':disabled',
  _visited: ':visited',
}

/**
 * Hash function for deterministic class names
 */
function hash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Resolve token value from config
 */
function resolveToken<C extends DesignConfig>(
  config: C,
  category: keyof C,
  value: string
): string {
  const scale = config[category]
  if (!scale || typeof scale !== 'object') return value

  // Handle nested tokens like 'red.500'
  if (value.includes('.')) {
    const [parent, child] = value.split('.')
    const parentObj = scale[parent]
    if (parentObj && typeof parentObj === 'object') {
      return (parentObj as Record<string, any>)[child] ?? value
    }
  }

  // Handle direct tokens like 'lg'
  return (scale as Record<string, any>)[value] ?? value
}

/**
 * Get CSS value from config token or raw value
 */
function getCSSValue<C extends DesignConfig>(
  config: C,
  prop: string,
  value: string | number
): string {
  if (typeof value === 'number') {
    // Properties that should have 'px' appended
    const needsPx = [
      'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'gap', 'borderRadius', 'borderWidth', 'fontSize', 'letterSpacing'
    ]
    if (needsPx.includes(prop)) {
      return `${value}px`
    }
    return String(value)
  }

  // Try to resolve from design tokens
  const tokenMap: Record<string, keyof DesignConfig> = {
    color: 'colors',
    backgroundColor: 'colors',
    borderColor: 'colors',
    fontSize: 'fontSizes',
    fontWeight: 'fontWeights',
    lineHeight: 'lineHeights',
    letterSpacing: 'letterSpacings',
    borderRadius: 'radii',
    boxShadow: 'shadows',
    margin: 'spacing',
    marginTop: 'spacing',
    marginRight: 'spacing',
    marginBottom: 'spacing',
    marginLeft: 'spacing',
    padding: 'spacing',
    paddingTop: 'spacing',
    paddingRight: 'spacing',
    paddingBottom: 'spacing',
    paddingLeft: 'spacing',
    gap: 'spacing',
    width: 'sizes',
    height: 'sizes',
    minWidth: 'sizes',
    maxWidth: 'sizes',
    minHeight: 'sizes',
    maxHeight: 'sizes',
  }

  const category = tokenMap[prop]
  if (category) {
    return resolveToken(config, category, value)
  }

  return value
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

/**
 * Generate atomic CSS class and rule
 */
function generateAtomicClass<C extends DesignConfig>(
  config: C,
  prop: string,
  value: string | number,
  pseudo?: string
): string {
  const cssValue = getCSSValue(config, prop, value)
  const cssProp = kebabCase(prop)

  // Create unique identifier for this style
  const styleId = `${prop}-${value}${pseudo ?? ''}`
  const className = `zen-${hash(styleId)}`

  // Generate CSS rule
  const selector = pseudo ? `.${className}${pseudo}` : `.${className}`
  const rule = `${selector} { ${cssProp}: ${cssValue}; }`

  // Store for build-time extraction
  cssRules.set(className, rule)

  return className
}

/**
 * Create CSS function with typed config
 */
export function createStyleSystem<C extends DesignConfig>(config: C) {
  function css(styles: TypedStyleProps<C>): StyleObject {
    const classNames: string[] = []
    const dynamicStyles: Record<string, any> = {}

    for (const [key, value] of Object.entries(styles)) {
      if (value === undefined || value === null) continue

      // Handle pseudo selectors
      if (key.startsWith('_')) {
        const pseudo = pseudoMap[key]
        if (pseudo && typeof value === 'object') {
          // Recursively process pseudo styles
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            const prop = propertyMap[nestedKey] ?? nestedKey
            const className = generateAtomicClass(config, prop, nestedValue as string | number, pseudo)
            classNames.push(className)
          }
        }
        continue
      }

      // Handle responsive breakpoints
      if (config.breakpoints && key in (config.breakpoints as object)) {
        // TODO: Handle responsive styles
        continue
      }

      // Map shorthand to full property name
      const prop = propertyMap[key] ?? key

      // Skip non-style properties
      if (typeof value === 'object') {
        dynamicStyles[prop] = value
        continue
      }

      // Generate atomic class
      const className = generateAtomicClass(config, prop, value)
      classNames.push(className)
    }

    return {
      className: classNames.join(' '),
      style: Object.keys(dynamicStyles).length > 0 ? dynamicStyles : undefined,
    }
  }

  // Helper to merge multiple style objects
  function cx(...styles: (TypedStyleProps<C> | string | undefined | false | null)[]): StyleObject {
    const classNames: string[] = []
    const mergedStyles: TypedStyleProps<C> = {}

    for (const style of styles) {
      if (!style) continue

      if (typeof style === 'string') {
        classNames.push(style)
      } else if (typeof style === 'object') {
        Object.assign(mergedStyles, style)
      }
    }

    const result = css(mergedStyles)
    const allClasses = [...classNames, result.className].filter(Boolean).join(' ')

    return {
      className: allClasses,
      style: result.style,
    }
  }

  // Get all generated CSS rules (for extraction)
  function getCSSRules(): string {
    return Array.from(cssRules.values()).join('\n')
  }

  // Reset CSS rules (useful for testing)
  function resetCSSRules(): void {
    cssRules.clear()
  }

  return {
    css,
    cx,
    getCSSRules,
    resetCSSRules,
    config, // Expose config for plugins
  }
}

export type StyleSystem<C extends DesignConfig> = ReturnType<typeof createStyleSystem<C>>
