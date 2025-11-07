/**
 * @sylphx/silk-nextjs
 * Next.js integration for Silk with App Router and RSC support
 * Uses unplugin for zero-runtime CSS compilation
 */

import type { NextConfig } from 'next'
import type { DesignConfig } from '@sylphx/silk'
import { unpluginSilk, type SilkPluginOptions } from '@sylphx/silk-vite-plugin'

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

  // Warn if Turbopack is enabled
  if (nextConfig.turbo || process.env.TURBOPACK === '1') {
    console.warn(
      '\n⚠️  Silk does not support Turbopack yet (unplugin limitation).\n' +
      '   Automatically disabling Turbopack and using webpack instead.\n' +
      '   See: https://github.com/unjs/unplugin/issues/302\n'
    )
  }

  return {
    ...nextConfig,
    // Disable Turbopack since unplugin doesn't support it yet
    // https://github.com/unjs/unplugin/issues/302
    turbo: undefined,
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

          // Webpack will resolve the package path from node_modules exports
          const silkClientModule = '@sylphx/silk-nextjs/silk-client'
          if (entries['main.js'] && !entries['main.js'].includes(silkClientModule)) {
            entries['main.js'].unshift(silkClientModule)
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
