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
  outputFile: 'silk.css',      // Output to .next/silk.css
  babelOptions: {
    production: true,
    classPrefix: 'silk',
  },
  compression: {
    brotli: true,              // Pre-compress CSS (15-25% smaller)
    gzip: true,
  }
})
```

### 2. Add CSS Link to Layout

**Option A: Content-Hashed (Recommended for Production)**
```typescript
// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Silk + Next.js',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Silk generates CSS with content hash for cache busting
          Format: silk.{hash}.css (e.g., silk.ca8116ad.css)

          Note: You need to update the hash when CSS changes.
          For automatic hash injection, see Option B below.
        */}
        <link rel="stylesheet" href="/_next/static/css/silk.ca8116ad.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Option B: No Hash (Backwards Compatible)**
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Legacy silk.css without content hash
          ⚠️ May cause cache issues when CSS changes
        */}
        <link rel="stylesheet" href="/_next/static/css/silk.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Use in Components

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

### 4. Done!

That's it! The CSS is automatically generated at build time, and Next.js optimizes it through its CSS pipeline (merging, tree-shaking, minification).

## 🚀 Turbopack Support (Next.js 15/16)

For **20-70x faster builds** with Next.js 15/16 Turbopack, use the SWC plugin instead:

```bash
bun add @sylphx/swc-plugin-silk
```

```javascript
// next.config.js
export default {
  experimental: {
    turbo: {
      rules: {
        '*.{ts,tsx,js,jsx}': {
          loaders: ['@sylphx/swc-plugin-silk'],
          options: {
            production: process.env.NODE_ENV === 'production',
            classPrefix: ''  // or 'silk-' for dev mode
          }
        }
      }
    }
  }
}
```

**Benefits:**
- ✅ Native Rust performance (20-70x faster than Babel)
- ✅ 100% hash consistency (identical class names)
- ✅ Full Turbopack compatibility
- ✅ Production-ready (144 tests passing)

**When to use:**
- **Webpack builds** (default Next.js): Use `@sylphx/silk-nextjs` (this package)
- **Turbopack builds** (Next.js 15/16 with `--turbo`): Use `@sylphx/swc-plugin-silk`

[View SWC Plugin Documentation →](../swc-plugin/README.md)

## Features

### ✅ Zero-Runtime Compilation
- CSS extracted at build time via Babel/SWC plugin
- No runtime CSS-in-JS overhead
- Static atomic class names
- HMR support in development

### ✅ Next.js CSS Pipeline Integration
- **Fully integrated** with Next.js CSS optimization
- CSS merging, tree-shaking, and minification
- No Flash of Unstyled Content (FOUC)
- Optimal First Contentful Paint (FCP)

### ✅ App Router & RSC Support
- Full Next.js 13+ App Router compatibility
- Works with Pages Router too
- Server and Client Components supported
- True zero-bundle for server components

### ✅ Performance
- **-6.5KB JS bundle** (runtime code eliminated)
- **Brotli compression** (389B for 1KB CSS, -61%)
- **Atomic CSS** (one class per property)
- **Fast builds** (Babel/SWC transformation)

## Complete Example

```typescript
// next.config.js
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Your Next.js config
})
```

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import '../.next/silk.css'  // Import Silk CSS

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

const container = css({ px: 4, py: 6, maxW: '800px', mx: 'auto' })
const title = css({ fontSize: '2xl', fontWeight: 'bold', mb: 4 })

export default function Home() {
  return (
    <div className={container}>
      <h1 className={title}>Welcome to Silk + Next.js!</h1>
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
  // Output CSS file path (relative to .next/)
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

  // ⚠️ DEPRECATED: Auto-inject bypasses Next.js CSS optimization
  inject?: boolean           // default: false (use manual import)
}
```

### Custom Output Path

```typescript
// next.config.js
export default withSilk({}, {
  outputFile: 'styles/silk.css'  // Output to .next/styles/silk.css
})
```

```typescript
// app/layout.tsx
import '../.next/styles/silk.css'  // Import from custom path
```

## How It Works

### Build-Time CSS Extraction

Silk uses a zero-runtime approach with Next.js integration:

1. **Component Transformation**
   - Babel/SWC plugin extracts CSS from your `css()` calls during compilation
   - Styles are transformed to static class names at build time
   - No runtime CSS-in-JS overhead

2. **CSS Generation**
   - CSS rules are collected and deduplicated
   - Output written to `.next/silk.css` (or custom path)
   - Atomic CSS classes (one class per property)

3. **Next.js Integration**
   - You import the generated CSS in `app/layout.tsx`
   - Next.js CSS pipeline handles optimization (merging, minification, tree-shaking)
   - CSS bundled with optimal cache headers

4. **Development vs Production**
   - **Development**: HMR support with instant style updates
   - **Production**: Minified, compressed, cache-optimized CSS

### How CSS Generation Works

1. **During compilation**: Babel/SWC plugin extracts CSS from your `css()` calls
2. **Content hash generation**: MD5 hash computed from CSS content (e.g., `ca8116ad`)
3. **Webpack emit hook**: CSS is directly emitted with multiple filenames:
   - `static/css/silk.{hash}.css` - Content-hashed for cache busting
   - `static/css/silk.css` - Legacy filename for backwards compatibility
   - `.next/silk.css` - Local reference file
4. **Auto-regeneration**:
   - ✅ **Dev mode**: HMR automatically updates CSS when styles change
   - ✅ **Build mode**: Fresh CSS + new hash generated on every build
   - ✅ **No manual codegen needed**
   - ✅ **Automatic cache invalidation** via content hash

### Technical Solution

The plugin uses webpack's `compilation.assets` API to directly emit CSS with content hashing:

```typescript
// Generate content hash for cache busting
const hash = createHash('md5').update(css).digest('hex').slice(0, 8)

// Emit during webpack compilation with multiple filenames
compilation.assets[`static/css/silk.${hash}.css`] = {
  source: () => css,
  size: () => css.length,
}

compilation.assets['static/css/silk.css'] = {
  source: () => css,
  size: () => css.length,
}
```

This solves two critical problems:
1. **Timing issue** - Direct asset emission bypasses `.next/` directory restrictions
2. **Cache busting** - Content hash ensures browsers fetch updated CSS

### Why This Works

✅ **Direct asset emission** - CSS is injected into webpack's asset pipeline
✅ **Correct path** - `static/css/` is Next.js's standard CSS output location
✅ **No file system dependency** - Everything happens in webpack's in-memory assets
✅ **Full Next.js integration** - CSS is served with proper cache headers
✅ **CDN compatible** - Works with `assetPrefix` and edge deployment

## Troubleshooting

### CSS File Not Found

If you get "Module not found: Can't resolve '../.next/silk.css'":

1. **Run build first** - CSS is generated during build/dev
   ```bash
   npm run dev  # or npm run build
   ```

2. **Check output path** - Make sure import path matches `outputFile` config
   ```typescript
   // If outputFile: 'styles/silk.css'
   import '../.next/styles/silk.css'  // Match the path
   ```

3. **Development mode** - CSS file is created on first build
   - First run may show warning
   - HMR will pick it up automatically

### Turbopack Compatibility

Silk supports both webpack and Turbopack (Next.js 16):

- **Webpack mode**: Uses Babel plugin (default, most stable)
- **Turbopack mode**: Uses SWC plugin (experimental)

```typescript
// next.config.js - Force webpack mode
export default withSilk({
  turbo: undefined  // Disable Turbopack
})
```

### CSS Not Updating

If you change styles but don't see updates:

1. **Restart dev server** - Sometimes HMR needs a full restart
2. **Clear .next cache** - `rm -rf .next && npm run dev`
3. **Check browser cache** - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### TypeScript Errors

If you get "Cannot find module '../.next/silk.css'":

```typescript
// silk.d.ts (create in project root)
declare module '../.next/silk.css'
declare module '../.next/*.css'
```

## Ecosystem

- **[@sylphx/silk](https://www.npmjs.com/package/@sylphx/silk)** - Core styling system
- **[@sylphx/silk-react](https://www.npmjs.com/package/@sylphx/silk-react)** - React bindings
- **[@sylphx/silk-vite-plugin](https://www.npmjs.com/package/@sylphx/silk-vite-plugin)** - Vite plugin

## Documentation

Full documentation: [GitHub Repository](https://github.com/sylphxltd/silk)

## License

MIT © [SylphX Ltd](https://sylphx.com)
