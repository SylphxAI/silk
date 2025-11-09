/**
 * @sylphx/silk-vue - Vite plugin
 */

import silkVite from '@sylphx/silk-vite-plugin'
import type { SilkVitePluginOptions } from '@sylphx/silk-vite-plugin'

/**
 * Silk plugin for Vue 3
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import vue from '@vitejs/plugin-vue'
 * import { silkPlugin } from '@sylphx/silk-vue/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     silkPlugin(), // Add BEFORE Vue plugin
 *     vue(),
 *   ],
 * })
 * ```
 */
export function silkPlugin(options: SilkVitePluginOptions = {}) {
  return silkVite(options)
}
