/**
 * @sylphx/silk-vite-plugin
 * Build-time CSS extraction with pre-compression (15-25% smaller)
 */

import type { Plugin, ViteDevServer } from 'vite'
import { cssRules } from '@sylphx/silk'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { compress } from 'brotli-wasm'
import { gzipSync } from 'node:zlib'

export interface CompressionOptions {
  /**
   * Enable Brotli compression (.css.br)
   * 15-25% smaller than gzip, 70% compression for CSS
   * @default true
   */
  brotli?: boolean

  /**
   * Brotli quality (0-11, higher = better compression but slower)
   * Use 11 for production (static compression, no runtime cost)
   * @default 11
   */
  brotliQuality?: number

  /**
   * Enable gzip compression (.css.gz)
   * Fallback for older servers
   * @default true
   */
  gzip?: boolean

  /**
   * Gzip level (0-9)
   * @default 9
   */
  gzipLevel?: number
}

export interface SilkPluginOptions {
  /**
   * Output CSS file path (relative to outDir)
   * @default 'silk.css'
   */
  outputFile?: string

  /**
   * Include CSS in HTML automatically
   * @default true
   */
  inject?: boolean

  /**
   * Minify CSS output
   * @default true in production
   */
  minify?: boolean

  /**
   * Watch mode for development
   * @default true
   */
  watch?: boolean

  /**
   * Pre-compression options (Brotli + gzip)
   * Generates .br and .gz files for web servers
   * @default { brotli: true, gzip: true }
   */
  compression?: CompressionOptions
}

export function silk(options: SilkPluginOptions = {}): Plugin {
  const {
    outputFile = 'silk.css',
    inject = true,
    minify,
    watch = true,
    compression = {}
  } = options

  const compressionConfig: Required<CompressionOptions> = {
    brotli: compression.brotli ?? true,
    brotliQuality: compression.brotliQuality ?? 11,
    gzip: compression.gzip ?? true,
    gzipLevel: compression.gzipLevel ?? 9,
  }

  let server: ViteDevServer | undefined
  let isBuild = false
  const cssCache = new Set<string>()

  /**
   * Generate compressed versions of CSS
   */
  async function generateCompressedAssets(css: string, fileName: string) {
    const outputs: Array<{ fileName: string; source: Buffer }> = []

    // Generate Brotli (.br)
    if (compressionConfig.brotli) {
      try {
        const compressed = await compress(Buffer.from(css, 'utf-8'), {
          quality: compressionConfig.brotliQuality,
        })
        outputs.push({
          fileName: `${fileName}.br`,
          source: Buffer.from(compressed),
        })
      } catch (error) {
        console.warn('Brotli compression failed:', error)
      }
    }

    // Generate gzip (.gz)
    if (compressionConfig.gzip) {
      try {
        const compressed = gzipSync(css, { level: compressionConfig.gzipLevel })
        outputs.push({
          fileName: `${fileName}.gz`,
          source: compressed,
        })
      } catch (error) {
        console.warn('Gzip compression failed:', error)
      }
    }

    return outputs
  }

  /**
   * Collect CSS rules from runtime
   */
  function collectCSS(): string {
    const rules: string[] = []

    for (const [className, rule] of cssRules) {
      if (!cssCache.has(className)) {
        rules.push(rule)
        cssCache.add(className)
      }
    }

    return rules.join('\n')
  }

  /**
   * Minify CSS (basic implementation)
   */
  function minifyCSS(css: string): string {
    return css
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim()
  }

  /**
   * Generate CSS output
   */
  function generateCSS(): string {
    let css = collectCSS()

    if (minify ?? isBuild) {
      css = minifyCSS(css)
    }

    return css
  }

  return {
    name: 'silk',

    configResolved(config) {
      isBuild = config.command === 'build'
    },

    configureServer(_server) {
      server = _server

      // Hot reload CSS in dev mode
      if (watch) {
        const watcher = setInterval(() => {
          const newCSS = collectCSS()
          if (newCSS) {
            server?.ws.send({
              type: 'custom',
              event: 'silk:update',
              data: { css: newCSS },
            })
          }
        }, 100)

        server.httpServer?.on('close', () => {
          clearInterval(watcher)
        })
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!inject) return html

        const css = generateCSS()
        if (!css) return html

        // Inject CSS into head
        const styleTag = `<style data-silk>${css}</style>`

        if (html.includes('</head>')) {
          return html.replace('</head>', `${styleTag}\n</head>`)
        }

        return `${styleTag}\n${html}`
      },
    },

    async generateBundle(_, bundle) {
      if (!isBuild) return

      const css = generateCSS()
      if (!css) return

      // Emit main CSS file
      this.emitFile({
        type: 'asset',
        fileName: outputFile,
        source: css,
      })

      // Generate and emit compressed versions
      const compressedAssets = await generateCompressedAssets(css, outputFile)
      for (const asset of compressedAssets) {
        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source,
        })
      }

      // Log compression results
      if (compressedAssets.length > 0) {
        const originalSize = Buffer.byteLength(css, 'utf-8')
        console.log('\n📦 Silk CSS Bundle:')
        console.log(`  Original: ${formatBytes(originalSize)} (${outputFile})`)

        for (const asset of compressedAssets) {
          const compressedSize = asset.source.length
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1)
          const ext = asset.fileName.split('.').pop()
          console.log(`  ${ext?.toUpperCase()}: ${formatBytes(compressedSize)} (-${savings}%)`)
        }
        console.log('')
      }

      // Update HTML to reference external CSS file
      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        if (chunk && chunk.type === 'asset' && fileName.endsWith('.html')) {
          const asset = chunk as any // OutputAsset type
          const html = asset.source as string
          const linkTag = `<link rel="stylesheet" href="/${outputFile}">`

          // Replace inline style with link tag
          asset.source = html
            .replace(/<style data-silk>[\s\S]*?<\/style>/, linkTag)
            .replace('</head>', `${linkTag}\n</head>`)
        }
      }
    },

    // Handle hot updates in dev mode
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Trigger CSS update
        const css = generateCSS()
        server.ws.send({
          type: 'custom',
          event: 'silk:update',
          data: { css },
        })
      }
    },
  }
}

export default silk

/**
 * Client-side script for hot CSS updates
 * This should be imported in the app entry point
 */
export const silkClient = `
if (import.meta.hot) {
  import.meta.hot.on('silk:update', ({ css }) => {
    let style = document.querySelector('style[data-silk]')
    if (!style) {
      style = document.createElement('style')
      style.setAttribute('data-silk', '')
      document.head.appendChild(style)
    }
    style.textContent = css
  })
}
`

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
