/**
 * @sylphx/silk-nextjs
 * Next.js integration for Silk with webpack virtual module support
 *
 * Architecture:
 * - Webpack mode: Use SilkWebpackPlugin (virtual module, no-codegen)
 * - Turbopack mode: Manual import (semi-codegen, requires CLI)
 */

import type { NextConfig } from 'next';
import SilkWebpackPlugin, { type SilkWebpackPluginOptions } from '@sylphx/silk-webpack-plugin';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SilkNextConfig extends SilkWebpackPluginOptions {
  /**
   * Build mode selection
   *
   * - undefined (default): Auto-detect
   *   - If you have custom webpack config → Webpack mode
   *   - If no custom webpack config → Turbopack mode (recommended)
   *
   * - true: Force Turbopack mode (CLI-based, faster)
   *   Requires: silk generate + import silk.generated.css
   *
   * - false: Force Webpack mode (zero-codegen, slower)
   *   Uses: Virtual CSS modules, automatic regeneration
   *
   * @default undefined (auto-detect)
   */
  turbopack?: boolean;
}

/**
 * Silk Next.js plugin
 *
 * @example
 * Webpack mode (recommended, no-codegen):
 * ```javascript
 * // next.config.js
 * const { withSilk } = require('@sylphx/silk-nextjs');
 *
 * module.exports = withSilk({
 *   // Next.js config
 * });
 * ```
 *
 * ```typescript
 * // app/layout.tsx
 * import 'silk.css'  // Virtual module → Next.js CSS pipeline
 * ```
 *
 * @example
 * Turbopack mode (semi-codegen):
 * ```javascript
 * // next.config.js
 * const { withSilk } = require('@sylphx/silk-nextjs');
 *
 * module.exports = withSilk({
 *   // Next.js config
 * }, {
 *   turbopack: true
 * });
 * ```
 *
 * ```json
 * // package.json
 * {
 *   "scripts": {
 *     "predev": "silk generate",
 *     "prebuild": "silk generate",
 *     "dev": "next dev --turbo",
 *     "build": "next build"
 *   }
 * }
 * ```
 *
 * ```typescript
 * // app/layout.tsx
 * import '../src/silk.generated.css'  // Physical file → Next.js CSS pipeline
 * ```
 */
export function withSilk(
  nextConfig: NextConfig = {},
  silkConfig: SilkNextConfig = {}
): NextConfig {
  const {
    turbopack: enableTurbopack,
    srcDir = './src',
    virtualModuleId = 'silk.css',
    debug = false,
    ...generateOptions
  } = silkConfig;

  // Strategy: Always provide webpack function for css() transformation
  // Next.js 16 defaults to Turbopack, but Silk requires webpack for css() transformation
  // Users should explicitly use `--webpack` flag or set turbopack: false

  return {
    ...nextConfig,

    webpack(config: any, options: any) {
      // If user explicitly enabled turbopack mode, skip webpack plugin
      if (enableTurbopack === true) {
        if (debug) {
          console.log('[Silk] Turbopack mode explicitly enabled, skipping webpack plugin');
        }
        // Call user's webpack config if exists
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options);
        }
        return config;
      }

      // Webpack is being used by Next.js (this function was called)
      if (debug) {
        console.log('[Silk] Webpack mode: Injecting SilkWebpackPlugin');
        console.log('[Silk] isServer:', options.isServer);
        console.log('[Silk] srcDir:', srcDir);
      }

      // Prevent Node.js-only dependencies from being bundled to client
      if (!options.isServer) {
        config.externals = config.externals || [];
        const externalsArray = Array.isArray(config.externals) ? config.externals : [config.externals];
        externalsArray.push({
          'lightningcss-wasm': 'commonjs lightningcss-wasm'
        });
        config.externals = externalsArray;

        if (debug) {
          console.log('[Silk] Added lightningcss-wasm to client externals');
        }
      }

      // Add SilkWebpackPlugin (to both client and server builds)
      config.plugins = config.plugins || [];
      config.plugins.push(
        new SilkWebpackPlugin({
          srcDir,
          virtualModuleId,
          debug,
          ...generateOptions
        })
      );

      // Ensure webpack can resolve the virtual module
      config.resolve = config.resolve || {};
      config.resolve.modules = config.resolve.modules || [];
      if (!config.resolve.modules.includes('node_modules')) {
        config.resolve.modules.push('node_modules');
      }

      // Call user's webpack config if exists
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    }
  };
}

// Default export for convenience
export default withSilk;

// Named exports
export { withSilk as silk };
export type { SilkWebpackPluginOptions };
