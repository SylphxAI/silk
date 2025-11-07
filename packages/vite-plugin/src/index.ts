/**
 * @zencss/vite-plugin
 * Build-time CSS extraction for zero runtime overhead
 */

import type { Plugin, ViteDevServer } from 'vite'
import { cssRules } from '@zencss/core'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface ZenCSSPluginOptions {
  /**
   * Output CSS file path (relative to outDir)
   * @default 'zencss.css'
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
}

export function zenCSS(options: ZenCSSPluginOptions = {}): Plugin {
  const {
    outputFile = 'zencss.css',
    inject = true,
    minify,
    watch = true,
  } = options

  let server: ViteDevServer | undefined
  let isBuild = false
  const cssCache = new Set<string>()

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
    name: 'zencss',

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
              event: 'zencss:update',
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
        const styleTag = `<style data-zencss>${css}</style>`

        if (html.includes('</head>')) {
          return html.replace('</head>', `${styleTag}\n</head>`)
        }

        return `${styleTag}\n${html}`
      },
    },

    generateBundle(_, bundle) {
      if (!isBuild) return

      const css = generateCSS()
      if (!css) return

      // Emit CSS file
      this.emitFile({
        type: 'asset',
        fileName: outputFile,
        source: css,
      })

      // Update HTML to reference external CSS file
      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        if (chunk.type === 'asset' && fileName.endsWith('.html')) {
          const html = chunk.source as string
          const linkTag = `<link rel="stylesheet" href="/${outputFile}">`

          // Replace inline style with link tag
          chunk.source = html
            .replace(/<style data-zencss>[\s\S]*?<\/style>/, linkTag)
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
          event: 'zencss:update',
          data: { css },
        })
      }
    },
  }
}

export default zenCSS

/**
 * Client-side script for hot CSS updates
 * This should be imported in the app entry point
 */
export const zenCSSClient = `
if (import.meta.hot) {
  import.meta.hot.on('zencss:update', ({ css }) => {
    let style = document.querySelector('style[data-zencss]')
    if (!style) {
      style = document.createElement('style')
      style.setAttribute('data-zencss', '')
      document.head.appendChild(style)
    }
    style.textContent = css
  })
}
`
