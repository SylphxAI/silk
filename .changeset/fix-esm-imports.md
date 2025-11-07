---
"@sylphx/silk": patch
---

Fix Node.js ESM module resolution - add .js extensions to all relative imports

This fixes the "Cannot find module" error when using @sylphx/silk in Node.js ESM environments. All relative imports now include explicit .js file extensions as required by Node.js ESM specification.

Changes:
- Updated tsconfig.json: moduleResolution from "bundler" to "node16"
- Added .js extensions to all relative imports in source files
- Compiled output now includes .js extensions in import/export statements

This ensures the package works correctly in all Node.js ESM environments, including Next.js, Remix, and other SSR frameworks.
