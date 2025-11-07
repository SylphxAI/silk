/**
 * Critical CSS Extraction
 * Extracts and inlines above-the-fold CSS for faster first paint
 */

export interface CriticalCSSConfig {
  /**
   * Enable critical CSS extraction
   * @default false
   */
  enabled?: boolean

  /**
   * Viewport dimensions for above-the-fold calculation
   * @default { width: 1920, height: 1080 }
   */
  viewport?: {
    width: number
    height: number
  }

  /**
   * Inline critical CSS in HTML
   * @default true
   */
  inline?: boolean

  /**
   * Defer loading of non-critical CSS
   * @default true
   */
  defer?: boolean

  /**
   * Minimum selector usage threshold to be considered critical
   * @default 0 (include all above-the-fold)
   */
  threshold?: number

  /**
   * Manually mark selectors as critical
   */
  forceInclude?: string[]

  /**
   * Manually exclude selectors from critical CSS
   */
  exclude?: string[]
}

export const defaultCriticalCSSConfig: Required<CriticalCSSConfig> = {
  enabled: false,
  viewport: { width: 1920, height: 1080 },
  inline: true,
  defer: true,
  threshold: 0,
  forceInclude: [],
  exclude: [],
}

/**
 * Critical CSS extractor
 */
export class CriticalCSSExtractor {
  private config: Required<CriticalCSSConfig>
  private criticalSelectors = new Set<string>()
  private nonCriticalSelectors = new Set<string>()

  constructor(config: CriticalCSSConfig = {}) {
    this.config = { ...defaultCriticalCSSConfig, ...config }
  }

  /**
   * Mark a selector as critical (above the fold)
   */
  markCritical(selector: string): void {
    this.criticalSelectors.add(selector)
    this.nonCriticalSelectors.delete(selector)
  }

  /**
   * Mark a selector as non-critical (below the fold)
   */
  markNonCritical(selector: string): void {
    this.nonCriticalSelectors.add(selector)
    this.criticalSelectors.delete(selector)
  }

  /**
   * Check if a selector is critical
   */
  isCritical(selector: string): boolean {
    // Force include
    if (this.config.forceInclude.some((pattern) => selector.includes(pattern))) {
      return true
    }

    // Force exclude
    if (this.config.exclude.some((pattern) => selector.includes(pattern))) {
      return false
    }

    return this.criticalSelectors.has(selector)
  }

  /**
   * Extract critical CSS from full CSS
   */
  extract(fullCSS: string): {
    critical: string
    nonCritical: string
  } {
    if (!this.config.enabled) {
      return { critical: '', nonCritical: fullCSS }
    }

    const criticalRules: string[] = []
    const nonCriticalRules: string[] = []

    // Split CSS into individual rules
    const rulePattern = /([^{]+)\s*\{([^}]+)\}/g
    let match

    while ((match = rulePattern.exec(fullCSS)) !== null) {
      const selector = match[1]?.trim()
      const declarations = match[2]?.trim()

      if (!selector || !declarations) continue

      const rule = `${selector} { ${declarations} }`

      // Check if any part of the selector is critical
      const isCritical = selector.split(',').some((sel) => this.isCritical(sel.trim()))

      if (isCritical) {
        criticalRules.push(rule)
      } else {
        nonCriticalRules.push(rule)
      }
    }

    return {
      critical: criticalRules.join('\n'),
      nonCritical: nonCriticalRules.join('\n'),
    }
  }

  /**
   * Generate HTML for critical CSS injection
   */
  generateInlineHTML(criticalCSS: string): string {
    if (!this.config.inline || !criticalCSS.trim()) {
      return ''
    }

    return `<style id="critical-css">${criticalCSS}</style>`
  }

  /**
   * Generate deferred CSS loading script
   */
  generateDeferredLoad(cssHref: string): string {
    if (!this.config.defer) {
      return `<link rel="stylesheet" href="${cssHref}">`
    }

    return `
<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${cssHref}"></noscript>
<script>
  // Fallback for browsers that don't support preload
  (function() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${cssHref}';
    document.head.appendChild(link);
  })();
</script>
    `.trim()
  }

  /**
   * Auto-detect critical selectors based on heuristics
   */
  autoDetect(css: string): void {
    // Common critical patterns
    const criticalPatterns = [
      // Reset and base styles
      /^\*$/,
      /^html$/,
      /^body$/,

      // Layout
      /^\.container\b/,
      /^\.wrapper\b/,
      /^\.layout\b/,

      // Header and navigation
      /^header\b/,
      /^nav\b/,
      /^\.header\b/,
      /^\.navbar\b/,

      // Logo and branding
      /^\.logo\b/,
      /^\.brand\b/,

      // Hero section
      /^\.hero\b/,
      /^\.banner\b/,

      // Common above-the-fold elements
      /^h1\b/,
      /^\.title\b/,
      /^\.heading\b/,

      // Fonts (critical for rendering)
      /@font-face/,
    ]

    const rulePattern = /([^{]+)\s*\{[^}]+\}/g
    let match

    while ((match = rulePattern.exec(css)) !== null) {
      const selector = match[1]?.trim()

      if (!selector) continue

      // Check if selector matches critical patterns
      const isCritical = criticalPatterns.some((pattern) => pattern.test(selector))

      if (isCritical) {
        this.markCritical(selector)
      } else {
        this.markNonCritical(selector)
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    critical: number
    nonCritical: number
    total: number
    criticalPercentage: number
  } {
    const critical = this.criticalSelectors.size
    const nonCritical = this.nonCriticalSelectors.size
    const total = critical + nonCritical
    const criticalPercentage = total > 0 ? (critical / total) * 100 : 0

    return {
      critical,
      nonCritical,
      total,
      criticalPercentage,
    }
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const stats = this.getStats()

    return [
      '⚡ Critical CSS Report',
      '─'.repeat(50),
      `Critical selectors: ${stats.critical}`,
      `Non-critical selectors: ${stats.nonCritical}`,
      `Total selectors: ${stats.total}`,
      `Critical percentage: ${stats.criticalPercentage.toFixed(1)}%`,
      '',
      'Critical selectors will be inlined in <head>',
      'Non-critical CSS will be deferred for faster first paint',
    ].join('\n')
  }

  /**
   * Reset extractor
   */
  reset(): void {
    this.criticalSelectors.clear()
    this.nonCriticalSelectors.clear()
  }
}

/**
 * Critical CSS measurement utilities
 */
export class CriticalCSSMeasurement {
  /**
   * Estimate critical CSS size impact
   */
  static estimateImpact(criticalCSS: string, fullCSS: string): {
    criticalSize: number
    fullSize: number
    criticalPercentage: number
    estimatedSavings: {
      firstPaint: string
      speedIndex: string
    }
  } {
    const criticalSize = Buffer.byteLength(criticalCSS, 'utf-8')
    const fullSize = Buffer.byteLength(fullCSS, 'utf-8')
    const criticalPercentage = (criticalSize / fullSize) * 100

    // Rough estimates based on web.dev research
    const blockedTime = (fullSize - criticalSize) / 1024 / 10 // ~10KB/ms on 3G
    const firstPaintSavings = blockedTime * 0.3 // 30% improvement
    const speedIndexSavings = blockedTime * 0.5 // 50% improvement

    return {
      criticalSize,
      fullSize,
      criticalPercentage,
      estimatedSavings: {
        firstPaint: `~${firstPaintSavings.toFixed(0)}ms faster`,
        speedIndex: `~${speedIndexSavings.toFixed(0)}ms faster`,
      },
    }
  }

  /**
   * Format size for display
   */
  static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }
}
