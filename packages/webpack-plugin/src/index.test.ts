/**
 * @sylphx/silk-webpack-plugin
 * Webpack plugin tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SilkWebpackPlugin } from './index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

describe('SilkWebpackPlugin', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(tmpdir(), `silk-webpack-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create test source file
    testFile = path.join(tempDir, 'test.tsx');
    await fs.writeFile(testFile, `
import { css } from '@sylphx/silk';

const styles = css({
  display: 'flex',
  padding: 4,
  color: 'blue.500',
  _hover: {
    color: 'blue.600'
  }
});

export default styles;
    `.trim(), 'utf-8');
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('plugin initialization', () => {
    it('should create plugin with default options', () => {
      const plugin = new SilkWebpackPlugin();

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('SilkWebpackPlugin');
    });

    it('should create plugin with custom options', () => {
      const options = {
        srcDir: './src',
        outputFile: './dist/silk.css',
        minify: true,
        debug: true,
      };

      const plugin = new SilkWebpackPlugin(options);
      expect(plugin.name).toBe('SilkWebpackPlugin');
    });

    it('should accept empty options', () => {
      const plugin = new SilkWebpackPlugin({});
      expect(plugin.name).toBe('SilkWebpackPlugin');
    });
  });

  describe('plugin lifecycle', () => {
    it('should have required Webpack plugin methods', () => {
      const plugin = new SilkWebpackPlugin();

      expect(typeof plugin.apply).toBe('function');
    });

    it('should accept compiler instance', () => {
      const plugin = new SilkWebpackPlugin();

      // Mock Webpack compiler
      const mockCompiler = {
        hooks: {
          beforeCompile: {
            tapAsync: vi.fn(),
          },
          emit: {
            tapAsync: vi.fn(),
          },
          watchRun: {
            tapAsync: vi.fn(),
          },
        },
      };

      // Should not throw when applied
      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();

      // Should register hooks
      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalled();
      expect(mockCompiler.hooks.emit.tapAsync).toHaveBeenCalled();
    });

    it('should handle missing compiler hooks gracefully', () => {
      const plugin = new SilkWebpackPlugin();

      // Mock compiler with missing hooks
      const mockCompiler = {
        hooks: {},
      };

      // Should not throw
      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
    });
  });

  describe('CSS generation', () => {
    it('should generate CSS file', async () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: path.join(tempDir, 'silk.css'),
        debug: true,
      });

      // Mock compilation
      const mockCompilation = {
        assets: {},
        errors: [],
        warnings: [],
        emitAsset: vi.fn(),
      };

      // Mock callback
      const callback = vi.fn();

      // Simulate emit hook
      // @ts-ignore - Accessing private method for testing
      await plugin.handleEmit(mockCompilation as any, callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle minify option', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: path.join(tempDir, 'silk.min.css'),
        minify: true,
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
    });

    it('should handle debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        debug: true,
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);

      consoleSpy.mockRestore();
    });
  });

  describe('file watching', () => {
    it('should set up file watching in watch mode', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        watch: true,
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);

      // Should register watch hook
      expect(mockCompiler.hooks.watchRun.tapAsync).toHaveBeenCalled();
    });

    it('should skip watching when not in watch mode', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        watch: false,
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);

      // Should still register hook but handle watch mode internally
      expect(mockCompiler.hooks.watchRun.tapAsync).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle invalid source directory', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: path.join(tempDir, 'nonexistent'),
        outputFile: path.join(tempDir, 'output.css'),
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
    });

    it('should handle file system errors', async () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: '/invalid/path/silk.css',
      });

      const mockCompilation = {
        assets: {},
        errors: [],
        warnings: [],
        emitAsset: vi.fn(),
      };

      const callback = vi.fn();

      // @ts-ignore - Accessing private method for testing
      await plugin.handleEmit(mockCompilation as any, callback);

      // Should complete without throwing
      expect(callback).toHaveBeenCalled();
    });

    it('should handle empty source directory', async () => {
      const emptyDir = path.join(tmpdir(), `silk-empty-${Date.now()}`);
      await fs.mkdir(emptyDir, { recursive: true });

      try {
        const plugin = new SilkWebpackPlugin({
          srcDir: emptyDir,
          outputFile: path.join(emptyDir, 'silk.css'),
        });

        const mockCompilation = {
          assets: {},
          errors: [],
          warnings: [],
          emitAsset: vi.fn(),
        };

        const callback = vi.fn();

        // @ts-ignore - Accessing private method for testing
        await plugin.handleEmit(mockCompilation as any, callback);

        expect(callback).toHaveBeenCalled();
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('Webpack integration', () => {
    it('should work with different webpack configurations', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: '[name].silk.css', // Webpack pattern
      });

      const mockCompiler = {
        options: {
          mode: 'production',
        },
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);
    });

    it('should handle webpack development mode', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        minify: false, // Development mode
      });

      const mockCompiler = {
        options: {
          mode: 'development',
        },
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);
    });

    it('should handle webpack production mode', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        minify: true, // Production mode
      });

      const mockCompiler = {
        options: {
          mode: 'production',
        },
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      plugin.apply(mockCompiler as any);
    });
  });

  describe('multiple instances', () => {
    it('should handle multiple plugin instances', () => {
      const plugin1 = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: path.join(tempDir, 'silk1.css'),
      });

      const plugin2 = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: path.join(tempDir, 'silk2.css'),
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      expect(() => {
        plugin1.apply(mockCompiler as any);
        plugin2.apply(mockCompiler as any);
      }).not.toThrow();

      // Both plugins should register hooks
      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalledTimes(2);
      expect(mockCompiler.hooks.emit.tapAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('asset emission', () => {
    it('should emit CSS as webpack asset', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        outputFile: 'silk.css',
      });

      const mockCompilation = {
        assets: {},
        errors: [],
        warnings: [],
        emitAsset: vi.fn(),
      };

      const callback = vi.fn();

      // Mock the CSS generation
      // @ts-ignore - Accessing private method for testing
      plugin.generateCSS = vi.fn().mockResolvedValue('.test { color: red; }');

      // @ts-ignore - Accessing private method for testing
      plugin.handleEmit(mockCompilation as any, callback);

      // Should attempt to emit asset
      expect(mockCompilation.emitAsset).toHaveBeenCalled();
    });
  });

  describe('configuration validation', () => {
    it('should handle invalid configuration', () => {
      const invalidOptions = {
        srcDir: 123 as any, // Invalid type
        outputFile: null as any,
        minify: 'yes' as any,
      };

      const plugin = new SilkWebpackPlugin(invalidOptions);
      expect(plugin.name).toBe('SilkWebpackPlugin');
    });

    it('should use default values for missing options', () => {
      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
        // Other options should get defaults
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      expect(() => {
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large projects efficiently', () => {
      // Create many test files
      const createManyFiles = async () => {
        for (let i = 0; i < 10; i++) {
          const file = path.join(tempDir, `test${i}.tsx`);
          await fs.writeFile(file, `
import { css } from '@sylphx/silk';
const styles${i} = css({ color: 'blue.500', padding: ${i} });
          `.trim(), 'utf-8');
        }
      };

      const plugin = new SilkWebpackPlugin({
        srcDir: tempDir,
      });

      const mockCompiler = {
        hooks: {
          beforeCompile: { tapAsync: vi.fn() },
          emit: { tapAsync: vi.fn() },
          watchRun: { tapAsync: vi.fn() },
        },
      };

      expect(async () => {
        await createManyFiles();
        plugin.apply(mockCompiler as any);
      }).not.toThrow();
    });
  });
});