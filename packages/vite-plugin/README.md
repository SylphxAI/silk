# @sylphx/silk-vite-plugin

Vite plugin for Silk - enables build-time CSS extraction and optimization.

## Installation

```bash
npm install @sylphx/silk @sylphx/silk-vite-plugin
# or
bun add @sylphx/silk @sylphx/silk-vite-plugin
```

## Quick Start

**vite.config.ts:**

```typescript
import { defineConfig } from 'vite'
import { silk } from '@sylphx/silk-vite-plugin'

export default defineConfig({
  plugins: [
    silk({
      outputFile: 'silk.css',  // Output CSS file
      inject: true,            // Auto-inject CSS
      minify: true,            // Minify CSS in production
      watch: true              // Watch for changes
    })
  ]
})
```

**Import CSS in your app:**

```typescript
import './silk.css'
```

## Features

- ✅ **Build-time Extraction** - Zero runtime CSS-in-JS overhead
- ✅ **Auto Injection** - Automatically inject CSS into HTML
- ✅ **Production Optimization** - Minification and deduplication
- ✅ **Hot Module Replacement** - Watch mode for development
- ✅ **TypeScript Support** - Full type safety

## Options

```typescript
interface SilkPluginOptions {
  outputFile?: string    // Output CSS file (default: 'silk.css')
  inject?: boolean       // Auto-inject CSS (default: true)
  minify?: boolean       // Minify CSS (default: based on mode)
  watch?: boolean        // Watch for changes (default: true)
}
```

## Ecosystem

### Core
- **[@sylphx/silk](https://www.npmjs.com/package/@sylphx/silk)** - Core styling system

### Framework Integrations
- **[@sylphx/silk-react](https://www.npmjs.com/package/@sylphx/silk-react)** - React bindings
- **[@sylphx/silk-vue](https://www.npmjs.com/package/@sylphx/silk-vue)** - Vue 3 Composition API
- **[@sylphx/silk-svelte](https://www.npmjs.com/package/@sylphx/silk-svelte)** - Svelte reactive stores
- **[@sylphx/silk-solid](https://www.npmjs.com/package/@sylphx/silk-solid)** - Solid.js fine-grained reactivity

### Meta-Framework Plugins
- **[@sylphx/silk-nextjs](https://www.npmjs.com/package/@sylphx/silk-nextjs)** - Next.js App Router & RSC
- **[@sylphx/silk-remix](https://www.npmjs.com/package/@sylphx/silk-remix)** - Remix streaming SSR
- **[@sylphx/silk-astro](https://www.npmjs.com/package/@sylphx/silk-astro)** - Astro islands architecture

## Documentation

Full documentation: [GitHub Repository](https://github.com/sylphxltd/silk)

## License

MIT © [SylphX Ltd](https://sylphx.com)
