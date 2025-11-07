# Changelog

All notable changes to ZenCSS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-XX

### 🎉 Initial Release

First public release of ZenCSS - a type-safe CSS-in-TypeScript library with zero codegen and industry-leading bundle sizes.

### ✨ Features

#### Core Features
- **Zero Codegen Type Inference** - Full TypeScript type inference using template literal types
- **Strict Type Safety** - Only design tokens allowed, compile-time validation for all props
- **Zero Runtime** - CSS extracted at build time, 0 bytes JavaScript overhead
- **Atomic CSS Generation** - Generates minimal atomic CSS classes on-demand
- **Design System Config** - Comprehensive config with colors, spacing, typography, etc.

#### React Integration
- **React Components** - Box, Flex, Grid, Text primitives with full type inference
- **Styled Components** - `styled()` API similar to styled-components but type-safe
- **One-Line Setup** - `createZenReact()` helper for instant setup with zero boilerplate
- **Pseudo Selectors** - `_hover`, `_focus`, `_active` with full type safety
- **Responsive Props** - Breakpoint-based responsive design utilities

#### Advanced Features
- **Critical CSS Extraction** - Automatic above-the-fold CSS extraction (30-50% faster first paint)
- **Production Optimizer** - Tree shaking, minification, deduplication (50-90% size reduction)
- **Performance Monitoring** - Built-in build analytics and benchmarking
- **Modern CSS** - @layer support, :where() selector, zero specificity conflicts
- **Cascade Layers** - Automatic layer organization for predictable specificity
- **CSS Variables** - Full theming support with CSS custom properties

#### Build Tools
- **Vite Plugin** - Build-time CSS extraction for Vite
- **Tree Shaking** - Automatic removal of unused CSS classes
- **CSS Minification** - Production-ready minified output
- **Deduplication** - Automatic merging of identical CSS rules

### 📦 Packages

- `@sylphx/zencss@0.1.0` - Core CSS-in-TS runtime
- `@sylphx/zencss-react@0.1.0` - React integration with primitives
- `@sylphx/zencss-vite-plugin@0.1.0` - Vite build plugin

### 🔒 Breaking Changes

**Strict Type Safety (BREAKING)**
- Removed `(string & {})` fallback from all design token properties
- Only design tokens defined in config are now allowed
- Invalid tokens now produce compile-time TypeScript errors
- Use `style` prop as escape hatch for custom values outside design system

**Migration:**
```tsx
// Before (permissive):
<Box bg="custom-color" />  // Would compile even if invalid

// After (strict):
<Box bg="brand.500" />     // ✅ Valid token
<Box bg="invalid" />       // ❌ TypeScript error

// Escape hatch for custom values:
<Box
  bg="brand.500"
  style={{ background: 'linear-gradient(...)' }}
/>
```

### 🎯 Performance

Bundle Size Comparison (Large App):
- **ZenCSS**: 228B gzipped
- **Tailwind CSS**: 4.6KB gzipped (+1972%)
- **Panda CSS**: 5.0KB gzipped (+2136%)

Performance Improvements:
- 38-2100% smaller bundles than alternatives
- 30-50% faster first paint with critical CSS
- 50-90% size reduction through production optimizer
- Zero runtime JavaScript overhead

### 📚 Documentation

- Comprehensive README with examples
- Benchmark results documentation
- React configuration setup guide
- Type checking verification guide
- 7+ demo components showcasing all features

### 🧪 Testing

- 349 tests passing
- 100% coverage for core utilities
- Comprehensive benchmark suite
- React component integration tests

### 🎨 Examples

- Full-featured React demo app
- Responsive design examples
- Pseudo selector demonstrations
- Component variant patterns
- Layout and typography showcases
- Composition examples (cards, forms, dashboards)
- Strict type safety examples

---

## [Unreleased]

### Planned Features
- Vue integration
- Svelte integration
- Next.js App Router support
- Remix integration
- Webpack plugin
- esbuild plugin
- CSS-in-JS migration tools

---

[0.1.0]: https://github.com/sylphxltd/zencss/releases/tag/v0.1.0
