import { describe, it, expect } from 'vitest'
import type { DesignConfig, TypedStyleProps } from './types'

describe('Type utilities', () => {
  describe('TypedStyleProps', () => {
    it('should have shorthand properties', () => {
      type TestConfig = DesignConfig
      type Props = TypedStyleProps<TestConfig>

      // Check that these properties exist in the type
      const props: Partial<Props> = {
        bg: 'red',
        p: 4,
        m: 8,
        w: 100,
        h: 100,
      }

      expect(props).toBeDefined()
    })

    it('should support pseudo states', () => {
      type TestConfig = DesignConfig
      type Props = TypedStyleProps<TestConfig>

      const props: Partial<Props> = {
        _hover: { bg: 'blue' },
        _focus: { color: 'red' },
        _active: { opacity: '0.5' },
      }

      expect(props).toBeDefined()
    })

    it('should accept both token values and raw values', () => {
      type TestConfig = {
        colors: {
          red: { 500: '#ef4444' }
        }
        spacing: {
          4: '1rem'
        }
      }

      type Props = TypedStyleProps<TestConfig>

      const props: Partial<Props> = {
        color: 'red.500', // token
        bg: '#ffffff', // raw color
        p: 4, // token
        m: 16, // raw number
      }

      expect(props).toBeDefined()
    })
  })
})
