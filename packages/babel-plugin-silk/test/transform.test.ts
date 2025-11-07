/**
 * Tests for babel-plugin-silk transformations
 */

import { transformSync } from '@babel/core'
import { describe, it, expect } from 'vitest'
import babelPluginSilk from '../src/index'
import type { SilkMetadata } from '../src/types'

/**
 * Helper to transform code with the plugin
 */
function transform(code: string, options = {}) {
  const result = transformSync(code, {
    plugins: [[babelPluginSilk, options]],
    filename: 'test.ts',
  })

  if (!result) {
    throw new Error('Transform failed')
  }

  return {
    code: result.code || '',
    metadata: result.metadata as { silk?: SilkMetadata } | undefined,
  }
}

describe('babel-plugin-silk', () => {
  describe('basic transformations', () => {
    it('transforms simple static css() call', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const button = css({ bg: 'red', p: 4 });
      `

      const result = transform(input)

      // Should replace with class name
      expect(result.code).toContain('"')
      expect(result.code).not.toContain('css({')

      // Should have metadata
      expect(result.metadata?.silk).toBeDefined()
      expect(result.metadata?.silk?.cssRules).toHaveLength(2) // bg and p
    })

    it('generates correct CSS rules', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const button = css({ bg: 'red' });
      `

      const result = transform(input)
      const cssRules = result.metadata?.silk?.cssRules || []

      // Find the bg rule
      const bgRule = cssRules.find(([_, rule]) =>
        rule.includes('background-color: red')
      )

      expect(bgRule).toBeDefined()
      expect(bgRule?.[1]).toMatch(/\.silk_bg_red_\w+ \{ background-color: red; \}/)
    })

    it('handles spacing units correctly', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const box = css({ p: 4 });
      `

      const result = transform(input)
      const cssRules = result.metadata?.silk?.cssRules || []

      const pRule = cssRules.find(([_, rule]) => rule.includes('padding'))
      expect(pRule?.[1]).toMatch(/padding: 1rem/)
    })

    it('handles empty object', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const empty = css({});
      `

      const result = transform(input)
      expect(result.code).toContain('""')
    })
  })

  describe('production mode', () => {
    it('generates short class names in production', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const button = css({ bg: 'red' });
      `

      const result = transform(input, { production: true })
      const cssRules = result.metadata?.silk?.cssRules || []

      // Class names should be short (no 'silk_' prefix)
      const [className] = cssRules[0] || []
      expect(className).toBeDefined()
      expect(className).not.toContain('silk_')
      expect(className.length).toBeLessThan(12)
    })
  })

  describe('dynamic values', () => {
    it('leaves dynamic values at runtime', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const button = css({ bg: props.color });
      `

      const result = transform(input)

      // Should still have css() call
      expect(result.code).toContain('css(')
      expect(result.code).toContain('props.color')
    })

    it('handles partial compilation', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const button = css({ bg: props.color, p: 4 });
      `

      const result = transform(input)

      // Should have css() call with dynamic value
      expect(result.code).toContain('css(')
      expect(result.code).toContain('props.color')

      // Should have static class name as second argument
      expect(result.code).toMatch(/css\(\{[^}]+\},\s*"[^"]+"\)/)

      // Should generate CSS for static property
      const cssRules = result.metadata?.silk?.cssRules || []
      const pRule = cssRules.find(([_, rule]) => rule.includes('padding'))
      expect(pRule).toBeDefined()
    })
  })

  describe('property shorthands', () => {
    it('expands property shorthands', () => {
      const input = `
        import { css } from '@sylphx/silk';
        const box = css({ m: 2, w: 100, h: 50 });
      `

      const result = transform(input)
      const cssRules = result.metadata?.silk?.cssRules || []

      const rules = cssRules.map(([_, rule]) => rule).join(' ')

      expect(rules).toContain('margin: 0.5rem')
      expect(rules).toContain('width: 100px')
      expect(rules).toContain('height: 50px')
    })
  })

  describe('import detection', () => {
    it('only transforms css from @sylphx/silk', () => {
      const input = `
        import { css } from 'other-library';
        const button = css({ bg: 'red' });
      `

      const result = transform(input)

      // Should NOT transform
      expect(result.code).toContain('css({')
      expect(result.metadata?.silk?.cssRules).toHaveLength(0)
    })

    it('works with renamed imports', () => {
      const input = `
        import { css as styles } from '@sylphx/silk';
        const button = styles({ bg: 'red' });
      `

      const result = transform(input)

      // Should NOT transform (looking for 'css' specifically)
      // Note: Supporting renamed imports requires more complex logic
      expect(result.code).toContain('styles({')
    })
  })
})
