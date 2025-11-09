/**
 * @sylphx/zencss
 * Zero-codegen, type-safe CSS-in-TS with build-time extraction
 */

// Core runtime (Browser-safe, ~500B gzipped)
export { createStyleSystem, cssRules } from './runtime.js'
export type { StyleSystem } from './runtime.js'

// Build-time only: Default css function for zero-runtime compilation
// This is a stub that gets transformed by @sylphx/babel-plugin-silk at build time
// DO NOT use at runtime - it will throw an error
export function css(...args: any[]): string {
  throw new Error(
    '@sylphx/silk: css() should be transformed at build-time by @sylphx/babel-plugin-silk. ' +
    'Make sure you have the Vite/Webpack plugin configured correctly.'
  )
}

// NOTE: Build-time optimization tools have been moved to @sylphx/silk/optimizer
// to prevent bundling Node.js-only code (lightningcss) in browser builds.
//
// Import them from:
//   import { optimizeCSSWithLightning } from '@sylphx/silk/optimizer'
//
// This includes:
//   - Production optimizations (LightningCSS)
//   - Atomic CSS deduplication
//   - Critical CSS extraction

// Modern CSS Features (93% browser support)
export {
  supportsContainerQueries,
  supportsScope,
  supportsStartingStyle,
  generateContainerQuery as generateModernContainerQuery,
  generateScopeCSS,
  generateStartingStyle,
  parseContainerQuery,
  isContainerQuery,
  isScope,
  isStartingStyle,
  extractModernCSSFeatures,
  generateCompatibilityReport,
  defaultModernCSSConfig,
} from './modern-css.js'
export type { ModernCSSConfig } from './modern-css.js'

// Runtime Performance (2-3x faster)
export { getRuntimeStats, resetRuntimeStats } from './runtime.js'

// Extended runtime with all features
export { createExtendedStyleSystem } from './runtime-extended.js'
export type { ExtendedStyleSystem, ExtendedStyleSystemOptions } from './runtime-extended.js'

// Types
export type {
  DesignConfig,
  TypedStyleProps,
  StyleObject,
  CSSProperties,
  NestedKeys,
  TokenScale,
} from './types.js'

// Style prop utilities for framework bindings
export {
  STYLE_PROP_NAMES,
  STYLE_PROP_SET,
  isStyleProp,
} from './style-props.js'
export type { StylePropName } from './style-props.js'

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
} from './types-extended.js'

// Config
export { defineConfig, defaultConfig } from './config.js'
export type { DefaultConfig } from './config.js'

// Optimizer
export {
  normalizeProps,
  mergeProperties,
  optimizeProps,
  getMinimalProps,
  resolveConflicts,
} from './optimizer.js'

// Style Merging (StyleX-inspired)
export {
  mergeStyles,
  conditionalStyle,
  createVariant,
  createCompoundVariant,
} from './merge-styles.js'
export type { CompoundVariantConfig } from './merge-styles.js'

// Responsive
export {
  generateMediaQuery,
  processResponsiveStyles,
  generateResponsiveCSS,
  generateContainerQuery,
  processContainerQueries,
  generateContainerQueryCSS,
} from './responsive.js'

// Variants & Recipes
export { recipe, slotRecipe, cva } from './variants.js'

// Theming
export {
  resolveSemanticToken,
  flattenSemanticTokens,
  generateCSSVariables,
  generateCSSVariableStylesheet,
  ThemeController,
  createTheme,
} from './theming.js'
export type { ThemeMode } from './theming.js'

// Animations
export {
  generateKeyframes,
  generateAllKeyframes,
  defaultAnimations,
  defaultKeyframes,
  transitionPresets,
  easingFunctions,
} from './animations.js'

// Cascade Layers (@layer)
export {
  classifyLayer,
  generateLayerDefinition,
  wrapInLayer,
  organizeByLayers,
  LayerManager,
  defaultLayerConfig,
} from './layers.js'
export type { CascadeLayer, LayerConfig } from './layers.js'

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
} from './selectors.js'
export type { SelectorConfig } from './selectors.js'

// Native CSS Nesting
export {
  isNestableSelector,
  generateNestedCSS,
  groupRulesBySelector,
  convertToNestedCSS,
  isNestingSupported,
  defaultNestingConfig,
} from './nesting.js'
export type { NestingConfig } from './nesting.js'

// Modern CSS Color Functions
export {
  oklch,
  lch,
  lab,
  hwb,
  colorMix,
  lighten,
  darken,
  alpha,
  parseOKLCH,
  isModernColorFunction,
  areModernColorsSupported,
  generatePalette,
  createColorScale,
  hexToOKLCH,
  defaultColorConfig,
} from './colors.js'
export type { ColorConfig, OKLCHColor, ColorMixOptions, ColorPaletteOptions } from './colors.js'

// Tree Shaking & Dead Code Elimination (types only - implementations use Node.js APIs)
export type { TreeShakingConfig } from './tree-shaking.js'

// Critical CSS Extraction (types only - implementations use Node.js APIs)
export type { CriticalCSSConfig } from './critical-css.js'

// Performance Monitoring (types only - implementations use Node.js APIs)
export type { PerformanceMetrics, BuildReport } from './performance.js'

// Benchmarking (types only - implementations use Node.js APIs)
export type { BenchmarkMetrics, BenchmarkScenario } from './benchmark.js'

// NOTE: Node.js-only implementations (tree-shaking, critical-css, performance, benchmark)
// are not exported from the main entry to ensure browser compatibility.
// Import them directly if needed in Node.js environments:
// import { CSSMinifier } from '@sylphx/zencss/dist/tree-shaking.js'
// import { CriticalCSSExtractor } from '@sylphx/zencss/dist/critical-css.js'
// import { PerformanceMonitor } from '@sylphx/zencss/dist/performance.js'
// import { BenchmarkRunner } from '@sylphx/zencss/dist/benchmark.js'
