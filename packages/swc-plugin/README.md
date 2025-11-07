# @sylphx/swc-plugin-silk

SWC plugin for Silk - zero-runtime CSS-in-TypeScript compilation.

## Why SWC Plugin?

- ✅ **Native Turbopack support** - Works with Next.js 16+ out of the box
- ✅ **20-70x faster** than Babel plugin
- ✅ **Perfect Next.js integration** - No webpack mode needed
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

✅ **Phase 1 Complete: AST Transformation**

The SWC plugin successfully transforms `css()` calls to class name strings:

```typescript
// Input
const button = css({ bg: 'red', p: 4 })

// Output (after SWC transformation)
const button = 'silk_bg_red_a7f3 silk_p_4_b2e1'
```

🚧 **Phase 2 In Progress: CSS Collection**

CSS rule extraction is currently handled by `@sylphx/unplugin-silk`. For full functionality, use both plugins together:

```javascript
// next.config.js
const { silk } = require('@sylphx/nextjs-plugin')

module.exports = silk({
  experimental: {
    swcPlugins: [
      ['@sylphx/swc-plugin-silk', { production: true }]
    ]
  }
})
```

This hybrid approach ensures:
- ✅ Fast transformation via SWC (20-70x faster than Babel)
- ✅ CSS collection via unplugin (until native SWC solution available)
- ✅ Full Turbopack compatibility in Next.js 16+

Follow our progress:
- [GitHub Issues](https://github.com/sylphxltd/silk/issues)
- [Roadmap](https://github.com/sylphxltd/silk/blob/main/ROADMAP.md)

## License

MIT © SylphX Ltd
