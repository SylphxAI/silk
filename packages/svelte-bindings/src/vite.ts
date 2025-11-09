/**
 * @sylphx/silk-svelte - Vite plugin
 */

import silkVite from '@sylphx/silk-vite-plugin'
import type { SilkVitePluginOptions } from '@sylphx/silk-vite-plugin'

/**
 * Silk plugin for Svelte
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import { svelte } from '@sveltejs/vite-plugin-svelte'
 * import { silkPlugin } from '@sylphx/silk-svelte/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     silkPlugin(), // Add BEFORE Svelte plugin
 *     svelte(),
 *   ],
 * })
 * ```
 */
export function silkPlugin(options: SilkVitePluginOptions = {}) {
  return silkVite(options)
}
