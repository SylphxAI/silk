# @sylphx/silk

Type-safe CSS-in-TypeScript without codegen. **88.5% smaller CSS** than Panda CSS with modern color functions (OKLCH, color-mix) and native CSS nesting.

## Installation

```bash
npm install @sylphx/silk
# or
bun add @sylphx/silk
```

## Quick Start

```typescript
import { defineConfig, createStyleSystem } from '@sylphx/silk'

const config = defineConfig({
  colors: {
    brand: { 500: '#3b82f6' }
  },
  spacing: { 4: '1rem' }
})

const { css } = createStyleSystem(config)

const button = css({
  bg: 'brand.500',      // ✨ Fully typed
  px: 4,
  _hover: { opacity: 0.8 }
})
```

## Features

- ✅ **Zero Codegen** - No build step required (unlike Panda CSS)
- ✅ **88.5% Smaller** - 682B vs 5,936B (Panda CSS)
- ✅ **Full Type Safety** - Only design tokens allowed
- ✅ **Modern CSS** - OKLCH colors, color-mix(), native nesting, @layer
- ✅ **Critical CSS** - Built-in extraction (unique feature)
- ✅ **Performance Monitoring** - Built-in analytics

## Codegen Strategy

Silk follows a **pure build-time** approach:

1. **Development**: Runtime `css()` for hot reload and debugging
2. **Production**: Babel plugin transforms `css()` to static strings at build-time
3. **No Runtime**: Zero JavaScript overhead in production bundles

The default `css()` function throws an error if not transformed by the build plugin, ensuring zero runtime overhead.

## Ecosystem

### Framework Integrations
- **[@sylphx/silk-react](https://www.npmjs.com/package/@sylphx/silk-react)** - React bindings with styled components
- **[@sylphx/silk-vue](https://www.npmjs.com/package/@sylphx/silk-vue)** - Vue 3 Composition API support
- **[@sylphx/silk-svelte](https://www.npmjs.com/package/@sylphx/silk-svelte)** - Svelte reactive stores
- **[@sylphx/silk-solid](https://www.npmjs.com/package/@sylphx/silk-solid)** - Solid.js fine-grained reactivity
- **[@sylphx/silk-qwik](https://www.npmjs.com/package/@sylphx/silk-qwik)** - Qwik resumability & zero hydration
- **[@sylphx/silk-preact](https://www.npmjs.com/package/@sylphx/silk-preact)** - Preact 3KB React alternative

### Meta-Framework Plugins
- **[@sylphx/silk-nextjs](https://www.npmjs.com/package/@sylphx/silk-nextjs)** - Next.js App Router & RSC
- **[@sylphx/silk-remix](https://www.npmjs.com/package/@sylphx/silk-remix)** - Remix streaming SSR
- **[@sylphx/silk-astro](https://www.npmjs.com/package/@sylphx/silk-astro)** - Astro islands architecture

### Build Tools
- **[@sylphx/silk-vite-plugin](https://www.npmjs.com/package/@sylphx/silk-vite-plugin)** - Vite plugin for build-time extraction

### Design System Presets
- **[@sylphx/silk-preset-material](https://www.npmjs.com/package/@sylphx/silk-preset-material)** - Material Design 3 preset (~2KB)
- **[@sylphx/silk-preset-minimal](https://www.npmjs.com/package/@sylphx/silk-preset-minimal)** - Minimal design system (~1KB)

## Documentation

Full documentation: [GitHub Repository](https://github.com/sylphxltd/silk)

## License

MIT © [SylphX Ltd](https://sylphx.com)
