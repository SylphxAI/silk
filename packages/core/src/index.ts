/**
 * @sylphx/zencss
 * Zero-codegen, type-safe CSS-in-TS with build-time extraction
 */

// Core runtime
export { createStyleSystem, cssRules } from './runtime'
export type { StyleSystem } from './runtime'

// Production optimizations
export {
  generateClassName,
  generateShortClassName,
  hashStyleId,
  optimizeCSS,
  resetShortNameCounter,
  getShortNameCount,
} from './production'
export type { ProductionConfig, CSSOptimizationResult } from './production'

// Extended runtime with all features
export { createExtendedStyleSystem } from './runtime-extended'
export type { ExtendedStyleSystem, ExtendedStyleSystemOptions } from './runtime-extended'

// Types
export type {
  DesignConfig,
  TypedStyleProps,
  StyleObject,
  CSSProperties,
  NestedKeys,
  TokenScale,
} from './types'

// Extended types
export type {
  ResponsiveStyleProps,
  ContainerStyleProps,
  SemanticTokens,
  SemanticTokenValue,
  ThemeConfig,
  AnimationConfig,
  ExtendedCSSProperties,
  ExtendedPseudoSelectors,
  RecipeConfig,
  RecipeVariantProps,
  CompoundVariant,
  VariantDefinition,
  SlotRecipeConfig,
  CompleteStyleProps,
} from './types-extended'

// Config
export { defineConfig, defaultConfig } from './config'
export type { DefaultConfig } from './config'

// Optimizer
export {
  normalizeProps,
  mergeProperties,
  optimizeProps,
  getMinimalProps,
  resolveConflicts,
} from './optimizer'

// Responsive
export {
  generateMediaQuery,
  processResponsiveStyles,
  generateResponsiveCSS,
  generateContainerQuery,
  processContainerQueries,
  generateContainerQueryCSS,
} from './responsive'

// Variants & Recipes
export { recipe, slotRecipe, cva } from './variants'

// Theming
export {
  resolveSemanticToken,
  flattenSemanticTokens,
  generateCSSVariables,
  generateCSSVariableStylesheet,
  ThemeController,
  createTheme,
} from './theming'
export type { ThemeMode } from './theming'

// Animations
export {
  generateKeyframes,
  generateAllKeyframes,
  defaultAnimations,
  defaultKeyframes,
  transitionPresets,
  easingFunctions,
} from './animations'

// Cascade Layers (@layer)
export {
  classifyLayer,
  generateLayerDefinition,
  wrapInLayer,
  organizeByLayers,
  LayerManager,
  defaultLayerConfig,
} from './layers'
export type { CascadeLayer, LayerConfig } from './layers'

// Selector Optimization (:where)
export {
  wrapInWhere,
  generateSelector,
  calculateSpecificity,
  compareSpecificity,
  optimizeSelector,
  extractClassNames,
  hasPseudo,
  minifyClassName,
  ClassNameGenerator,
  defaultSelectorConfig,
} from './selectors'
export type { SelectorConfig } from './selectors'

// Tree Shaking & Dead Code Elimination (types only - implementations use Node.js APIs)
export type { TreeShakingConfig } from './tree-shaking'

// Critical CSS Extraction (types only - implementations use Node.js APIs)
export type { CriticalCSSConfig } from './critical-css'

// Performance Monitoring (types only - implementations use Node.js APIs)
export type { PerformanceMetrics, BuildReport } from './performance'

// Benchmarking (types only - implementations use Node.js APIs)
export type { BenchmarkMetrics, BenchmarkScenario } from './benchmark'

// NOTE: Node.js-only implementations (tree-shaking, critical-css, performance, benchmark)
// are not exported from the main entry to ensure browser compatibility.
// Import them directly if needed in Node.js environments:
// import { CSSMinifier } from '@sylphx/zencss/dist/tree-shaking.js'
// import { CriticalCSSExtractor } from '@sylphx/zencss/dist/critical-css.js'
// import { PerformanceMonitor } from '@sylphx/zencss/dist/performance.js'
// import { BenchmarkRunner } from '@sylphx/zencss/dist/benchmark.js'
