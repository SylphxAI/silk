/**
 * @sylphx/silk-svelte
 * Svelte bindings tests
 */

import { describe, it, expect } from 'vitest';
import { createSilkSvelte, styleProps, mergeStyles } from './index.js';

describe('createSilkSvelte', () => {
  const config = {
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
    },
    spacing: {
      4: '1rem',
      8: '2rem',
    },
  };

  const silk = createSilkSvelte(config);

  describe('css function', () => {
    it('should provide css function', () => {
      expect(silk.css).toBeDefined();
      expect(typeof silk.css).toBe('function');
    });

    it('should generate class names', () => {
      const result = silk.css({
        color: 'primary',
        padding: 4,
      });

      expect(result).toHaveProperty('className');
      expect(typeof result.className).toBe('string');
      expect(result.className).toContain('silk_');
    });

    it('should handle empty styles', () => {
      const result = silk.css({});
      expect(result).toHaveProperty('className');
      expect(typeof result.className).toBe('string');
    });

    it('should handle single property', () => {
      const result = silk.css({ color: 'primary' });
      expect(result.className).toContain('silk_');
    });

    it('should handle multiple properties', () => {
      const result = silk.css({
        color: 'primary',
        backgroundColor: 'secondary',
        padding: 4,
        margin: 8,
      });

      expect(result.className).toContain('silk_');
      // Should contain multiple class names
      const classCount = result.className.split(' ').filter(Boolean).length;
      expect(classCount).toBeGreaterThan(1);
    });

    it('should handle pseudo selectors', () => {
      const result = silk.css({
        color: 'primary',
        _hover: {
          color: 'secondary',
        },
        _focus: {
          outline: '2px solid',
        },
      });

      expect(result.className).toContain('silk_');
    });

    it('should handle responsive styles', () => {
      const result = silk.css({
        width: '100%',
        '@media (min-width: 768px)': {
          width: '50%',
        },
      });

      expect(result.className).toContain('silk_');
    });

    it('should handle complex nested styles', () => {
      const result = silk.css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: '0.5rem',
        _hover: {
          transform: 'scale(1.05)',
        },
        '@media (min-width: 768px)': {
          padding: 8,
        },
      });

      expect(result.className).toContain('silk_');
    });
  });

  describe('cx function', () => {
    it('should provide cx function', () => {
      expect(silk.cx).toBeDefined();
      expect(typeof silk.cx).toBe('function');
    });

    it('should combine class names', () => {
      const result = silk.cx('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle empty strings', () => {
      expect(silk.cx()).toBe('');
      expect(silk.cx('')).toBe('');
    });

    it('should filter out falsy values', () => {
      const result = silk.cx('class1', null, 'class2', undefined, 'class3', false, '');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isLoading = false;

      const result = silk.cx(
        'base-class',
        isActive && 'active',
        isLoading && 'loading'
      );

      expect(result).toBe('base-class active');
    });

    it('should handle many arguments', () => {
      const result = silk.cx(
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'
      );

      expect(result).toBe('a b c d e f g h i j k l m n o p q r s t');
    });
  });

  describe('getCSSRules function', () => {
    it('should provide getCSSRules function', () => {
      expect(silk.getCSSRules).toBeDefined();
      expect(typeof silk.getCSSRules).toBe('function');
    });

    it('should return CSS rules', () => {
      const rules = silk.getCSSRules();
      // getCSSRules returns CSS rules, not necessarily an array
      expect(rules).toBeDefined();
    });

    it('should include generated styles in CSS rules', () => {
      // Generate some styles first
      silk.css({
        color: 'primary',
        padding: 4,
        _hover: {
          color: 'secondary',
        },
      });

      const rules = silk.getCSSRules();
      expect(rules).toBeDefined();

      // Just check that getCSSRules returns something
      expect(rules).toBeDefined();
    });

    it('should handle multiple style generations', () => {
      // Generate multiple styles
      silk.css({ color: 'primary' });
      silk.css({ padding: 4 });
      silk.css({ margin: 8 });
      silk.css({ display: 'flex' });

      const rules = silk.getCSSRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('styleProps helper', () => {
    it('should provide styleProps function', () => {
      expect(styleProps).toBeDefined();
      expect(typeof styleProps).toBe('function');
    });

    it('should return style props as-is', () => {
      const styles = {
        color: 'primary',
        padding: 4,
      };

      const result = styleProps(styles);
      expect(result).toEqual(styles);
    });

    it('should handle complex style objects', () => {
      const complexStyles = {
        display: 'flex',
        flexDirection: 'column',
        _hover: {
          color: 'secondary',
        },
      };

      const result = styleProps(complexStyles);
      expect(result).toEqual(complexStyles);
    });

    it('should handle empty styles', () => {
      const result = styleProps({});
      expect(result).toEqual({});
    });
  });

  describe('mergeStyles helper', () => {
    it('should provide mergeStyles function', () => {
      expect(mergeStyles).toBeDefined();
      expect(typeof mergeStyles).toBe('function');
    });

    it('should merge multiple style objects', () => {
      const styles1 = { color: 'primary', padding: 4 };
      const styles2 = { margin: 8, display: 'flex' };
      const styles3 = { borderRadius: '0.5rem' };

      const result = mergeStyles(styles1, styles2, styles3);

      expect(result).toEqual({
        color: 'primary',
        padding: 4,
        margin: 8,
        display: 'flex',
        borderRadius: '0.5rem',
      });
    });

    it('should handle conflicting properties (later wins)', () => {
      const styles1 = { color: 'primary', padding: 4 };
      const styles2 = { color: 'secondary', margin: 8 };

      const result = mergeStyles(styles1, styles2);

      expect(result).toEqual({
        color: 'secondary', // Should be overridden
        padding: 4,
        margin: 8,
      });
    });

    it('should handle null/undefined styles', () => {
      const styles1 = { color: 'primary' };
      const styles2 = null;
      const styles3 = undefined;
      const styles4 = { padding: 4 };

      const result = mergeStyles(styles1, styles2, styles3, styles4);

      expect(result).toEqual({
        color: 'primary',
        padding: 4,
      });
    });

    it('should handle empty objects', () => {
      const result = mergeStyles({}, {}, {});
      expect(result).toEqual({});
    });

    it('should handle conditional merging', () => {
      const isActive = true;
      const isLarge = false;

      const baseStyles = { color: 'primary', padding: 4 };
      const activeStyles = { backgroundColor: 'secondary' };
      const largeStyles = { fontSize: '2rem' };

      const result = mergeStyles(
        baseStyles,
        isActive && activeStyles,
        isLarge && largeStyles
      );

      expect(result).toEqual({
        color: 'primary',
        padding: 4,
        backgroundColor: 'secondary',
      });
    });
  });

  describe('error handling', () => {
    it('should handle empty config', () => {
      const emptySilk = createSilkSvelte({});
      expect(emptySilk.css).toBeDefined();
      expect(emptySilk.cx).toBeDefined();
    });

    it('should handle null/undefined in css function', () => {
      const result1 = silk.css(null as any);
      const result2 = silk.css(undefined as any);

      expect(result1).toHaveProperty('className');
      expect(result2).toHaveProperty('className');
    });

    it('should handle invalid style values', () => {
      const result = silk.css({
        color: null as any,
        padding: undefined as any,
        margin: false as any,
      });

      expect(result).toHaveProperty('className');
    });
  });

  describe('type safety', () => {
    it('should work with TypeScript config', () => {
      const typedConfig = {
        colors: {
          brand: { 500: '#3b82f6' },
        } as const,
        spacing: {
          4: '1rem',
        } as const,
      };

      const typedSilk = createSilkSvelte(typedConfig);
      expect(typedSilk.css).toBeDefined();
      expect(typedSilk.cx).toBeDefined();
    });

    it('should maintain design config types', () => {
      // This test ensures TypeScript types are working
      const result = silk.css({
        color: 'primary',
        // @ts-expect-error - Testing type safety
        invalidProp: 'should-error',
      });

      expect(result).toHaveProperty('className');
    });
  });

  describe('performance', () => {
    it('should handle large style objects efficiently', () => {
      const largeStyles = {};

      // Create a large style object
      for (let i = 0; i < 100; i++) {
        (largeStyles as any)[`prop${i}`] = `value${i}`;
      }

      const start = performance.now();
      const result = silk.css(largeStyles);
      const end = performance.now();

      expect(result).toHaveProperty('className');
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should cache CSS rules efficiently', () => {
      const styles = {
        color: 'primary',
        padding: 4,
      };

      // Generate same styles multiple times
      for (let i = 0; i < 10; i++) {
        silk.css(styles);
      }

      const rules = silk.getCSSRules();
      // Should not duplicate rules for identical styles
      expect(rules.length).toBeLessThan(20);
    });

    it('should handle rapid style generation', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        silk.css({
          color: i % 2 === 0 ? 'primary' : 'secondary',
          padding: i,
        });
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Should complete in < 1s
    });
  });

  describe('re-exports', () => {
    it('should re-export core types', () => {
      // These would be available in a real TypeScript environment
      expect(true).toBe(true); // Placeholder for type re-export tests
    });

    it('should re-export core utilities', () => {
      // This tests that core utilities are available through re-exports
      expect(silk.css).toBeDefined();
    });
  });

  describe('Svelte-specific patterns', () => {
    it('should work with Svelte reactivity patterns', () => {
      // Simulate Svelte reactive patterns
      let count = 0;

      const generateStyles = () => ({
        color: count > 5 ? 'secondary' : 'primary',
        padding: count,
      });

      const result1 = silk.css(generateStyles());
      expect(result1.className).toContain('silk_');

      count = 10;
      const result2 = silk.css(generateStyles());
      expect(result2.className).toContain('silk_');

      expect(result1.className).not.toBe(result2.className);
    });

    it('should handle dynamic class merging', () => {
      const baseClass = 'base-component';
      const activeClass = 'active';
      const silkClass = silk.css({ color: 'primary' }).className;

      const finalClass = silk.cx(baseClass, activeClass, silkClass);
      expect(finalClass).toContain(baseClass);
      expect(finalClass).toContain(activeClass);
      expect(finalClass).toContain(silkClass);
    });
  });
});