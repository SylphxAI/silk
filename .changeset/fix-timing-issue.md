---
"@sylphx/silk-nextjs": patch
---

Fix webpack virtual module timing issue

- Create virtual modules with initial content at plugin initialization
- Update content in processAssets stage (not create)
- Ensures modules exist before webpack starts resolving
- Fixes "Module not found: Error: Can't resolve '__silk_auto_inject__'"
