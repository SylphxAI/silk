import { describe, it, expect } from 'vitest'
import {
  normalizeProps,
  mergeProperties,
  optimizeProps,
  getMinimalProps,
  resolveConflicts,
} from './optimizer'

describe('CSS Optimizer', () => {
  describe('normalizeProps', () => {
    it('should expand shorthand properties', () => {
      const result = normalizeProps({
        p: 4,
        m: 8,
      })

      expect(result).toEqual({
        padding: 4,
        margin: 8,
      })
    })

    it('should expand directional shorthands', () => {
      const result = normalizeProps({
        px: 4,
        py: 8,
        mx: 2,
        my: 1,
      })

      expect(result).toEqual({
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 8,
        paddingBottom: 8,
        marginLeft: 2,
        marginRight: 2,
        marginTop: 1,
        marginBottom: 1,
      })
    })

    it('should expand specific properties', () => {
      const result = normalizeProps({
        mt: 4,
        mb: 8,
        pl: 2,
        pr: 4,
      })

      expect(result).toEqual({
        marginTop: 4,
        marginBottom: 8,
        paddingLeft: 2,
        paddingRight: 4,
      })
    })

    it('should handle bg and rounded shorthands', () => {
      const result = normalizeProps({
        bg: 'red',
        rounded: 'md',
        shadow: 'lg',
      })

      expect(result).toEqual({
        backgroundColor: 'red',
        borderRadius: 'md',
        boxShadow: 'lg',
      })
    })

    it('should preserve full property names', () => {
      const result = normalizeProps({
        backgroundColor: 'blue',
        marginTop: 4,
      })

      expect(result).toEqual({
        backgroundColor: 'blue',
        marginTop: 4,
      })
    })

    it('should handle pseudo selectors recursively', () => {
      const result = normalizeProps({
        p: 4,
        _hover: {
          bg: 'red',
          p: 8,
        },
      })

      expect(result).toEqual({
        padding: 4,
        _hover: {
          backgroundColor: 'red',
          padding: 8,
        },
      })
    })
  })

  describe('mergeProperties', () => {
    it('should merge marginTop and marginBottom into marginBlock', () => {
      const result = mergeProperties({
        marginTop: 4,
        marginBottom: 4,
      })

      expect(result).toEqual({
        marginBlock: 4,
      })
    })

    it('should merge marginLeft and marginRight into marginInline', () => {
      const result = mergeProperties({
        marginLeft: 2,
        marginRight: 2,
      })

      expect(result).toEqual({
        marginInline: 2,
      })
    })

    it('should merge all margins into margin', () => {
      const result = mergeProperties({
        marginTop: 4,
        marginRight: 4,
        marginBottom: 4,
        marginLeft: 4,
      })

      expect(result).toEqual({
        margin: 4,
      })
    })

    it('should merge marginBlock and marginInline into margin', () => {
      const result = mergeProperties({
        marginBlock: 4,
        marginInline: 4,
      })

      expect(result).toEqual({
        margin: 4,
      })
    })

    it('should merge padding properties', () => {
      const result = mergeProperties({
        paddingTop: 8,
        paddingRight: 8,
        paddingBottom: 8,
        paddingLeft: 8,
      })

      expect(result).toEqual({
        padding: 8,
      })
    })

    it('should not merge if values are different', () => {
      const result = mergeProperties({
        marginTop: 4,
        marginBottom: 8,
      })

      expect(result).toEqual({
        marginTop: 4,
        marginBottom: 8,
      })
    })

    it('should preserve unrelated properties', () => {
      const result = mergeProperties({
        marginTop: 4,
        marginBottom: 4,
        color: 'red',
        fontSize: 'lg',
      })

      expect(result).toEqual({
        marginBlock: 4,
        color: 'red',
        fontSize: 'lg',
      })
    })
  })

  describe('optimizeProps', () => {
    it('should normalize and merge in one step', () => {
      const result = optimizeProps({
        mt: 4,
        mb: 4,
      })

      expect(result).toEqual({
        marginBlock: 4,
      })
    })

    it('should handle complex optimization', () => {
      const result = optimizeProps({
        pt: 8,
        pr: 8,
        pb: 8,
        pl: 8,
      })

      expect(result).toEqual({
        padding: 8,
      })
    })

    it('should optimize nested pseudo styles', () => {
      const result = optimizeProps({
        mt: 4,
        mb: 4,
        _hover: {
          pt: 2,
          pb: 2,
        },
      })

      expect(result).toEqual({
        marginBlock: 4,
        _hover: {
          paddingBlock: 2,
        },
      })
    })
  })

  describe('resolveConflicts', () => {
    it('should remove conflicting shorthand when specific property exists', () => {
      const result = resolveConflicts({
        margin: 4,
        marginTop: 8,
      })

      // marginTop is more specific, so it wins
      expect(result.marginTop).toBe(8)
      expect(result.margin).toBeUndefined()
    })

    it('should keep non-conflicting specific properties', () => {
      const result = resolveConflicts({
        marginTop: 4,
        marginBottom: 8,
        marginLeft: 2,
        color: 'red',
      })

      expect(result).toEqual({
        marginTop: 4,
        marginBottom: 8,
        marginLeft: 2,
        color: 'red',
      })
    })
  })

  describe('getMinimalProps', () => {
    it('should produce minimal effective output', () => {
      const result = getMinimalProps({
        mt: 4,
        mb: 4,
        ml: 4,
        mr: 4,
      })

      expect(result).toEqual({
        margin: 4,
      })
    })

    it('should optimize complex cases', () => {
      const result = getMinimalProps({
        pt: 8,
        pb: 8,
        pl: 8,
        pr: 8,
        mt: 4,
        mb: 4,
      })

      expect(result).toEqual({
        padding: 8,
        marginBlock: 4,
      })
    })

    it('should handle mixed shorthands and merge when possible', () => {
      const result = getMinimalProps({
        px: 4, // paddingLeft + paddingRight
        py: 4, // paddingTop + paddingBottom (same value!)
      })

      // Should merge into single padding
      expect(result.padding).toBe(4)
    })
  })

  describe('Real-world optimization examples', () => {
    it('should optimize button styles', () => {
      const result = getMinimalProps({
        pt: 2,
        pr: 4,
        pb: 2,
        pl: 4,
        bg: 'blue',
        rounded: 'md',
      })

      expect(result).toEqual({
        paddingBlock: 2,
        paddingInline: 4,
        backgroundColor: 'blue',
        borderRadius: 'md',
      })
    })

    it('should optimize card styles', () => {
      const result = getMinimalProps({
        p: 6,
        bg: 'white',
        rounded: 'lg',
        shadow: 'md',
      })

      expect(result).toEqual({
        padding: 6,
        backgroundColor: 'white',
        borderRadius: 'lg',
        boxShadow: 'md',
      })
    })

    it('should optimize complex layout', () => {
      const result = getMinimalProps({
        mt: 8,
        mb: 8,
        ml: 4,
        mr: 4,
        pt: 4,
        pb: 4,
        pl: 4,
        pr: 4,
      })

      expect(result).toEqual({
        marginBlock: 8,
        marginInline: 4,
        padding: 4,
      })
    })
  })
})
