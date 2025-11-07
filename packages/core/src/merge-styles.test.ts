import { describe, it, expect } from 'vitest'
import {
  mergeStyles,
  conditionalStyle,
  createVariant,
  createCompoundVariant,
  type CompoundVariantConfig,
} from './merge-styles'
import type { DesignConfig, TypedStyleProps } from './types'

// Test config
const config = {
  colors: {
    brand: { 500: '#3b82f6', 600: '#2563eb' },
    gray: { 100: '#f3f4f6', 900: '#111827' },
    red: { 500: '#ef4444' },
  },
  spacing: { 4: '1rem', 6: '1.5rem', 8: '2rem' },
} as const

type TestConfig = typeof config

describe('merge-styles', () => {
  describe('mergeStyles', () => {
    it('should merge simple properties', () => {
      const style1: TypedStyleProps<TestConfig> = { px: 4, py: 2 }
      const style2: TypedStyleProps<TestConfig> = { px: 6, bg: 'brand.500' }

      const result = mergeStyles(style1, style2)

      expect(result).toEqual({
        px: 6, // overridden
        py: 2,
        bg: 'brand.500',
      })
    })

    it('should handle undefined and null styles', () => {
      const style1: TypedStyleProps<TestConfig> = { px: 4 }

      const result = mergeStyles(style1, undefined, null, false)

      expect(result).toEqual({ px: 4 })
    })

    it('should merge nested pseudo selectors', () => {
      const style1: TypedStyleProps<TestConfig> = {
        bg: 'brand.500',
        _hover: { bg: 'brand.600' },
      }
      const style2: TypedStyleProps<TestConfig> = {
        _hover: { opacity: 0.8 },
      }

      const result = mergeStyles(style1, style2)

      expect(result).toEqual({
        bg: 'brand.500',
        _hover: {
          bg: 'brand.600',
          opacity: 0.8,
        },
      })
    })

    it('should override nested properties', () => {
      const style1: TypedStyleProps<TestConfig> = {
        _hover: { bg: 'brand.500', opacity: 0.8 },
      }
      const style2: TypedStyleProps<TestConfig> = {
        _hover: { bg: 'brand.600' },
      }

      const result = mergeStyles(style1, style2)

      expect(result._hover).toEqual({
        bg: 'brand.600', // overridden
        opacity: 0.8,
      })
    })

    it('should handle multiple style objects', () => {
      const base: TypedStyleProps<TestConfig> = { px: 4, py: 2 }
      const hover: TypedStyleProps<TestConfig> = { _hover: { opacity: 0.8 } }
      const color: TypedStyleProps<TestConfig> = { bg: 'brand.500' }
      const override: TypedStyleProps<TestConfig> = { px: 6 }

      const result = mergeStyles(base, hover, color, override)

      expect(result).toEqual({
        px: 6,
        py: 2,
        _hover: { opacity: 0.8 },
        bg: 'brand.500',
      })
    })

    it('should filter out undefined and null values within styles', () => {
      const style: TypedStyleProps<TestConfig> = {
        px: 4,
        py: undefined,
        bg: 'brand.500',
      }

      const result = mergeStyles(style)

      expect(result).toEqual({
        px: 4,
        bg: 'brand.500',
      })
      expect(result.py).toBeUndefined()
    })
  })

  describe('conditionalStyle', () => {
    it('should apply styles conditionally', () => {
      const base: TypedStyleProps<TestConfig> = { px: 4 }
      const active = true
      const disabled = false

      const result = conditionalStyle(
        base,
        active && { bg: 'brand.500' },
        disabled && { opacity: 0.5 }
      )

      expect(result).toEqual({
        px: 4,
        bg: 'brand.500',
      })
    })

    it('should handle all falsy conditions', () => {
      const base: TypedStyleProps<TestConfig> = { px: 4 }

      const result = conditionalStyle(
        base,
        false && { bg: 'brand.500' },
        null,
        undefined
      )

      expect(result).toEqual({ px: 4 })
    })

    it('should work with ternary-like patterns', () => {
      const isActive = true

      const result = conditionalStyle(
        { px: 4 },
        isActive ? { bg: 'brand.500' } : { bg: 'gray.100' }
      )

      expect(result).toEqual({
        px: 4,
        bg: 'brand.500',
      })
    })
  })

  describe('createVariant', () => {
    it('should create a variant selector function', () => {
      const buttonVariant = createVariant<TestConfig, 'primary' | 'secondary'>({
        primary: { bg: 'brand.500', color: 'white' },
        secondary: { bg: 'gray.100', color: 'gray.900' },
      })

      expect(buttonVariant('primary')).toEqual({
        bg: 'brand.500',
        color: 'white',
      })

      expect(buttonVariant('secondary')).toEqual({
        bg: 'gray.100',
        color: 'gray.900',
      })
    })

    it('should return empty object for unknown variant', () => {
      const buttonVariant = createVariant<TestConfig, 'primary'>({
        primary: { bg: 'brand.500' },
      })

      const result = buttonVariant('unknown' as any)

      expect(result).toEqual({})
    })

    it('should work with mergeStyles', () => {
      const colorVariant = createVariant<TestConfig, 'primary' | 'danger'>({
        primary: { bg: 'brand.500' },
        danger: { bg: 'red.500' },
      })

      const base: TypedStyleProps<TestConfig> = { px: 6, py: 3 }

      const result = mergeStyles(base, colorVariant('danger'))

      expect(result).toEqual({
        px: 6,
        py: 3,
        bg: 'red.500',
      })
    })
  })

  describe('createCompoundVariant', () => {
    it('should apply basic variant styles', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
            secondary: TypedStyleProps<TestConfig>
          }
          size: {
            sm: TypedStyleProps<TestConfig>
            md: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
            secondary: { bg: 'gray.100' },
          },
          size: {
            sm: { px: 4, py: 2 },
            md: { px: 6, py: 3 },
          },
        },
      })

      const result = buttonStyle({ color: 'primary', size: 'md' })

      expect(result).toEqual({
        bg: 'brand.500',
        px: 6,
        py: 3,
      })
    })

    it('should apply compound variants when conditions match', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
          }
          size: {
            sm: TypedStyleProps<TestConfig>
            lg: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
          },
          size: {
            sm: { px: 4, py: 2 },
            lg: { px: 8, py: 4 },
          },
        },
        compoundVariants: [
          {
            when: { color: 'primary', size: 'lg' },
            style: { shadow: 'lg' },
          },
        ],
      })

      const result = buttonStyle({ color: 'primary', size: 'lg' })

      expect(result).toEqual({
        bg: 'brand.500',
        px: 8,
        py: 4,
        shadow: 'lg', // from compound variant
      })
    })

    it('should not apply compound variants when conditions do not match', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
          }
          size: {
            sm: TypedStyleProps<TestConfig>
            lg: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
          },
          size: {
            sm: { px: 4, py: 2 },
            lg: { px: 8, py: 4 },
          },
        },
        compoundVariants: [
          {
            when: { color: 'primary', size: 'lg' },
            style: { shadow: 'lg' },
          },
        ],
      })

      const result = buttonStyle({ color: 'primary', size: 'sm' })

      expect(result).toEqual({
        bg: 'brand.500',
        px: 4,
        py: 2,
        // no shadow (compound variant didn't match)
      })
    })

    it('should apply default variants', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
            secondary: TypedStyleProps<TestConfig>
          }
          size: {
            md: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
            secondary: { bg: 'gray.100' },
          },
          size: {
            md: { px: 6, py: 3 },
          },
        },
        defaultVariants: {
          color: 'primary',
          size: 'md',
        },
      })

      const result = buttonStyle({})

      expect(result).toEqual({
        bg: 'brand.500',
        px: 6,
        py: 3,
      })
    })

    it('should override default variants with provided props', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
            secondary: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
            secondary: { bg: 'gray.100' },
          },
        },
        defaultVariants: {
          color: 'primary',
        },
      })

      const result = buttonStyle({ color: 'secondary' })

      expect(result).toEqual({
        bg: 'gray.100',
      })
    })

    it('should apply multiple compound variants', () => {
      const buttonStyle = createCompoundVariant<
        TestConfig,
        {
          color: {
            primary: TypedStyleProps<TestConfig>
          }
          size: {
            lg: TypedStyleProps<TestConfig>
          }
          disabled: {
            true: TypedStyleProps<TestConfig>
          }
        }
      >({
        variants: {
          color: {
            primary: { bg: 'brand.500' },
          },
          size: {
            lg: { px: 8, py: 4 },
          },
          disabled: {
            true: { opacity: 0.5 },
          },
        },
        compoundVariants: [
          {
            when: { color: 'primary', size: 'lg' },
            style: { shadow: 'lg' },
          },
          {
            when: { disabled: 'true' },
            style: { cursor: 'not-allowed' },
          },
        ],
      })

      const result = buttonStyle({
        color: 'primary',
        size: 'lg',
        disabled: 'true',
      })

      expect(result).toEqual({
        bg: 'brand.500',
        px: 8,
        py: 4,
        opacity: 0.5,
        shadow: 'lg', // first compound
        cursor: 'not-allowed', // second compound
      })
    })
  })
})
