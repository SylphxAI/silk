/**
 * Animation and transition utilities
 */

import type { AnimationConfig } from './types-extended.js'

/**
 * Generate @keyframes CSS
 */
export function generateKeyframes(
  name: string,
  frames: Record<string, Record<string, string | number>>
): string {
  const frameRules = Object.entries(frames)
    .map(([key, props]) => {
      const cssProps = Object.entries(props)
        .map(([prop, value]) => {
          const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
          return `${cssProp}: ${value};`
        })
        .join(' ')
      return `  ${key} { ${cssProps} }`
    })
    .join('\n')

  return `@keyframes ${name} {\n${frameRules}\n}`
}

/**
 * Generate all keyframes from config
 */
export function generateAllKeyframes(
  keyframes: Record<string, Record<string, Record<string, string | number>>> | undefined
): string {
  if (!keyframes) return ''

  return Object.entries(keyframes)
    .map(([name, frames]) => generateKeyframes(name, frames))
    .join('\n\n')
}

/**
 * Predefined animations
 */
export const defaultAnimations = {
  // Spin
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',

  // Fade
  fadeIn: 'fadeIn 0.3s ease-in',
  fadeOut: 'fadeOut 0.3s ease-out',

  // Slide
  slideInUp: 'slideInUp 0.3s ease-out',
  slideInDown: 'slideInDown 0.3s ease-out',
  slideInLeft: 'slideInLeft 0.3s ease-out',
  slideInRight: 'slideInRight 0.3s ease-out',

  // Scale
  scaleIn: 'scaleIn 0.3s ease-out',
  scaleOut: 'scaleOut 0.3s ease-in',

  // Rotate
  rotateIn: 'rotateIn 0.3s ease-out',
  rotateOut: 'rotateOut 0.3s ease-in',
}

export const defaultKeyframes = {
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  ping: {
    '75%, 100%': { transform: 'scale(2)', opacity: '0' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  },

  // Fade
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },

  // Slide
  slideInUp: {
    from: { transform: 'translateY(100%)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },

  // Scale
  scaleIn: {
    from: { transform: 'scale(0)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: '1' },
    to: { transform: 'scale(0)', opacity: '0' },
  },

  // Rotate
  rotateIn: {
    from: { transform: 'rotate(-180deg)', opacity: '0' },
    to: { transform: 'rotate(0)', opacity: '1' },
  },
  rotateOut: {
    from: { transform: 'rotate(0)', opacity: '1' },
    to: { transform: 'rotate(180deg)', opacity: '0' },
  },
}

/**
 * Transition presets
 */
export const transitionPresets = {
  fast: 'all 0.15s ease',
  base: 'all 0.3s ease',
  slow: 'all 0.5s ease',
  colors: 'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease',
  opacity: 'opacity 0.3s ease',
  shadow: 'box-shadow 0.3s ease',
  transform: 'transform 0.3s ease',
  all: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

/**
 * Easing functions
 */
export const easingFunctions = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}
