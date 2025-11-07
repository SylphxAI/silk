/**
 * Class name generation for atomic CSS
 */

import { hashPropertyValue, simpleHash } from '../utils/hash.js'
import type { PluginOptions } from '../types.js'

/**
 * Generate a unique class name for a CSS property-value pair
 *
 * Development mode: silk_bg_red_a7f3 (descriptive)
 * Production mode: a7f3b2c1 (short)
 *
 * @param property - CSS property name
 * @param value - CSS property value
 * @param options - Plugin options
 * @param variant - Optional variant (e.g., 'hover', 'md')
 * @returns Generated class name
 */
export function generateClassName(
  property: string,
  value: any,
  options: PluginOptions = {},
  variant = ''
): string {
  const { production, classPrefix } = options
  const hash = hashPropertyValue(property, value, variant)

  if (production) {
    // Short hash for production: a7f3b2c1
    return hash.slice(0, 8)
  }

  // Descriptive for development
  const prefix = classPrefix ?? 'silk'
  const sanitizedValue = sanitizeValueForClassName(value)
  const shortHash = hash.slice(0, 4)

  if (variant) {
    return `${prefix}_${variant}_${property}_${sanitizedValue}_${shortHash}`
  }

  return `${prefix}_${property}_${sanitizedValue}_${shortHash}`
}

/**
 * Sanitize a value for use in a class name
 * Removes special characters and limits length
 */
function sanitizeValueForClassName(value: any): string {
  let str = String(value)

  // Remove units and special characters
  str = str
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 10) // Limit length

  return str || 'val'
}

/**
 * Generate a class name for a pseudo-selector
 *
 * @param pseudo - Pseudo-selector (e.g., '_hover')
 * @param property - CSS property
 * @param value - CSS value
 * @param options - Plugin options
 * @returns Class name with pseudo variant
 */
export function generatePseudoClassName(
  pseudo: string,
  property: string,
  value: any,
  options: PluginOptions = {}
): string {
  // Remove leading underscore from pseudo
  const pseudoName = pseudo.startsWith('_') ? pseudo.slice(1) : pseudo
  return generateClassName(property, value, options, pseudoName)
}

/**
 * Generate a class name for a responsive breakpoint
 *
 * @param breakpoint - Breakpoint name (e.g., 'md')
 * @param property - CSS property
 * @param value - CSS value
 * @param options - Plugin options
 * @returns Class name with breakpoint variant
 */
export function generateResponsiveClassName(
  breakpoint: string,
  property: string,
  value: any,
  options: PluginOptions = {}
): string {
  return generateClassName(property, value, options, breakpoint)
}
