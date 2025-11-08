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
   * Enable Turbopack mode (experimental)
   *
   * Note: Turbopack mode requires semi-codegen:
   * 1. Run: silk generate
   * 2. Import: import '../src/silk.generated.css'
   *
   * @default false
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
    turbopack: enableTurbopack = false,
    srcDir = './src',
    virtualModuleId = 'silk.css',
    debug = false,
    ...generateOptions
  } = silkConfig;

  // Turbopack mode: User must use CLI tool
  if (enableTurbopack) {
    if (debug) {
      console.log('[Silk] Turbopack mode enabled (semi-codegen)');
      console.log('[Silk] Please run: silk generate');
      console.log('[Silk] Then import: import "../src/silk.generated.css"');
    }

    // Return config as-is (no webpack modifications)
    return nextConfig;
  }

  // Webpack mode: Inject SilkWebpackPlugin
  return {
    ...nextConfig,

    webpack(config: any, options: any) {
      // Only apply plugin for client build (not server)
      if (!options.isServer) {
        if (debug) {
          console.log('[Silk] Webpack mode: Injecting SilkWebpackPlugin');
        }

        // Add SilkWebpackPlugin
        config.plugins = config.plugins || [];
        config.plugins.push(
          new SilkWebpackPlugin({
            srcDir,
            virtualModuleId,
            debug,
            ...generateOptions
          })
        );
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
