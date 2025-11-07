# @sylphx/silk-react

React bindings for Silk - type-safe styled components without codegen.

## Installation

```bash
npm install @sylphx/silk @sylphx/silk-react
# or
bun add @sylphx/silk @sylphx/silk-react
```

## Quick Start

```tsx
import { defineConfig } from '@sylphx/silk'
import { createSilkReact } from '@sylphx/silk-react'

const config = defineConfig({
  colors: { brand: { 500: '#3b82f6' } },
  spacing: { 4: '1rem', 6: '1.5rem' }
})

const { styled, Box } = createSilkReact(config)

// Styled components with full type safety
const Button = styled('button', {
  bg: 'brand.500',
  px: 6,
  py: 4,
  _hover: { opacity: 0.8 }
})

// Or use Box with inline styles
function App() {
  return (
    <Box px={4} py={6}>
      <Button>Click me</Button>
    </Box>
  )
}
```

## Features

- ✅ **Styled Components** - `styled()` API like styled-components
- ✅ **Box Component** - Flexible primitive with style props
- ✅ **Full Type Safety** - Only design tokens allowed
- ✅ **Zero Runtime** - Build-time CSS extraction
- ✅ **React 18+** - Modern React support

## Ecosystem

### Core
- **[@sylphx/silk](https://www.npmjs.com/package/@sylphx/silk)** - Core styling system

### Framework Integrations
- **[@sylphx/silk-vue](https://www.npmjs.com/package/@sylphx/silk-vue)** - Vue 3 Composition API
- **[@sylphx/silk-svelte](https://www.npmjs.com/package/@sylphx/silk-svelte)** - Svelte reactive stores
- **[@sylphx/silk-solid](https://www.npmjs.com/package/@sylphx/silk-solid)** - Solid.js fine-grained reactivity

### Meta-Framework Plugins
- **[@sylphx/silk-nextjs](https://www.npmjs.com/package/@sylphx/silk-nextjs)** - Next.js App Router & RSC
- **[@sylphx/silk-remix](https://www.npmjs.com/package/@sylphx/silk-remix)** - Remix streaming SSR
- **[@sylphx/silk-astro](https://www.npmjs.com/package/@sylphx/silk-astro)** - Astro islands architecture

### Build Tools
- **[@sylphx/silk-vite-plugin](https://www.npmjs.com/package/@sylphx/silk-vite-plugin)** - Vite plugin for build-time extraction

## Documentation

Full documentation: [GitHub Repository](https://github.com/sylphxltd/silk)

## License

MIT © [SylphX Ltd](https://sylphx.com)
