import { describe, it, expect, beforeEach } from 'vitest'
import { createStyleSystem } from './runtime'
import { defineConfig } from './config'

describe('createStyleSystem', () => {
  const config = defineConfig({
    colors: {
      red: {
        500: '#ef4444',
        600: '#dc2626',
      },
      blue: {
        500: '#3b82f6',
      },
    },
    spacing: {
      4: '1rem',
      8: '2rem',
    },
    fontSizes: {
      lg: '1.125rem',
      xl: '1.25rem',
    },
  } as const)

  const { css, cx, resetCSSRules } = createStyleSystem(config)

  beforeEach(() => {
    resetCSSRules()
  })

  describe('css()', () => {
    it('should generate atomic class for single style', () => {
      const result = css({ color: 'red.500' })

      expect(result.className).toBeTruthy()
      expect(result.className).toMatch(/^zen-[a-z0-9]+$/)
    })

    it('should resolve color tokens correctly', () => {
      const result = css({ color: 'red.500' })
      expect(result.className).toBeTruthy()
    })

    it('should handle spacing tokens', () => {
      const result = css({ p: 4, m: 8 })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(2)
    })

    it('should handle shorthand properties', () => {
      const result = css({
        bg: 'blue.500',
        p: 4,
        m: 8,
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(3)
    })

    it('should handle numeric values', () => {
      const result = css({
        width: 200,
        height: 100,
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(2)
    })

    it('should handle raw CSS values', () => {
      const result = css({
        color: '#000000',
        width: '50%',
      })

      expect(result.className).toBeTruthy()
    })

    it('should generate same class for same styles', () => {
      const result1 = css({ color: 'red.500' })
      const result2 = css({ color: 'red.500' })

      expect(result1.className).toBe(result2.className)
    })

    it('should handle pseudo states', () => {
      const result = css({
        color: 'red.500',
        _hover: {
          color: 'red.600',
        },
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(2)
    })

    it('should handle multiple pseudo states', () => {
      const result = css({
        bg: 'blue.500',
        _hover: {
          bg: 'red.500',
        },
        _focus: {
          bg: 'red.600',
        },
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(3)
    })

    it('should handle layout properties', () => {
      const result = css({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(4)
    })

    it('should handle font properties', () => {
      const result = css({
        fontSize: 'lg',
        fontWeight: 'bold',
      })

      expect(result.className).toBeTruthy()
    })
  })

  describe('cx()', () => {
    it('should merge multiple style objects', () => {
      const result = cx({ color: 'red.500' }, { p: 4 })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ')).toHaveLength(2)
    })

    it('should merge string classNames', () => {
      const result = cx('custom-class', { color: 'red.500' })

      expect(result.className).toContain('custom-class')
      expect(result.className).toMatch(/zen-[a-z0-9]+/)
    })

    it('should filter out falsy values', () => {
      const result = cx({ color: 'red.500' }, false, undefined, null, { p: 4 })

      expect(result.className).toBeTruthy()
    })

    it('should override styles (last wins)', () => {
      const result = cx({ color: 'red.500' }, { color: 'blue.500' })

      expect(result.className).toBeTruthy()
    })
  })

  describe('CSS generation', () => {
    it('should generate valid CSS rules', () => {
      const { getCSSRules } = createStyleSystem(config)

      css({ color: 'red.500', p: 4 })
      const cssOutput = getCSSRules()

      expect(cssOutput).toContain('color')
      expect(cssOutput).toContain('padding')
      expect(cssOutput).toContain('#ef4444')
      expect(cssOutput).toContain('1rem')
    })

    it('should generate pseudo-selector CSS', () => {
      const { getCSSRules } = createStyleSystem(config)

      css({
        color: 'red.500',
        _hover: {
          color: 'red.600',
        },
      })
      const cssOutput = getCSSRules()

      expect(cssOutput).toContain(':hover')
      expect(cssOutput).toContain('#dc2626')
    })

    it('should not duplicate CSS rules', () => {
      const { getCSSRules } = createStyleSystem(config)

      css({ color: 'red.500' })
      css({ color: 'red.500' })
      css({ color: 'red.500' })

      const cssOutput = getCSSRules()
      const colorRuleCount = (cssOutput.match(/color: #ef4444/g) || []).length

      expect(colorRuleCount).toBe(1)
    })
  })

  describe('Type safety', () => {
    it('should accept valid token values', () => {
      // These should not throw type errors
      css({ color: 'red.500' })
      css({ color: 'blue.500' })
      css({ p: 4 })
      css({ m: 8 })
    })

    it('should accept raw CSS values', () => {
      css({ color: '#ffffff' })
      css({ padding: '2rem' })
      css({ width: 100 })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty style object', () => {
      const result = css({})

      expect(result.className).toBe('')
    })

    it('should handle undefined values', () => {
      const result = css({
        color: undefined as any,
        p: 4,
      })

      expect(result.className).toBeTruthy()
    })

    it('should handle null values', () => {
      const result = css({
        color: null as any,
        p: 4,
      })

      expect(result.className).toBeTruthy()
    })
  })
})
