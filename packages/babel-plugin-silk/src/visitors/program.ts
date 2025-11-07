/**
 * Program visitor for metadata collection
 */

import type { NodePath } from '@babel/core'
import type * as t from '@babel/types'
import type { PluginState, SilkMetadata } from '../types.js'

const PLUGIN_VERSION = '0.1.0'

/**
 * Program visitor handlers
 */
export const programVisitor = {
  /**
   * Program entry - initialize plugin state
   */
  enter(path: NodePath<t.Program>, state: PluginState) {
    // Initialize collections for CSS rules and class names
    state.cssRules = new Map<string, string>()
    state.classNames = new Set<string>()

    // Store filename for debugging
    state.filename = state.file.opts.filename || 'unknown'
  },

  /**
   * Program exit - emit metadata
   */
  exit(path: NodePath<t.Program>, state: PluginState) {
    // Convert collections to arrays for metadata
    const cssRules = Array.from(state.cssRules.entries())
    const classNames = Array.from(state.classNames)

    // Emit metadata for bundler to consume
    const metadata: SilkMetadata = {
      cssRules,
      classNames,
      version: PLUGIN_VERSION,
    }

    // Attach to file metadata
    state.file.metadata.silk = metadata

    // Development logging
    if (!state.opts.production && cssRules.length > 0) {
      const filename = state.filename || 'unknown'
      console.log(
        `[Silk] Compiled ${cssRules.length} CSS rules in ${filename}`
      )
    }
  },
}
