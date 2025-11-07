/**
 * Extended runtime with all advanced features
 * Responsive, Variants, Theming, Animations, Container Queries
 */

import type { DesignConfig, TypedStyleProps, StyleObject } from './types.js'
import type { ThemeConfig, AnimationConfig, ContainerConfig } from './types-extended.js'
import { getMinimalProps } from './optimizer.js'
import {
  processResponsiveStyles,
  generateResponsiveCSS,
  processContainerQueries,
  generateContainerQueryCSS,
} from './responsive.js'
import { generateCSSVariables, generateCSSVariableStylesheet, createTheme } from './theming.js'
import { generateAllKeyframes, defaultKeyframes, defaultAnimations } from './animations.js'

// Extended pseudo selector mapping
const extendedPseudoMap: Record<string, string> = {
  _hover: ':hover',
  _focus: ':focus',
  _active: ':active',
  _focusVisible: ':focus-visible',
  _focusWithin: ':focus-within',
  _disabled: ':disabled',
  _enabled: ':enabled',
  _checked: ':checked',
  _indeterminate: ':indeterminate',
  _readOnly: ':read-only',
  _required: ':required',
  _valid: ':valid',
  _invalid: ':invalid',
  _first: ':first-of-type',
  _last: ':last-of-type',
  _firstChild: ':first-child',
  _lastChild: ':last-child',
  _odd: ':nth-child(odd)',
  _even: ':nth-child(even)',
  _only: ':only-child',
  _before: '::before',
  _after: '::after',
  _placeholder: '::placeholder',
  _selection: '::selection',
  _visited: ':visited',
  _groupHover: ':hover',
  _peerFocus: ':focus',
}

// Media query conditions
const mediaConditions: Record<string, string> = {
  _dark: '@media (prefers-color-scheme: dark)',
  _light: '@media (prefers-color-scheme: light)',
  _motionReduce: '@media (prefers-reduced-motion: reduce)',
  _motionSafe: '@media (prefers-reduced-motion: no-preference)',
  _print: '@media print',
}

export interface ExtendedStyleSystemOptions {
  optimize?: boolean
  cssVarRoot?: string
  cssVarPrefix?: string
  useCustomProperties?: boolean
  mode?: 'light' | 'dark'
}

type ExtendedConfig = DesignConfig & ThemeConfig & AnimationConfig & ContainerConfig

/**
 * Extended style system with all features
 */
export function createExtendedStyleSystem<C extends ExtendedConfig>(
  config: C,
  options: ExtendedStyleSystemOptions = {}
) {
  const {
    optimize = true,
    cssVarRoot = ':root',
    cssVarPrefix = 'silk',
    useCustomProperties = false,
    mode = 'light',
  } = options

  // CSS rule storage
  const cssRules = new Map<string, string>()
  const responsiveRules = new Map<string, string>()
  const containerRules = new Map<string, string>()
  let keyframesGenerated = false

  // Theme controller
  const theme = createTheme(mode)

  /**
   * Hash function for class names
   */
  function hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Resolve token value
   */
  function resolveToken(category: keyof C, value: string): string {
    const scale = config[category]
    if (!scale || typeof scale !== 'object') return value

    const scaleObj = scale as Record<string, any>

    if (value.includes('.')) {
      const [parent, child] = value.split('.')
      if (parent && child) {
        const parentObj = scaleObj[parent]
        if (parentObj && typeof parentObj === 'object') {
          return parentObj[child] ?? value
        }
      }
    }

    return scaleObj[value] ?? value
  }

  /**
   * Get CSS value (with CSS variable support)
   */
  function getCSSValue(prop: string, value: string | number): string {
    if (useCustomProperties) {
      // Check if this is a token reference
      const tokenMap: Record<string, keyof C> = {
        color: 'colors',
        backgroundColor: 'colors',
        borderColor: 'colors',
        fontSize: 'fontSizes',
        padding: 'spacing',
        margin: 'spacing',
      }

      const category = tokenMap[prop]
      if (category && typeof value === 'string') {
        const categoryStr = String(category)
        const cssVar = value.includes('.')
          ? `var(--${cssVarPrefix}-${categoryStr}-${value.replace('.', '-')})`
          : `var(--${cssVarPrefix}-${categoryStr}-${value})`
        return cssVar
      }
    }

    // Token category mapping
    const tokenMap: Record<string, keyof C> = {
      color: 'colors',
      backgroundColor: 'colors',
      fontSize: 'fontSizes',
      padding: 'spacing',
      margin: 'spacing',
    }

    const category = tokenMap[prop]
    if (category) {
      const resolved = resolveToken(category, String(value))
      if (resolved !== String(value)) {
        return resolved
      }
    }

    if (typeof value === 'number') {
      const needsPx = ['padding', 'margin', 'fontSize', 'width', 'height']
      if (needsPx.some((p) => prop.includes(p))) {
        return `${value}px`
      }
      return String(value)
    }

    return value
  }

  /**
   * Generate atomic class
   */
  function generateAtomicClass(prop: string, value: string | number, pseudo?: string): string {
    const cssValue = getCSSValue(prop, value)
    const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    const styleId = `${prop}-${value}${pseudo ?? ''}`
    const className = `silk-${hash(styleId)}`

    const selector = pseudo ? `.${className}${pseudo}` : `.${className}`
    const rule = `${selector} { ${cssProp}: ${cssValue}; }`

    cssRules.set(className, rule)
    return className
  }

  /**
   * Main CSS function with all features
   */
  function css(styles: any): StyleObject {
    const classNames: string[] = []

    // Optimize styles
    const processedStyles = optimize ? getMinimalProps(styles) : styles

    // Process responsive styles
    const { base, responsive } = processResponsiveStyles(processedStyles, config.breakpoints)

    // Process container queries
    const { base: baseAfterContainer, container, containerType, containerName } =
      processContainerQueries(base, config.containers)

    // Process base styles
    for (const [key, value] of Object.entries(baseAfterContainer)) {
      if (value === undefined || value === null) continue

      // Skip symbol keys
      if (typeof key === 'symbol') continue

      // Handle pseudo selectors
      if (key.startsWith('_')) {
        const pseudo = extendedPseudoMap[key]
        const mediaCondition = mediaConditions[key]

        if (pseudo && typeof value === 'object') {
          const optimizedPseudo = optimize ? getMinimalProps(value) : value
          for (const [nestedKey, nestedValue] of Object.entries(optimizedPseudo)) {
            const className = generateAtomicClass(nestedKey, nestedValue as string | number, pseudo)
            classNames.push(className)
          }
        } else if (mediaCondition && typeof value === 'object') {
          // Handle media condition styles
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            const className = generateAtomicClass(nestedKey, nestedValue as string | number)
            classNames.push(className)
          }
        }
        continue
      }

      if (typeof value === 'object') continue

      const className = generateAtomicClass(key, value)
      classNames.push(className)
    }

    // Generate responsive CSS
    if (Object.keys(responsive).length > 0 && config.breakpoints) {
      const tempClass = `silk-r-${hash(JSON.stringify(responsive))}`
      const rules = generateResponsiveCSS(`.${tempClass}`, responsive, config.breakpoints, getCSSValue)

      for (const rule of rules) {
        responsiveRules.set(tempClass, rule)
      }
      classNames.push(tempClass)
    }

    // Generate container query CSS
    if (Object.keys(container).length > 0 && config.containers) {
      const tempClass = `silk-c-${hash(JSON.stringify(container))}`
      const rules = generateContainerQueryCSS(`.${tempClass}`, container, config.containers, getCSSValue)

      for (const rule of rules) {
        containerRules.set(tempClass, rule)
      }
      classNames.push(tempClass)
    }

    return {
      className: classNames.filter(Boolean).join(' '),
    }
  }

  /**
   * Get all CSS rules
   */
  function getCSSRules(): string {
    const rules: string[] = []

    // Add keyframes if not already added
    if (!keyframesGenerated) {
      const allKeyframes = {
        ...defaultKeyframes,
        ...(config.keyframes || {}),
      }
      const keyframesCSS = generateAllKeyframes(allKeyframes)
      if (keyframesCSS) {
        rules.push(keyframesCSS)
      }
      keyframesGenerated = true
    }

    // Add CSS variables
    if (useCustomProperties) {
      const cssVarSheet = generateCSSVariableStylesheet(config, {
        selector: cssVarRoot,
        prefix: cssVarPrefix,
      })
      rules.push(cssVarSheet)
    }

    // Add atomic rules
    rules.push(...Array.from(cssRules.values()))

    // Add responsive rules
    rules.push(...Array.from(responsiveRules.values()))

    // Add container rules
    rules.push(...Array.from(containerRules.values()))

    return rules.join('\n')
  }

  /**
   * Reset CSS rules
   */
  function resetCSSRules(): void {
    cssRules.clear()
    responsiveRules.clear()
    containerRules.clear()
    keyframesGenerated = false
  }

  /**
   * Get CSS variables
   */
  function getCSSVariables() {
    return generateCSSVariables(config, { mode: theme.getMode(), prefix: cssVarPrefix })
  }

  return {
    css,
    getCSSRules,
    resetCSSRules,
    getCSSVariables,
    theme,
    config,
  }
}

export type ExtendedStyleSystem<C extends ExtendedConfig> = ReturnType<
  typeof createExtendedStyleSystem<C>
>
