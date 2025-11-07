/**
 * Extended type system for advanced features
 * Responsive, Variants, Theming, Container Queries
 */

import type { DesignConfig, TypedStyleProps } from './types.js'

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

/**
 * Extract breakpoint keys from config
 */
export type BreakpointKeys<Config extends DesignConfig> = Config['breakpoints'] extends infer B
  ? keyof B & string
  : never

/**
 * Responsive style props with breakpoint support
 */
export type ResponsiveStyleProps<Config extends DesignConfig> = TypedStyleProps<Config> & {
  [K in BreakpointKeys<Config>]?: TypedStyleProps<Config>
}

// ============================================================================
// CONTAINER QUERIES
// ============================================================================

export interface ContainerConfig {
  containers?: Record<string, string>
}

export type ContainerKeys<Config extends ContainerConfig> = Config['containers'] extends infer C
  ? keyof C & string
  : never

export type ContainerStyleProps<Config extends DesignConfig & ContainerConfig> =
  TypedStyleProps<Config> & {
    containerType?: 'size' | 'inline-size' | 'normal'
    containerName?: string
  } & {
    [K in `@${ContainerKeys<Config>}`]?: TypedStyleProps<Config>
  }

// ============================================================================
// SEMANTIC TOKENS (Theming)
// ============================================================================

export interface SemanticTokenValue {
  light?: string
  dark?: string
  DEFAULT?: string
}

export interface SemanticTokens {
  colors?: Record<string, SemanticTokenValue | Record<string, SemanticTokenValue>>
  spacing?: Record<string, SemanticTokenValue>
  sizes?: Record<string, SemanticTokenValue>
  [key: string]: any
}

export interface ThemeConfig {
  semanticTokens?: SemanticTokens
}

// ============================================================================
// ANIMATIONS
// ============================================================================

export interface AnimationConfig {
  animations?: Record<string, string>
  keyframes?: Record<string, Record<string, Record<string, string | number>>>
}

// ============================================================================
// EXTENDED CSS PROPERTIES
// ============================================================================

export interface ExtendedCSSProperties {
  // Text utilities
  textOverflow?: 'clip' | 'ellipsis'
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word'
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'

  // Cursor & interaction
  cursor?:
    | 'auto'
    | 'default'
    | 'pointer'
    | 'wait'
    | 'text'
    | 'move'
    | 'not-allowed'
    | 'help'
    | 'grab'
    | 'grabbing'
  userSelect?: 'none' | 'auto' | 'text' | 'all'
  pointerEvents?: 'none' | 'auto'

  // Modern layout
  aspectRatio?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string

  // Transform
  transform?: string
  transformOrigin?: string
  transformStyle?: 'flat' | 'preserve-3d'
  perspective?: string | number

  // Transition & animation
  transition?: string
  transitionProperty?: string
  transitionDuration?: string
  transitionTimingFunction?: string
  transitionDelay?: string
  animation?: string

  // Grid
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridColumn?: string
  gridRow?: string
  gridAutoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'

  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  zIndex?: number

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

// ============================================================================
// EXTENDED PSEUDO SELECTORS
// ============================================================================

export type ExtendedPseudoSelectors<T> = {
  // Existing
  _hover?: T
  _focus?: T
  _active?: T

  // Focus variants
  _focusVisible?: T
  _focusWithin?: T

  // State
  _disabled?: T
  _enabled?: T
  _checked?: T
  _indeterminate?: T
  _readOnly?: T
  _required?: T
  _valid?: T
  _invalid?: T

  // Position
  _first?: T
  _last?: T
  _firstChild?: T
  _lastChild?: T
  _odd?: T
  _even?: T
  _only?: T

  // Advanced
  _before?: T
  _after?: T
  _placeholder?: T
  _selection?: T
  _visited?: T

  // Media
  _dark?: T
  _light?: T
  _motionReduce?: T
  _motionSafe?: T
  _print?: T

  // Group & peer
  _groupHover?: T
  _peerFocus?: T
}

// ============================================================================
// VARIANTS & RECIPES
// ============================================================================

/**
 * Variant definition
 */
export type VariantDefinition<Config extends DesignConfig> = Record<
  string,
  TypedStyleProps<Config>
>

/**
 * Compound variant - applies when multiple variant conditions are met
 */
export type CompoundVariant<Config extends DesignConfig> = {
  [variantKey: string]: string | boolean
} & {
  css: TypedStyleProps<Config>
}

/**
 * Recipe configuration
 */
export interface RecipeConfig<
  Config extends DesignConfig,
  Variants extends Record<string, VariantDefinition<Config>> = {},
> {
  base?: TypedStyleProps<Config>
  variants?: Variants
  compoundVariants?: CompoundVariant<Config>[]
  defaultVariants?: {
    [K in keyof Variants]?: keyof Variants[K] & string
  }
}

/**
 * Recipe variant props type
 */
export type RecipeVariantProps<Variants extends Record<string, Record<string, any>>> = {
  [K in keyof Variants]?: keyof Variants[K] & string
}

/**
 * Recipe return type
 */
export interface RecipeFunction<
  Config extends DesignConfig,
  Variants extends Record<string, VariantDefinition<Config>>,
> {
  (props?: RecipeVariantProps<Variants>): string
  variants: Variants
  config: RecipeConfig<Config, Variants>
}

// ============================================================================
// SLOT RECIPES (Multi-part components)
// ============================================================================

export type SlotDefinition<Config extends DesignConfig> = Record<string, TypedStyleProps<Config>>

export interface SlotRecipeConfig<
  Config extends DesignConfig,
  Slots extends Record<string, TypedStyleProps<Config>>,
  Variants extends Record<string, Record<string, SlotDefinition<Config>>> = {},
> {
  slots: (keyof Slots)[]
  base?: Slots
  variants?: Variants
  defaultVariants?: {
    [K in keyof Variants]?: keyof Variants[K] & string
  }
}

export type SlotRecipeVariantProps<Variants extends Record<string, Record<string, any>>> = {
  [K in keyof Variants]?: keyof Variants[K] & string
}

export type SlotRecipeReturn<Slots extends Record<string, any>> = {
  [K in keyof Slots]: string
}

export interface SlotRecipeFunction<
  Config extends DesignConfig,
  Slots extends Record<string, TypedStyleProps<Config>>,
  Variants extends Record<string, Record<string, SlotDefinition<Config>>>,
> {
  (props?: SlotRecipeVariantProps<Variants>): SlotRecipeReturn<Slots>
}

// ============================================================================
// COMPLETE EXTENDED STYLE PROPS
// ============================================================================

export type CompleteStyleProps<Config extends DesignConfig & ThemeConfig & AnimationConfig> =
  TypedStyleProps<Config> &
    ExtendedCSSProperties &
    ExtendedPseudoSelectors<TypedStyleProps<Config> & ExtendedCSSProperties> &
    ResponsiveStyleProps<Config> & {
      // Animation
      animation?: Config['animations'] extends infer A ? keyof A | (string & {}) : string

      // Theme conditions
      _light?: TypedStyleProps<Config>
      _dark?: TypedStyleProps<Config>
    }
