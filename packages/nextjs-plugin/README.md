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

**That's it!** Silk supports both Webpack and Turbopack modes:

- **Webpack Mode** (Recommended): Zero codegen - automatic CSS extraction via virtual module
- **Turbopack Mode**: CLI codegen required - generate CSS files manually

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

Silk supports both Webpack and Turbopack modes, but they work differently:

### Webpack Mode (Recommended - Zero Codegen)

```bash
next dev     # Webpack mode (automatic CSS extraction)
next build   # Production build
```

**Features:**
- ✅ Zero codegen required
- ✅ Automatic CSS extraction via SilkWebpackPlugin
- ✅ Virtual CSS module (`silk.css`)
- ✅ Zero runtime overhead

### Turbopack Mode (Requires CLI)

```bash
# Install CLI tool
npm install @sylphx/silk-cli

# Add package.json scripts
{
  "predev": "silk generate --src ./app --output ./silk.generated.css",
  "prebuild": "silk generate --src ./app --output ./silk.generated.css",
  "dev": "next dev --turbo",
  "build": "next build"
}

# Import generated CSS
// app/layout.tsx
import '../silk.generated.css'
```

**Features:**
- ✅ 10x faster builds
- ✅ Babel plugin transforms `css()` calls
- ❌ Requires CLI codegen
- ❌ Physical CSS files

### Turbopack vs Webpack

| Feature | Webpack | Turbopack |
|---------|---------|-----------|
| **Build Speed** | Standard | 10x faster |
| **Codegen** | ❌ None | ✅ Required |
| **CSS Output** | Virtual module | Physical file |
| **Setup** | Simple | CLI + Scripts |

**Recommendation**: Use Webpack for zero-codegen development. Use Turbopack if you need faster builds and don't mind the CLI step.

## Compatibility

- **Next.js:** 13.x, 14.x, 15.x, 16.x
- **React:** 18.x, 19.x
- **Build Tools:**
  - Turbopack: ✅ **Recommended** (10x faster)
  - Webpack: ✅ Supported (zero-codegen)
