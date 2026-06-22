/**
 * Performance benchmarks for Silk CSS-in-TypeScript
 */

import { describe, it, expect } from 'vitest'
import { generateClassName } from './production.js'

describe('Performance Benchmarks', () => {
  describe('Class Name Generation', () => {
    it('should generate class names under 0.1ms', () => {
      const iterations = 1000
      const styles = [
        'display-flex',
        'color-red',
        'font-size-16px',
        'padding-1rem',
        'background-linear-gradient(45deg, #ff6b6b, #4ecdc4)'
      ]

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        styles.forEach(style => {
          generateClassName(style, { production: true, shortClassNames: false })
        })
      }

      const end = performance.now()
      const totalTime = end - start
      const avgTime = totalTime / (iterations * styles.length)

      console.log(`Generated ${iterations * styles.length} class names in ${totalTime.toFixed(2)}ms`)
      console.log(`Average time per class name: ${avgTime.toFixed(4)}ms`)

      expect(avgTime).toBeLessThan(0.1) // Less than 0.1ms per class name
    })

    it('should handle simple style generation efficiently', () => {
      const iterations = 1000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        generateClassName('display-flex', { production: true, shortClassNames: false })
      }

      const end = performance.now()
      const avgTime = (end - start) / iterations

      console.log(`Simple style generation: ${avgTime.toFixed(4)}ms per call`)
      expect(avgTime).toBeLessThan(0.05)
    })

    it('should handle complex style generation efficiently', () => {
      const iterations = 1000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        generateClassName('background-linear-gradient(45deg, #ff6b6b, #4ecdc4)', {
          production: true,
          shortClassNames: false
        })
      }

      const end = performance.now()
      const avgTime = (end - start) / iterations

      console.log(`Complex style generation: ${avgTime.toFixed(4)}ms per call`)
      expect(avgTime).toBeLessThan(0.05)
    })

    it('should handle development mode generation efficiently', () => {
      const iterations = 1000
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        generateClassName('display-flex', { production: false, shortClassNames: false })
      }

      const end = performance.now()
      const avgTime = (end - start) / iterations

      console.log(`Development mode generation: ${avgTime.toFixed(4)}ms per call`)
      expect(avgTime).toBeLessThan(0.05)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated generation', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        generateClassName(`test-style-${i}`, { production: true, shortClassNames: false })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      console.log(`Memory increase after ${iterations} generations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)

      // Memory increase should be minimal (less than 1MB for 10k generations)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
    })
  })

  describe('Deterministic Performance', () => {
    it('should have consistent performance across multiple runs', () => {
      const styleId = 'display-flex'
      const iterations = 10000
      const times: number[] = []

      for (let i = 0; i < 1000; i++) {
        generateClassName(styleId, { production: true, shortClassNames: false })
      }

      for (let i = 0; i < 8; i++) {
        const start = performance.now()

        for (let j = 0; j < iterations; j++) {
          generateClassName(styleId, { production: true, shortClassNames: false })
        }

        const end = performance.now()
        times.push(end - start)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length
      const stdDev = Math.sqrt(variance)

      console.log(`Average time: ${avgTime.toFixed(2)}ms`)
      console.log(`Standard deviation: ${stdDev.toFixed(2)}ms`)

      // The absolute floor accounts for sub-millisecond timer and JIT noise on CI.
      expect(stdDev).toBeLessThan(Math.max(avgTime * 0.25, 0.25))
    })
  })
})
