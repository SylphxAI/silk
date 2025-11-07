# SWC Plugin Development Guide

## Current Status

✅ **Hybrid architecture implemented** - Rust SWC plugin + AssemblyScript WASM module

## Architecture

We use a **Rust + AssemblyScript hybrid** approach:

1. **Rust (SWC Plugin)**: Minimal code for AST traversal
2. **AssemblyScript (WASM)**: Core CSS transformation logic

This means **you can write most logic in TypeScript-like syntax!**

## What's Done

✅ Project structure created
✅ Cargo.toml with dependencies configured
✅ `VisitMut` visitor implementation with expression transformation
✅ `is_css_call()` function to detect css() calls
✅ Configuration struct with serde
✅ package.json with build scripts
✅ AssemblyScript reference implementation (for documentation)
✅ **Core transformation logic in Rust:**
  - Property shorthand resolution (bg → background-color, etc.)
  - camelCase to kebab-case conversion
  - CSS value normalization with unit handling
  - Hash-based class name generation
  - ObjectExpression extraction
  - CallExpression replacement with string literals
✅ Comprehensive unit tests for all helper functions

## What's Needed

### Phase 1: Core Transformation ✅ COMPLETE

- ✅ **Parse ObjectExpression arguments**
  - Extract property-value pairs from `css({ bg: 'red', p: 4 })`
  - ⚠️  Nested objects not yet supported (pseudo-selectors, responsive values)

- ✅ **Generate class names**
  - Hash generation implemented
  - Property shorthand expansion (bg → background-color) ✅

- ✅ **Generate CSS rules**
  - Convert property-value pairs to CSS strings ✅
  - Handle units (numbers → px/rem) ✅
  - ⚠️  Color token resolution not yet implemented

- ✅ **Replace CallExpression**
  - Transform `css({...})` → `"silk_bg_red_a7f3 silk_p_4_b2e1"` ✅
  - Return string literal with generated class names ✅

**Implementation details:**
- Direct Rust implementation (no AssemblyScript WASM layer needed)
- Full property shorthand mapping (m, p, bg, w, h, etc.)
- Automatic unit handling (spacing uses 0.25rem, dimensions use px)
- Hash-based class name generation for deduplication

### Phase 2: CSS Collection & Output ✅ USING HYBRID APPROACH

**Current Solution: Hybrid Architecture**

We're using a pragmatic two-plugin approach:

1. **SWC Plugin** (`@sylphx/swc-plugin-silk`)
   - ✅ Transforms `css()` calls to class name strings
   - ✅ Works with Turbopack in Next.js 16+
   - ✅ 20-70x faster than Babel
   - ⚠️  Does NOT collect CSS (SWC limitation)

2. **Unplugin** (`@sylphx/unplugin-silk` via `@sylphx/nextjs-plugin`)
   - ✅ Collects CSS rules during bundling
   - ✅ Generates `silk.css` output file
   - ✅ Works alongside SWC plugin

**Why this approach?**

SWC plugins run in WASM sandbox and cannot:
- Write files to disk
- Return metadata to bundler
- Inject CSS imports

**Future options to explore:**

1. **SWC comments** (similar to styled-components)
   ```rust
   // Inject: /*! silk:css .silk_bg_red_a7f3{background-color:red} */
   ```
   Then create a webpack/vite loader to extract these comments

2. **Virtual modules** (complex)
   ```rust
   // Generate: import 'silk:css!a7f3'
   ```

3. **SWC metadata** (if available in newer versions)
   Check if SWC now supports metadata like Babel

For now, the hybrid approach provides full functionality with excellent performance.

### Phase 3: Testing

- ✅ Unit tests for helper functions:
  - `test_camel_to_kebab()`
  - `test_resolve_css_property()`
  - `test_normalize_css_value()`
  - `test_generate_class_name()`
  - `test_generate_css_rule()`
- [ ] Integration tests with fixture files
- [ ] Snapshot testing for transformed output
- [ ] Manual testing with Next.js 16 + Turbopack

### Phase 4: Publishing

- [ ] Build WASM binary for all platforms
- [ ] Test installation from npm
- [ ] Write documentation
- [ ] Publish to npm

## Development Setup

### Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Add WASM target
rustup target add wasm32-wasip1

# 3. Install SWC CLI (optional)
cargo install swc_cli

# 4. Install AssemblyScript (in assemblyscript/ directory)
cd assemblyscript
npm install
cd ..
```

### Build

**Build AssemblyScript WASM first:**
```bash
cd assemblyscript
npm run asbuild
# Generates: build/release.wasm
```

**Then build Rust SWC plugin:**
```bash
cd ..
cargo build --release --target wasm32-wasip1
# Generates: target/wasm32-wasip1/release/swc_plugin_silk.wasm
```

**Full build (both):**
```bash
npm run build
# This runs both builds in sequence
```

### Test

```bash
cargo test
```

### Local Testing with Next.js

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcPlugins: [
      ['./packages/swc-plugin/target/wasm32-wasip1/release/swc_plugin_silk.wasm', {
        production: true
      }]
    ]
  }
}
```

## Learning Resources

- [SWC Plugin Handbook](https://swc.rs/docs/plugin/ecmascript/getting-started)
- [styled-components SWC plugin source](https://github.com/swc-project/plugins/tree/main/packages/styled-components)
- [SWC AST Explorer](https://play.swc.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)

## Questions to Resolve

1. **How to collect CSS rules?**
   - SWC plugins run in WASM sandbox
   - Can't write to filesystem
   - Need to communicate with bundler

2. **Should we still use unplugin?**
   - Maybe: SWC plugin for transformation, unplugin for CSS output
   - Or: Find pure SWC solution

3. **Platform support?**
   - WASM works everywhere
   - But performance vs native binaries?

## Next Steps

**Immediate:**
1. ✅ ~~Implement property-value extraction~~ DONE
2. ✅ ~~Port class name generation logic~~ DONE
3. Build WASM binary and test with Next.js 16

**Later:**
4. ✅ ~~Solve CSS collection problem~~ USING HYBRID APPROACH
5. Integration tests with fixture files
6. Explore native CSS collection solutions

**Current Status:**
✅ Core transformation complete! The plugin transforms `css({ bg: 'red', p: 4 })` to class name strings.
🚧 Ready for building and testing with actual Next.js project.
