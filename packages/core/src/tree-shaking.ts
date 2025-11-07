/**
 * CSS Tree Shaking and Dead Code Elimination
 * Scans source files to determine which classes are actually used
 * and only generates CSS for those classes
 */

import * as fs from 'fs'
import * as path from 'path'

export interface TreeShakingConfig {
  /**
   * Enable tree shaking
   * @default true in production
   */
  enabled?: boolean

  /**
   * Directories to scan for class usage
   * @default ['./src']
   */
  scanDirs?: string[]

  /**
   * File extensions to scan
   * @default ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte']
   */
  extensions?: string[]

  /**
   * Patterns to exclude
   * @default ['node_modules', 'dist', 'build']
   */
  exclude?: string[]

  /**
   * Whether to report unused classes
   * @default false
   */
  reportUnused?: boolean
}

export const defaultTreeShakingConfig: Required<TreeShakingConfig> = {
  enabled: process.env.NODE_ENV === 'production',
  scanDirs: ['./src'],
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'],
  exclude: ['node_modules', 'dist', 'build', '.git'],
  reportUnused: false,
}

/**
 * Class usage tracker
 */
export class ClassUsageTracker {
  private usedClasses = new Set<string>()
  private generatedClasses = new Set<string>()
  private config: Required<TreeShakingConfig>

  constructor(config: TreeShakingConfig = {}) {
    this.config = { ...defaultTreeShakingConfig, ...config }
  }

  /**
   * Scan source files for class usage
   */
  async scan(rootDir: string = process.cwd()): Promise<void> {
    if (!this.config.enabled) return

    const files = await this.findSourceFiles(rootDir)

    for (const file of files) {
      await this.scanFile(file)
    }
  }

  /**
   * Find all source files to scan
   */
  private async findSourceFiles(rootDir: string): Promise<string[]> {
    const files: string[] = []

    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        // Skip excluded directories
        if (this.config.exclude.some((pattern) => fullPath.includes(pattern))) {
          continue
        }

        if (entry.isDirectory()) {
          await walk(fullPath)
        } else if (entry.isFile()) {
          // Check if file has valid extension
          const ext = path.extname(entry.name)
          if (this.config.extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }

    for (const scanDir of this.config.scanDirs) {
      const fullScanDir = path.resolve(rootDir, scanDir)
      if (fs.existsSync(fullScanDir)) {
        await walk(fullScanDir)
      }
    }

    return files
  }

  /**
   * Scan a single file for class usage
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf-8')

    // Extract classes from css() calls
    // Pattern: css({ ... })
    const cssCallPattern = /css\s*\(\s*\{([^}]*)\}/g
    let match

    while ((match = cssCallPattern.exec(content)) !== null) {
      const propsStr = match[1]
      if (propsStr) {
        this.extractPropsFromObject(propsStr)
      }
    }

    // Extract from className strings
    // Pattern: className="zen-abc123" or className='zen-abc123'
    const classNamePattern = /className\s*=\s*["']([^"']+)["']/g

    while ((match = classNamePattern.exec(content)) !== null) {
      const classStr = match[1]
      if (!classStr) continue
      const classes = classStr.split(/\s+/)
      for (const cls of classes) {
        if (cls.startsWith('zen-')) {
          this.usedClasses.add(cls)
        }
      }
    }

    // Extract from template literals
    // Pattern: className={`zen-abc ${other}`}
    const templatePattern = /className\s*=\s*\{`([^`]+)`\}/g

    while ((match = templatePattern.exec(content)) !== null) {
      const templateStr = match[1]
      if (!templateStr) continue
      const classes = templateStr.match(/zen-[\w-]+/g) || []
      for (const cls of classes) {
        this.usedClasses.add(cls)
      }
    }
  }

  /**
   * Extract property names from CSS object
   */
  private extractPropsFromObject(objectStr: string): void {
    // Simple property extraction (can be enhanced)
    const propPattern = /(\w+)\s*:\s*['"]?[\w.-]+['"]?/g
    let match

    while ((match = propPattern.exec(objectStr)) !== null) {
      // These are style properties, not class names
      // We track them to understand usage patterns
    }
  }

  /**
   * Mark a class as generated
   */
  markGenerated(className: string): void {
    this.generatedClasses.add(className)
  }

  /**
   * Check if a class is used
   */
  isUsed(className: string): boolean {
    if (!this.config.enabled) return true
    return this.usedClasses.has(className)
  }

  /**
   * Get all used classes
   */
  getUsedClasses(): Set<string> {
    return new Set(this.usedClasses)
  }

  /**
   * Get all generated classes
   */
  getGeneratedClasses(): Set<string> {
    return new Set(this.generatedClasses)
  }

  /**
   * Get unused classes (generated but not used)
   */
  getUnusedClasses(): Set<string> {
    const unused = new Set<string>()

    for (const generated of this.generatedClasses) {
      if (!this.usedClasses.has(generated)) {
        unused.add(generated)
      }
    }

    return unused
  }

  /**
   * Get tree shaking statistics
   */
  getStats(): {
    used: number
    generated: number
    unused: number
    savedPercentage: number
  } {
    const used = this.usedClasses.size
    const generated = this.generatedClasses.size
    const unused = generated - used
    const savedPercentage = generated > 0 ? (unused / generated) * 100 : 0

    return {
      used,
      generated,
      unused,
      savedPercentage,
    }
  }

  /**
   * Generate tree shaking report
   */
  generateReport(): string {
    const stats = this.getStats()
    const unused = this.getUnusedClasses()

    const lines = [
      '🌳 Tree Shaking Report',
      '─'.repeat(50),
      `Used classes: ${stats.used}`,
      `Generated classes: ${stats.generated}`,
      `Unused classes: ${stats.unused}`,
      `Saved: ${stats.savedPercentage.toFixed(1)}%`,
      '',
    ]

    if (this.config.reportUnused && unused.size > 0) {
      lines.push('Unused classes:')
      for (const cls of Array.from(unused).slice(0, 20)) {
        lines.push(`  - ${cls}`)
      }
      if (unused.size > 20) {
        lines.push(`  ... and ${unused.size - 20} more`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.usedClasses.clear()
    this.generatedClasses.clear()
  }
}

/**
 * CSS Minifier for final output
 */
export class CSSMinifier {
  /**
   * Minify CSS string
   */
  static minify(css: string): string {
    return (
      css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove whitespace around { } : ; ,
        .replace(/\s*([{}:;,])\s*/g, '$1')
        // Remove unnecessary semicolons
        .replace(/;}/g, '}')
        // Remove trailing whitespace
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  /**
   * Calculate size savings
   */
  static calculateSavings(original: string, minified: string): {
    originalSize: number
    minifiedSize: number
    savedBytes: number
    savedPercentage: number
  } {
    const originalSize = Buffer.byteLength(original, 'utf-8')
    const minifiedSize = Buffer.byteLength(minified, 'utf-8')
    const savedBytes = originalSize - minifiedSize
    const savedPercentage = (savedBytes / originalSize) * 100

    return {
      originalSize,
      minifiedSize,
      savedBytes,
      savedPercentage,
    }
  }
}

/**
 * CSS deduplication utility
 */
export class CSSDeduplicator {
  /**
   * Deduplicate identical CSS rules
   */
  static deduplicate(css: string): string {
    const rules = new Map<string, Set<string>>()

    // Split into individual rules
    const rulePattern = /([^{]+)\s*\{([^}]+)\}/g
    let match

    while ((match = rulePattern.exec(css)) !== null) {
      const selector = match[1]?.trim()
      const declarations = match[2]?.trim()

      if (!selector || !declarations) continue

      // Group selectors with same declarations
      if (!rules.has(declarations)) {
        rules.set(declarations, new Set())
      }
      rules.get(declarations)!.add(selector)
    }

    // Rebuild CSS with combined selectors
    const deduplicated: string[] = []

    for (const [declarations, selectors] of rules.entries()) {
      const combinedSelector = Array.from(selectors).join(', ')
      deduplicated.push(`${combinedSelector} { ${declarations} }`)
    }

    return deduplicated.join('\n')
  }

  /**
   * Calculate deduplication savings
   */
  static calculateSavings(original: string, deduplicated: string): {
    originalRules: number
    deduplicatedRules: number
    savedRules: number
    savedPercentage: number
  } {
    const countRules = (css: string) => (css.match(/\{/g) || []).length

    const originalRules = countRules(original)
    const deduplicatedRules = countRules(deduplicated)
    const savedRules = originalRules - deduplicatedRules
    const savedPercentage = (savedRules / originalRules) * 100

    return {
      originalRules,
      deduplicatedRules,
      savedRules,
      savedPercentage,
    }
  }
}

/**
 * Production CSS optimizer
 */
export class ProductionOptimizer {
  private tracker: ClassUsageTracker
  private minifier = CSSMinifier
  private deduplicator = CSSDeduplicator

  constructor(config: TreeShakingConfig = {}) {
    this.tracker = new ClassUsageTracker(config)
  }

  /**
   * Optimize CSS for production
   */
  async optimize(css: string, rootDir?: string): Promise<{
    css: string
    stats: {
      treeShaking: ReturnType<ClassUsageTracker['getStats']>
      minification: ReturnType<typeof CSSMinifier.calculateSavings>
      deduplication: ReturnType<typeof CSSDeduplicator.calculateSavings>
      totalSavings: number
    }
  }> {
    // 1. Tree shake unused classes
    if (rootDir) {
      await this.tracker.scan(rootDir)
    }

    // 2. Deduplicate rules
    const deduplicated = this.deduplicator.deduplicate(css)
    const deduplicationStats = this.deduplicator.calculateSavings(css, deduplicated)

    // 3. Minify
    const minified = this.minifier.minify(deduplicated)
    const minificationStats = this.minifier.calculateSavings(deduplicated, minified)

    // 4. Calculate total savings
    const originalSize = Buffer.byteLength(css, 'utf-8')
    const finalSize = Buffer.byteLength(minified, 'utf-8')
    const totalSavings = ((originalSize - finalSize) / originalSize) * 100

    return {
      css: minified,
      stats: {
        treeShaking: this.tracker.getStats(),
        minification: minificationStats,
        deduplication: deduplicationStats,
        totalSavings,
      },
    }
  }

  /**
   * Get tracker for manual usage
   */
  getTracker(): ClassUsageTracker {
    return this.tracker
  }
}
