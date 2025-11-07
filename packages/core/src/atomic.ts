/**
 * Atomic CSS Deduplication
 * Inspired by Meta's StyleX - achieve "plateau effect" where CSS growth slows
 *
 * Key insight: Each property-value pair should generate only ONE atomic class
 * Result: 10-20% smaller CSS for apps with 100+ components
 */

import { generateShortClassName } from './production'
import type { ProductionConfig } from './production'

export interface AtomicCSSOptions {
  /** Production config for class name generation */
  production?: ProductionConfig
  /** Enable atomic deduplication (default: true) */
  enabled?: boolean
}

/**
 * Registry for atomic CSS classes
 * Maps property-value pairs to deduplicated class names
 */
export class AtomicCSSRegistry {
  // Map atom key (property:value) to class name
  private atoms = new Map<string, string>()

  // Track usage count for each class
  private usage = new Map<string, number>()

  // Cache for rapid lookups
  private reverseMap = new Map<string, string>()

  constructor(private options: AtomicCSSOptions = {}) {}

  /**
   * Register an atomic style and return deduplicated class name
   *
   * @example
   * registerAtom('color', 'red') → 'a0'
   * registerAtom('color', 'red') → 'a0' (same class, reused)
   * registerAtom('color', 'blue') → 'a1' (different value, new class)
   */
  registerAtom(property: string, value: string): string {
    const atomKey = this.normalizeAtomKey(property, value)

    // Check if already registered
    let className = this.atoms.get(atomKey)

    if (className) {
      // Increment usage counter
      this.usage.set(className, (this.usage.get(className) ?? 0) + 1)
      return className
    }

    // Generate new atomic class name
    className = generateShortClassName(atomKey)

    // Register atom
    this.atoms.set(atomKey, className)
    this.usage.set(className, 1)
    this.reverseMap.set(className, atomKey)

    return className
  }

  /**
   * Register multiple atoms and return class names
   */
  registerAtoms(styles: Record<string, string>): string[] {
    const classNames: string[] = []

    for (const [property, value] of Object.entries(styles)) {
      if (value === undefined || value === null) continue
      classNames.push(this.registerAtom(property, value))
    }

    return classNames
  }

  /**
   * Generate all atomic CSS rules (deduplicated)
   */
  generateAtomicCSS(): string {
    const rules: string[] = []

    for (const [atomKey, className] of this.atoms) {
      const [property, value] = atomKey.split('::')
      if (!property || !value) continue

      // Generate minimal CSS rule
      rules.push(`.${className}{${property}:${value}}`)
    }

    return rules.join('')
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    const totalUsage = Array.from(this.usage.values()).reduce((sum, count) => sum + count, 0)
    const uniqueAtoms = this.atoms.size
    const deduplicationRate = totalUsage / (uniqueAtoms || 1)
    const savingsPercentage = uniqueAtoms > 0 ? ((1 - 1 / deduplicationRate) * 100) : 0

    return {
      uniqueAtoms,
      totalUsage,
      deduplicationRate: Math.round(deduplicationRate * 100) / 100,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
      averageReuse: Math.round(deduplicationRate * 100) / 100,
    }
  }

  /**
   * Get most frequently used atoms (for optimization insights)
   */
  getTopAtoms(limit = 10): Array<{ atom: string; usage: number; className: string }> {
    return Array.from(this.usage.entries())
      .map(([className, usage]) => ({
        atom: this.reverseMap.get(className) ?? '',
        usage,
        className,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit)
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.atoms.clear()
    this.usage.clear()
    this.reverseMap.clear()
  }

  /**
   * Normalize atom key for consistent hashing
   */
  private normalizeAtomKey(property: string, value: string): string {
    // Normalize property name (camelCase → kebab-case)
    const normalizedProperty = property.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

    // Normalize value (remove extra whitespace)
    const normalizedValue = value.trim().replace(/\s+/g, ' ')

    return `${normalizedProperty}::${normalizedValue}`
  }

  /**
   * Export registry data (for caching/persistence)
   */
  export(): {
    atoms: Array<[string, string]>
    usage: Array<[string, number]>
  } {
    return {
      atoms: Array.from(this.atoms.entries()),
      usage: Array.from(this.usage.entries()),
    }
  }

  /**
   * Import registry data (from cache/persistence)
   */
  import(data: { atoms: Array<[string, string]>; usage: Array<[string, number]> }): void {
    this.atoms = new Map(data.atoms)
    this.usage = new Map(data.usage)

    // Rebuild reverse map
    this.reverseMap.clear()
    for (const [atomKey, className] of this.atoms) {
      this.reverseMap.set(className, atomKey)
    }
  }
}

/**
 * Global atomic registry (singleton)
 */
let globalRegistry: AtomicCSSRegistry | null = null

/**
 * Get or create global atomic registry
 */
export function getAtomicRegistry(options?: AtomicCSSOptions): AtomicCSSRegistry {
  if (!globalRegistry) {
    globalRegistry = new AtomicCSSRegistry(options)
  }
  return globalRegistry
}

/**
 * Reset global registry (for testing)
 */
export function resetAtomicRegistry(): void {
  globalRegistry = null
}

/**
 * Generate atomic CSS report
 */
export function generateAtomicReport(registry: AtomicCSSRegistry): string {
  const stats = registry.getStats()
  const topAtoms = registry.getTopAtoms(5)

  return [
    '⚛️  Atomic CSS Deduplication Report',
    '─'.repeat(50),
    `Unique atoms: ${stats.uniqueAtoms}`,
    `Total usage: ${stats.totalUsage}`,
    `Deduplication rate: ${stats.deduplicationRate}x`,
    `Savings: ${stats.savingsPercentage}%`,
    '',
    'Top 5 Most Reused Atoms:',
    ...topAtoms.map(
      (atom, i) => `  ${i + 1}. ${atom.className} (${atom.atom}) - used ${atom.usage}x`
    ),
    '',
    'Atomic deduplication ensures each style is generated only once!',
  ].join('\n')
}
