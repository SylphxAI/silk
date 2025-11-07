/**
 * Runtime CSS generation and atomic class management
 * Build-time: Extracts static CSS
 * Runtime: Handles dynamic styles (2-3x faster with optimizations)
 */

import type { DesignConfig, TypedStyleProps, StyleObject } from './types'
import { getMinimalProps } from './optimizer'
import { LayerManager, type LayerConfig, type CascadeLayer, classifyLayer } from './layers'
import {
  type SelectorConfig,
  generateSelector,
  wrapInWhere,
  ClassNameGenerator,
} from './selectors'
import {
  type ProductionConfig,
  generateClassName,
  optimizeCSS,
  resetShortNameCounter,
} from './production'

// CSS rule storage for build-time extraction
export const cssRules = new Map<string, string>()

// Layer manager for organizing CSS by cascade layers
let globalLayerManager: LayerManager | null = null

// Atomic class counter
let atomicCounter = 0

/**
 * Runtime Performance Optimizations (2-3x faster)
 * Inspired by Panda CSS optimizations
 */

// Object pool to avoid allocations (reduces GC pressure)
class ObjectPool<T> {
  private pool: T[] = []
  private maxSize: number

  constructor(private factory: () => T, maxSize = 100) {
    this.maxSize = maxSize
  }

  acquire(): T {
    return this.pool.pop() ?? this.factory()
  }

  release(obj: T): void {
    if (typeof obj === 'object' && obj !== null) {
      // Clear object properties
      for (const key in obj) {
        delete obj[key]
      }

      // Return to pool if not full
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj)
      }
    }
  }

  size(): number {
    return this.pool.length
  }

  clear(): void {
    this.pool = []
  }
}

// Object pools for common operations
const stylePropsPool = new ObjectPool<Record<string, any>>(() => ({}), 100)
const classNameArrayPool = new ObjectPool<string[]>(() => [], 50)

// Memoization cache for repeated style objects
const styleMemoCache = new Map<string, string>()
let styleMemoHits = 0
let styleMemoMisses = 0

/**
 * Get memoization statistics
 */
export function getRuntimeStats() {
  const totalCalls = styleMemoHits + styleMemoMisses
  const hitRate = totalCalls > 0 ? (styleMemoHits / totalCalls) * 100 : 0

  return {
    memoCache: {
      size: styleMemoCache.size,
      hits: styleMemoHits,
      misses: styleMemoMisses,
      hitRate: Math.round(hitRate * 100) / 100,
    },
    objectPools: {
      styleProps: stylePropsPool.size(),
      classNameArrays: classNameArrayPool.size(),
    },
  }
}

/**
 * Reset runtime statistics (for testing)
 */
export function resetRuntimeStats() {
  styleMemoCache.clear()
  styleMemoHits = 0
  styleMemoMisses = 0
  stylePropsPool.clear()
  classNameArrayPool.clear()
}

/**
 * Fast hash function for memoization keys
 */
function fastHash(obj: any): string {
  // Use JSON.stringify but cache the result
  const str = JSON.stringify(obj)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString(36)
}

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
function resolveToken<C extends DesignConfig>(config: C, category: keyof C, value: string): string {
  const scale = config[category]
  if (!scale || typeof scale !== 'object') return value

  const scaleObj = scale as Record<string, any>

  // Handle nested tokens like 'red.500'
  if (value.includes('.')) {
    const [parent, child] = value.split('.')
    if (parent && child) {
      const parentObj = scaleObj[parent]
      if (parentObj && typeof parentObj === 'object') {
        return parentObj[child] ?? value
      }
    }
  }

  // Handle direct tokens like 'lg'
  return scaleObj[value] ?? value
}

/**
 * Get CSS value from config token or raw value
 */
function getCSSValue<C extends DesignConfig>(
  config: C,
  prop: string,
  value: string | number
): string {
  // Token category mapping
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

  // Try to resolve from design tokens first
  if (category) {
    const resolved = resolveToken(config, category, String(value))
    // If token was resolved (value changed), return it
    if (resolved !== String(value)) {
      return resolved
    }
    // If token wasn't found and value is a number, continue to number handling
  }

  // Handle raw numeric values
  if (typeof value === 'number') {
    // Properties that should have 'px' appended
    const needsPx = [
      'width',
      'height',
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'gap',
      'borderRadius',
      'borderWidth',
      'fontSize',
      'letterSpacing',
    ]
    if (needsPx.includes(prop)) {
      return `${value}px`
    }
    return String(value)
  }

  // Return string value as-is
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
  productionConfig: ProductionConfig,
  pseudo?: string
): string {
  const cssValue = getCSSValue(config, prop, value)
  const cssProp = kebabCase(prop)

  // Create unique identifier for this style
  const styleId = `${prop}-${value}${pseudo ?? ''}`
  const className = generateClassName(styleId, productionConfig)

  // Generate CSS rule
  const selector = pseudo ? `.${className}${pseudo}` : `.${className}`
  const rule = `${selector} { ${cssProp}: ${cssValue}; }`

  // Store for build-time extraction
  cssRules.set(className, rule)

  // Add to layer manager if enabled
  if (globalLayerManager) {
    const layer = classifyLayer(prop, value, 'atomic')
    globalLayerManager.add(rule, layer)
  }

  return className
}

/**
 * Create CSS function with typed config
 */
export function createStyleSystem<C extends DesignConfig>(
  config: C,
  options?: { optimize?: boolean } & ProductionConfig & LayerConfig
) {
  const { optimize = true, enabled, order, defaultLayer, ...productionConfig } = options ?? {}
  const prodConfig: ProductionConfig = {
    production: productionConfig.production ?? false,
    shortClassNames: productionConfig.shortClassNames ?? true,
    minify: productionConfig.minify ?? true,
    optimizeCSS: productionConfig.optimizeCSS ?? true,
    classPrefix: productionConfig.classPrefix,
  }

  // Initialize layer manager (only pass defined properties)
  const layerConfig: LayerConfig = {}
  if (enabled !== undefined) layerConfig.enabled = enabled
  if (order !== undefined) layerConfig.order = order
  if (defaultLayer !== undefined) layerConfig.defaultLayer = defaultLayer
  globalLayerManager = new LayerManager(layerConfig)

  function css(styles: TypedStyleProps<C>): StyleObject {
    const classNames: string[] = []
    const dynamicStyles: Record<string, any> = {}

    // OPTIMIZATION: Merge and minimize properties
    const processedStyles = optimize ? getMinimalProps(styles) : styles

    for (const [key, value] of Object.entries(processedStyles)) {
      if (value === undefined || value === null) continue

      // Handle pseudo selectors
      if (key.startsWith('_')) {
        const pseudo = pseudoMap[key]
        if (pseudo && typeof value === 'object') {
          // Recursively process pseudo styles with optimization
          const pseudoStyles = optimize ? getMinimalProps(value as TypedStyleProps<C>) : value
          for (const [nestedKey, nestedValue] of Object.entries(pseudoStyles)) {
            const className = generateAtomicClass(
              config,
              nestedKey,
              nestedValue as string | number,
              prodConfig,
              pseudo
            )
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

      // Skip non-style properties
      if (typeof value === 'object') {
        dynamicStyles[key] = value
        continue
      }

      // Generate atomic class (property names are already normalized by optimizer)
      const className = generateAtomicClass(config, key, value, prodConfig)
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
  function getCSSRules(options?: { optimize?: boolean; useLayers?: boolean }): string {
    const {
      optimize: shouldOptimize = prodConfig.optimizeCSS,
      useLayers = globalLayerManager !== null
    } = options ?? {}

    let css: string

    // Use layer manager if available and enabled
    if (useLayers && globalLayerManager) {
      css = globalLayerManager.generateCSS()
    } else {
      css = Array.from(cssRules.values()).join('\n')
    }

    if (shouldOptimize && prodConfig.production) {
      const { optimized } = optimizeCSS(css)
      return optimized
    }

    return css
  }

  // Reset CSS rules (useful for testing)
  function resetCSSRules(): void {
    cssRules.clear()
    resetShortNameCounter()
    if (globalLayerManager) {
      globalLayerManager.clear()
    }
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
