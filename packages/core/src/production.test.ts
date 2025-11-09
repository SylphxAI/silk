import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateShortClassName,
  hashStyleId,
  generateClassName,
  optimizeCSS,
  resetShortNameCounter,
  getShortNameCount,
  type ProductionConfig,
} from './production'

describe('production optimizations', () => {
  beforeEach(() => {
    resetShortNameCounter()
  })

  describe('generateShortClassName', () => {
    it('should generate short class names starting with a0', () => {
      expect(generateShortClassName('color-red')).toBe('a0')
      expect(generateShortClassName('bg-blue')).toBe('a1')
      expect(generateShortClassName('p-4')).toBe('a2')
    })

    it('should generate class names up to z9', () => {
      // Generate 260 class names (a0-z9)
      const names: string[] = []
      for (let i = 0; i < 260; i++) {
        names.push(generateShortClassName(`style-${i}`))
      }

      expect(names[0]).toBe('a0')
      expect(names[9]).toBe('a9')
      expect(names[10]).toBe('b0')
      expect(names[259]).toBe('z9')
    })

    it('should continue to aa0 after z9', () => {
      // Generate 261 class names to reach aa0
      for (let i = 0; i < 260; i++) {
        generateShortClassName(`style-${i}`)
      }

      expect(generateShortClassName('style-260')).toBe('aa0')
      expect(generateShortClassName('style-261')).toBe('aa1')
    })

    it('should cache and reuse class names for same styleId', () => {
      const name1 = generateShortClassName('color-red')
      const name2 = generateShortClassName('color-red')

      expect(name1).toBe(name2)
      expect(name1).toBe('a0')

      // Counter should not increment for cached values
      expect(getShortNameCount()).toBe(1)
    })

    it('should generate different names for different styleIds', () => {
      const name1 = generateShortClassName('color-red')
      const name2 = generateShortClassName('color-blue')

      expect(name1).not.toBe(name2)
      expect(name1).toBe('a0')
      expect(name2).toBe('a1')
    })
  })

  describe('hashStyleId', () => {
    it('should generate consistent hash for same string', () => {
      const hash1 = hashStyleId('color-red-500')
      const hash2 = hashStyleId('color-red-500')

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different strings', () => {
      const hash1 = hashStyleId('color-red-500')
      const hash2 = hashStyleId('color-blue-500')

      expect(hash1).not.toBe(hash2)
    })

    it('should generate base-36 string', () => {
      const hash = hashStyleId('test')

      // Base-36 only contains 0-9 and a-z
      expect(hash).toMatch(/^[0-9a-z]+$/)
    })
  })

  describe('generateClassName', () => {
    it('should use short names in production mode', () => {
      const config: ProductionConfig = {
        production: true,
        shortClassNames: true,
      }

      const className = generateClassName('color-red', config)

      expect(className).toBe('a0')
    })

    it('should use readable names in development mode', () => {
      const config: ProductionConfig = {
        production: false,
      }

      const className = generateClassName('color-red', config)

      // New format: silk_property_value_hash (descriptive)
      expect(className).toMatch(/^silk_/)
      expect(className).toContain('color')
      expect(className).toContain('red')
      expect(className.length).toBeGreaterThan(10)
    })

    it('should respect custom classPrefix', () => {
      const config: ProductionConfig = {
        production: false,
        classPrefix: 'custom',
      }

      const className = generateClassName('color-red', config)

      // Custom prefix with descriptive format
      expect(className).toMatch(/^custom_/)
      expect(className).toContain('color')
    })

    it('should use short prefix in production when specified', () => {
      const config: ProductionConfig = {
        production: true,
        classPrefix: 'z',
      }

      const className = generateClassName('color-red', config)

      // Still uses short name generator in production
      expect(className).toBe('a0')
    })

    it('should disable short names when shortClassNames is false', () => {
      const config: ProductionConfig = {
        production: true,
        shortClassNames: false,
        classPrefix: 'z',
      }

      const className = generateClassName('color-red', config)

      // Production mode with shortClassNames: false uses z{hash} format (no separator)
      expect(className).toMatch(/^z[a-z0-9]+$/)
      expect(className).not.toBe('a0')
    })
  })

  describe('optimizeCSS', () => {
    it('should remove duplicate properties', () => {
      const css = '.a { color: red; font-size: 14px; color: blue; }'
      const result = optimizeCSS(css)

      expect(result.optimized).not.toContain('color:red')
      expect(result.optimized).toContain('color:blue')
    })

    it('should optimize colors from #ffffff to #fff', () => {
      const css = '.a { color: #ffffff; }'
      const result = optimizeCSS(css)

      expect(result.optimized).toContain('#fff')
      expect(result.optimized).not.toContain('#ffffff')
    })

    it('should optimize colors from #aabbcc to #abc', () => {
      const css = '.a { color: #aabbcc; }'
      const result = optimizeCSS(css)

      expect(result.optimized).toContain('#abc')
    })

    it('should optimize rgb(0,0,0) to #000', () => {
      const css = '.a { color: rgb(0,0,0); }'
      const result = optimizeCSS(css)

      expect(result.optimized).toContain('#000')
      expect(result.optimized).not.toContain('rgb')
    })

    it('should optimize rgb(255,255,255) to #fff', () => {
      const css = '.a { color: rgb(255,255,255); }'
      const result = optimizeCSS(css)

      expect(result.optimized).toContain('#fff')
    })

    it('should remove unnecessary units from 0 values', () => {
      const css = '.a { margin: 0px; padding: 0em; width: 0rem; }'
      const result = optimizeCSS(css)

      expect(result.optimized).not.toContain('0px')
      expect(result.optimized).not.toContain('0em')
      expect(result.optimized).not.toContain('0rem')
      expect(result.optimized).toContain('margin:0')
      expect(result.optimized).toContain('padding:0')
    })

    it('should sort declarations alphabetically', () => {
      const css = '.a { z-index: 1; color: red; background: blue; }'
      const result = optimizeCSS(css)

      const indexOfBackground = result.optimized.indexOf('background')
      const indexOfColor = result.optimized.indexOf('color')
      const indexOfZIndex = result.optimized.indexOf('z-index')

      expect(indexOfBackground).toBeLessThan(indexOfColor)
      expect(indexOfColor).toBeLessThan(indexOfZIndex)
    })

    it('should minify CSS (remove unnecessary whitespace)', () => {
      const css = `
        .a {
          color: red;
          padding: 10px;
        }
      `
      const result = optimizeCSS(css)

      expect(result.optimized).not.toContain('\n')
      expect(result.optimized).not.toContain('  ')
      expect(result.optimized.length).toBeLessThan(css.length)
    })

    it('should remove CSS comments', () => {
      const css = '/* comment */ .a { color: red; /* inline */ }'
      const result = optimizeCSS(css)

      expect(result.optimized).not.toContain('/*')
      expect(result.optimized).not.toContain('*/')
      expect(result.optimized).not.toContain('comment')
    })

    it('should remove trailing semicolon', () => {
      const css = '.a { color: red; }'
      const result = optimizeCSS(css)

      expect(result.optimized).not.toMatch(/;\}/)
      expect(result.optimized).toContain('}')
    })

    it('should report savings correctly', () => {
      const css = `
        .a {
          color: #ffffff;
          margin: 0px;
          padding: 0px;
        }
      `
      const result = optimizeCSS(css)

      expect(result.savings.originalSize).toBeGreaterThan(result.savings.optimizedSize)
      expect(result.savings.percentage).toBeGreaterThan(0)
      expect(result.savings.percentage).toBeLessThan(100)
    })

    it('should handle complex CSS with multiple rules', () => {
      const css = `
        .a { color: #ffffff; margin: 0px; }
        .b { padding: 0rem; background: rgb(0,0,0); }
        .c { color: red; color: blue; font-size: 14px; }
      `
      const result = optimizeCSS(css)

      expect(result.optimized).toContain('#fff')
      expect(result.optimized).toContain('#000')
      expect(result.optimized).not.toContain('0px')
      expect(result.optimized).not.toContain('0rem')
      expect(result.optimized).not.toContain('color:red')
      expect(result.optimized).toContain('color:blue')
    })
  })

  describe('resetShortNameCounter', () => {
    it('should reset counter to 0', () => {
      generateShortClassName('test1')
      generateShortClassName('test2')
      expect(getShortNameCount()).toBe(2)

      resetShortNameCounter()

      expect(getShortNameCount()).toBe(0)
    })

    it('should start generating from a0 again after reset', () => {
      generateShortClassName('test1')
      generateShortClassName('test2')

      resetShortNameCounter()

      const className = generateShortClassName('test3')
      expect(className).toBe('a0')
    })

    it('should clear cache', () => {
      const name1 = generateShortClassName('test')
      expect(name1).toBe('a0')

      resetShortNameCounter()

      const name2 = generateShortClassName('test')
      expect(name2).toBe('a0') // Same styleId should get same name after reset
    })
  })
})
