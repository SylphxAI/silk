/**
 * Extended configuration with all features
 */

import { defineConfig } from './config.js'
import { defaultKeyframes, defaultAnimations } from './animations.js'
import type { ThemeConfig, AnimationConfig } from './types-extended.js'

/**
 * Extended config helper with semantic tokens and animations
 */
export function defineExtendedConfig<
  T extends {
    colors?: any
    spacing?: any
    breakpoints?: any
    semanticTokens?: any
    animations?: any
    keyframes?: any
    containers?: any
  },
>(config: T): T {
  return config
}

/**
 * Extended default config with all features
 */
export const extendedDefaultConfig = defineExtendedConfig({
  colors: {
    transparent: 'transparent',
    current: 'currentColor',
    black: '#000',
    white: '#fff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    red: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      900: '#7f1d1d',
    },
    blue: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    green: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      900: '#14532d',
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
  },

  sizes: {
    full: '100%',
    screen: '100vh',
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  containers: {
    xs: '320px',
    sm: '384px',
    md: '448px',
    lg: '512px',
    xl: '576px',
  },

  semanticTokens: {
    colors: {
      bg: {
        DEFAULT: {
          light: '#ffffff',
          dark: '#111827',
        },
        subtle: {
          light: '#f9fafb',
          dark: '#1f2937',
        },
        muted: {
          light: '#f3f4f6',
          dark: '#374151',
        },
      },
      text: {
        DEFAULT: {
          light: '#111827',
          dark: '#f9fafb',
        },
        muted: {
          light: '#6b7280',
          dark: '#9ca3af',
        },
      },
      border: {
        DEFAULT: {
          light: '#e5e7eb',
          dark: '#374151',
        },
      },
      primary: {
        DEFAULT: {
          light: '#3b82f6',
          dark: '#60a5fa',
        },
        hover: {
          light: '#2563eb',
          dark: '#3b82f6',
        },
      },
    },
  },

  animations: defaultAnimations,
  keyframes: defaultKeyframes,
} as const)

export type ExtendedDefaultConfig = typeof extendedDefaultConfig
