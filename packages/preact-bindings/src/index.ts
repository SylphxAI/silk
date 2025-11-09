/**
 * @sylphx/silk-preact
 * Preact bindings for Silk with lightweight 3KB runtime
 */

import { h, type FunctionComponent, type JSX } from 'preact'
import { useMemo } from 'preact/hooks'
import { createStyleSystem, STYLE_PROP_SET, type DesignConfig, type TypedStyleProps, type StyleSystem } from '@sylphx/silk'

export interface SilkPreactSystem<C extends DesignConfig> {
  /**
   * Create a styled Preact component
   */
  styled: <E extends keyof JSX.IntrinsicElements>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ) => FunctionComponent<JSX.IntrinsicElements[E] & TypedStyleProps<C>>

  /**
   * CSS function for dynamic styles
   */
  css: StyleSystem<C>['css']

  /**
   * Box primitive component
   */
  Box: FunctionComponent<JSX.IntrinsicElements['div'] & TypedStyleProps<C>>

  /**
   * Flex primitive component
   */
  Flex: FunctionComponent<JSX.IntrinsicElements['div'] & TypedStyleProps<C>>

  /**
   * Grid primitive component
   */
  Grid: FunctionComponent<JSX.IntrinsicElements['div'] & TypedStyleProps<C>>

  /**
   * Get all CSS rules
   */
  getCSSRules: StyleSystem<C>['getCSSRules']
}

/**
 * Create Silk system for Preact
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@sylphx/silk'
 * import { createSilkPreact } from '@sylphx/silk-preact'
 *
 * export const { styled, Box, css } = createSilkPreact(
 *   defineConfig({
 *     colors: { brand: { 500: '#3b82f6' } },
 *     spacing: { 4: '1rem' }
 *   })
 * )
 * ```
 */
export function createSilkPreact<const C extends DesignConfig>(
  config: C
): SilkPreactSystem<C> {
  const styleSystem = createStyleSystem<C>(config)

  // Use shared style prop set from core
  const stylePropNames = STYLE_PROP_SET

  /**
   * Create a styled Preact component
   */
  function styled<E extends keyof JSX.IntrinsicElements>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ): FunctionComponent<JSX.IntrinsicElements[E] & TypedStyleProps<C>> {
    return function StyledComponent(props: JSX.IntrinsicElements[E] & TypedStyleProps<C>) {
      // Extract style props from component props
      const styleProps: Partial<TypedStyleProps<C>> = {}
      const elementProps: Partial<JSX.IntrinsicElements[E]> = {}

      for (const key in props) {
        if (stylePropNames.has(key as any)) {
          (styleProps as any)[key] = props[key]
        } else {
          (elementProps as any)[key] = props[key]
        }
      }

      // Memoize className generation
      const className = useMemo(() => {
        const mergedStyles = { ...baseStyles, ...styleProps }
        return styleSystem.css(mergedStyles as TypedStyleProps<C>)
      }, [Object.values(styleProps).join(',')])

      // Create element with class
      return h(element, { ...elementProps, class: className }, props.children)
    }
  }

  // Create primitive components
  const Box = styled('div')
  const Flex = styled('div', { display: 'flex' })
  const Grid = styled('div', { display: 'grid' })

  return {
    styled,
    css: styleSystem.css.bind(styleSystem),
    Box,
    Flex,
    Grid,
    getCSSRules: styleSystem.getCSSRules.bind(styleSystem),
  }
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
