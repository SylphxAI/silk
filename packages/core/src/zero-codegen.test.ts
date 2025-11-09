/**
 * @sylphx/silk - Zero Codegen tests
 * Verify that Silk follows pure build-time approach
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { css, createStyleSystem } from './index.js'

describe('Zero Codegen Strategy', () => {
  describe('Default css function', () => {
    it('should throw error when not transformed', () => {
      // The default css() should throw if not transformed by Babel plugin
      expect(() => css({ color: 'red' })).toThrow(
        '@sylphx/silk: css() should be transformed at build-time by @sylphx/babel-plugin-silk'
      )
    })

    it('should throw error with custom message', () => {
      expect(() => css({ display: 'flex' })).toThrow(
        'Make sure you have the Vite/Webpack plugin configured correctly.'
      )
    })
  })

  describe('Runtime createStyleSystem', () => {
    it('should work in development mode', () => {
      const silk = createStyleSystem({
        colors: { primary: '#3b82f6' },
        spacing: { 4: '1rem' }
      })

      const styles = silk.css({
        color: 'primary',
        padding: 4
      })

      expect(styles.className).toMatch(/^silk_/) // Development format
      expect(typeof styles.className).toBe('string')
    })

    it('should default to development mode (not auto-detect NODE_ENV)', () => {
      // Even if NODE_ENV=production, runtime should default to development
      // unless explicitly set to true
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      try {
        const silk = createStyleSystem({
          colors: { primary: '#3b82f6' }
        })

        const styles = silk.css({ color: 'primary' })

        // Should still use development format (silk_...)
        expect(styles.className).toMatch(/^silk_/)
        expect(styles.className).toContain('color')
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should only use production mode when explicitly set', () => {
      const silk = createStyleSystem(
        { colors: { primary: '#3b82f6' } },
        { production: true } // Explicitly enable production mode
      )

      const styles = silk.css({ color: 'primary' })

      // Should use production format (s{hash})
      expect(styles.className).toMatch(/^s[a-z0-9]+$/)
      expect(styles.className).not.toContain('silk')
      expect(styles.className).not.toContain('color')
    })
  })

  describe('Build-time vs Runtime separation', () => {
    it('should export cssRules for build-time extraction', () => {
      const silk = createStyleSystem({
        colors: { primary: '#3b82f6' },
        spacing: { 4: '1rem' }
      })

      // Generate some styles
      silk.css({ color: 'primary', padding: 4 })
      silk.css({ display: 'flex', margin: 4 })

      // Should have CSS rules for extraction
      const cssRules = silk.getCSSRules()
      expect(cssRules).toBeDefined()
      expect(typeof cssRules).toBe('string')
      expect(cssRules.length).toBeGreaterThan(0)
    })
  })
})