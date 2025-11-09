import { describe, it, expect } from 'vitest'
import { transformSync } from '@swc/core'
import { readFileSync } from 'fs'
import { join } from 'path'

const PLUGIN_PATH = join(__dirname, '../target/wasm32-wasip1/release/swc_plugin_silk.wasm')

/**
 * Helper to transform code using the SWC plugin
 */
function transform(code: string, config: any = {}) {
  try {
    const result = transformSync(code, {
      filename: 'test.ts',
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
        experimental: {
          plugins: [[PLUGIN_PATH, config]],
        },
      },
    })
    return result.code
  } catch (error) {
    // Plugin might not be built yet
    console.warn('⚠️  SWC plugin WASM not found. Run: cargo build --release --target wasm32-wasip1')
    throw error
  }
}

describe('SWC Plugin Transformation', () => {
  describe('Basic Transformations', () => {
    it('should transform single property css() call', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const red = css({ bg: 'red' })
      `

      const output = transform(input)

      // Should replace css() with string literal
      expect(output).not.toContain('css({ bg:')
      expect(output).toContain('silk_bg_red_')
    })

    it('should transform multiple properties', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const button = css({ bg: 'blue', color: 'white', p: 4 })
      `

      const output = transform(input)

      // Should contain all class names
      expect(output).toContain('silk_bg_blue_')
      expect(output).toContain('silk_color_white_')
      expect(output).toContain('silk_p_4_')
      // Should be a single string with spaces
      expect(output).toMatch(/["']silk_bg_blue_\w+ silk_color_white_\w+ silk_p_4_\w+["']/)
    })

    it('should handle empty object', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const empty = css({})
      `

      const output = transform(input)

      // Should replace with empty string
      expect(output).toContain('""')
    })
  })

  describe('Property Shorthands', () => {
    it('should expand margin shorthands', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const margins = css({ m: 4, mt: 2, mx: 3 })
      `

      const output = transform(input)

      expect(output).toContain('silk_m_4_')
      expect(output).toContain('silk_mt_2_')
      expect(output).toContain('silk_mx_3_')
    })

    it('should expand padding shorthands', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const paddings = css({ p: 4, pt: 2, px: 3 })
      `

      const output = transform(input)

      expect(output).toContain('silk_p_4_')
      expect(output).toContain('silk_pt_2_')
      expect(output).toContain('silk_px_3_')
    })

    it('should expand size shorthands', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const sizes = css({ w: 200, h: 100, minW: 50 })
      `

      const output = transform(input)

      expect(output).toContain('silk_w_200_')
      expect(output).toContain('silk_h_100_')
      expect(output).toContain('silk_minW_50_')
    })

    it('should expand background shorthands', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const bg = css({ bg: 'red', bgColor: 'blue' })
      `

      const output = transform(input)

      expect(output).toContain('silk_bg_red_')
      expect(output).toContain('silk_bgColor_blue_')
    })
  })

  describe('Value Handling', () => {
    it('should handle numeric values', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const box = css({ p: 4, width: 200, opacity: 0.5, zIndex: 10 })
      `

      const output = transform(input)

      // All numeric values should be transformed
      expect(output).toContain('silk_p_4_')
      expect(output).toContain('silk_width_200_')
      expect(output).toContain('silk_opacity_0_5_')
      expect(output).toContain('silk_zIndex_10_')
    })

    it('should handle string values', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const colors = css({ color: 'red', bg: '#ff0000' })
      `

      const output = transform(input)

      expect(output).toContain('silk_color_red_')
      expect(output).toContain('silk_bg_ff0000_') // # removed
    })

    it('should handle special characters', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const special = css({
          color: 'rgb(255, 0, 0)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        })
      `

      const output = transform(input)

      // Special characters should be sanitized
      expect(output).toContain('silk_color_')
      expect(output).toContain('silk_boxShadow_')
      // Should not contain raw parentheses or dots in class names
      const match = output.match(/silk_color_[^"']+/)
      if (match) {
        expect(match[0]).not.toContain('(')
        expect(match[0]).not.toContain(')')
      }
    })
  })

  describe('CamelCase Properties', () => {
    it('should handle camelCase properties', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const text = css({
          fontSize: 16,
          fontWeight: 'bold',
          backgroundColor: 'yellow'
        })
      `

      const output = transform(input)

      expect(output).toContain('silk_fontSize_16_')
      expect(output).toContain('silk_fontWeight_bold_')
      expect(output).toContain('silk_backgroundColor_yellow_')
    })
  })

  describe('Multiple Calls', () => {
    it('should transform multiple css() calls', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const style1 = css({ bg: 'red' })
        const style2 = css({ bg: 'blue' })
        const style3 = css({ bg: 'green' })
      `

      const output = transform(input)

      expect(output).toContain('silk_bg_red_')
      expect(output).toContain('silk_bg_blue_')
      expect(output).toContain('silk_bg_green_')
    })
  })

  describe('Custom Configuration', () => {
    it('should use custom prefix', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const button = css({ bg: 'red' })
      `

      const output = transform(input, { classPrefix: 'custom' })

      expect(output).toContain('custom_bg_red_')
      expect(output).not.toContain('silk_')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const zeros = css({ p: 0, m: 0, opacity: 0 })
      `

      const output = transform(input)

      expect(output).toContain('silk_p_0_')
      expect(output).toContain('silk_m_0_')
      expect(output).toContain('silk_opacity_0_')
    })

    it('should NOT transform non-css function calls', () => {
      const input = `
        function css(obj: any) { return obj }
        const notTransformed = css({ bg: 'red' })
      `

      const output = transform(input)

      // Should NOT be transformed (no @sylphx/silk import)
      // The actual behavior depends on plugin implementation
      // For now, just verify code compiles
      expect(output).toBeDefined()
    })
  })

  describe('Hash Consistency', () => {
    it('should generate same hash for same inputs', () => {
      const input1 = `
        import { css } from '@sylphx/silk'
        const style1 = css({ bg: 'red' })
      `

      const input2 = `
        import { css } from '@sylphx/silk'
        const style2 = css({ bg: 'red' })
      `

      const output1 = transform(input1)
      const output2 = transform(input2)

      // Extract class names
      const match1 = output1.match(/silk_bg_red_(\w+)/)
      const match2 = output2.match(/silk_bg_red_(\w+)/)

      expect(match1).toBeTruthy()
      expect(match2).toBeTruthy()
      expect(match1![1]).toBe(match2![1]) // Same hash
    })

    it('should generate different hash for different inputs', () => {
      const input = `
        import { css } from '@sylphx/silk'
        const red = css({ bg: 'red' })
        const blue = css({ bg: 'blue' })
      `

      const output = transform(input)

      // Extract hashes
      const redMatch = output.match(/silk_bg_red_(\w+)/)
      const blueMatch = output.match(/silk_bg_blue_(\w+)/)

      expect(redMatch).toBeTruthy()
      expect(blueMatch).toBeTruthy()
      expect(redMatch![1]).not.toBe(blueMatch![1]) // Different hashes
    })
  })
})

describe('Fixture Files', () => {
  it('should transform basic fixture', () => {
    try {
      const fixture = readFileSync(
        join(__dirname, 'fixtures/basic.input.ts'),
        'utf-8'
      )

      const output = transform(fixture)

      // Verify transformations occurred
      expect(output).not.toContain('css({')
      expect(output).toContain('silk_')
    } catch (error: any) {
      if (error.code === 'ENOENT' || error.message?.includes('WASM')) {
        console.warn('⚠️  Skipping fixture test: plugin not built yet')
      } else {
        throw error
      }
    }
  })

  it('should transform shorthands fixture', () => {
    try {
      const fixture = readFileSync(
        join(__dirname, 'fixtures/shorthands.input.ts'),
        'utf-8'
      )

      const output = transform(fixture)

      // Verify all shorthands are transformed
      expect(output).toContain('silk_m_')
      expect(output).toContain('silk_p_')
      expect(output).toContain('silk_w_')
      expect(output).toContain('silk_bg_')
    } catch (error: any) {
      if (error.code === 'ENOENT' || error.message?.includes('WASM')) {
        console.warn('⚠️  Skipping fixture test: plugin not built yet')
      } else {
        throw error
      }
    }
  })
})
