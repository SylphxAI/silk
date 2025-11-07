/**
 * Babel plugin for zero-runtime Silk CSS-in-TypeScript compilation
 *
 * Transforms css() calls into static class names at build-time:
 *
 * Input:  const button = css({ bg: 'red', p: 4 })
 * Output: const button = 'silk_bg_red_a7f3 silk_p_4_b2e1'
 *
 * CSS generated: .silk_bg_red_a7f3 { background-color: red; }
 *                .silk_p_4_b2e1 { padding: 1rem; }
 */

import type { PluginObj } from '@babel/core'
import type { PluginState } from './types.js'
import { programVisitor } from './visitors/program.js'
import { handleCallExpression } from './visitors/call-expression.js'

/**
 * Babel plugin entry point
 */
export default function babelPluginSilk(babel: typeof import('@babel/core')): PluginObj<PluginState> {
  const { types: t } = babel

  return {
    name: 'babel-plugin-silk',

    visitor: {
      /**
       * Program visitor - initialize and cleanup
       */
      Program: programVisitor,

      /**
       * CallExpression visitor - transform css() calls
       */
      CallExpression(path, state) {
        handleCallExpression(path, state, t)
      },
    },
  }
}

/**
 * Export types for TypeScript users
 */
export type { PluginOptions, SilkMetadata } from './types'
