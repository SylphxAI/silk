/**
 * @sylphx/silk-preset-minimal
 * Minimal preset tests
 */

import { describe, it, expect } from 'vitest';
import { preset } from './index.js';

describe('@sylphx/silk-preset-minimal', () => {
  describe('preset export', () => {
    it('should export preset object', () => {
      expect(preset).toBeDefined();
      expect(typeof preset).toBe('object');
    });

    it('should have required preset properties', () => {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('config');
      expect(typeof preset.name).toBe('string');
      expect(typeof preset.config).toBe('object');
    });

    it('should have correct preset name', () => {
      expect(preset.name).toBe('@sylphx/silk-preset-minimal');
    });
  });

  describe('color configuration', () => {
    it('should include essential colors', () => {
      const { colors } = preset.config;

      expect(colors).toBeDefined();
      expect(colors).toHaveProperty('white');
      expect(colors).toHaveProperty('black');
      expect(colors).toHaveProperty('transparent');

      // Check for grayscale colors
      expect(colors).toHaveProperty('gray');
      expect(Array.isArray(colors.gray)).toBe(true);
    });

    it('should have valid color values', () => {
      const { colors } = preset.config;

      expect(colors.white).toBe('#ffffff');
      expect(colors.black).toBe('#000000');
      expect(colors.transparent).toBe('transparent');

      // Check grayscale values
      expect(colors.gray[50]).toBe('#f9fafb');
      expect(colors.gray[100]).toBe('#f3f4f6');
      expect(colors.gray[900]).toBe('#111827');
    });

    it('should include semantic colors', () => {
      const { colors } = preset.config;

      expect(colors).toHaveProperty('inherit');
      expect(colors).toHaveProperty('current');
      expect(colors.inherit).toBe('inherit');
      expect(colors.current).toBe('currentColor');
    });
  });

  describe('spacing configuration', () => {
    it('should include spacing scale', () => {
      const { spacing } = preset.config;

      expect(spacing).toBeDefined();
      expect(typeof spacing).toBe('object');
    });

    it('should have consistent spacing values', () => {
      const { spacing } = preset.config;

      // Check base spacing values
      expect(spacing[0]).toBe('0');
      expect(spacing[1]).toBe('0.25rem');  // 4px
      expect(spacing[2]).toBe('0.5rem');   // 8px
      expect(spacing[4]).toBe('1rem');     // 16px
      expect(spacing[8]).toBe('2rem');     // 32px
    });

    it('should include larger spacing values', () => {
      const { spacing } = preset.config;

      expect(spacing[12]).toBe('3rem');    // 48px
      expect(spacing[16]).toBe('4rem');    // 64px
      expect(spacing[20]).toBe('5rem');    // 80px
      expect(spacing[24]).toBe('6rem');    // 96px
    });

    it('should include fractional spacing', () => {
      const { spacing } = preset.config;

      expect(spacing[0.5]).toBe('0.125rem'); // 2px
      expect(spacing[1.5]).toBe('0.375rem'); // 6px
      expect(spacing[2.5]).toBe('0.625rem'); // 10px
    });
  });

  describe('font size configuration', () => {
    it('should include font sizes', () => {
      const { fontSize } = preset.config;

      expect(fontSize).toBeDefined();
      expect(typeof fontSize).toBe('object');
    });

    it('should have readable font scale', () => {
      const { fontSize } = preset.config;

      expect(fontSize.xs).toBeDefined();
      expect(fontSize.sm).toBeDefined();
      expect(fontSize.base).toBeDefined();
      expect(fontSize.lg).toBeDefined();
      expect(fontSize.xl).toBeDefined();
      expect(fontSize['2xl']).toBeDefined();
      expect(fontSize['3xl']).toBeDefined();
    });

    it('should have valid font size values', () => {
      const { fontSize } = preset.config;

      expect(fontSize.xs).toBe('0.75rem');
      expect(fontSize.sm).toBe('0.875rem');
      expect(fontSize.base).toBe('1rem');
      expect(fontSize.lg).toBe('1.125rem');
      expect(fontSize.xl).toBe('1.25rem');
      expect(fontSize['2xl']).toBe('1.5rem');
      expect(fontSize['3xl']).toBe('1.875rem');
    });
  });

  describe('font weight configuration', () => {
    it('should include font weights', () => {
      const { fontWeight } = preset.config;

      expect(fontWeight).toBeDefined();
      expect(typeof fontWeight).toBe('object');
    });

    it('should have standard font weights', () => {
      const { fontWeight } = preset.config;

      expect(fontWeight.thin).toBe('100');
      expect(fontWeight.light).toBe('300');
      expect(fontWeight.normal).toBe('400');
      expect(fontWeight.medium).toBe('500');
      expect(fontWeight.semibold).toBe('600');
      expect(fontWeight.bold).toBe('700');
      expect(fontWeight.extrabold).toBe('800');
      expect(fontWeight.black).toBe('900');
    });
  });

  describe('line height configuration', () => {
    it('should include line heights', () => {
      const { lineHeight } = preset.config;

      expect(lineHeight).toBeDefined();
      expect(typeof lineHeight).toBe('object');
    });

    it('should have standard line heights', () => {
      const { lineHeight } = preset.config;

      expect(lineHeight.none).toBe('1');
      expect(lineHeight.tight).toBe('1.25');
      expect(lineHeight.snug).toBe('1.375');
      expect(lineHeight.normal).toBe('1.5');
      expect(lineHeight.relaxed).toBe('1.625');
      expect(lineHeight.loose).toBe('2');
    });
  });

  describe('border radius configuration', () => {
    it('should include border radius values', () => {
      const { borderRadius } = preset.config;

      expect(borderRadius).toBeDefined();
      expect(typeof borderRadius).toBe('object');
    });

    it('should have rounded corners scale', () => {
      const { borderRadius } = preset.config;

      expect(borderRadius.none).toBe('0');
      expect(borderRadius.sm).toBe('0.125rem');
      expect(borderRadius.base).toBe('0.25rem');
      expect(borderRadius.md).toBe('0.375rem');
      expect(borderRadius.lg).toBe('0.5rem');
      expect(borderRadius.xl).toBe('0.75rem');
      expect(borderRadius['2xl']).toBe('1rem');
      expect(borderRadius.full).toBe('9999px');
    });
  });

  describe('shadow configuration', () => {
    it('should include box shadows', () => {
      const { boxShadow } = preset.config;

      expect(boxShadow).toBeDefined();
      expect(typeof boxShadow).toBe('object');
    });

    it('should have standard shadow values', () => {
      const { boxShadow } = preset.config;

      expect(boxShadow.sm).toBeDefined();
      expect(boxShadow.base).toBeDefined();
      expect(boxShadow.md).toBeDefined();
      expect(boxShadow.lg).toBeDefined();
      expect(boxShadow.xl).toBeDefined();
      expect(boxShadow.inner).toBeDefined();
      expect(boxShadow.none).toBe('0 0 #0000');
    });

    it('should have valid shadow CSS values', () => {
      const { boxShadow } = preset.config;

      // Check that shadows are valid CSS
      expect(boxShadow.sm).toMatch(/^[\d\spxrgba(),.]+$/);
      expect(boxShadow.base).toMatch(/^[\d\spxrgba(),.]+$/);
      expect(boxShadow.md).toMatch(/^[\d\spxrgba(),.]+$/);
    });
  });

  describe('z-index configuration', () => {
    it('should include z-index values', () => {
      const { zIndex } = preset.config;

      expect(zIndex).toBeDefined();
      expect(typeof zIndex).toBe('object');
    });

    it('should have logical z-index scale', () => {
      const { zIndex } = preset.config;

      expect(zIndex.hide).toBe('-1');
      expect(zIndex.auto).toBe('auto');
      expect(zIndex.base).toBe('0');
      expect(zIndex.docked).toBe('10');
      expect(zIndex.sticky).toBe('20');
      expect(zIndex.bar).toBe('30');
      expect(zIndex.overlay).toBe('40');
      expect(zIndex.modal).toBe('50');
      expect(zIndex.popover).toBe('60');
      expect(zInset.skipLink).toBe('70');
      expect(zIndex.toast).toBe('80');
      expect(zIndex.tooltip).toBe('90');
    });
  });

  describe('opacity configuration', () => {
    it('should include opacity values', () => {
      const { opacity } = preset.config;

      expect(opacity).toBeDefined();
      expect(typeof opacity).toBe('object');
    });

    it('should have standard opacity scale', () => {
      const { opacity } = preset.config;

      expect(opacity[0]).toBe('0');
      expect(opacity[5]).toBe('0.05');
      expect(opacity[10]).toBe('0.1');
      expect(opacity[20]).toBe('0.2');
      expect(opacity[25]).toBe('0.25');
      expect(opacity[30]).toBe('0.3');
      expect(opacity[40]).toBe('0.4');
      expect(opacity[50]).toBe('0.5');
      expect(opacity[60]).toBe('0.6');
      expect(opacity[70]).toBe('0.7');
      expect(opacity[75]).toBe('0.75');
      expect(opacity[80]).toBe('0.8');
      expect(opacity[90]).toBe('0.9');
      expect(opacity[95]).toBe('0.95');
      expect(opacity[100]).toBe('1');
    });
  });

  describe('breakpoint configuration', () => {
    it('should include breakpoints', () => {
      const { breakpoints } = preset.config;

      expect(breakpoints).toBeDefined();
      expect(typeof breakpoints).toBe('object');
    });

    it('should have responsive breakpoint scale', () => {
      const { breakpoints } = preset.config;

      expect(breakpoints.sm).toBe('640px');
      expect(breakpoints.md).toBe('768px');
      expect(breakpoints.lg).toBe('1024px');
      expect(breakpoints.xl).toBe('1280px');
      expect(breakpoints['2xl']).toBe('1536px');
    });
  });

  describe('container configuration', () => {
    it('should include container settings', () => {
      const { container } = preset.config;

      expect(container).toBeDefined();
      expect(typeof container).toBe('object');
    });

    it('should have container centering', () => {
      const { container } = preset.config;

      expect(container.center).toBe(true);
    });

    it('should have container padding', () => {
      const { container } = preset.config;

      expect(container.padding).toBe('2rem');
    });
  });

  describe('minimal preset characteristics', () => {
    it('should not include excessive colors', () => {
      const { colors } = preset.config;

      // Minimal preset should only have essential colors
      const colorKeys = Object.keys(colors);
      expect(colorKeys.length).toBeLessThan(50); // Reasonable limit for minimal preset
    });

    it('should focus on utility values', () => {
      const config = preset.config;

      // Should have essential utilities
      expect(config.spacing).toBeDefined();
      expect(config.fontSize).toBeDefined();
      expect(config.fontWeight).toBeDefined();
      expect(config.borderRadius).toBeDefined();
      expect(config.boxShadow).toBeDefined();
    });

    it('should be production-ready', () => {
      const config = preset.config;

      // All values should be valid CSS
      Object.values(config.spacing).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      Object.values(config.fontSize).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/rem$/);
      });
    });
  });

  describe('type safety', () => {
    it('should maintain consistent types', () => {
      const config = preset.config;

      // All color values should be strings
      Object.values(config.colors).forEach(value => {
        expect(typeof value).toBe('string');
      });

      // All spacing values should be strings
      Object.values(config.spacing).forEach(value => {
        expect(typeof value).toBe('string');
      });

      // All numeric values should be strings (CSS values)
      Object.values(config.zIndex).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('extensibility', () => {
    it('should be extensible', () => {
      // Test that preset can be extended
      const extendedConfig = {
        ...preset.config,
        colors: {
          ...preset.config.colors,
          brand: {
            500: '#3b82f6',
          },
        },
      };

      expect(extendedConfig.colors.brand).toBeDefined();
      expect(extendedConfig.colors.white).toBe('#ffffff'); // Original preserved
    });

    it('should work with other presets', () => {
      const anotherPreset = {
        config: {
          colors: {
            primary: '#10b981',
          },
        },
      };

      const merged = {
        ...preset.config,
        ...anotherPreset.config,
        colors: {
          ...preset.config.colors,
          ...anotherPreset.config.colors,
        },
      };

      expect(merged.colors.white).toBe('#ffffff');
      expect(merged.colors.primary).toBe('#10b981');
    });
  });
});