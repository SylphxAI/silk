/**
 * Core type utilities for zero-codegen type inference
 */

// Extract nested keys from object: { colors: { red: { 500: 'xxx' } } } -> 'red.500'
export type NestedKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends string | number
        ? `${Prefix}${K}`
        : T[K] extends object
        ? T[K] extends readonly any[]
          ? `${Prefix}${K}`
          : // Check if all values are primitives (this is a leaf object like { 500: '#fff', 600: '#eee' })
          [T[K][keyof T[K]]] extends [string | number]
          ? `${Prefix}${K}.${keyof T[K] & (string | number)}`
          : NestedKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
    }[keyof T & string]
  : never

// Flatten nested object values: { red: { 500: '#fff' } } -> '#fff'
export type NestedValues<T> = T extends object
  ? T[keyof T] extends infer V
    ? V extends object
      ? NestedValues<V>
      : V
    : never
  : T

// Token scale type helper
export type TokenScale<T> = {
  readonly [K in keyof T]: T[K]
}

// CSS Properties type (simplified, can extend to full CSS spec)
export type CSSProperties = {
  // Colors
  color?: string
  backgroundColor?: string
  borderColor?: string

  // Spacing
  margin?: string | number
  marginTop?: string | number
  marginRight?: string | number
  marginBottom?: string | number
  marginLeft?: string | number
  padding?: string | number
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number
  gap?: string | number

  // Sizing
  width?: string | number
  height?: string | number
  minWidth?: string | number
  minHeight?: string | number
  maxWidth?: string | number
  maxHeight?: string | number

  // Layout
  display?: 'flex' | 'block' | 'inline' | 'inline-block' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'

  // Typography
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  textAlign?: 'left' | 'center' | 'right' | 'justify'

  // Border
  borderRadius?: string | number
  borderWidth?: string | number

  // Effects
  opacity?: string | number
  boxShadow?: string

  // Pseudo & responsive (handled separately)
  '&:hover'?: CSSProperties
  '&:focus'?: CSSProperties
  '&:active'?: CSSProperties
}

// Design system config structure
export interface DesignConfig {
  colors?: Record<string, Record<string, string> | string>
  spacing?: Record<string, string>
  sizes?: Record<string, string>
  fontSizes?: Record<string, string>
  fontWeights?: Record<string, string | number>
  lineHeights?: Record<string, string | number>
  letterSpacings?: Record<string, string>
  radii?: Record<string, string>
  shadows?: Record<string, string>
  breakpoints?: Record<string, string>
}

// Map config to typed properties
// STRICT MODE: Only design tokens are allowed (no arbitrary strings)
// Use the 'style' prop for custom values outside the design system
export type TypedStyleProps<Config extends DesignConfig> = {
  // Color properties - only design tokens allowed
  color?: Config['colors'] extends infer C ? NestedKeys<C> : never
  bg?: Config['colors'] extends infer C ? NestedKeys<C> : never
  backgroundColor?: Config['colors'] extends infer C ? NestedKeys<C> : never
  borderColor?: Config['colors'] extends infer C ? NestedKeys<C> : never

  // Spacing properties - design tokens or numbers only
  m?: Config['spacing'] extends infer S ? keyof S | number : number
  margin?: Config['spacing'] extends infer S ? keyof S | number : number
  mt?: Config['spacing'] extends infer S ? keyof S | number : number
  marginTop?: Config['spacing'] extends infer S ? keyof S | number : number
  mr?: Config['spacing'] extends infer S ? keyof S | number : number
  marginRight?: Config['spacing'] extends infer S ? keyof S | number : number
  mb?: Config['spacing'] extends infer S ? keyof S | number : number
  marginBottom?: Config['spacing'] extends infer S ? keyof S | number : number
  ml?: Config['spacing'] extends infer S ? keyof S | number : number
  marginLeft?: Config['spacing'] extends infer S ? keyof S | number : number

  p?: Config['spacing'] extends infer S ? keyof S | number : number
  padding?: Config['spacing'] extends infer S ? keyof S | number : number
  pt?: Config['spacing'] extends infer S ? keyof S | number : number
  paddingTop?: Config['spacing'] extends infer S ? keyof S | number : number
  pr?: Config['spacing'] extends infer S ? keyof S | number : number
  paddingRight?: Config['spacing'] extends infer S ? keyof S | number : number
  pb?: Config['spacing'] extends infer S ? keyof S | number : number
  paddingBottom?: Config['spacing'] extends infer S ? keyof S | number : number
  pl?: Config['spacing'] extends infer S ? keyof S | number : number
  paddingLeft?: Config['spacing'] extends infer S ? keyof S | number : number

  gap?: Config['spacing'] extends infer S ? keyof S | number : number

  // Size properties - design tokens or numbers only
  w?: Config['sizes'] extends infer S ? keyof S | number : number
  width?: Config['sizes'] extends infer S ? keyof S | number : number
  h?: Config['sizes'] extends infer S ? keyof S | number : number
  height?: Config['sizes'] extends infer S ? keyof S | number : number
  minW?: Config['sizes'] extends infer S ? keyof S | number : number
  minWidth?: Config['sizes'] extends infer S ? keyof S | number : number
  minH?: Config['sizes'] extends infer S ? keyof S | number : number
  minHeight?: Config['sizes'] extends infer S ? keyof S | number : number
  maxW?: Config['sizes'] extends infer S ? keyof S | number : number
  maxWidth?: Config['sizes'] extends infer S ? keyof S | number : number
  maxH?: Config['sizes'] extends infer S ? keyof S | number : number
  maxHeight?: Config['sizes'] extends infer S ? keyof S | number : number

  // Typography - design tokens or numbers only
  fontSize?: Config['fontSizes'] extends infer F ? keyof F | number : number
  fontWeight?: Config['fontWeights'] extends infer F ? keyof F | number : number
  lineHeight?: Config['lineHeights'] extends infer L ? keyof L | number : number
  letterSpacing?: Config['letterSpacings'] extends infer L ? keyof L : never

  // Border
  borderRadius?: Config['radii'] extends infer R ? keyof R | number : number
  rounded?: Config['radii'] extends infer R ? keyof R | number : number

  // Layout
  display?: CSSProperties['display']
  flexDirection?: CSSProperties['flexDirection']
  justifyContent?: CSSProperties['justifyContent']
  alignItems?: CSSProperties['alignItems']
  textAlign?: CSSProperties['textAlign']

  // Effects
  opacity?: number
  boxShadow?: Config['shadows'] extends infer S ? keyof S : never
  shadow?: Config['shadows'] extends infer S ? keyof S : never

  // Pseudo states
  _hover?: TypedStyleProps<Config>
  _focus?: TypedStyleProps<Config>
  _active?: TypedStyleProps<Config>
  _disabled?: TypedStyleProps<Config>
  _visited?: TypedStyleProps<Config>
  _checked?: TypedStyleProps<Config>
  _before?: TypedStyleProps<Config>
  _after?: TypedStyleProps<Config>

  // Modern CSS: Container Queries (93% browser support)
  // Enable with containerType, then use @container queries
  containerType?: 'size' | 'inline-size' | 'normal'
  containerName?: string
  '@container'?: TypedStyleProps<Config>
  '@container (min-width: 400px)'?: TypedStyleProps<Config>
  '@container (min-width: 600px)'?: TypedStyleProps<Config>
  '@container (orientation: portrait)'?: TypedStyleProps<Config>

  // Modern CSS: @scope (85% browser support)
  // Scoped styles with explicit boundaries
  '@scope'?: {
    root?: string
    limit?: string
    styles: TypedStyleProps<Config>
  }

  // Modern CSS: @starting-style (88% browser support)
  // Entry animations from display:none
  '@starting-style'?: TypedStyleProps<Config>

  // Modern CSS: View Transitions (75% browser support, Interop 2025)
  viewTransitionName?: string

  // CSS Containment (95% browser support)
  contain?: 'none' | 'strict' | 'content' | 'size' | 'layout' | 'style' | 'paint'

  // Responsive (breakpoints)
  [K: string]: any // Allow responsive props like 'sm', 'md', etc.
}

// Style function return type
export interface StyleObject {
  className: string
  style?: Record<string, any>
}
