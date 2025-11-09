/**
 * Responsive breakpoints system
 */

import type { DesignConfig, TypedStyleProps } from './types.js'

export interface ResponsiveConfig {
  breakpoints?: Record<string, string>
}

/**
 * Sort breakpoints by pixel value
 */
function sortBreakpoints(breakpoints: Record<string, string>): [string, string][] {
  return Object.entries(breakpoints).sort((a, b) => {
    const aVal = Number.parseInt(a[1])
    const bVal = Number.parseInt(b[1])
    return aVal - bVal
  })
}

/**
 * Generate media query from breakpoint
 */
export function generateMediaQuery(breakpoint: string, minMax: 'min' | 'max' = 'min'): string {
  return `@media (${minMax}-width: ${breakpoint})`
}

/**
 * Process responsive styles
 */
export function processResponsiveStyles<C extends DesignConfig>(
  styles: TypedStyleProps<C>,
  breakpoints: Record<string, string> | undefined
): {
  base: TypedStyleProps<C>
  responsive: Record<string, TypedStyleProps<C>>
} {
  if (!breakpoints) {
    return { base: styles, responsive: {} }
  }

  const base: TypedStyleProps<C> = {}
  const responsive: Record<string, TypedStyleProps<C>> = {}
  const breakpointKeys = new Set(Object.keys(breakpoints))

  for (const [key, value] of Object.entries(styles)) {
    if (breakpointKeys.has(key) && typeof value === 'object') {
      // This is a responsive breakpoint
      responsive[key] = value
    } else {
      // Regular style
      base[key] = value
    }
  }

  return { base, responsive }
}

/**
 * Generate CSS rules for responsive styles
 */
export function generateResponsiveCSS(
  selector: string,
  responsiveStyles: Record<string, Record<string, any>>,
  breakpoints: Record<string, string>,
  cssValueResolver: (prop: string, value: any) => string
): string[] {
  const rules: string[] = []
  const sorted = sortBreakpoints(breakpoints)

  for (const [breakpointKey, breakpointValue] of sorted) {
    const styles = responsiveStyles[breakpointKey]
    if (!styles) continue

    const mediaQuery = generateMediaQuery(breakpointValue)
    const cssProps = Object.entries(styles)
      .map(([prop, value]) => {
        const cssValue = cssValueResolver(prop, value)
        const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
        return `${cssProp}: ${cssValue};`
      })
      .join(' ')

    const rule = `${mediaQuery} { ${selector} { ${cssProps} } }`
    rules.push(rule)
  }

  return rules
}

/**
 * Container query support
 */
export interface ContainerQueryConfig {
  containers?: Record<string, string>
}

/**
 * Generate container query
 */
export function generateContainerQuery(size: string): string {
  return `@container (min-width: ${size})`
}

/**
 * Process container queries
 */
export function processContainerQueries<C extends DesignConfig>(
  styles: TypedStyleProps<C>,
  containers: Record<string, string> | undefined
): {
  base: TypedStyleProps<C>
  container: Record<string, TypedStyleProps<C>>
  containerType?: string
  containerName?: string
} {
  if (!containers) {
    return { base: styles, container: {} }
  }

  const base: TypedStyleProps<C> = {}
  const container: Record<string, TypedStyleProps<C>> = {}
  let containerType: string | undefined
  let containerName: string | undefined
  const containerKeys = new Set(Object.keys(containers).map((k) => `@${k}`))

  for (const [key, value] of Object.entries(styles)) {
    if (key === 'containerType') {
      containerType = value
    } else if (key === 'containerName') {
      containerName = value
    } else if (containerKeys.has(key) && typeof value === 'object') {
      // Remove @ prefix
      const containerKey = key.slice(1)
      container[containerKey] = value
    } else {
      base[key] = value
    }
  }

  return { base, container, containerType, containerName }
}

/**
 * Generate CSS for container queries
 */
export function generateContainerQueryCSS(
  selector: string,
  containerStyles: Record<string, Record<string, any>>,
  containers: Record<string, string>,
  cssValueResolver: (prop: string, value: any) => string
): string[] {
  const rules: string[] = []

  for (const [containerKey, containerValue] of Object.entries(containers)) {
    const styles = containerStyles[containerKey]
    if (!styles) continue

    const containerQuery = generateContainerQuery(containerValue)
    const cssProps = Object.entries(styles)
      .map(([prop, value]) => {
        const cssValue = cssValueResolver(prop, value)
        const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
        return `${cssProp}: ${cssValue};`
      })
      .join(' ')

    const rule = `${containerQuery} { ${selector} { ${cssProps} } }`
    rules.push(rule)
  }

  return rules
}
