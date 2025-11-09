/**
 * Hashing utilities for class name generation
 *
 * NOTE: Hash implementation imported from @sylphx/silk to ensure consistency
 * across CLI, Babel plugin, and Runtime
 */

import { murmurHash2 as coreHash } from '@sylphx/silk/production'

/**
 * MurmurHash2 implementation
 * Re-exported from @sylphx/silk for consistency
 */
export const murmurHash2 = coreHash

/**
 * Generate a stable hash for a property-value pair
 * Matches runtime format for deterministic class names
 *
 * @param property - CSS property name
 * @param value - CSS property value
 * @param variant - Optional variant (e.g., 'hover', 'md')
 * @returns Hash string
 */
export function hashPropertyValue(
  property: string,
  value: any,
  variant = ''
): string {
  const content = `${property}-${value}${variant}`
  return murmurHash2(content)
}
