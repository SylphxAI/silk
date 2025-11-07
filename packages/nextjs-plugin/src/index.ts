/**
 * @sylphx/silk-nextjs
 * Next.js integration for Silk with App Router and RSC support
 * Uses unplugin for zero-runtime CSS compilation
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { NextConfig } from 'next'
import type { DesignConfig } from '@sylphx/silk'
import { unpluginSilk, type SilkPluginOptions } from '@sylphx/silk-vite-plugin'

// Get the path to silk-client.js in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const silkClientPath = join(__dirname, 'silk-client.js')

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
   * Inject CSS link into HTML
   * @default true
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
 *   outputFile: 'silk.css',
 *   babelOptions: {
 *     production: true
 *   }
 * })
 * ```
 */
export function withSilk(
  nextConfig: NextConfig = {},
  silkConfig: SilkNextConfig = {}
): NextConfig {
  const {
    outputFile = 'silk.css',
    appRouter = true,
    rsc = true,
    criticalCSS = true,
    inject = true,
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

  return {
    ...nextConfig,
    webpack(config, options) {
      const { isServer, dev } = options

      // Call user's webpack config if exists
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options)
      }

      // Add Silk unplugin
      config.plugins = config.plugins || []
      config.plugins.push(unpluginSilk.webpack(silkPluginOptions))

      // Inject CSS in client bundle (only in production)
      if (!isServer && inject && !dev) {
        const originalEntry = config.entry
        config.entry = async () => {
          const entries = await originalEntry()

          if (entries['main.js'] && !entries['main.js'].includes(silkClientPath)) {
            entries['main.js'].unshift(silkClientPath)
          }

          return entries
        }
      }

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
