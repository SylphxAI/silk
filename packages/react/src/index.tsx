/**
 * @sylphx/zencss-react
 * React bindings for ZenCSS
 */

import React, { createElement, forwardRef } from 'react'
import type {
  ComponentProps,
  ElementType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react'
import type { DesignConfig, TypedStyleProps, StyleSystem } from '@sylphx/zencss'
import { createStyleSystem } from '@sylphx/zencss'

// HTML elements that can be styled
type StylableElements = keyof JSX.IntrinsicElements

// Props for styled components
type StyledComponentProps<
  Element extends ElementType,
  Config extends DesignConfig,
> = Omit<ComponentProps<Element>, keyof TypedStyleProps<Config>> &
  TypedStyleProps<Config> & {
    as?: ElementType
  }

// Styled component type - use a function component with explicit prop types
interface StyledComponent<Element extends ElementType, Config extends DesignConfig>
  extends React.ForwardRefExoticComponent<
    StyledComponentProps<Element, Config> & React.RefAttributes<any>
  > {
  (props: StyledComponentProps<Element, Config> & React.RefAttributes<any>): React.ReactElement | null
}

/**
 * Create React bindings for a style system
 */
export function createReactStyleSystem<C extends DesignConfig>(styleSystem: StyleSystem<C>) {
  const { css, cx } = styleSystem

  /**
   * Extract style props from component props
   */
  function extractStyleProps(props: Record<string, any>): {
    styleProps: TypedStyleProps<C>
    elementProps: Record<string, any>
  } {
    const styleProps: Record<string, any> = {}
    const elementProps: Record<string, any> = {}

    // Known style prop keys (could be auto-generated from TypedStyleProps)
    const stylePropKeys = new Set([
      'color',
      'bg',
      'backgroundColor',
      'borderColor',
      'm',
      'margin',
      'mt',
      'marginTop',
      'mr',
      'marginRight',
      'mb',
      'marginBottom',
      'ml',
      'marginLeft',
      'p',
      'padding',
      'pt',
      'paddingTop',
      'pr',
      'paddingRight',
      'pb',
      'paddingBottom',
      'pl',
      'paddingLeft',
      'gap',
      'w',
      'width',
      'h',
      'height',
      'minW',
      'minWidth',
      'maxW',
      'maxWidth',
      'minH',
      'minHeight',
      'maxH',
      'maxHeight',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'textAlign',
      'borderRadius',
      'rounded',
      'opacity',
      'boxShadow',
      'shadow',
      'display',
      'flexDirection',
      'justifyContent',
      'alignItems',
      '_hover',
      '_focus',
      '_active',
    ])

    for (const [key, value] of Object.entries(props)) {
      if (stylePropKeys.has(key) || key.startsWith('_')) {
        styleProps[key] = value
      } else {
        elementProps[key] = value
      }
    }

    return { styleProps: styleProps as TypedStyleProps<C>, elementProps }
  }

  /**
   * Create a styled component
   */
  function styled<Element extends StylableElements>(
    element: Element,
    baseStyles?: TypedStyleProps<C>
  ): StyledComponent<Element, C> {
    const StyledComponent = forwardRef<any, StyledComponentProps<Element, C>>((props, ref) => {
      const { as, className: externalClassName, ...rest } = props
      const { styleProps, elementProps } = extractStyleProps(rest)

      // Merge base styles with prop styles
      const mergedStyles = { ...baseStyles, ...styleProps } as TypedStyleProps<C>
      const { className, style } = css(mergedStyles)

      // Merge classNames
      const finalClassName = [className, externalClassName].filter(Boolean).join(' ')

      return createElement(as ?? element, {
        ...elementProps,
        ref,
        className: finalClassName,
        style,
      })
    })

    StyledComponent.displayName = `Styled(${String(element)})`

    return StyledComponent as StyledComponent<Element, C>
  }

  /**
   * Factory function to create styled elements
   */
  const styledFactory = new Proxy(styled, {
    get(target, prop: string) {
      if (prop in target) return target[prop as keyof typeof target]
      return (baseStyles?: TypedStyleProps<C>) => styled(prop as StylableElements, baseStyles)
    },
  }) as typeof styled & {
    [K in StylableElements]: (baseStyles?: TypedStyleProps<C>) => StyledComponent<K, C>
  }

  /**
   * Box component - most commonly used primitive
   */
  const Box = styled('div')

  /**
   * Flex component - shorthand for display: flex
   */
  const Flex = styled('div', { display: 'flex' })

  /**
   * Grid component - shorthand for display: grid
   */
  const Grid = styled('div', { display: 'grid' })

  /**
   * Text component
   */
  const Text = styled('span')

  /**
   * useStyles hook for dynamic styles
   */
  function useStyles(styles: TypedStyleProps<C>) {
    return React.useMemo(() => css(styles), [styles])
  }

  return {
    styled: styledFactory,
    Box,
    Flex,
    Grid,
    Text,
    useStyles,
    css,
    cx,
  }
}

export type ReactStyleSystem<C extends DesignConfig> = ReturnType<typeof createReactStyleSystem<C>>

/**
 * Helper function to create a complete ZenCSS React setup with proper type inference
 * This simplifies the config file by handling all the type gymnastics internally
 *
 * @example
 * ```tsx
 * // zen.config.ts
 * import { defineConfig } from '@sylphx/zencss'
 * import { createZenReact } from '@sylphx/zencss-react'
 *
 * const config = defineConfig({
 *   colors: { brand: { 500: '#3b82f6' } }
 * } as const)
 *
 * export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(config)
 * ```
 */
export function createZenReact<const C extends DesignConfig>(config: C) {
  // Create style system with explicit type
  const styleSystem = createStyleSystem<C>(config)

  // Create React bindings with explicit type
  const reactSystem = createReactStyleSystem<C>(styleSystem)

  // Type helper for styled components to ensure proper JSX type inference
  type ZenStyledComponent<E extends keyof JSX.IntrinsicElements> = ReturnType<
    typeof reactSystem.styled<E>
  >

  // Return all exports with explicit types for better type preservation in JSX
  return {
    styled: reactSystem.styled,
    Box: reactSystem.Box as ZenStyledComponent<'div'>,
    Flex: reactSystem.Flex as ZenStyledComponent<'div'>,
    Grid: reactSystem.Grid as ZenStyledComponent<'div'>,
    Text: reactSystem.Text as ZenStyledComponent<'span'>,
    css: reactSystem.css,
    cx: reactSystem.cx,
    // Also export the underlying systems for advanced use cases
    styleSystem,
    reactSystem,
  }
}

export type ZenReactSystem<C extends DesignConfig> = ReturnType<typeof createZenReact<C>>
