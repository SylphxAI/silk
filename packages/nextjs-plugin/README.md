# @sylphx/silk-nextjs

Next.js integration for Silk - zero-runtime CSS-in-TypeScript with App Router support.

## Turbopack Support

### Development (✅ Fully Supported)

```bash
next dev --turbo
```

### Production (Use Webpack)

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build --webpack"
  }
}
```

**Why?** Turbopack doesn't support webpack plugins yet. Use webpack for production builds.

## Quick Start

```typescript
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({}, {
  outputFile: 'silk.css',
  minify: true,
})

// app/layout.tsx
import '../.next/silk.css'

// app/page.tsx  
import { css } from '@sylphx/silk'

const styles = {
  title: css({ fontSize: '2rem', color: '#333' }),
}
```

## Compatibility

- Next.js: 13.x, 14.x, 15.x, 16.x
- React: 18.x, 19.x
- Webpack ✅ | Turbopack ✅ (dev only)
