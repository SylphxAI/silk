/**
 * @sylphx/silk-qwik
 * Qwik bindings for Silk with resumability and zero hydration
 */

import { component$, useSignal, useTask$, type QwikIntrinsicElements, type Component } from '@builder.io/qwik'
import { createStyleSystem, STYLE_PROP_NAMES, type StylePropName, type DesignConfig, type TypedStyleProps, type StyleSystem } from '@sylphx/silk'

export interface SilkQwikSystem<C extends DesignConfig> {
  /**
   * Create a styled Qwik component with resumability
   */
  styled: <E extends keyof QwikIntrinsicElements>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ) => Component<QwikIntrinsicElements[E] & TypedStyleProps<C>>

  /**
   * CSS function for generating class names
   */
  css: StyleSystem<C>['css']

  /**
   * Box primitive component
   */
  Box: Component<QwikIntrinsicElements['div'] & TypedStyleProps<C>>

  /**
   * Flex primitive component
   */
  Flex: Component<QwikIntrinsicElements['div'] & TypedStyleProps<C>>

  /**
   * Get all CSS rules
   */
  getCSSRules: StyleSystem<C>['getCSSRules']
}

/**
 * Create Silk system for Qwik with resumability
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@sylphx/silk'
 * import { createSilkQwik } from '@sylphx/silk-qwik'
 *
 * export const { styled, Box, css } = createSilkQwik(
 *   defineConfig({
 *     colors: { brand: { 500: '#3b82f6' } },
 *     spacing: { 4: '1rem' }
 *   })
 * )
 * ```
 */
export function createSilkQwik<const C extends DesignConfig>(
  config: C
): SilkQwikSystem<C> {
  const styleSystem = createStyleSystem<C>(config)

  // Use shared style prop names from core
  const stylePropNames = STYLE_PROP_NAMES

  /**
   * Create a styled Qwik component
   *
   * Uses Qwik's resumability - style computation happens on server,
   * zero JavaScript shipped for styling on client
   */
  function styled<E extends keyof QwikIntrinsicElements>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ): Component<QwikIntrinsicElements[E] & TypedStyleProps<C>> {
    return component$((props: QwikIntrinsicElements[E] & TypedStyleProps<C>) => {
      // Extract style props from component props
      const styleProps: Partial<TypedStyleProps<C>> = {}
      const elementProps: Partial<QwikIntrinsicElements[E]> = {}

      for (const key in props) {
        if (stylePropNames.includes(key as StylePropName)) {
          (styleProps as any)[key] = props[key]
        } else {
          (elementProps as any)[key] = props[key]
        }
      }

      // Merge base styles with props
      const mergedStyles = { ...baseStyles, ...styleProps }

      // Generate className (happens on server, resumable on client)
      const className = styleSystem.css(mergedStyles as TypedStyleProps<C>).className

      // Create element with class
      const Element = element as any
      return (
        <Element {...elementProps} class={className}>
          {props.children}
        </Element>
      )
    })
  }

  // Create primitive components
  const Box = styled('div')
  const Flex = styled('div', { display: 'flex' })

  return {
    styled,
    css: styleSystem.css.bind(styleSystem),
    Box,
    Flex,
    getCSSRules: styleSystem.getCSSRules.bind(styleSystem),
  }
}

/**
 * Hook for reactive styles in Qwik
 * Leverages Qwik's fine-grained reactivity
 *
 * @example
 * ```typescript
 * const count = useSignal(0)
 * const dynamicClass = useSilkStyle(css, () => ({
 *   bg: count.value > 5 ? 'red.500' : 'blue.500'
 * }))
 * ```
 */
export function useSilkStyle<C extends DesignConfig>(
  css: StyleSystem<C>['css'],
  styleFn: () => TypedStyleProps<C>
) {
  const className = useSignal('')

  useTask$(({ track }) => {
    // Track style function dependencies
    const styles = styleFn()
    track(() => styles)

    // Generate className
    className.value = css(styles).className
  })

  return className
}

// Re-export core types
export type {
  DesignConfig,
  TypedStyleProps,
  StyleObject,
  CSSProperties,
} from '@sylphx/silk'

// Re-export core utilities
export * from '@sylphx/silk'
