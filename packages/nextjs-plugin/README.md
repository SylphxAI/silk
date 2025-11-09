# @sylphx/silk-nextjs

Next.js integration for Silk - zero-runtime CSS-in-TypeScript with App Router support.

## Installation

```bash
npm install @sylphx/silk @sylphx/silk-nextjs @sylphx/babel-plugin-silk
```

## Quick Start

### 1. Configure Next.js

```javascript
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({
  // Your Next.js config
});
```

### 2. Add Babel Configuration

Create a `.babelrc` file in your project root:

```json
{
  "presets": ["next/babel"],
  "plugins": ["@sylphx/babel-plugin-silk"]
}
```

**That's it!** Works with both Webpack and Turbopack (Next.js 16+).

### 3. Use Silk in your components

```typescript
// app/page.tsx
import { css } from '@sylphx/silk';

const styles = {
  container: css({
    display: 'flex',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }),
  title: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white'
  })
};

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello Silk!</h1>
    </div>
  );
}
```

## Configuration

### Root-level `app/` Directory

If your project uses a root-level `app/` directory (not `src/app/`), configure `srcDir`:

```javascript
// next.config.mjs
export default withSilk({}, {
  srcDir: './app',  // Scan root-level app/ directory
  debug: true       // Optional: enable debug logging
});
```

### Custom Source Directory

```javascript
export default withSilk({}, {
  srcDir: './src',           // Default: './src'
  virtualModuleId: 'silk.css', // Default: 'silk.css'
  minify: true,               // Minify CSS (default: production only)
  debug: false                // Debug logging
});
```

## Supported Directory Structures

✅ **Root-level `app/` directory:**
```
my-app/
├── app/
│   ├── layout.tsx
│   └── page.tsx
└── next.config.mjs  ← srcDir: './app'
```

✅ **`src/app/` directory (default):**
```
my-app/
├── src/
│   └── app/
│       ├── layout.tsx
│       └── page.tsx
└── next.config.mjs  ← srcDir: './src' (or omit)
```

## Turbopack Support (Next.js 16+)

Silk v3.3.1+ works seamlessly with Turbopack! No additional setup needed beyond the `.babelrc` file.

```bash
next dev --turbo    # Turbopack mode (10x faster)
next build --turbo  # Production build with Turbopack
```

**How it works:**
- Next.js 16 automatically uses Babel when `.babelrc` exists
- `@sylphx/babel-plugin-silk` transforms `css()` calls at build time
- No CLI or `silk generate` needed
- Zero runtime overhead, same as Webpack mode

**v3.3.0 → v3.3.1 Migration:**
If you're upgrading from v3.3.0, you can now remove:
- ❌ `@sylphx/silk-cli` dependency
- ❌ `predev`/`prebuild` scripts running `silk generate`
- ❌ `silk.generated.css` import
- ✅ Just keep `.babelrc` + `@sylphx/babel-plugin-silk`

## Compatibility

- **Next.js:** 13.x, 14.x, 15.x, 16.x
- **React:** 18.x, 19.x
- **Build Tools:**
  - Turbopack: ✅ **Recommended** (10x faster)
  - Webpack: ✅ Supported (zero-codegen)
