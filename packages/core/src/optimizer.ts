/**
 * CSS optimization utilities
 * Merge properties and generate minimal effective class names
 */

import type { TypedStyleProps, DesignConfig } from './types.js'

/**
 * Property groups that can be merged
 */
const mergableGroups = {
  // Margin
  marginBlock: ['marginTop', 'marginBottom'],
  marginInline: ['marginLeft', 'marginRight'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],

  // Padding
  paddingBlock: ['paddingTop', 'paddingBottom'],
  paddingInline: ['paddingLeft', 'paddingRight'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],

  // Border Width
  borderWidth: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],

  // Border Radius
  borderRadius: [
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
  ],
} as const

/**
 * Shorthand property mappings
 */
const shorthandMap: Record<string, string[]> = {
  m: ['margin'],
  mx: ['marginInline', 'marginLeft', 'marginRight'],
  my: ['marginBlock', 'marginTop', 'marginBottom'],
  mt: ['marginTop'],
  mr: ['marginRight'],
  mb: ['marginBottom'],
  ml: ['marginLeft'],

  p: ['padding'],
  px: ['paddingInline', 'paddingLeft', 'paddingRight'],
  py: ['paddingBlock', 'paddingTop', 'paddingBottom'],
  pt: ['paddingTop'],
  pr: ['paddingRight'],
  pb: ['paddingBottom'],
  pl: ['paddingLeft'],

  w: ['width'],
  h: ['height'],
  minW: ['minWidth'],
  maxW: ['maxWidth'],
  minH: ['minHeight'],
  maxH: ['maxHeight'],

  bg: ['backgroundColor'],
  rounded: ['borderRadius'],
  shadow: ['boxShadow'],
}

/**
 * Normalize and expand shorthand properties
 */
export function normalizeProps<C extends DesignConfig>(
  props: TypedStyleProps<C>
): Record<string, any> {
  const normalized: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue

    // Handle pseudo selectors recursively
    if (key.startsWith('_')) {
      if (typeof value === 'object') {
        normalized[key] = normalizeProps(value as TypedStyleProps<C>)
      }
      continue
    }

    // Expand shorthand to full property names
    const fullProps = shorthandMap[key]
    if (fullProps) {
      // For multi-target shorthands (px, py, mx, my), expand to all targets
      for (const targetProp of fullProps) {
        // Only use the most specific property (skip logical properties for now)
        if (!targetProp.includes('Inline') && !targetProp.includes('Block')) {
          normalized[targetProp] = value
        }
      }
      // If no specific properties, use the most general one
      if (!Object.keys(normalized).some((k) => fullProps.includes(k))) {
        const lastProp = fullProps[fullProps.length - 1]
        if (lastProp) {
          normalized[lastProp] = value
        }
      }
    } else {
      normalized[key] = value
    }
  }

  return normalized
}

/**
 * Check if all values in array are equal
 */
function allEqual<T>(arr: T[]): boolean {
  return arr.every((val) => val === arr[0])
}

/**
 * Merge properties into shorthand when possible
 * Example: { marginTop: 4, marginBottom: 4 } → { marginBlock: 4 }
 */
export function mergeProperties(props: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = { ...props }
  const processed = new Set<string>()

  // Try to merge each group
  for (const [shorthand, longforms] of Object.entries(mergableGroups)) {
    const values = longforms.map((prop) => merged[prop]).filter((v) => v !== undefined)

    // Skip if not all properties are present
    if (values.length === 0) continue
    if (values.length !== longforms.length) continue

    // Check if all values are equal
    if (allEqual(values)) {
      // Merge into shorthand
      merged[shorthand] = values[0]

      // Remove individual properties
      for (const prop of longforms) {
        delete merged[prop]
        processed.add(prop)
      }
    }
  }

  // Special case: marginBlock + marginInline → margin
  if (
    merged.marginBlock !== undefined &&
    merged.marginInline !== undefined &&
    merged.marginBlock === merged.marginInline
  ) {
    merged.margin = merged.marginBlock
    delete merged.marginBlock
    delete merged.marginInline
  }

  // Special case: paddingBlock + paddingInline → padding
  if (
    merged.paddingBlock !== undefined &&
    merged.paddingInline !== undefined &&
    merged.paddingBlock === merged.paddingInline
  ) {
    merged.padding = merged.paddingBlock
    delete merged.paddingBlock
    delete merged.paddingInline
  }

  return merged
}

/**
 * Optimize style props by normalizing and merging
 */
export function optimizeProps<C extends DesignConfig>(
  props: TypedStyleProps<C>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue

    // Handle pseudo selectors recursively
    if (key.startsWith('_')) {
      if (typeof value === 'object') {
        result[key] = optimizeProps(value as TypedStyleProps<C>)
      }
      continue
    }

    result[key] = value
  }

  // Step 1: Normalize shorthand properties
  const normalized = normalizeProps(result)

  // Step 2: Merge properties into shorthand
  const merged = mergeProperties(normalized)

  return merged
}

/**
 * Calculate specificity score for property precedence
 * Higher score = more specific
 */
export function getPropertySpecificity(prop: string): number {
  // Specific properties (marginTop) > logical properties (marginBlock) > shorthand (margin)
  const specificityMap: Record<string, number> = {
    // Specific properties
    marginTop: 3,
    marginRight: 3,
    marginBottom: 3,
    marginLeft: 3,
    paddingTop: 3,
    paddingRight: 3,
    paddingBottom: 3,
    paddingLeft: 3,

    // Logical properties
    marginBlock: 2,
    marginInline: 2,
    paddingBlock: 2,
    paddingInline: 2,

    // Shorthand
    margin: 1,
    padding: 1,
  }

  return specificityMap[prop] ?? 1
}

/**
 * Resolve property conflicts (later + more specific wins)
 */
export function resolveConflicts(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [prop, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue

    const specificity = getPropertySpecificity(prop)

    // Find conflicting properties
    const conflictingProps = Object.keys(result).filter((existingProp) =>
      arePropertiesConflicting(prop, existingProp)
    )

    // Remove lower or equal specificity conflicting properties
    for (const conflictingProp of conflictingProps) {
      const existingSpecificity = getPropertySpecificity(conflictingProp)
      if (specificity >= existingSpecificity) {
        delete result[conflictingProp]
      }
    }

    // Add current property if no higher specificity conflict remains
    const remainingConflicts = Object.keys(result).filter((existingProp) =>
      arePropertiesConflicting(prop, existingProp)
    )

    if (remainingConflicts.length === 0) {
      result[prop] = value
    }
  }

  return result
}

/**
 * Check if two properties conflict
 */
function arePropertiesConflicting(prop1: string, prop2: string): boolean {
  // Same property always conflicts
  if (prop1 === prop2) return true

  // Check if one is a shorthand of the other
  for (const [shorthand, longforms] of Object.entries(mergableGroups)) {
    // Shorthand conflicts with its longforms
    const longformsArray = longforms as readonly string[]
    if (prop1 === shorthand && longformsArray.includes(prop2)) return true
    if (prop2 === shorthand && longformsArray.includes(prop1)) return true
  }

  // Different specific properties don't conflict (e.g., marginTop vs marginBottom)
  return false
}

/**
 * Get minimal effective properties (optimized for minimal class output)
 */
export function getMinimalProps<C extends DesignConfig>(
  props: TypedStyleProps<C> | Record<string, any>
): Record<string, any> {
  // Optimize props (normalize + merge)
  const optimized = optimizeProps(props as any)

  // Resolve conflicts
  const resolved = resolveConflicts(optimized)

  return resolved
}
