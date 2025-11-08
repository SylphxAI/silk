/**
 * @sylphx/silk-nextjs
 * Next.js integration for Silk with App Router and RSC support
 * Uses unplugin for zero-runtime CSS compilation with automatic CSS injection
 */

import type { NextConfig } from 'next'
import type { DesignConfig } from '@sylphx/silk'
import { unpluginSilk, type SilkPluginOptions } from '@sylphx/silk-vite-plugin'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import * as path from 'node:path'

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
   * @default true
   */
  inject?: boolean
}

/**
 * Silk Next.js plugin with automatic CSS injection
 *
 * @example
 * ```typescript
 * // next.config.js
 * import { withSilk } from '@sylphx/silk-nextjs'
 *
 * export default withSilk({
 *   // Next.js config
 * }, {
 *   // Silk config (all optional)
 *   outputFile: 'silk.css',
 *   inject: true  // Auto-inject CSS (default)
 * })
 * ```
 */
export function withSilk(
  nextConfig: NextConfig = {},
  silkConfig: SilkNextConfig = {}
): NextConfig {
  const {
    outputFile = 'silk.css',
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

  // Detect Turbopack mode
  const useTurbopack = nextConfig.turbo !== undefined || process.env.TURBOPACK === '1'

  // SWC plugin configuration for Turbopack
  const swcPluginConfig = useTurbopack ? {
    experimental: {
      ...nextConfig.experimental,
      swcPlugins: [
        ['@sylphx/swc-plugin-silk', babelOptions as Record<string, unknown>] as [string, Record<string, unknown>],
        ...(nextConfig.experimental?.swcPlugins || []),
      ],
    },
  } : {}

  return {
    ...nextConfig,
    ...swcPluginConfig,
    webpack(config, options) {
      const { isServer, dev, dir } = options

      // Call user's webpack config if exists
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options)
      }

      // Add Silk unplugin (generates CSS)
      config.plugins = config.plugins || []
      config.plugins.push(unpluginSilk.webpack(silkPluginOptions))

      // Automatic CSS injection for client bundles
      if (!isServer && inject) {
        // Create virtual modules with initial empty content
        // This ensures the module exists when webpack starts resolving
        const virtualModules = new VirtualModulesPlugin({
          'node_modules/__silk_styles__.css': '/* Silk CSS - Generated at build time */',
          'node_modules/__silk_auto_inject__.js': "import '__silk_styles__.css';"
        })
        config.plugins.push(virtualModules)

        // Add custom plugin to update virtual modules with actual CSS
        config.plugins.push({
          apply(compiler: any) {
            compiler.hooks.thisCompilation.tap('SilkAutoInject', (compilation: any) => {
              // Hook into processAssets to access the generated CSS
              compilation.hooks.processAssets.tap(
                {
                  name: 'SilkAutoInject',
                  // Run after Silk plugin generates CSS
                  stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                  // Get CSS content from compilation assets
                  const cssAsset = compilation.assets[outputFile]
                  if (!cssAsset) return

                  const cssContent = cssAsset.source()

                  // Update virtual CSS file with actual generated content
                  virtualModules.writeModule(`node_modules/__silk_styles__.css`, cssContent)
                }
              )
            })
          },
        })

        // Inject virtual module into all client entries
        const originalEntry = config.entry
        config.entry = async () => {
          const entries = await originalEntry()

          // Add virtual module to all client entries
          for (const [key, value] of Object.entries(entries)) {
            // Skip server and middleware entries
            if (key.includes('server') || key.includes('middleware')) continue

            if (Array.isArray(value)) {
              // Inject at the beginning so CSS loads first
              if (!value.includes('__silk_auto_inject__')) {
                value.unshift('__silk_auto_inject__')
              }
            }
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
