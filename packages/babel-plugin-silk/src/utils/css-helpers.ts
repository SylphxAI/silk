/**
 * CSS transformation utilities
 */

/**
 * Property shorthand mappings
 * Maps Silk shorthand to full CSS properties
 */
export const PROPERTY_MAP: Record<string, string> = {
  m: 'margin',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',
  ml: 'margin-left',
  mx: 'margin-inline',
  my: 'margin-block',
  p: 'padding',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',
  pl: 'padding-left',
  px: 'padding-inline',
  py: 'padding-block',
  w: 'width',
  h: 'height',
  minW: 'min-width',
  minH: 'min-height',
  maxW: 'max-width',
  maxH: 'max-height',
  bg: 'background-color',
  bgColor: 'background-color',
  rounded: 'border-radius',
  roundedTop: 'border-top-left-radius border-top-right-radius',
  roundedBottom: 'border-bottom-left-radius border-bottom-right-radius',
  roundedLeft: 'border-top-left-radius border-bottom-left-radius',
  roundedRight: 'border-top-right-radius border-bottom-right-radius',
}

/**
 * Pseudo-selector mappings
 */
export const PSEUDO_MAP: Record<string, string> = {
  _hover: ':hover',
  _focus: ':focus',
  _active: ':active',
  _disabled: ':disabled',
  _visited: ':visited',
  _focusVisible: ':focus-visible',
  _focusWithin: ':focus-within',
  _checked: ':checked',
  _before: '::before',
  _after: '::after',
  _placeholder: '::placeholder',
  _selection: '::selection',
  _first: ':first-child',
  _last: ':last-child',
  _odd: ':nth-child(odd)',
  _even: ':nth-child(even)',
}

/**
 * Convert camelCase to kebab-case
 *
 * @param str - camelCase string
 * @returns kebab-case string
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/**
 * Resolve CSS property name from shorthand
 *
 * @param property - Property name (may be shorthand)
 * @returns Full CSS property name
 */
export function resolveCSSProperty(property: string): string {
  return PROPERTY_MAP[property] || camelToKebab(property)
}

/**
 * Resolve pseudo-selector from shorthand
 *
 * @param pseudo - Pseudo-selector shorthand (e.g., '_hover')
 * @returns CSS pseudo-selector (e.g., ':hover')
 */
export function resolvePseudoSelector(pseudo: string): string {
  return PSEUDO_MAP[pseudo] || pseudo.slice(1)
}

/**
 * Normalize CSS value
 * Handles unitless numbers, token resolution, etc.
 *
 * @param property - CSS property name
 * @param value - Raw value
 * @param tokens - Design tokens
 * @returns Normalized CSS value string
 */
export function normalizeCSSValue(
  property: string,
  value: any,
  tokens?: Record<string, any>
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return ''
  }

  // Already a string
  if (typeof value === 'string') {
    // Check if it's a token reference
    if (tokens && value.startsWith('$')) {
      const tokenKey = value.slice(1)
      return tokens[tokenKey] || value
    }
    return value
  }

  // Number handling
  if (typeof value === 'number') {
    // Spacing properties use 0.25rem units (like Tailwind)
    const spacingProps = ['p', 'padding', 'm', 'margin', 'gap', 'space']
    const isSpacing = spacingProps.some(prop => property.startsWith(prop))

    if (isSpacing) {
      return `${value * 0.25}rem`
    }

    // Properties that are unitless
    const unitlessProps = [
      'opacity',
      'zIndex',
      'fontWeight',
      'lineHeight',
      'flex',
      'flexGrow',
      'flexShrink',
      'order',
    ]
    if (unitlessProps.includes(property)) {
      return String(value)
    }

    // Default to px for other numeric values
    return `${value}px`
  }

  // Boolean values
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  // Fallback: stringify
  return String(value)
}

/**
 * Check if a property is a pseudo-selector
 */
export function isPseudoSelector(prop: string): boolean {
  return prop.startsWith('_')
}

/**
 * Check if a value is a responsive object
 * e.g., { base: '100%', md: '50%' }
 */
export function isResponsiveValue(value: any): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const keys = Object.keys(value)
  const responsiveKeys = ['base', 'sm', 'md', 'lg', 'xl', '2xl']

  return keys.some(key => responsiveKeys.includes(key))
}
