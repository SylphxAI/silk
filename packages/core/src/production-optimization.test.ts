/**
 * Tests for production optimization features
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CSSMinifier, CSSDeduplicator } from './tree-shaking'
import { CriticalCSSExtractor } from './critical-css'
import { PerformanceMonitor } from './performance'

describe('Production Optimization', () => {
  describe('CSSMinifier', () => {
    it('should remove comments', () => {
      const css = '/* comment */ .test { color: red; } /* another */'
      const minified = CSSMinifier.minify(css)
      expect(minified).not.toContain('/*')
      expect(minified).not.toContain('*/')
    })

    it('should remove whitespace', () => {
      const css = '.test { color: red; padding: 1rem; }'
      const minified = CSSMinifier.minify(css)
      expect(minified).toBe('.test{color:red;padding:1rem}')
    })

    it('should remove unnecessary semicolons', () => {
      const css = '.test { color: red; }'
      const minified = CSSMinifier.minify(css)
      expect(minified).toBe('.test{color:red}')
    })

    it('should calculate savings correctly', () => {
      const original = '.test { color: red; }'
      const minified = '.test{color:red}'
      const savings = CSSMinifier.calculateSavings(original, minified)

      expect(savings.originalSize).toBeGreaterThan(savings.minifiedSize)
      expect(savings.savedBytes).toBeGreaterThan(0)
      expect(savings.savedPercentage).toBeGreaterThan(0)
    })
  })

  describe('CSSDeduplicator', () => {
    it('should combine selectors with same declarations', () => {
      const css = `.a { color: red; }
                   .b { color: red; }
                   .c { color: red; }`

      const deduplicated = CSSDeduplicator.deduplicate(css)

      expect(deduplicated).toContain('.a, .b, .c')
      expect(deduplicated).toContain('color: red')
    })

    it('should keep different declarations separate', () => {
      const css = `.a { color: red; }
                   .b { color: blue; }`

      const deduplicated = CSSDeduplicator.deduplicate(css)

      expect(deduplicated).toContain('.a')
      expect(deduplicated).toContain('.b')
      expect(deduplicated).toContain('color: red')
      expect(deduplicated).toContain('color: blue')
    })

    it('should calculate savings', () => {
      const css = `.a { color: red; }
                   .b { color: red; }
                   .c { color: red; }`

      const deduplicated = CSSDeduplicator.deduplicate(css)
      const savings = CSSDeduplicator.calculateSavings(css, deduplicated)

      expect(savings.originalRules).toBe(3)
      expect(savings.deduplicatedRules).toBe(1)
      expect(savings.savedRules).toBe(2)
      expect(savings.savedPercentage).toBeCloseTo(66.67, 1)
    })
  })

  describe('CriticalCSSExtractor', () => {
    let extractor: CriticalCSSExtractor

    beforeEach(() => {
      extractor = new CriticalCSSExtractor({ enabled: true })
    })

    it('should mark selectors as critical', () => {
      extractor.markCritical('.header')
      expect(extractor.isCritical('.header')).toBe(true)
    })

    it('should mark selectors as non-critical', () => {
      extractor.markNonCritical('.footer')
      expect(extractor.isCritical('.footer')).toBe(false)
    })

    it('should extract critical CSS', () => {
      extractor.markCritical('.header')
      extractor.markNonCritical('.footer')

      const css = `.header { color: blue; }
                   .footer { color: gray; }`

      const { critical, nonCritical } = extractor.extract(css)

      expect(critical).toContain('.header')
      expect(critical).not.toContain('.footer')
      expect(nonCritical).toContain('.footer')
      expect(nonCritical).not.toContain('.header')
    })

    it('should respect forceInclude config', () => {
      extractor = new CriticalCSSExtractor({
        enabled: true,
        forceInclude: ['header'],
      })

      const css = `.header { color: blue; }`
      const { critical } = extractor.extract(css)

      expect(critical).toContain('.header')
    })

    it('should respect exclude config', () => {
      extractor = new CriticalCSSExtractor({
        enabled: true,
        exclude: ['footer'],
      })

      extractor.markCritical('.footer')

      const css = `.footer { color: gray; }`
      const { critical } = extractor.extract(css)

      expect(critical).not.toContain('.footer')
    })

    it('should generate inline HTML', () => {
      const css = '.test { color: red; }'
      const html = extractor.generateInlineHTML(css)

      expect(html).toContain('<style id="critical-css">')
      expect(html).toContain('.test { color: red; }')
      expect(html).toContain('</style>')
    })

    it('should generate deferred load script', () => {
      const html = extractor.generateDeferredLoad('/styles/main.css')

      expect(html).toContain('rel="preload"')
      expect(html).toContain('/styles/main.css')
      expect(html).toContain('<noscript>')
    })

    it('should auto-detect common critical selectors', () => {
      const css = `
        * { box-sizing: border-box; }
        body { margin: 0; }
        header { background: white; }
        .hero { padding: 2rem; }
        .footer { background: black; }
      `

      extractor.autoDetect(css)

      expect(extractor.isCritical('*')).toBe(true)
      expect(extractor.isCritical('body')).toBe(true)
      expect(extractor.isCritical('header')).toBe(true)
      expect(extractor.isCritical('.hero')).toBe(true)
    })
  })

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor

    beforeEach(() => {
      monitor = new PerformanceMonitor()
    })

    it('should track build time', () => {
      monitor.startBuild()
      // Simulate some work
      monitor.endBuild()

      const duration = monitor.getBuildDuration()
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('should record metrics', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      const latest = monitor.getLatestMetrics()
      expect(latest).not.toBeNull()
      expect(latest?.buildTime).toBe(100)
    })

    it('should calculate average build time', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      monitor.recordMetrics({
        buildTime: 200,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      const avg = monitor.getAverageBuildTime()
      expect(avg).toBe(150)
    })

    it('should calculate average CSS size', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 600 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      const avgSize = monitor.getAverageCSSSize()
      expect(avgSize.original).toBe(1000)
      expect(avgSize.optimized).toBe(550)
      expect(avgSize.savedPercentage).toBeCloseTo(45, 0)
    })

    it('should generate report', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500, gzipped: 200 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      const report = monitor.generateReport()

      expect(report).toContain('Performance Report')
      expect(report).toContain('BUILD TIME')
      expect(report).toContain('CSS SIZE')
      expect(report).toContain('CLASS USAGE')
      expect(report).toContain('OPTIMIZATION')
    })

    it('should export JSON', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      const json = monitor.exportJSON()
      const parsed = JSON.parse(json)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].buildTime).toBe(100)
    })

    it('should clear metrics', () => {
      monitor.recordMetrics({
        buildTime: 100,
        cssSize: { original: 1000, optimized: 500 },
        classStats: { total: 100, used: 80, unused: 20 },
        optimization: { merged: 10, deduplicated: 5, treeShaken: 15 },
      })

      expect(monitor.getLatestMetrics()).not.toBeNull()

      monitor.clear()

      expect(monitor.getLatestMetrics()).toBeNull()
    })
  })

  describe('Integration', () => {
    it('should optimize CSS end-to-end', () => {
      const originalCSS = `
        /* Comment to remove */
        .a { color: red; }
        .b { color: red; }
        .c { color: red; }

        .different { color: blue; }
      `

      // 1. Deduplicate
      const deduplicated = CSSDeduplicator.deduplicate(originalCSS)

      // 2. Minify
      const minified = CSSMinifier.minify(deduplicated)

      // 3. Extract critical
      const extractor = new CriticalCSSExtractor({ enabled: true })
      extractor.markCritical('.a')
      const { critical, nonCritical } = extractor.extract(minified)

      // Assertions
      expect(minified.length).toBeLessThan(originalCSS.length)
      expect(minified).not.toContain('/*')
      expect(critical.length).toBeGreaterThan(0)
      expect(nonCritical.length).toBeGreaterThan(0)
    })
  })
})
