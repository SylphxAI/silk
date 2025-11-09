/**
 * @sylphx/silk-vue
 * Vue 3 bindings for Silk with Composition API and reactivity support
 */

import { h, defineComponent, computed } from 'vue'
import type { PropType, Component, VNode } from 'vue'
import { createStyleSystem, STYLE_PROP_NAMES, type DesignConfig, type TypedStyleProps, type StyleSystem } from '@sylphx/silk'

export interface SilkVueSystem<C extends DesignConfig> {
  /**
   * Create a styled Vue component
   */
  styled: <E extends keyof HTMLElementTagNameMap>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ) => Component

  /**
   * CSS function for dynamic styles
   */
  css: StyleSystem<C>['css']

  /**
   * Box primitive component
   */
  Box: Component

  /**
   * Flex primitive component
   */
  Flex: Component

  /**
   * Grid primitive component
   */
  Grid: Component

  /**
   * Get all CSS rules
   */
  getCSSRules: StyleSystem<C>['getCSSRules']
}

/**
 * Create Silk system for Vue 3
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@sylphx/silk'
 * import { createSilkVue } from '@sylphx/silk-vue'
 *
 * export const { styled, Box, css } = createSilkVue(
 *   defineConfig({
 *     colors: { brand: { 500: '#3b82f6' } },
 *     spacing: { 4: '1rem' }
 *   })
 * )
 * ```
 */
export function createSilkVue<const C extends DesignConfig>(
  config: C
): SilkVueSystem<C> {
  const styleSystem = createStyleSystem<C>(config)

  // Use shared style prop names from core
  const stylePropNames = STYLE_PROP_NAMES

  /**
   * Create a styled Vue component
   */
  function styled<E extends keyof HTMLElementTagNameMap>(
    element: E,
    baseStyles?: TypedStyleProps<C>
  ): Component {
    return defineComponent({
      name: `Silk${element.charAt(0).toUpperCase() + element.slice(1)}`,
      props: {
        // Define all style props as optional
        ...Object.fromEntries(
          stylePropNames.map(name => [
            name,
            { type: [String, Number, Object] as PropType<any>, required: false }
          ])
        ),
        // Allow additional HTML attributes
        class: { type: String, required: false },
        style: { type: Object as PropType<Record<string, any>>, required: false }
      },
      setup(props, { slots, attrs }) {
        // Extract style props from props
        const styleProps = computed(() => {
          const extracted: Record<string, any> = {}
          for (const key of stylePropNames) {
            if (key in props && props[key as keyof typeof props] !== undefined) {
              extracted[key] = props[key as keyof typeof props]
            }
          }
          return extracted
        })

        // Merge base styles with props
        const mergedStyles = computed(() => ({
          ...baseStyles,
          ...styleProps.value
        }))

        // Generate class name
        const className = computed(() =>
          styleSystem.css(mergedStyles.value as TypedStyleProps<C>)
        )

        // Extract non-style props for HTML element
        const elementAttrs = computed(() => {
          const result: Record<string, any> = { ...attrs }
          // Remove style props
          for (const key of stylePropNames) {
            delete result[key]
          }
          return result
        })

        return () => {
          return h(
            element,
            {
              ...elementAttrs.value,
              class: [className.value, props.class].filter(Boolean).join(' '),
              style: props.style
            },
            slots.default?.()
          )
        }
      }
    })
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
