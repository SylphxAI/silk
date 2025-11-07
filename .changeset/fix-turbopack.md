---
"@sylphx/silk-nextjs": patch
---

Disable Turbopack automatically (Next.js 16+ compatibility)

Next.js 16 uses Turbopack by default, but unplugin doesn't support Turbopack yet.
This update automatically disables Turbopack and falls back to webpack when using Silk.

Changes:
- Automatically set `turbo: undefined` in Next.js config
- Show warning when Turbopack is detected
- Ensures Silk works correctly in Next.js 16+

Reference: https://github.com/unjs/unplugin/issues/302
