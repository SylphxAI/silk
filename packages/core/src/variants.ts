/**
 * Variants and Recipes system
 * Type-safe component variants inspired by Stitches and Panda CSS
 */

import type { DesignConfig, TypedStyleProps } from './types'
import type {
  RecipeConfig,
  RecipeVariantProps,
  CompoundVariant,
  VariantDefinition,
  RecipeFunction,
} from './types-extended'

/**
 * Create a recipe (component with variants)
 */
export function recipe<
  Config extends DesignConfig,
  Variants extends Record<string, VariantDefinition<Config>>,
>(
  config: RecipeConfig<Config, Variants>,
  cssFunction: (styles: TypedStyleProps<Config>) => { className: string }
) {
  const { base = {}, variants = {} as Variants, compoundVariants = [], defaultVariants = {} } = config

  const recipeFn = function (props: RecipeVariantProps<Variants> = {}): string {
    const classNames: string[] = []

    // Apply base styles
    if (Object.keys(base).length > 0) {
      const { className } = cssFunction(base)
      classNames.push(className)
    }

    // Apply variant styles
    const appliedVariants: Record<string, string> = {}

    for (const [variantKey, variantValue] of Object.entries(variants)) {
      // Get variant value from props or defaultVariants
      const selectedVariant =
        (props as any)[variantKey] || (defaultVariants as any)[variantKey]

      if (selectedVariant && variantValue[selectedVariant]) {
        const { className } = cssFunction(variantValue[selectedVariant])
        classNames.push(className)
        appliedVariants[variantKey] = selectedVariant
      }
    }

    // Apply compound variants (when multiple variants match)
    for (const compoundVariant of compoundVariants) {
      const { css, ...conditions } = compoundVariant
      const matches = Object.entries(conditions).every(
        ([key, value]) => appliedVariants[key] === value
      )

      if (matches) {
        const { className } = cssFunction(css)
        classNames.push(className)
      }
    }

    return classNames.filter(Boolean).join(' ')
  } as RecipeFunction<Config, Variants>

  // Attach metadata
  recipeFn.variants = variants
  recipeFn.config = config

  return recipeFn
}

/**
 * Slot recipe for multi-part components
 */
export function slotRecipe<
  Config extends DesignConfig,
  Slots extends Record<string, TypedStyleProps<Config>>,
  Variants extends Record<string, Record<string, Record<keyof Slots, TypedStyleProps<Config>>>>,
>(
  config: {
    slots: (keyof Slots)[]
    base?: Slots
    variants?: Variants
    defaultVariants?: {
      [K in keyof Variants]?: keyof Variants[K] & string
    }
  },
  cssFunction: (styles: TypedStyleProps<Config>) => { className: string }
) {
  const { slots, base = {} as Slots, variants = {} as Variants, defaultVariants = {} } = config

  return function (props: RecipeVariantProps<Variants> = {}): Record<keyof Slots, string> {
    const result = {} as Record<keyof Slots, string>

    for (const slotName of slots) {
      const classNames: string[] = []

      // Apply base styles for this slot
      if (base[slotName]) {
        const { className } = cssFunction(base[slotName])
        classNames.push(className)
      }

      // Apply variant styles for this slot
      for (const [variantKey, variantValue] of Object.entries(variants)) {
        const selectedVariant =
          (props as any)[variantKey] || (defaultVariants as any)[variantKey]

        if (selectedVariant && variantValue[selectedVariant]) {
          const slotStyles = variantValue[selectedVariant][slotName]
          if (slotStyles) {
            const { className } = cssFunction(slotStyles)
            classNames.push(className)
          }
        }
      }

      result[slotName] = classNames.filter(Boolean).join(' ')
    }

    return result
  }
}

/**
 * CVA (Class Variance Authority) style API
 * Alternative syntax for variants
 */
export function cva<
  Config extends DesignConfig,
  Variants extends Record<string, VariantDefinition<Config>>,
>(base: TypedStyleProps<Config>, config?: Omit<RecipeConfig<Config, Variants>, 'base'>) {
  return recipe({ base, ...config }, () => ({ className: '' }))
}
