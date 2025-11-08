/**
 * @sylphx/silk-nextjs
 * Next.js integration for Silk with App Router and RSC support
 * Uses unplugin for zero-runtime CSS compilation with automatic CSS injection
 */

import type { NextConfig } from 'next'
import type { DesignConfig } from '@sylphx/silk'
import { unpluginSilk, type SilkPluginOptions } from '@sylphx/silk-vite-plugin'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface SilkNextConfig extends SilkPluginOptions {
  /**
   * Enable App Router optimizations
   * @default true
   */
  appRouter?: boolean

  /**
   * Enable React Server Components optimizations
   * @default true
   */
  rsc?: boolean

  /**
   * Generate critical CSS for initial page load
   * @default true
   */
  criticalCSS?: boolean

  /**
   * Automatically inject CSS into HTML
   *
   * ⚠️ DEPRECATED: Auto-injection has fundamental limitations:
   * - Bypasses Next.js CSS optimization pipeline (no merging/tree-shaking)
   * - Extra network request (impacts FCP)
   * - Flash of Unstyled Content (FOUC)
   * - CDN compatibility issues
   *
   * RECOMMENDED: Use manual import instead (see README)
   *
   * @default false
   * @deprecated Use manual CSS import for reliable production builds
   */
  inject?: boolean
}

/**
 * Silk Next.js plugin
 *
 * @example
 * ```typescript
 * // next.config.js
 * import { withSilk } from '@sylphx/silk-nextjs'
 *
 * export default withSilk({
 *   // Next.js config
 * }, {
 *   // Silk config
 *   outputFile: 'styles/silk.css',  // Output path
 * })
 *
 * // app/layout.tsx - Import the generated CSS
 * import '../.next/styles/silk.css'
 * ```
 */
export function withSilk(
  nextConfig: NextConfig = {},
  silkConfig: SilkNextConfig = {}
): NextConfig {
  const {
    outputFile = 'silk.css',
    inject = false,  // Deprecated - CSS is now auto-emitted to static/css
    babelOptions = {},
    compression = {},
    minify,
  } = silkConfig

  // Configure Silk plugin with Next.js specific settings
  const silkPluginOptions: SilkPluginOptions = {
    outputFile,
    minify,
    compression,
    babelOptions: {
      ...babelOptions,
      production: babelOptions.production ?? process.env.NODE_ENV === 'production',
    },
  }

  // Path to the bundled WASM file (shipped with this package)
  const wasmPath = path.join(__dirname, 'swc_plugin_silk.wasm')

  // SWC plugin configuration for Turbopack (only enabled when turbopack config exists)
  const hasTurbopackConfig = nextConfig.turbopack !== undefined || nextConfig.turbo !== undefined
  const swcPluginConfig = hasTurbopackConfig ? {
    experimental: {
      ...nextConfig.experimental,
      swcPlugins: [
        [wasmPath, babelOptions as Record<string, unknown>] as [string, Record<string, unknown>],
        ...(nextConfig.experimental?.swcPlugins || []),
      ],
    },
  } : {}

  // Ensure .next directory and placeholder CSS exist
  const ensureCSSPlaceholder = (dir: string) => {
    const cssPath = path.join(dir, '.next', outputFile)
    const cssDir = path.dirname(cssPath)

    if (!fs.existsSync(cssDir)) {
      fs.mkdirSync(cssDir, { recursive: true })
    }

    if (!fs.existsSync(cssPath)) {
      fs.writeFileSync(cssPath, '/* Silk CSS - will be generated during build */')
    }
  }

  return {
    ...nextConfig,
    ...swcPluginConfig,

    // Turbopack configuration (Next.js 16+)
    turbopack: {
      ...nextConfig.turbopack,
    },

    webpack(config, options) {
      const { isServer, dev, dir } = options

      // Call user's webpack config if exists
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options)
      }

      // Ensure placeholder exists for CSS imports
      ensureCSSPlaceholder(dir)

      // Create placeholder hook for Webpack builds
      config.plugins = config.plugins || []
      config.plugins.push({
        apply(compiler: any) {
          compiler.hooks.beforeCompile.tapAsync('SilkPlaceholder', (_params: any, callback: () => void) => {
            ensureCSSPlaceholder(dir)
            callback()
          })
        }
      })

      // Add Silk unplugin (generates CSS to static/css/silk.css)
      config.plugins.push(unpluginSilk.webpack(silkPluginOptions))

      return config
    },
  }
}

/**
 * Get Silk configuration for Next.js
 */
export function getSilkConfig<C extends DesignConfig>(config: C) {
  return {
    config,
    // App Router helpers
    appRouter: {
      /**
       * Generate CSS for server components
       */
      generateServerCSS: () => {
        // Extract CSS during SSR
        return ''
      },

      /**
       * Get critical CSS for route
       */
      getCriticalCSS: (route: string) => {
        // Extract critical CSS for specific route
        return ''
      },
    },

    // React Server Components helpers
    rsc: {
      /**
       * Mark styles as RSC-safe
       */
      serverOnly: <T>(styles: T): T => styles,

      /**
       * Client-only styles
       */
      clientOnly: <T>(styles: T): T => styles,
    },
  }
}

// Re-export Silk React bindings
export { createSilkReact } from '@sylphx/silk-react'
export type { SilkReactSystem } from '@sylphx/silk-react'

// Re-export core
export * from '@sylphx/silk'

// Export Silk styles component
export { SilkStyles, getSilkCssLink } from './SilkStyles.js'
