# @sylphx/silk-nextjs

Next.js integration for Silk - zero-runtime CSS-in-TypeScript with **App Router** and **React Server Components** support.

## Installation

```bash
npm install @sylphx/silk-nextjs
# or
bun add @sylphx/silk-nextjs
```

## Quick Start

### 1. Configure Next.js

```typescript
// next.config.js (or .mjs)
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Your Next.js config
}, {
  // Silk options (all optional)
  outputFile: 'silk.css',
  inject: true,            // Auto-inject CSS (default)
  babelOptions: {
    production: true,
    classPrefix: 'silk',
  },
  compression: {
    brotli: true,          // Pre-compress CSS (15-25% smaller)
    gzip: true,
  }
})
```

### 2. Use in Components

```typescript
// app/components/Button.tsx
'use client'

import { css } from '@sylphx/silk'

const button = css({
  bg: 'blue',
  color: 'white',
  px: 4,
  py: 2,
  rounded: 8,
  _hover: { opacity: 0.8 }
})

export function Button({ children }) {
  return <button className={button}>{children}</button>
}
```

### 3. Done! CSS is Automatically Injected

That's it! The CSS is automatically generated at build time and injected into your HTML. No manual CSS imports needed.

```typescript
// app/layout.tsx - No CSS import needed!

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

## Features

### ✅ Fully Automatic CSS Injection
- **No manual CSS imports required** - CSS automatically injected into HTML
- Webpack handles everything at build time
- Works like Vanilla Extract - zero configuration
- Clean developer experience

### ✅ Zero-Runtime Compilation
- CSS extracted at build time via Babel plugin
- No runtime CSS-in-JS overhead
- Static atomic class names
- HMR support in development

### ✅ App Router Support
- Full Next.js 13+ App Router compatibility
- Works with Pages Router too
- Server and Client Components supported

### ✅ React Server Components (RSC)
- Zero runtime overhead
- CSS extracted during build
- True zero-bundle for server components

### ✅ Performance
- **-6.5KB JS bundle** (runtime code eliminated)
- **Brotli compression** (389B for 1KB CSS, -61%)
- **Atomic CSS** (one class per property)
- **Fast builds** (Babel transformation)

## App Router Example

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silk + Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```typescript
// app/page.tsx
import { css } from '@sylphx/silk'

const container = css({ px: 4, py: 6 })

export default function Home() {
  return (
    <div className={container}>
      <h1>Welcome to Silk + Next.js!</h1>
    </div>
  )
}
```

## Server Components

```typescript
// app/components/ServerCard.tsx
// No 'use client' - this is a server component!

import { css } from '@sylphx/silk'

const card = css({
  p: 4,
  rounded: 'lg',
  bg: 'white',
  shadow: 'md'
})

export function ServerCard({ title, children }) {
  // Styles are extracted at build time
  // Zero runtime overhead!
  return (
    <div className={card}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

## Configuration Options

```typescript
interface SilkNextConfig {
  // Output CSS file path
  outputFile?: string        // default: 'silk.css'

  // Minify CSS output
  minify?: boolean           // default: true in production

  // Babel plugin options
  babelOptions?: {
    production?: boolean     // default: NODE_ENV === 'production'
    classPrefix?: string     // default: 'silk'
    importSources?: string[] // default: ['@sylphx/silk']
  }

  // Compression options
  compression?: {
    brotli?: boolean         // default: true
    brotliQuality?: number   // default: 11 (0-11)
    gzip?: boolean           // default: true
    gzipLevel?: number       // default: 9 (0-9)
  }

  // Inject CSS link into HTML
  inject?: boolean           // default: true
}
```

## How It Works

### Automatic CSS Injection

Silk uses a sophisticated webpack integration that automatically handles CSS injection:

1. **Build Time CSS Generation**
   - The Babel plugin extracts CSS from your `css()` calls during transformation
   - CSS rules are collected and deduplicated
   - A single `silk.css` file is generated

2. **Automatic Injection**
   - A virtual webpack module is created that imports the generated CSS
   - This module is automatically added to your client bundle entries
   - Webpack's CSS loaders handle extraction and link tag injection
   - No manual imports needed!

3. **Development vs Production**
   - Development: CSS is served via webpack-dev-server with HMR support
   - Production: CSS is extracted to static files with compression

### Manual CSS Import (Optional)

If you prefer manual control or need to disable auto-injection:

```typescript
// next.config.js
export default withSilk({}, {
  inject: false  // Disable auto-injection
})
```

Then manually import in your layout:

```typescript
// app/layout.tsx
import './silk.css'
```

## Troubleshooting

### Turbopack Compatibility

Silk uses webpack-based plugin. If using Next.js 16 with Turbopack:

- Silk automatically disables Turbopack and uses webpack
- For native Turbopack support, use the SWC plugin (coming soon)

```typescript
// next.config.js
// Silk will automatically set turbo: undefined
```

### Build Errors

**"Unexpected token" or SyntaxError**
- Make sure you're using `'use client'` directive for client components
- Ensure Babel is configured correctly (Silk handles this automatically)

**Webpack conflicts**
- If you have custom webpack config, make sure it doesn't conflict with Silk
- The `withSilk()` wrapper should be the outermost wrapper

### CSS Not Updating

If you change styles but don't see updates:

1. **Restart dev server** - Sometimes HMR needs a full restart
2. **Clear .next cache** - `rm -rf .next && npm run dev`
3. **Check browser cache** - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## Ecosystem

- **[@sylphx/silk](https://www.npmjs.com/package/@sylphx/silk)** - Core styling system
- **[@sylphx/silk-react](https://www.npmjs.com/package/@sylphx/silk-react)** - React bindings
- **[@sylphx/silk-vite-plugin](https://www.npmjs.com/package/@sylphx/silk-vite-plugin)** - Vite plugin

## Documentation

Full documentation: [GitHub Repository](https://github.com/sylphxltd/silk)

## License

MIT © [SylphX Ltd](https://sylphx.com)
