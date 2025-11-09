# Next.js Integration

Complete guide to using Silk with Next.js 13+ (App Router and Pages Router).

## Installation

```bash
bun add @sylphx/silk @sylphx/silk-nextjs @sylphx/babel-plugin-silk
```

## Setup

### 1. Next.js Configuration

```ts
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Your Next.js config
  reactStrictMode: true,
}, {
  // Silk config (optional)
  srcDir: './app',     // or './src' if using src folder
  debug: false         // Enable for debugging
})
```

### 2. Babel Configuration (Required)

Create a `.babelrc` file in your project root:

```json
// .babelrc
{
  "presets": ["next/babel"],
  "plugins": ["@sylphx/babel-plugin-silk"]
}
```

That's it! Silk works with both Webpack and Turbopack with the same setup.

::: tip Turbopack Support (Next.js 16+)
Silk v3.3.1+ works seamlessly with Turbopack! Just add the `.babelrc` file above.

**Key differences from v3.3.0:**
- ❌ No `silk generate` or CLI needed
- ❌ No `silk.generated.css` import needed
- ✅ Just `.babelrc` + babel-plugin-silk
- ✅ Next.js 16 automatically uses Babel when `.babelrc` exists
- ✅ Works exactly like Webpack mode

Both Webpack and Turbopack provide zero runtime overhead with the same developer experience.
:::

## App Router (Recommended)

### Basic Usage

```tsx
// app/page.tsx
import { css } from '@sylphx/silk'

const container = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem'
})

const title = css({
  fontSize: '3rem',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
})

export default function Page() {
  return (
    <div className={container}>
      <h1 className={title}>Hello Silk!</h1>
    </div>
  )
}
```

### Server Components

Silk works perfectly with **Server Components**:

```tsx
// app/products/page.tsx (Server Component)
import { css } from '@sylphx/silk'

const grid = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)'
  },
  gap: '2rem'
})

// This runs on the SERVER only
async function getProducts() {
  const res = await fetch('https://api.example.com/products')
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className={grid}>
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
```

### Client Components

Use `'use client'` directive for interactive components:

```tsx
// app/components/Counter.tsx
'use client'

import { useState } from 'react'
import { css } from '@sylphx/silk'

const button = css({
  padding: '12px 24px',
  background: '#667eea',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',

  _hover: {
    background: '#764ba2'
  }
})

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button
      className={button}
      onClick={() => setCount(count + 1)}
    >
      Count: {count}
    </button>
  )
}
```

### Layout Styles

```tsx
// app/layout.tsx
import { css } from '@sylphx/silk'

const body = css({
  margin: 0,
  padding: 0,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: '#0a0a0a',
  color: '#ffffff'
})

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={body}>{children}</body>
    </html>
  )
}
```

## Pages Router

Silk also works with the Pages Router:

```tsx
// pages/index.tsx
import { css } from '@sylphx/silk'

const container = css({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center'
})

export default function Home() {
  return (
    <div className={container}>
      <h1>Hello from Pages Router!</h1>
    </div>
  )
}
```

## Configuration Options

```ts
// next.config.mjs
export default withSilk(nextConfig, {
  // Source directory to scan for css() calls
  srcDir: './app',           // Default: './src'

  // Enable debug logging
  debug: true,               // Default: false

  // Virtual module ID (advanced)
  virtualModuleId: 'silk.css' // Default: 'silk.css'
})
```

## Common Patterns

### Shared Styles

Create a `styles/` folder for shared styles:

```ts
// app/styles/buttons.ts
import { css } from '@sylphx/silk'

export const baseButton = css({
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s'
})

export const primaryButton = css({
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',

  _hover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
  }
})

export const secondaryButton = css({
  background: 'transparent',
  border: '2px solid #667eea',
  color: '#667eea',

  _hover: {
    background: '#667eea',
    color: 'white'
  }
})
```

Usage:

```tsx
import { baseButton, primaryButton } from '@/styles/buttons'

<button className={`${baseButton} ${primaryButton}`}>
  Primary
</button>
```

### Dark Mode

```tsx
'use client'

import { css } from '@sylphx/silk'

const container = css({
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  padding: '2rem'
})

// In your CSS variables
// :root {
//   --bg-primary: #ffffff;
//   --text-primary: #000000;
// }
// [data-theme="dark"] {
//   --bg-primary: #0a0a0a;
//   --text-primary: #ffffff;
// }
```

### Responsive Grid

```tsx
const grid = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(6, 1fr)'
  },
  gap: {
    base: '1rem',
    md: '2rem'
  }
})
```

## Troubleshooting

### "css() should be transformed at build-time"

This error means the transformation isn't happening. Check:

1. ✅ `@sylphx/babel-plugin-silk` is installed
2. ✅ `.babelrc` file exists in project root with babel-plugin-silk configured
3. ✅ `withSilk()` is wrapping your Next.js config
4. ✅ Restart dev server after config changes

### Styles not updating in dev

1. Delete `.next` folder: `rm -rf .next`
2. Restart dev server

### TypeScript errors

Make sure you have the correct types installed:

```bash
bun add -D @types/react @types/node
```

## Performance

Silk adds **zero runtime overhead**:

| Metric | Traditional CSS-in-JS | Silk |
|--------|----------------------|------|
| Runtime JS | ~15-30KB | **0KB** ✅ |
| Style injection | Runtime (slow) | **None** ✅ |
| CSS size | 100% | **45-65%** ✅ |
| Hydration | Required | **Not needed** ✅ |

## Best Practices

### ✅ Do

- Use Server Components when possible (better performance)
- Extract shared styles to separate files
- Use responsive objects for breakpoints
- Leverage TypeScript for type-safe styles

### ❌ Don't

- Don't use inline `css()` calls in loops (extract to const)
- Don't create styles inside render (they won't be extracted)
- Don't mix Silk with other CSS-in-JS libraries

## Next Steps

- [Responsive Design](/guide/responsive)
- [Theming](/guide/theming)
- [Configuration Reference](/api/configuration)
- [Troubleshooting](/guide/troubleshooting)
