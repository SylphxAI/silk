/**
 * @zencss/core
 * Zero-codegen, type-safe CSS-in-TS with build-time extraction
 */

export { createStyleSystem, cssRules } from './runtime'
export type {
  DesignConfig,
  TypedStyleProps,
  StyleObject,
  CSSProperties,
  NestedKeys,
  TokenScale,
  StyleSystem,
} from './types'
export { defineConfig } from './config'
