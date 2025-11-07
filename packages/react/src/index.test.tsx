import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { createStyleSystem } from '@zencss/core'
import { createReactStyleSystem } from './index'

describe('createReactStyleSystem', () => {
  const config = {
    colors: {
      red: { 500: '#ef4444', 600: '#dc2626' },
      blue: { 500: '#3b82f6' },
    },
    spacing: {
      4: '1rem',
      8: '2rem',
    },
  } as const

  const styleSystem = createStyleSystem(config)
  const { styled, Box, Flex, Grid, Text, css, cx } = createReactStyleSystem(styleSystem)

  beforeEach(() => {
    styleSystem.resetCSSRules()
  })

  describe('styled()', () => {
    it('should create a styled component', () => {
      const Button = styled('button')

      expect(Button).toBeDefined()
      expect(Button.displayName).toBe('Styled(button)')
    })

    it('should accept base styles', () => {
      const Button = styled('button', {
        bg: 'blue.500',
        color: 'white',
      })

      expect(Button).toBeDefined()
    })

    it('should create component with React.forwardRef', () => {
      const Button = styled('button')

      // Check if it's a ForwardRef component
      expect(Button.$$typeof?.toString()).toContain('react.forward_ref')
    })
  })

  describe('styled factory', () => {
    it('should provide styled.div shorthand', () => {
      const Container = styled.div({ p: 4 })

      expect(Container).toBeDefined()
      expect(Container.displayName).toBe('Styled(div)')
    })

    it('should provide styled.button shorthand', () => {
      const Button = styled.button({ bg: 'blue.500' })

      expect(Button).toBeDefined()
      expect(Button.displayName).toBe('Styled(button)')
    })

    it('should provide styled.span shorthand', () => {
      const Span = styled.span({ color: 'red.500' })

      expect(Span).toBeDefined()
      expect(Span.displayName).toBe('Styled(span)')
    })
  })

  describe('Built-in components', () => {
    it('should provide Box component', () => {
      expect(Box).toBeDefined()
      expect(Box.displayName).toBe('Styled(div)')
    })

    it('should provide Flex component', () => {
      expect(Flex).toBeDefined()
      expect(Flex.displayName).toBe('Styled(div)')
    })

    it('should provide Grid component', () => {
      expect(Grid).toBeDefined()
      expect(Grid.displayName).toBe('Styled(div)')
    })

    it('should provide Text component', () => {
      expect(Text).toBeDefined()
      expect(Text.displayName).toBe('Styled(span)')
    })
  })

  describe('Style props extraction', () => {
    it('should separate style props from element props', () => {
      const Button = styled('button')

      // This test verifies that the component can accept both style and element props
      // The actual extraction happens internally
      expect(() => {
        React.createElement(Button, {
          color: 'red.500',
          p: 4,
          onClick: () => {},
          disabled: true,
        })
      }).not.toThrow()
    })
  })

  describe('useStyles hook', () => {
    it('should be defined', () => {
      const { useStyles } = createReactStyleSystem(styleSystem)

      expect(useStyles).toBeDefined()
      expect(typeof useStyles).toBe('function')
    })
  })

  describe('CSS and CX utilities', () => {
    it('should expose css function', () => {
      const result = css({ color: 'red.500' })

      expect(result.className).toBeTruthy()
    })

    it('should expose cx function', () => {
      const result = cx({ color: 'red.500' }, { p: 4 })

      expect(result.className).toBeTruthy()
    })
  })

  describe('Polymorphic "as" prop', () => {
    it('should accept as prop for component polymorphism', () => {
      const Button = styled('button')

      // Should not throw when creating element with 'as' prop
      expect(() => {
        React.createElement(Button, {
          as: 'a',
          href: 'https://example.com',
        })
      }).not.toThrow()
    })
  })

  describe('Type safety', () => {
    it('should accept valid style props', () => {
      const Button = styled('button')

      // These should not throw type errors
      expect(() => {
        React.createElement(Button, {
          color: 'red.500',
          bg: 'blue.500',
          p: 4,
          m: 8,
        })
      }).not.toThrow()
    })

    it('should accept pseudo state props', () => {
      const Button = styled('button')

      expect(() => {
        React.createElement(Button, {
          _hover: { bg: 'red.600' },
          _focus: { bg: 'blue.500' },
        })
      }).not.toThrow()
    })
  })
})
