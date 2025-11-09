/**
 * Shared style prop names for framework bindings
 *
 * This list is used by React, Vue, Svelte, Preact, Solid, and Qwik bindings
 * to extract style props from component props.
 *
 * Centralizing this list ensures:
 * - No duplication across framework bindings
 * - Consistent prop support across all frameworks
 * - Single source of truth for maintainability
 */

export const STYLE_PROP_NAMES = [
  // Color props
  'color',
  'bg',
  'backgroundColor',
  'borderColor',

  // Spacing props - margin
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
  'mx',
  'marginX',
  'my',
  'marginY',

  // Spacing props - padding
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
  'px',
  'paddingX',
  'py',
  'paddingY',

  // Spacing props - gap
  'gap',
  'rowGap',
  'columnGap',

  // Size props
  'w',
  'width',
  'h',
  'height',
  'minW',
  'minWidth',
  'minH',
  'minHeight',
  'maxW',
  'maxWidth',
  'maxH',
  'maxHeight',

  // Typography props
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'textDecoration',

  // Layout props - flexbox
  'display',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',

  // Layout props - grid
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  'gridArea',
  'gridAutoFlow',
  'gridAutoColumns',
  'gridAutoRows',

  // Layout props - position
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'zIndex',

  // Border props
  'border',
  'borderWidth',
  'borderStyle',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'rounded',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',

  // Effect props
  'opacity',
  'shadow',
  'boxShadow',
  'textShadow',
  'cursor',
  'pointerEvents',
  'userSelect',

  // Transform props
  'transform',
  'transformOrigin',
  'scale',
  'rotate',
  'translate',
  'skew',

  // Transition and animation props
  'transition',
  'transitionDuration',
  'transitionTimingFunction',
  'transitionDelay',
  'animation',
  'animationDuration',
  'animationTimingFunction',
  'animationDelay',
  'animationIterationCount',
  'animationDirection',
  'animationFillMode',
  'animationPlayState',

  // Background props
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',

  // Overflow props
  'overflow',
  'overflowX',
  'overflowY',

  // Pseudo states
  '_hover',
  '_focus',
  '_active',
  '_disabled',
  '_visited',
  '_checked',
  '_invalid',
  '_placeholder',
  '_before',
  '_after',
  '_first',
  '_last',
  '_odd',
  '_even',
  '_empty',
  '_focusVisible',
  '_focusWithin',

  // Modern CSS features
  'containerType',
  'containerName',
  '@container',
  '@scope',
  '@starting-style',
  'viewTransitionName',
  'contain',
  'contentVisibility',
  'willChange',

  // Responsive breakpoints (if used directly)
  '@sm',
  '@md',
  '@lg',
  '@xl',
  '@2xl',
] as const

/**
 * Type-safe set of style prop names for O(1) lookup
 */
export const STYLE_PROP_SET = new Set(STYLE_PROP_NAMES)

/**
 * Check if a prop name is a style prop
 */
export function isStyleProp(propName: string): boolean {
  return (STYLE_PROP_SET as Set<string>).has(propName) || propName.startsWith('_') || propName.startsWith('@')
}

/**
 * Type for style prop names
 */
export type StylePropName = typeof STYLE_PROP_NAMES[number]
