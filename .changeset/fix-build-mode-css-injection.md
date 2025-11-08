---
"@sylphx/silk-nextjs": patch
---

Fix automatic CSS injection in production build mode

- Replaced virtual modules with real file injection to fix build-time resolution issues
- CSS now correctly injected in both dev and build modes
- Removed webpack-virtual-modules dependency
- Uses .next/silk-auto/ directory for generated inject files
- Tested and verified working with Next.js 16 webpack builds
