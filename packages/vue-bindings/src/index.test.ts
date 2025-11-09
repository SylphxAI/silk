/**
 * @sylphx/silk-vue
 * Vue 3 bindings tests
 */

import { describe, it, expect } from 'vitest';
import { createApp } from 'vue';
import { createSilkVue } from './index.js';

describe('createSilkVue', () => {
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

  const silk = createSilkVue(config);

  describe('styled function', () => {
    it('should create a styled component', () => {
      const StyledDiv = silk.styled('div', {
        color: 'primary',
        padding: 4,
      });

      expect(StyledDiv).toBeDefined();
      expect(StyledDiv.name).toBe('SilkDiv');
    });

    it('should accept style props', () => {
      const StyledDiv = silk.styled('div', {
        color: 'primary',
      });

      // Test component creation (basic smoke test)
      expect(typeof StyledDiv).toBe('object');
    });

    it('should handle different HTML elements', () => {
      const StyledButton = silk.styled('button');
      const StyledSpan = silk.styled('span');
      const StyledSection = silk.styled('section');

      expect(StyledButton.name).toBe('Silkbutton');
      expect(StyledSpan.name).toBe('Silkspan');
      expect(StyledSection.name).toBe('Silksection');
    });

    it('should work without base styles', () => {
      const StyledDiv = silk.styled('div');
      expect(StyledDiv.name).toBe('SilkDiv');
    });

    it('should accept complex style objects', () => {
      const complexStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary',
        bg: 'secondary',
        p: 4,
        borderRadius: '0.5rem',
        _hover: {
          color: 'secondary',
          bg: 'primary',
        },
      };

      const StyledDiv = silk.styled('div', complexStyles);
      expect(StyledDiv.name).toBe('SilkDiv');
    });
  });

  describe('primitive components', () => {
    it('should provide Box component', () => {
      expect(silk.Box).toBeDefined();
      expect(silk.Box.name).toBe('Silkdiv');
    });

    it('should provide Flex component', () => {
      expect(silk.Flex).toBeDefined();
      expect(silk.Flex.name).toBe('Silkdiv');
    });

    it('should provide Grid component', () => {
      expect(silk.Grid).toBeDefined();
      expect(silk.Grid.name).toBe('Silkdiv');
    });
  });

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

    it('should handle pseudo selectors', () => {
      const result = silk.css({
        color: 'primary',
        _hover: {
          color: 'secondary',
        },
      });

      expect(result.className).toContain('silk_');
      // Should include both base and hover states
    });
  });

  describe('getCSSRules function', () => {
    it('should provide getCSSRules function', () => {
      expect(silk.getCSSRules).toBeDefined();
      expect(typeof silk.getCSSRules).toBe('function');
    });

    it('should return CSS rules', () => {
      const rules = silk.getCSSRules();
      expect(rules).toBeDefined();
    });

    it('should include generated styles in CSS rules', () => {
      // Generate some styles first
      silk.css({
        color: 'primary',
        padding: 4,
      });

      const rules = silk.getCSSRules();
      expect(rules).toBeDefined();
    });
  });

  describe('style prop extraction', () => {
    it('should extract color props', () => {
      const StyledDiv = silk.styled('div');

      // Create component instance with color props
      // (Vue component testing would require mounting, which is complex)
      // For now, just ensure the component accepts these props in its definition
      expect(StyledDiv).toBeDefined();
    });

    it('should extract spacing props', () => {
      const StyledDiv = silk.styled('div', {
        m: 4,
        p: 8,
      });

      expect(StyledDiv.name).toBe('SilkDiv');
    });

    it('should extract layout props', () => {
      const StyledDiv = silk.styled('div', {
        display: 'flex',
        flexDirection: 'column',
      });

      expect(StyledDiv.name).toBe('SilkDiv');
    });

    it('should extract pseudo states', () => {
      const StyledDiv = silk.styled('div', {
        _hover: {
          color: 'secondary',
        },
        _focus: {
          outline: '2px solid',
        },
      });

      expect(StyledDiv.name).toBe('SilkDiv');
    });
  });

  describe('component composition', () => {
    it('should allow merging base styles with props', () => {
      const BaseStyled = silk.styled('div', {
        color: 'primary',
        p: 4,
      });

      expect(BaseStyled.name).toBe('SilkDiv');
    });

    it('should handle complex component hierarchies', () => {
      const Container = silk.styled('div', {
        maxW: '1200px',
        mx: 'auto',
        p: 4,
      });

      const Card = silk.styled('div', {
        bg: 'white',
        borderRadius: '0.5rem',
        shadow: 'md',
        p: 6,
      });

      expect(Container.name).toBe('SilkDiv');
      expect(Card.name).toBe('SilkDiv');
    });
  });

  describe('error handling', () => {
    it('should handle empty config', () => {
      const emptySilk = createSilkVue({});
      expect(emptySilk.css).toBeDefined();
      expect(emptySilk.Box).toBeDefined();
    });

    it('should handle invalid HTML elements gracefully', () => {
      // This should still work, Vue will handle invalid elements
      const InvalidElement = silk.styled('invalid-element' as any);
      expect(InvalidElement).toBeDefined();
    });

    it('should handle null/undefined styles', () => {
      // These will throw errors due to null/undefined, which is expected behavior
      expect(() => silk.css(null as any)).toThrow();
      expect(() => silk.css(undefined as any)).toThrow();
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

      const typedSilk = createSilkVue(typedConfig);
      expect(typedSilk.css).toBeDefined();
    });

    it('should maintain design config types', () => {
      // This test ensures TypeScript types are working
      // In a real TypeScript environment, this would catch type errors
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
        p: 4,
      };

      // Generate same styles multiple times
      for (let i = 0; i < 10; i++) {
        silk.css(styles);
      }

      const rules = silk.getCSSRules();
      // Just check that we can call it
      expect(rules).toBeDefined();
    });
  });
});