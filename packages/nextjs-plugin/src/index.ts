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
        // Use .next directory for generated files (cleaned between builds)
        const silkDir = path.join(dir, '.next', 'silk-auto')
        const injectPath = path.join(silkDir, 'inject.js')

        // Ensure directory exists
        if (!fs.existsSync(silkDir)) {
          fs.mkdirSync(silkDir, { recursive: true })
        }

        // Create initial inject file
        fs.writeFileSync(injectPath, `// Silk CSS auto-inject\n// Updated during build\n`)

        // Add custom plugin to collect and inject CSS
        config.plugins.push({
          apply(compiler: any) {
            compiler.hooks.emit.tapAsync('SilkAutoInject', (compilation: any, callback: any) => {
              // Collect all CSS from Silk-generated assets
              let allCSS = ''

              // Check for silk.css in compilation assets
              if (compilation.assets[outputFile]) {
                allCSS = compilation.assets[outputFile].source()
              } else {
                // Fallback: collect from all CSS assets
                Object.keys(compilation.assets).forEach(filename => {
                  if (filename.endsWith('.css') && !filename.includes('node_modules')) {
                    const asset = compilation.assets[filename]
                    if (asset && typeof asset.source === 'function') {
                      const content = asset.source()
                      if (content && content.includes('silk_')) {
                        allCSS += content
                      }
                    }
                  }
                })
              }

              if (allCSS) {
                // Update inject file with CSS
                const injectContent = `// Silk CSS auto-inject\nif (typeof document !== 'undefined') {\n  const style = document.createElement('style');\n  style.textContent = ${JSON.stringify(allCSS)};\n  document.head.appendChild(style);\n}\n`
                fs.writeFileSync(injectPath, injectContent)
              }

              callback()
            })
          },
        })

        // Inject into all client entries
        const originalEntry = config.entry
        config.entry = async () => {
          const entries = await originalEntry()

          for (const [key, value] of Object.entries(entries)) {
            if (key.includes('server') || key.includes('middleware')) continue

            if (Array.isArray(value)) {
              if (!value.includes(injectPath)) {
                value.unshift(injectPath)
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
