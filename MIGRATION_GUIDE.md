# Migration Guide: Silk v1.x → v2.0

This guide will help you migrate from Silk v1.x (runtime CSS) to v2.0 (zero-runtime build-time compilation).

---

## Overview

**v2.0 introduces:** True zero-runtime CSS compilation via Babel plugin + unplugin.

**Benefits:**
- **-6.5KB JS bundle** (runtime code eliminated)
- **389B Brotli CSS** (-61% compression)
- **0ms runtime cost** (no CSS-in-JS overhead)
- **HMR with state preservation**

**Migration Time:** ~15 minutes per project

---

## Step-by-Step Migration

### 1. Install Build Plugin

Choose the plugin for your bundler:

**Vite (Recommended):**
```bash
bun add @sylphx/silk-vite-plugin
```

**Next.js (Webpack):**
```bash
# Automatically included in @sylphx/silk-nextjs v2.0
bun add @sylphx/silk-nextjs@latest
```

**Framework-Specific:**
```bash
# Update to latest version
bun add @sylphx/silk-remix@latest
bun add @sylphx/silk-astro@latest
bun add @sylphx/silk-solid@latest
bun add @sylphx/silk-vue@latest
bun add @sylphx/silk-svelte@latest
bun add @sylphx/silk-qwik@latest
bun add @sylphx/silk-preact@latest
```

---

### 2. Configure Build Tool

#### Vite

**Before (v1.x):**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
```

**After (v2.0):**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import silk from '@sylphx/silk-vite-plugin'  // ← Add this
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    silk(),  // ← Add BEFORE React
    react(),
  ],
})
```

#### Next.js (App Router)

**Before (v1.x):**
```javascript
// next.config.js
export default {
  // Your config
}
```

**After (v2.0):**
```javascript
// next.config.js
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Your Next.js config
}, {
  // Silk options
  outputFile: 'silk.css',
  babelOptions: {
    production: true
  }
})
```

#### Remix

**Before (v1.x):**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { vitePlugin as remix } from '@remix-run/dev'

export default defineConfig({
  plugins: [remix()]
})
```

**After (v2.0):**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { vitePlugin as remix } from '@remix-run/dev'
import { silkPlugin } from '@sylphx/silk-remix/vite'  // ← Add this

export default defineConfig({
  plugins: [
    silkPlugin(),  // ← Add BEFORE Remix
    remix(),
  ],
})
```

#### Astro

**Before (v1.x):**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  // Your config
})
```

**After (v2.0):**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import silk from '@sylphx/silk-astro'  // ← Add this

export default defineConfig({
  integrations: [
    silk({  // ← Add integration
      outputFile: 'silk.css',
      babelOptions: { production: true }
    })
  ]
})
```

#### Other Vite-based Frameworks

For Solid, Vue, Svelte, Qwik, Preact:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { silkPlugin } from '@sylphx/silk-{framework}/vite'
import frameworkPlugin from 'framework-plugin'

export default defineConfig({
  plugins: [
    silkPlugin(),  // ← Add BEFORE framework plugin
    frameworkPlugin(),
  ],
})
```

---

### 3. Update Code

You have **two options**:

#### Option A: Zero-Runtime (Recommended)

**Change:** Use direct `import { css }` instead of `createStyleSystem()`

**Before (v1.x):**
```typescript
// ❌ Runtime CSS generation
import { createStyleSystem } from '@sylphx/silk'

const { css } = createStyleSystem(config)

const button = css({ bg: 'blue', px: 4 })
```

**After (v2.0):**
```typescript
// ✅ Build-time transformation
import { css } from '@sylphx/silk'

const button = css({ bg: 'blue', px: 4 })
// Transformed to: "silk_bg_blue_xxxx silk_px_4_xxxx"
```

#### Option B: Keep Runtime (No Changes)

If you prefer runtime CSS generation, **no code changes needed**:

```typescript
// ✅ Still works in v2.0
import { createStyleSystem } from '@sylphx/silk'

const { css } = createStyleSystem(config)

const button = css({ bg: 'blue', px: 4 })
```

**Note:** Only Option A (direct import) gets zero-runtime benefits.

---

### 4. Import CSS File

Add CSS import to your app entry:

#### Next.js App Router

```typescript
// app/layout.tsx
import './silk.css'  // ← Add this

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

#### Next.js Pages Router

```typescript
// pages/_app.tsx
import '../silk.css'  // ← Add this

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

#### Remix

```typescript
// app/root.tsx
import type { LinksFunction } from '@remix-run/node'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: '/silk.css' }  // ← Add this
]
```

#### Astro

```astro
---
// src/layouts/Layout.astro
---

<html>
  <head>
    <link rel="stylesheet" href="/silk.css" />  <!-- Add this -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

#### Vite (React/Vue/Solid/etc)

```typescript
// main.tsx or main.ts
import './silk.css'  // ← Add this
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

---

### 5. Test Build

```bash
# Development mode
bun run dev

# Production build
bun run build

# Check output
ls -lh dist/silk.css*
# Should see:
# - silk.css       (1KB)
# - silk.css.br    (389B Brotli)
# - silk.css.gz    (472B Gzip)
```

---

## Common Scenarios

### Scenario 1: Basic Vite + React App

**Before (v1.x):**
```typescript
// src/App.tsx
import { createStyleSystem } from '@sylphx/silk'

const { css } = createStyleSystem({
  colors: { brand: { 500: '#3b82f6' } }
})

function App() {
  const button = css({ bg: 'brand.500', px: 4 })
  return <button className={button}>Click</button>
}
```

**After (v2.0):**

Step 1: Install plugin
```bash
bun add @sylphx/silk-vite-plugin
```

Step 2: Update vite.config.ts
```typescript
import { defineConfig } from 'vite'
import silk from '@sylphx/silk-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [silk(), react()]
})
```

Step 3: Update code (optional but recommended)
```typescript
// src/App.tsx
import { css } from '@sylphx/silk'  // ← Direct import

function App() {
  const button = css({ bg: 'brand.500', px: 4 })
  return <button className={button}>Click</button>
}
```

Step 4: Import CSS
```typescript
// src/main.tsx
import './silk.css'  // ← Add this
```

---

### Scenario 2: Next.js App Router

**Before (v1.x):**
```typescript
// app/page.tsx
'use client'
import { createStyleSystem } from '@sylphx/silk'

const { css } = createStyleSystem(config)

export default function Home() {
  const container = css({ p: 8 })
  return <div className={container}>Hello</div>
}
```

**After (v2.0):**

Step 1: Update next.config.js
```javascript
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({}, {
  outputFile: 'silk.css',
  babelOptions: { production: true }
})
```

Step 2: Update code
```typescript
// app/page.tsx
'use client'
import { css } from '@sylphx/silk'  // ← Direct import

export default function Home() {
  const container = css({ p: 8 })
  return <div className={container}>Hello</div>
}
```

Step 3: Import CSS
```typescript
// app/layout.tsx
import './silk.css'  // ← Add this
```

---

### Scenario 3: Using with Styled Components API

**No changes needed!** The `styled()` API works with zero-runtime automatically:

```typescript
// Works in both v1.x and v2.0
import { createSilkReact } from '@sylphx/silk-react'

const { styled } = createSilkReact(config)

const Button = styled('button', {
  bg: 'brand.500',
  px: 4,
  py: 2
})
```

Just ensure you have the build plugin configured!

---

## Troubleshooting

### Issue: `css() must be transformed at build-time`

**Error:**
```
Error: @sylphx/silk: css() should be transformed at build-time
```

**Cause:** Build plugin not configured or not working.

**Fix:**
1. Verify plugin is installed: `bun add @sylphx/silk-vite-plugin`
2. Check vite.config.ts has `silk()` plugin
3. Ensure `silk()` is placed **before** framework plugin
4. Restart dev server: `bun run dev`

---

### Issue: CSS file not generated

**Symptoms:** No `silk.css` in build output

**Fix:**
1. Check build plugin configuration
2. Verify `outputFile` option is correct
3. Check console for Babel compilation messages:
   ```
   [Silk] Compiled 25 CSS rules from App.tsx
   ```
4. Run: `bun run build` and check `dist/` folder

---

### Issue: HMR not working

**Symptoms:** Page reloads on style changes

**Fix:**
1. Ensure `silk()` plugin has `enforce: 'pre'` (automatic in v2.0)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart dev server

---

### Issue: TypeScript errors

**Symptoms:** Type errors after upgrading

**Fix:**
1. Update all Silk packages to v2.0:
   ```bash
   bun update @sylphx/silk @sylphx/silk-react
   ```
2. Rebuild TypeScript: `bun run build`
3. Restart TypeScript server in IDE

---

## Verification Checklist

After migration, verify:

### Development Mode
- [ ] Dev server starts without errors
- [ ] Styles apply correctly in browser
- [ ] HMR works without page reload
- [ ] Component state preserved on HMR
- [ ] TypeScript autocomplete works
- [ ] Console shows: `[Silk] Compiled X CSS rules`

### Production Build
- [ ] Build completes without errors
- [ ] `silk.css` file exists in output
- [ ] `silk.css.br` and `silk.css.gz` exist (if compression enabled)
- [ ] JS bundle is smaller (-6.5KB expected)
- [ ] Styles work in production build
- [ ] No runtime errors in browser console

### Browser DevTools
- [ ] Inspect element shows atomic class names: `silk_bg_blue_xxxx`
- [ ] CSS file loads correctly (Network tab)
- [ ] No inline styles from Silk (all external CSS)

---

## Rollback (If Needed)

If you encounter issues, you can rollback:

```bash
# Downgrade to v1.x
bun add @sylphx/silk@1.2.0
bun add @sylphx/silk-react@1.0.3

# Remove build plugin
bun remove @sylphx/silk-vite-plugin

# Revert config changes
git checkout vite.config.ts
```

---

## Getting Help

If you're stuck:

1. **Check documentation:** [README.md](./README.md)
2. **Search issues:** [GitHub Issues](https://github.com/sylphxltd/silk/issues)
3. **Ask questions:** [GitHub Discussions](https://github.com/sylphxltd/silk/discussions)
4. **Report bugs:** [New Issue](https://github.com/sylphxltd/silk/issues/new)

---

## Performance Comparison

### Before (v1.x)
```
JS Bundle: 152.45 KB
CSS: Inline or runtime-generated
Runtime Cost: 2-3ms per css() call
```

### After (v2.0)
```
JS Bundle: 145.98 KB (-6.5KB, -4.3%)
CSS: 1.00 KB (separate file)
CSS (Brotli): 389B (-61%)
CSS (Gzip): 472B (-53%)
Runtime Cost: 0ms (zero overhead!)
```

**Result: Faster load, smaller bundle, zero runtime cost.**

---

<div align="center">

**Questions? Issues? We're here to help!**

[GitHub Issues](https://github.com/sylphxltd/silk/issues) • [Discussions](https://github.com/sylphxltd/silk/discussions)

</div>
