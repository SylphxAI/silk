/**
 * Hashing utilities for class name generation
 */

/**
 * MurmurHash2 implementation (similar to @emotion/hash)
 * Fast, collision-resistant, deterministic
 *
 * @param str - String to hash
 * @returns Base-36 hash string
 */
export function murmurHash2(str: string): string {
  let h = 0

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h = Math.imul(h ^ c, 0x5bd1e995)
    h ^= h >>> 13
  }

  return (h >>> 0).toString(36)
}

/**
 * Simple deterministic hash for development
 * More readable output than MurmurHash2
 *
 * @param str - String to hash
 * @returns Base-36 hash string
 */
export function simpleHash(str: string): string {
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }

  return (hash >>> 0).toString(36)
}

/**
 * Generate a stable hash for a property-value pair
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
  const content = `${property}:${JSON.stringify(value)}:${variant}`
  return murmurHash2(content)
}
