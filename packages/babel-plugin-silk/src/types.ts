/**
 * Type definitions for babel-plugin-silk
 */

import type { NodePath, PluginPass } from '@babel/core'
import type * as t from '@babel/types'

/**
 * Plugin configuration options
 */
export interface PluginOptions {
  /**
   * Enable production mode optimizations
   * - Short class names (a0, b1, etc.)
   * - Minified CSS output
   * @default false
   */
  production?: boolean

  /**
   * Class name prefix
   * @default 'silk' in dev, '' in production
   */
  classPrefix?: string

  /**
   * Import sources to transform
   * @default ['@sylphx/silk']
   */
  importSources?: string[]

  /**
   * Functions to transform
   * @default ['css']
   */
  functions?: string[]

  /**
   * Design token configuration
   */
  tokens?: {
    colors?: Record<string, string>
    spacing?: Record<string, string>
    [key: string]: any
  }

  /**
   * Breakpoint configuration for responsive styles
   */
  breakpoints?: Record<string, string>
}

/**
 * Plugin state extended with custom properties
 */
export interface PluginState extends PluginPass {
  opts: PluginOptions
  cssRules: Map<string, string>
  classNames: Set<string>
  filename: string
  file: PluginPass['file'] & {
    metadata: PluginPass['file']['metadata'] & {
      silk?: SilkMetadata
    }
  }
}

/**
 * Extracted style information
 */
export interface ExtractedStyles {
  /**
   * Static styles that can be compiled at build-time
   */
  styles: Record<string, any>

  /**
   * Properties that contain dynamic values and must remain at runtime
   */
  dynamicProps: Array<NodePath<t.ObjectProperty | t.SpreadElement>>
}

/**
 * Generated CSS output
 */
export interface GeneratedCSS {
  /**
   * Array of generated class names
   */
  classNames: string[]

  /**
   * Map of class name to CSS rule
   */
  cssRules: Map<string, string>

  /**
   * Space-separated class names
   */
  className: string
}

/**
 * Metadata emitted by the plugin
 */
export interface SilkMetadata {
  /**
   * Array of [className, cssRule] tuples
   */
  cssRules: Array<[string, string]>

  /**
   * Array of class names
   */
  classNames: string[]

  /**
   * Plugin version
   */
  version: string
}
