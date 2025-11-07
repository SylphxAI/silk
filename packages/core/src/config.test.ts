import { describe, it, expect } from 'vitest'
import { defineConfig, defaultConfig } from './config'

describe('defineConfig', () => {
  it('should return config as-is', () => {
    const config = defineConfig({
      colors: {
        primary: '#000',
      },
    } as const)

    expect(config).toEqual({
      colors: {
        primary: '#000',
      },
    })
  })

  it('should preserve type information', () => {
    const config = defineConfig({
      colors: {
        red: { 500: '#ef4444' },
      },
      spacing: {
        4: '1rem',
      },
    } as const)

    expect(config.colors?.red?.[500]).toBe('#ef4444')
    expect(config.spacing?.[4]).toBe('1rem')
  })
})

describe('defaultConfig', () => {
  it('should have color scales', () => {
    expect(defaultConfig.colors).toBeDefined()
    expect(defaultConfig.colors?.gray).toBeDefined()
    expect(defaultConfig.colors?.red).toBeDefined()
    expect(defaultConfig.colors?.blue).toBeDefined()
  })

  it('should have spacing scale', () => {
    expect(defaultConfig.spacing).toBeDefined()
    expect(defaultConfig.spacing?.[4]).toBe('1rem')
    expect(defaultConfig.spacing?.[8]).toBe('2rem')
  })

  it('should have font sizes', () => {
    expect(defaultConfig.fontSizes).toBeDefined()
    expect(defaultConfig.fontSizes?.base).toBe('1rem')
    expect(defaultConfig.fontSizes?.lg).toBe('1.125rem')
  })

  it('should have font weights', () => {
    expect(defaultConfig.fontWeights).toBeDefined()
    expect(defaultConfig.fontWeights?.normal).toBe(400)
    expect(defaultConfig.fontWeights?.bold).toBe(700)
  })

  it('should have border radii', () => {
    expect(defaultConfig.radii).toBeDefined()
    expect(defaultConfig.radii?.md).toBe('0.375rem')
    expect(defaultConfig.radii?.full).toBe('9999px')
  })

  it('should have shadows', () => {
    expect(defaultConfig.shadows).toBeDefined()
    expect(defaultConfig.shadows?.sm).toBeDefined()
    expect(defaultConfig.shadows?.lg).toBeDefined()
  })

  it('should have breakpoints', () => {
    expect(defaultConfig.breakpoints).toBeDefined()
    expect(defaultConfig.breakpoints?.sm).toBe('640px')
    expect(defaultConfig.breakpoints?.lg).toBe('1024px')
  })
})
