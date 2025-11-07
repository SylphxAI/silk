# @sylphx/babel-plugin-silk

**Zero-runtime Babel plugin for Silk CSS-in-TypeScript**

Compiles `css()` calls to static class names at build-time, achieving true zero-runtime overhead.

## Features

- ✅ **True Zero Runtime** for static styles
- ✅ **Atomic CSS** generation (one class per property)
- ✅ **Partial Compilation** for mixed static/dynamic styles
- ✅ **Production Optimization** with short class names
- ✅ **Framework Agnostic** works with any bundler

## Installation

```bash
npm install --save-dev @sylphx/babel-plugin-silk
# or
bun add --dev @sylphx/babel-plugin-silk
```

## Usage

### Babel Configuration

```json
{
  "plugins": ["@sylphx/babel-plugin-silk"]
}
```

### With Options

```json
{
  "plugins": [
    [
      "@sylphx/babel-plugin-silk",
      {
        "production": true,
        "classPrefix": "",
        "importSources": ["@sylphx/silk"]
      }
    ]
  ]
}
```

## How It Works

### Static Styles (Full Compilation)

```typescript
// Input
import { css } from '@sylphx/silk'
const button = css({ bg: 'red', p: 4 })

// Output (Development)
const button = 'silk_bg_red_a7f3 silk_p_4_b2e1'

// Output (Production)
const button = 'a7f3b2c1'

// Generated CSS
.silk_bg_red_a7f3 { background-color: red; }
.silk_p_4_b2e1 { padding: 1rem; }
```

### Dynamic Styles (Partial Compilation)

```typescript
// Input
const button = css({ bg: props.color, p: 4 })

// Output
const button = css({ bg: props.color }, 'silk_p_4_b2e1')

// Generated CSS
.silk_p_4_b2e1 { padding: 1rem; }
```

Static properties are extracted at build-time, dynamic properties remain at runtime.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `production` | `boolean` | `false` | Enable production optimizations |
| `classPrefix` | `string` | `'silk'` (dev), `''` (prod) | Class name prefix |
| `importSources` | `string[]` | `['@sylphx/silk']` | Import sources to transform |
| `functions` | `string[]` | `['css']` | Function names to transform |

## Integration with Bundlers

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { transformSync } from '@babel/core'
import babelPluginSilk from '@sylphx/babel-plugin-silk'

export default defineConfig({
  plugins: [
    {
      name: 'vite-plugin-silk',
      transform(code, id) {
        if (!id.endsWith('.tsx') && !id.endsWith('.ts')) return null

        const result = transformSync(code, {
          filename: id,
          plugins: [babelPluginSilk],
        })

        // Extract CSS from metadata
        const css = result?.metadata?.silk?.cssRules
          .map(([_, rule]) => rule)
          .join('\n')

        return {
          code: result?.code,
          map: result?.map,
        }
      },
    },
  ],
})
```

### Next.js

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcPlugins: [
      ['@sylphx/babel-plugin-silk', { production: true }]
    ]
  }
}
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@sylphx/babel-plugin-silk']
          }
        }
      }
    ]
  }
}
```

## API

### Metadata Format

The plugin emits metadata via `result.metadata.silk`:

```typescript
interface SilkMetadata {
  cssRules: Array<[className: string, cssRule: string]>
  classNames: string[]
  version: string
}
```

### Example

```typescript
const result = transformSync(code, {
  plugins: [babelPluginSilk]
})

// Access generated CSS
const css = result.metadata.silk.cssRules
  .map(([_, rule]) => rule)
  .join('\n')

// Write to file
fs.writeFileSync('output.css', css)
```

## Supported Features

- ✅ Static property values
- ✅ Spread operators (static objects)
- ✅ Property shorthands (`bg`, `p`, `m`, etc.)
- ✅ Spacing units (Tailwind-style: `p: 4` → `1rem`)
- ✅ Pseudo-selectors (`_hover`, `_focus`)
- ✅ Responsive values (`{ base: '100%', md: '50%' }`)
- ⏳ Container queries (coming soon)
- ⏳ Variants and recipes (coming soon)

## Limitations

- Only transforms `css()` calls from configured import sources
- Renamed imports not supported (must import as `css`)
- Dynamic spreads not supported
- Imported style objects require inline definition

## Development

```bash
# Build
bun run build

# Test
bun test

# Watch mode
bun run dev
```

## License

MIT © SylphX Ltd
