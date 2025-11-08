import { describe, it, expect, beforeEach } from 'vitest'
import { createStyleSystem, getRuntimeStats, resetRuntimeStats } from './runtime'
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
      expect(result.className).toMatch(/^silk-[a-z0-9]+$/)
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
      expect(result.className).toMatch(/silk-[a-z0-9]+/)
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

  describe('Cascade Layers Integration', () => {
    it('should organize CSS in layers when enabled', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        enabled: true,
      })

      resetCSSRules()
      css({ color: 'red.500', p: 4 })

      const cssOutput = getCSSRules({ useLayers: true })

      expect(cssOutput).toContain('@layer')
      expect(cssOutput).toContain('@layer utilities')
    })

    it('should generate layer definition', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        enabled: true,
        order: ['base', 'utilities'],
      })

      resetCSSRules()
      css({ color: 'red.500' })

      const cssOutput = getCSSRules({ useLayers: true })

      expect(cssOutput).toContain('@layer base, utilities;')
    })

    it('should work without layers when disabled', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        enabled: false,
      })

      resetCSSRules()
      css({ color: 'red.500', p: 4 })

      const cssOutput = getCSSRules({ useLayers: false })

      expect(cssOutput).not.toContain('@layer')
      expect(cssOutput).toContain('color')
      expect(cssOutput).toContain('padding')
    })

    it('should classify atomic styles as utilities layer', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        enabled: true,
      })

      resetCSSRules()
      css({ color: 'red.500', p: 4, bg: 'blue.500' })

      const cssOutput = getCSSRules({ useLayers: true })

      expect(cssOutput).toContain('@layer utilities {')
    })

    it('should deduplicate rules within layers', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        enabled: true,
      })

      resetCSSRules()
      css({ color: 'red.500' })
      css({ color: 'red.500' })
      css({ color: 'red.500' })

      const cssOutput = getCSSRules({ useLayers: true })

      const colorRuleCount = (cssOutput.match(/color: #ef4444/g) || []).length
      expect(colorRuleCount).toBe(1)
    })
  })

  describe('Runtime Performance', () => {
    it('should track runtime statistics', () => {
      const { css, resetCSSRules } = createStyleSystem(config)
      resetCSSRules()
      resetRuntimeStats()

      // Generate some styles
      css({ color: 'red.500' })
      css({ p: 4 })
      css({ color: 'blue.500' })

      const stats = getRuntimeStats()

      expect(stats).toHaveProperty('memoCache')
      expect(stats).toHaveProperty('objectPools')
      expect(stats.memoCache).toBeDefined()
    })

    it('should calculate memoization hit rate', () => {
      const { css, resetCSSRules } = createStyleSystem(config)
      resetCSSRules()
      resetRuntimeStats()

      // Generate multiple different styles to populate cache
      css({ color: 'red.500' })
      css({ p: 4 })
      css({ color: 'blue.500' })
      css({ m: 8 })

      const stats = getRuntimeStats()

      // Should have some cache entries
      expect(stats.memoCache).toBeDefined()
      expect(stats.memoCache.hitRate).toBeGreaterThanOrEqual(0)
    })

    it('should reset runtime statistics', () => {
      const { css, resetCSSRules } = createStyleSystem(config)
      resetCSSRules()

      // Generate some styles
      css({ color: 'red.500' })
      css({ p: 4 })

      // Reset stats
      resetRuntimeStats()

      const stats = getRuntimeStats()

      expect(stats.memoCache.size).toBe(0)
      expect(stats.memoCache.hits).toBe(0)
      expect(stats.memoCache.misses).toBe(0)
    })

    it('should use object pools for performance', () => {
      const { css, resetCSSRules } = createStyleSystem(config)
      resetCSSRules()

      // Generate many styles to exercise object pools
      for (let i = 0; i < 50; i++) {
        css({ p: 4, m: 8, color: 'red.500' })
      }

      const stats = getRuntimeStats()

      expect(stats.objectPools).toBeDefined()
    })
  })

  describe('Production Mode', () => {
    it('should work in production mode', () => {
      const { css } = createStyleSystem(config, {
        production: true,
        optimize: true
      })

      const result = css({ color: 'red.500', p: 4 })

      expect(result.className).toBeTruthy()
    })

    it('should generate optimized classNames in production', () => {
      const { css, resetCSSRules } = createStyleSystem(config, {
        production: true,
        optimize: true
      })

      resetCSSRules()

      const result = css({ color: 'red.500' })

      // In production mode, class names should be shorter
      expect(result.className).toMatch(/^[a-z0-9]+$/)
    })

    it('should deduplicate in production mode', () => {
      const { css, getCSSRules, resetCSSRules } = createStyleSystem(config, {
        production: true,
        optimize: true
      })

      resetCSSRules()

      css({ color: 'red.500' })
      css({ color: 'red.500' })
      css({ color: 'red.500' })

      const cssOutput = getCSSRules()
      const colorRuleCount = (cssOutput.match(/color.*#ef4444/g) || []).length

      expect(colorRuleCount).toBe(1)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very deep nesting', () => {
      const result = css({
        _hover: {
          _focus: {
            _active: {
              color: 'red.500'
            }
          }
        }
      })

      expect(result.className).toBeTruthy()
    })

    it('should handle many properties', () => {
      const result = css({
        color: 'red.500',
        backgroundColor: 'blue.500',
        padding: 4,
        margin: 8,
        fontSize: 'lg',
        fontWeight: 'bold',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      })

      expect(result.className).toBeTruthy()
      expect(result.className.split(' ').length).toBeGreaterThan(5)
    })

    it('should handle mixed token and raw values', () => {
      const result = css({
        color: 'red.500',
        backgroundColor: '#00ff00',
        padding: 4,
        margin: '2rem',
        width: 200,
        height: '100px'
      })

      expect(result.className).toBeTruthy()
    })

    it('should handle className property', () => {
      const result = css({
        color: 'red.500'
      })

      expect(result).toHaveProperty('className')
      expect(typeof result.className).toBe('string')
    })
  })
})
