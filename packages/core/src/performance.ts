/**
 * Performance monitoring and analytics
 * Track build time, CSS size, and optimization metrics
 */

export interface PerformanceMetrics {
  buildTime: number
  cssSize: {
    original: number
    optimized: number
    gzipped?: number
  }
  classStats: {
    total: number
    used: number
    unused: number
  }
  optimization: {
    merged: number
    deduplicated: number
    treeShaken: number
  }
  timestamp: number
}

export interface BuildReport {
  duration: number
  cssGenerated: string
  classesUsed: number
  classesTotal: number
  optimization: {
    savings: number
    techniques: string[]
  }
}

/**
 * Performance monitor for tracking build metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private currentBuild: {
    startTime?: number
    endTime?: number
  } = {}

  /**
   * Start timing a build
   */
  startBuild(): void {
    this.currentBuild.startTime = Date.now()
  }

  /**
   * End timing a build
   */
  endBuild(): number {
    this.currentBuild.endTime = Date.now()
    return this.getBuildDuration()
  }

  /**
   * Get current build duration
   */
  getBuildDuration(): number {
    if (!this.currentBuild.startTime || !this.currentBuild.endTime) {
      return 0
    }
    return this.currentBuild.endTime - this.currentBuild.startTime
  }

  /**
   * Record metrics for a build
   */
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now(),
    })

    // Keep only last 100 builds
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  /**
   * Get average build time
   */
  getAverageBuildTime(): number {
    if (this.metrics.length === 0) return 0

    const total = this.metrics.reduce((sum, m) => sum + m.buildTime, 0)
    return total / this.metrics.length
  }

  /**
   * Get average CSS size
   */
  getAverageCSSSize(): {
    original: number
    optimized: number
    savedPercentage: number
  } {
    if (this.metrics.length === 0) {
      return { original: 0, optimized: 0, savedPercentage: 0 }
    }

    const avgOriginal =
      this.metrics.reduce((sum, m) => sum + m.cssSize.original, 0) / this.metrics.length
    const avgOptimized =
      this.metrics.reduce((sum, m) => sum + m.cssSize.optimized, 0) / this.metrics.length

    const savedPercentage = ((avgOriginal - avgOptimized) / avgOriginal) * 100

    return {
      original: avgOriginal,
      optimized: avgOptimized,
      savedPercentage,
    }
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const latest = this.getLatestMetrics()
    if (!latest) {
      return 'No performance data available'
    }

    const avgBuildTime = this.getAverageBuildTime()
    const avgSize = this.getAverageCSSSize()

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
      return `${(bytes / 1024 / 1024).toFixed(2)}MB`
    }

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms.toFixed(0)}ms`
      return `${(ms / 1000).toFixed(2)}s`
    }

    const lines = [
      '📊 ZenCSS Performance Report',
      '═'.repeat(60),
      '',
      '⏱️  BUILD TIME',
      '─'.repeat(60),
      `Current build: ${formatTime(latest.buildTime)}`,
      `Average build: ${formatTime(avgBuildTime)}`,
      '',
      '📦 CSS SIZE',
      '─'.repeat(60),
      `Original:  ${formatSize(latest.cssSize.original)}`,
      `Optimized: ${formatSize(latest.cssSize.optimized)}`,
      `Saved:     ${formatSize(latest.cssSize.original - latest.cssSize.optimized)} (${avgSize.savedPercentage.toFixed(1)}%)`,
    ]

    if (latest.cssSize.gzipped) {
      lines.push(`Gzipped:   ${formatSize(latest.cssSize.gzipped)}`)
    }

    lines.push(
      '',
      '🎯 CLASS USAGE',
      '─'.repeat(60),
      `Used:   ${latest.classStats.used}`,
      `Unused: ${latest.classStats.unused}`,
      `Total:  ${latest.classStats.total}`,
      `Usage:  ${((latest.classStats.used / latest.classStats.total) * 100).toFixed(1)}%`,
      '',
      '⚡ OPTIMIZATION',
      '─'.repeat(60),
      `Merged properties:    ${latest.optimization.merged}`,
      `Deduplicated rules:   ${latest.optimization.deduplicated}`,
      `Tree-shaken classes:  ${latest.optimization.treeShaken}`,
      '',
      '═'.repeat(60)
    )

    return lines.join('\n')
  }

  /**
   * Export metrics as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.currentBuild = {}
  }
}

/**
 * Build reporter for console output
 */
export class BuildReporter {
  private monitor: PerformanceMonitor
  private verbose: boolean

  constructor(monitor: PerformanceMonitor, verbose = false) {
    this.monitor = monitor
    this.verbose = verbose
  }

  /**
   * Report build start
   */
  reportStart(): void {
    if (this.verbose) {
      console.log('🔨 ZenCSS build started...')
    }
  }

  /**
   * Report build completion
   */
  reportComplete(report: BuildReport): void {
    const lines = [
      '',
      '✓ ZenCSS build complete',
      '─'.repeat(50),
      `⏱️  Duration: ${report.duration}ms`,
      `📦 CSS generated: ${report.cssGenerated}`,
      `🎯 Classes used: ${report.classesUsed} / ${report.classesTotal} (${((report.classesUsed / report.classesTotal) * 100).toFixed(1)}%)`,
      `⚡ Optimization saved: ${report.optimization.savings.toFixed(1)}%`,
      `✨ Techniques: ${report.optimization.techniques.join(', ')}`,
      '─'.repeat(50),
    ]

    console.log(lines.join('\n'))
  }

  /**
   * Report error
   */
  reportError(error: Error): void {
    console.error('❌ ZenCSS build failed:', error.message)
    if (this.verbose) {
      console.error(error.stack)
    }
  }

  /**
   * Report warning
   */
  reportWarning(message: string): void {
    console.warn(`⚠️  ${message}`)
  }
}

/**
 * Comparison utility for benchmarking
 */
export class Benchmarker {
  private results = new Map<string, PerformanceMetrics>()

  /**
   * Record benchmark result
   */
  record(name: string, metrics: PerformanceMetrics): void {
    this.results.set(name, metrics)
  }

  /**
   * Compare two benchmarks
   */
  compare(nameA: string, nameB: string): {
    buildTime: {
      a: number
      b: number
      diff: number
      faster: string
    }
    cssSize: {
      a: number
      b: number
      diff: number
      smaller: string
    }
  } | null {
    const a = this.results.get(nameA)
    const b = this.results.get(nameB)

    if (!a || !b) return null

    return {
      buildTime: {
        a: a.buildTime,
        b: b.buildTime,
        diff: ((a.buildTime - b.buildTime) / a.buildTime) * 100,
        faster: a.buildTime < b.buildTime ? nameA : nameB,
      },
      cssSize: {
        a: a.cssSize.optimized,
        b: b.cssSize.optimized,
        diff: ((a.cssSize.optimized - b.cssSize.optimized) / a.cssSize.optimized) * 100,
        smaller: a.cssSize.optimized < b.cssSize.optimized ? nameA : nameB,
      },
    }
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(): string {
    if (this.results.size < 2) {
      return 'Need at least 2 benchmarks to compare'
    }

    const lines = ['📊 Benchmark Comparison', '═'.repeat(60), '']

    const names = Array.from(this.results.keys())
    for (let i = 0; i < names.length - 1; i++) {
      const nameA = names[i]
      const nameB = names[i + 1]

      if (!nameA || !nameB) continue

      const comparison = this.compare(nameA, nameB)
      if (comparison) {
        lines.push(
          `${nameA} vs ${nameB}`,
          '─'.repeat(60),
          `Build time: ${comparison.buildTime.faster} is ${Math.abs(comparison.buildTime.diff).toFixed(1)}% faster`,
          `CSS size: ${comparison.cssSize.smaller} is ${Math.abs(comparison.cssSize.diff).toFixed(1)}% smaller`,
          ''
        )
      }
    }

    return lines.join('\n')
  }
}
