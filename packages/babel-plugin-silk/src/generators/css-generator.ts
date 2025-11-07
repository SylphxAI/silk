/**
 * CSS generation for atomic styles
 */

import {
  resolveCSSProperty,
  normalizeCSSValue,
  isPseudoSelector,
  resolvePseudoSelector,
  isResponsiveValue,
} from '../utils/css-helpers.js'
import {
  generateClassName,
  generatePseudoClassName,
  generateResponsiveClassName,
} from './class-name.js'
import type { GeneratedCSS, PluginOptions } from '../types.js'

/**
 * Default breakpoint configuration
 */
const DEFAULT_BREAKPOINTS: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

/**
 * Generate atomic CSS from a style object
 *
 * @param styles - Style object (flat, no nested pseudo/responsive)
 * @param options - Plugin options
 * @returns Generated CSS with class names and rules
 */
export function generateAtomicCSS(
  styles: Record<string, any>,
  options: PluginOptions = {}
): GeneratedCSS {
  const cssRules = new Map<string, string>()
  const classNames: string[] = []

  for (const [property, value] of Object.entries(styles)) {
    // Skip undefined/null values
    if (value === undefined || value === null) {
      continue
    }

    // Handle pseudo-selectors
    if (isPseudoSelector(property)) {
      const pseudo = resolvePseudoSelector(property)
      const nestedResult = generateAtomicCSS(value, options)

      for (const [cls, rule] of nestedResult.cssRules) {
        // Inject pseudo-selector into rule
        const pseudoRule = rule.replace(/\{/, `${pseudo} {`)
        cssRules.set(cls, pseudoRule)
        classNames.push(cls)
      }

      continue
    }

    // Handle responsive values
    if (isResponsiveValue(value)) {
      const breakpoints = options.breakpoints || DEFAULT_BREAKPOINTS

      for (const [breakpoint, val] of Object.entries(value)) {
        const className = generateResponsiveClassName(
          breakpoint,
          property,
          val,
          options
        )
        const cssProperty = resolveCSSProperty(property)
        const cssValue = normalizeCSSValue(property, val, options.tokens)

        let rule: string
        if (breakpoint === 'base') {
          // Base styles (no media query)
          rule = `.${className} { ${cssProperty}: ${cssValue}; }`
        } else {
          // Media query for breakpoint
          const mediaQuery = breakpoints[breakpoint] || breakpoint
          rule = `@media (min-width: ${mediaQuery}) { .${className} { ${cssProperty}: ${cssValue}; } }`
        }

        cssRules.set(className, rule)
        classNames.push(className)
      }

      continue
    }

    // Regular property
    const className = generateClassName(property, value, options)
    const cssProperty = resolveCSSProperty(property)
    const cssValue = normalizeCSSValue(property, value, options.tokens)
    const rule = `.${className} { ${cssProperty}: ${cssValue}; }`

    cssRules.set(className, rule)
    classNames.push(className)
  }

  return {
    classNames,
    cssRules,
    className: classNames.join(' '),
  }
}

/**
 * Generate CSS for a single property-value pair
 *
 * @param property - CSS property name
 * @param value - CSS value
 * @param options - Plugin options
 * @returns Class name and CSS rule
 */
export function generateSingleRule(
  property: string,
  value: any,
  options: PluginOptions = {}
): { className: string; rule: string } {
  const className = generateClassName(property, value, options)
  const cssProperty = resolveCSSProperty(property)
  const cssValue = normalizeCSSValue(property, value, options.tokens)
  const rule = `.${className} { ${cssProperty}: ${cssValue}; }`

  return { className, rule }
}
