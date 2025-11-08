# @sylphx/swc-plugin-silk

> ⚠️ **DEPRECATED (v0.1.0)**: This version is incomplete and lacks critical fixes.
>
> **Use [@sylphx/babel-plugin-silk@2.0.1+](https://www.npmjs.com/package/@sylphx/babel-plugin-silk) instead**, which includes:
> - ✅ Production mode optimizations (6-7 char class names)
> - ✅ **CRITICAL FIX**: Invalid CSS class name bug fixed
> - ✅ Complete CSS collection
> - ✅ Full Next.js webpack support
>
> Full SWC plugin support coming in future release.

---

SWC plugin for Silk - zero-runtime CSS-in-TypeScript compilation.

## Why SWC Plugin? (Future Goal)

- 🔄 **Native Turbopack support** - Works with Next.js 16+ out of the box (In Progress)
- 🔄 **20-70x faster** than Babel plugin (Partially Complete)
- 🔄 **Perfect Next.js integration** - No webpack mode needed (In Progress)
- ✅ **Future-proof** - SWC is the future of JS/TS compilation

## Architecture: Rust + AssemblyScript Hybrid

This plugin uses a hybrid approach for the best of both worlds:

```
┌─────────────────────────────────┐
│   SWC Plugin (Rust)             │
│   - AST traversal               │
│   - css() call detection        │
│   - Node replacement            │
└───────────┬─────────────────────┘
            │ calls
            ▼
┌─────────────────────────────────┐
│   Transform Logic (WASM)        │
│   - Written in AssemblyScript   │
│   - Class name generation       │
│   - CSS rule generation         │
│   - Hash calculation            │
└─────────────────────────────────┘
```

**Benefits:**
- 🦀 Minimal Rust code (easier to maintain)
- 📝 Core logic in TypeScript-like syntax (AssemblyScript)
- 🚀 WASM performance
- 🔧 Easy to port existing Babel plugin logic

## Installation

```bash
npm install -D @sylphx/swc-plugin-silk
```

## Usage

### Next.js 13+

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcPlugins: [
      ['@sylphx/swc-plugin-silk', {
        production: true,
        classPrefix: 'silk',
      }]
    ]
  }
}
```

### Standalone SWC

```json
// .swcrc
{
  "jsc": {
    "experimental": {
      "plugins": [
        ["@sylphx/swc-plugin-silk", {
          "production": true
        }]
      ]
    }
  }
}
```

## Options

- `production` (boolean): Enable production mode optimizations
- `classPrefix` (string): Prefix for generated class names
- `tokens` (object): Design tokens for value resolution

## How It Works

This plugin transforms Silk's `css()` calls at compile-time:

```typescript
// Input
const button = css({ bg: 'red', p: 4 })

// Output
const button = 'silk_bg_red_a7f3 silk_p_4_b2e1'

// Generated CSS
.silk_bg_red_a7f3 { background-color: red; }
.silk_p_4_b2e1 { padding: 1rem; }
```

## Current Status

### v0.1.0 - DEPRECATED ⚠️

**Why Deprecated?**

Version 0.1.0 was released prematurely and lacks critical features:

| Feature | v0.1.0 (SWC) | v2.0.1 (Babel) |
|---------|--------------|----------------|
| AST Transformation | ✅ | ✅ |
| Production Mode | ❌ | ✅ |
| Short Class Names (6-7 chars) | ❌ | ✅ |
| **Invalid Class Name Fix** | ❌ | ✅ **CRITICAL** |
| CSS Collection | ❌ Incomplete | ✅ |
| Hash Algorithm | Simple hex | MurmurHash2 Base-36 |
| Turbopack Support | ❌ | N/A (webpack only) |

**Critical Missing Features:**

1. **❌ No Production Mode**
   - Only generates long class names (`silk_bg_red_a7f3`)
   - No 6-7 character optimization

2. **❌ Invalid CSS Class Names (CRITICAL BUG)**
   - Can generate class names starting with digits (`.0a7f`, `.1b2c`)
   - These violate CSS identifier spec and are silently dropped by browsers
   - ~28% of CSS rules may be ignored
   - **Fixed in @sylphx/babel-plugin-silk@2.0.1**

3. **❌ Inconsistent Hashing**
   - Uses different hash algorithm than Babel plugin
   - Same code generates different class names in different modes

4. **❌ Incomplete CSS Collection**
   - Cannot collect CSS rules independently
   - Requires additional webpack plugin
   - Not truly Turbopack-compatible

### Migration Guide

**Instead of:**
```javascript
// ❌ Don't use this (deprecated)
module.exports = {
  experimental: {
    swcPlugins: [
      ['@sylphx/swc-plugin-silk', { production: true }]
    ]
  }
}
```

**Use:**
```javascript
// ✅ Use this instead
const { withSilk } = require('@sylphx/silk-nextjs')

module.exports = withSilk({}, {
  babelOptions: {
    production: true,
    // No classPrefix = optimal 6-7 char class names
  }
})
```

### Future Development

We are working on a complete SWC plugin implementation that will include:

- [ ] Production mode with digit-to-letter mapping (0→g, 1→h, ...)
- [ ] MurmurHash2 + Base-36 hashing (consistent with Babel plugin)
- [ ] Native CSS collection via SWC metadata
- [ ] True Turbopack support
- [ ] 100% feature parity with Babel plugin

Follow our progress:
- [GitHub Issues](https://github.com/sylphxltd/silk/issues)
- [Roadmap](https://github.com/sylphxltd/silk/blob/main/ROADMAP.md)

## Testing

### Running Tests

```bash
# Run all tests (Rust + Vitest)
npm test

# Rust unit tests only
npm run test:rust

# Vitest integration tests only
npm run test:vitest

# Watch mode for development
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Coverage

- ✅ **Property Shorthands** - All margin, padding, size, background expansions
- ✅ **Value Normalization** - Spacing (0.25rem), unitless, px units
- ✅ **CamelCase Conversion** - fontSize → font-size, backgroundColor → background-color
- ✅ **Hash Generation** - Consistent, deterministic hashing
- ✅ **Edge Cases** - Empty objects, special characters, zero values
- ✅ **Multiple Calls** - Multiple css() in same file
- ✅ **Custom Config** - Custom class prefix

See [TESTING.md](./TESTING.md) for detailed testing guide.

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development roadmap and progress
- **[BUILD.md](./BUILD.md)** - Comprehensive build guide
- **[TESTING.md](./TESTING.md)** - Testing guide and strategies
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- **[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)** - Pre-release checklist

## Community

- **GitHub:** [sylphxltd/silk](https://github.com/sylphxltd/silk)
- **Issues:** [Report bugs](https://github.com/sylphxltd/silk/issues)
- **Discussions:** [Ask questions](https://github.com/sylphxltd/silk/discussions)

## License

MIT © SylphX Ltd
