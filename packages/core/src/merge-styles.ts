/**
 * Style merging utilities
 * Inspired by Meta's StyleX mergeStyles API
 * Provides explicit, type-safe style composition
 */

import type { DesignConfig, TypedStyleProps } from './types'

/**
 * Merge multiple style objects with proper precedence
 *
 * Later styles override earlier styles.
 * Handles nested objects (pseudo selectors, responsive) correctly.
 *
 * Example:
 * ```ts
 * const baseButton = { px: 6, py: 3, bg: 'brand.500' }
 * const largeButton = { px: 8, py: 4 }
 *
 * mergeStyles(baseButton, largeButton)
 * // Result: { px: 8, py: 4, bg: 'brand.500' }
 * ```
 */
export function mergeStyles<C extends DesignConfig>(
  ...styles: (TypedStyleProps<C> | undefined | null | false)[]
): TypedStyleProps<C> {
  const merged: Record<string, any> = {}

  for (const style of styles) {
    if (!style) continue

    for (const [key, value] of Object.entries(style)) {
      if (value === undefined || value === null) continue

      // Handle nested objects (pseudo selectors, responsive)
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        (key.startsWith('_') || key.startsWith('@'))
      ) {
        // Merge nested objects
        merged[key] = merged[key]
          ? { ...merged[key], ...value }
          : { ...value }
      } else {
        // Direct override for simple properties
        merged[key] = value
      }
    }
  }

  return merged as TypedStyleProps<C>
}

/**
 * Conditional style helper
 *
 * Apply styles conditionally without ternary operators
 *
 * Example:
 * ```ts
 * conditionalStyle(
 *   baseStyles,
 *   isActive && activeStyles,
 *   isLarge && largeStyles
 * )
 * ```
 */
export function conditionalStyle<C extends DesignConfig>(
  ...styles: (TypedStyleProps<C> | undefined | null | false)[]
): TypedStyleProps<C> {
  return mergeStyles(...styles)
}

/**
 * Create a style variant function
 *
 * Returns a function that selects styles based on variant value.
 *
 * Example:
 * ```ts
 * const buttonVariant = createVariant({
 *   primary: { bg: 'brand.500', color: 'white' },
 *   secondary: { bg: 'gray.200', color: 'gray.900' },
 *   danger: { bg: 'red.500', color: 'white' },
 * })
 *
 * buttonVariant('primary') // { bg: 'brand.500', color: 'white' }
 * ```
 */
export function createVariant<C extends DesignConfig, K extends string>(
  variants: Record<K, TypedStyleProps<C>>
): (variant: K) => TypedStyleProps<C> {
  return (variant: K) => variants[variant] || ({} as TypedStyleProps<C>)
}

/**
 * Create a compound variant function
 *
 * Combines multiple variant dimensions with compound variants.
 *
 * Example:
 * ```ts
 * const buttonStyle = createCompoundVariant({
 *   variants: {
 *     color: {
 *       primary: { bg: 'brand.500' },
 *       secondary: { bg: 'gray.200' },
 *     },
 *     size: {
 *       sm: { px: 4, py: 2 },
 *       md: { px: 6, py: 3 },
 *       lg: { px: 8, py: 4 },
 *     },
 *   },
 *   compoundVariants: [
 *     // Special styling for large primary buttons
 *     {
 *       when: { color: 'primary', size: 'lg' },
 *       style: { shadow: 'lg' },
 *     },
 *   ],
 *   defaultVariants: {
 *     color: 'primary',
 *     size: 'md',
 *   },
 * })
 *
 * buttonStyle({ color: 'primary', size: 'lg' })
 * // Combines: primary color + lg size + compound variant shadow
 * ```
 */
export interface CompoundVariantConfig<
  C extends DesignConfig,
  V extends Record<string, Record<string, TypedStyleProps<C>>>
> {
  variants: V
  compoundVariants?: Array<{
    when: { [K in keyof V]?: keyof V[K] }
    style: TypedStyleProps<C>
  }>
  defaultVariants?: { [K in keyof V]?: keyof V[K] }
}

export function createCompoundVariant<
  C extends DesignConfig,
  V extends Record<string, Record<string, TypedStyleProps<C>>>
>(config: CompoundVariantConfig<C, V>) {
  return (
    props: { [K in keyof V]?: keyof V[K] }
  ): TypedStyleProps<C> => {
    const styles: TypedStyleProps<C>[] = []

    // Apply default variants
    const finalProps = { ...config.defaultVariants, ...props }

    // Collect variant styles
    for (const [dimension, value] of Object.entries(finalProps)) {
      if (!value) continue

      const variantGroup = config.variants[dimension]
      if (variantGroup && value in variantGroup) {
        styles.push(variantGroup[value as string])
      }
    }

    // Apply compound variants
    if (config.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const matches = Object.entries(compound.when).every(
          ([key, expectedValue]) => finalProps[key] === expectedValue
        )

        if (matches) {
          styles.push(compound.style)
        }
      }
    }

    return mergeStyles(...styles)
  }
}
