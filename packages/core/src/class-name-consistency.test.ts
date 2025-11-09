/**
 * Integration test to ensure class name generation consistency
 * across CLI, Babel plugin, and Runtime
 */

import { describe, it, expect } from 'vitest'
import { generateClassName as runtimeGenerateClassName } from './production.js'

// Import Babel plugin's generateClassName
// We'll simulate its behavior since we can't directly import from another package in tests
function murmurHash2Babel(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h = Math.imul(h ^ c, 0x5bd1e995)
    h ^= h >>> 13
  }
  return (h >>> 0).toString(36)
}

function generateClassNameBabel(
  property: string,
  value: any,
  production: boolean,
  classPrefix?: string,
  variant = ''
): string {
  const hash = murmurHash2Babel(`${property}-${value}${variant}`)

  if (production) {
    const prefix = classPrefix || 's'
    return `${prefix}${hash}`
  }

  const prefix = classPrefix ?? 'silk'
  const sanitizedValue = String(value)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 10)
  const shortHash = hash.slice(0, 4)

  if (variant) {
    return `${prefix}_${variant}_${property}_${sanitizedValue}_${shortHash}`
  }

  return `${prefix}_${property}_${sanitizedValue}_${shortHash}`
}

describe('Class Name Generation Consistency', () => {
  describe('Production Mode', () => {
    const testCases = [
      { property: 'position', value: 'relative', variant: '' },
      { property: 'display', value: 'flex', variant: '' },
      { property: 'color', value: 'red', variant: '' },
      { property: 'backgroundColor', value: '#fff', variant: '' },
      { property: 'padding', value: '16px', variant: '' },
      { property: 'color', value: 'blue', variant: 'hover' },
      { property: 'display', value: 'block', variant: 'md' },
    ]

    testCases.forEach(({ property, value, variant }) => {
      it(`should generate same class name for ${property}:${value}${variant ? `:${variant}` : ''}`, () => {
        const styleId = `${property}-${value}${variant}`

        // Runtime (used by CLI too)
        const runtimeClass = runtimeGenerateClassName(styleId, {
          production: true,
          shortClassNames: false,
        })

        // Babel plugin
        const babelClass = generateClassNameBabel(property, value, true, undefined, variant)

        // Should be identical
        expect(runtimeClass).toBe(babelClass)

        // Should follow production format: s{hash}
        expect(runtimeClass).toMatch(/^s[a-z0-9]+$/)

        // Should not contain separator or descriptive parts
        expect(runtimeClass).not.toContain('_')
        expect(runtimeClass).not.toContain('-')
        expect(runtimeClass).not.toContain('silk')
      })
    })
  })

  describe('Development Mode', () => {
    const testCases = [
      { property: 'position', value: 'relative' },
      { property: 'display', value: 'flex' },
      { property: 'color', value: 'red' },
    ]

    testCases.forEach(({ property, value }) => {
      it(`should generate same format for ${property}:${value}`, () => {
        const styleId = `${property}-${value}`

        // Runtime
        const runtimeClass = runtimeGenerateClassName(styleId, {
          production: false,
          shortClassNames: false,
        })

        // Babel plugin
        const babelClass = generateClassNameBabel(property, value, false)

        // Both should contain 'silk' prefix
        expect(runtimeClass).toContain('silk')
        expect(babelClass).toContain('silk')

        // Both should contain property name
        expect(runtimeClass).toContain(property)
        expect(babelClass).toContain(property)

        // Both should use underscore separator and contain hash
        expect(runtimeClass).toMatch(/silk_[a-z]+_[a-z0-9]+_[a-z0-9]+/)
        expect(babelClass).toMatch(/silk_[a-z]+_[a-z0-9]+_[a-z0-9]+/)
      })
    })
  })

  describe('Hash Function Consistency', () => {
    it('should produce same hash for same input', () => {
      const testInputs = [
        'position-relative',
        'display-flex',
        'color-red',
        'backgroundColor-#fff',
        'padding-16px',
        'color-bluehover',
      ]

      testInputs.forEach(input => {
        const runtimeHash = runtimeGenerateClassName(input, {
          production: true,
          shortClassNames: false,
        })

        const [property, ...rest] = input.split('-')
        const value = rest.join('-')
        const babelHash = generateClassNameBabel(property, value, true)

        expect(runtimeHash).toBe(babelHash)
      })
    })

    it('should produce different hash for different input', () => {
      const class1 = runtimeGenerateClassName('position-relative', {
        production: true,
        shortClassNames: false,
      })

      const class2 = runtimeGenerateClassName('position-absolute', {
        production: true,
        shortClassNames: false,
      })

      expect(class1).not.toBe(class2)
    })
  })

  describe('Deterministic Output', () => {
    it('should always generate same class name for same input', () => {
      const results = new Set<string>()

      for (let i = 0; i < 100; i++) {
        const className = runtimeGenerateClassName('display-flex', {
          production: true,
          shortClassNames: false,
        })
        results.add(className)
      }

      // Should only have one unique result
      expect(results.size).toBe(1)
    })
  })
})
