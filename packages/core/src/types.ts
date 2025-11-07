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
export type TypedStyleProps<Config extends DesignConfig> = {
  // Color properties
  color?: Config['colors'] extends infer C ? NestedKeys<C> | (string & {}) : string
  bg?: Config['colors'] extends infer C ? NestedKeys<C> | (string & {}) : string
  backgroundColor?: Config['colors'] extends infer C ? NestedKeys<C> | (string & {}) : string
  borderColor?: Config['colors'] extends infer C ? NestedKeys<C> | (string & {}) : string

  // Spacing properties
  m?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  margin?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  mt?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  marginTop?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  mr?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  marginRight?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number
  mb?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  marginBottom?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number
  ml?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  marginLeft?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number

  p?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  padding?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  pt?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  paddingTop?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number
  pr?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  paddingRight?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number
  pb?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  paddingBottom?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number
  pl?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number
  paddingLeft?: Config['spacing'] extends infer S
    ? keyof S | (string & {}) | number
    : string | number

  gap?: Config['spacing'] extends infer S ? keyof S | (string & {}) | number : string | number

  // Size properties
  w?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  width?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  h?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  height?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  minW?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  minWidth?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  minH?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  minHeight?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  maxW?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  maxWidth?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  maxH?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number
  maxHeight?: Config['sizes'] extends infer S ? keyof S | (string & {}) | number : string | number

  // Typography
  fontSize?: Config['fontSizes'] extends infer F
    ? keyof F | (string & {}) | number
    : string | number
  fontWeight?: Config['fontWeights'] extends infer F
    ? keyof F | (string & {}) | number
    : string | number
  lineHeight?: Config['lineHeights'] extends infer L
    ? keyof L | (string & {}) | number
    : string | number
  letterSpacing?: Config['letterSpacings'] extends infer L ? keyof L | (string & {}) : string

  // Border
  borderRadius?: Config['radii'] extends infer R
    ? keyof R | (string & {}) | number
    : string | number
  rounded?: Config['radii'] extends infer R ? keyof R | (string & {}) | number : string | number

  // Layout
  display?: CSSProperties['display']
  flexDirection?: CSSProperties['flexDirection']
  justifyContent?: CSSProperties['justifyContent']
  alignItems?: CSSProperties['alignItems']
  textAlign?: CSSProperties['textAlign']

  // Effects
  opacity?: string | number
  boxShadow?: Config['shadows'] extends infer S ? keyof S | (string & {}) : string
  shadow?: Config['shadows'] extends infer S ? keyof S | (string & {}) : string

  // Pseudo states
  _hover?: TypedStyleProps<Config>
  _focus?: TypedStyleProps<Config>
  _active?: TypedStyleProps<Config>

  // Responsive (breakpoints)
  [K: string]: any // Allow responsive props like 'sm', 'md', etc.
}

// Style function return type
export interface StyleObject {
  className: string
  style?: Record<string, any>
}
