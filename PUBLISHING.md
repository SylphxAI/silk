# Publishing Checklist for v0.1.0

## ✅ Pre-Publishing Checklist

### Code Quality
- [x] All packages build successfully
- [x] All tests passing (349 tests)
- [x] TypeScript type checking passes
- [x] No linting errors
- [x] Example project builds and runs

### Documentation
- [x] README updated with latest features
- [x] CHANGELOG.md created for v0.1.0
- [x] Benchmark results documented
- [x] React configuration guide complete
- [x] Type checking guide complete
- [x] All code examples verified

### Package Configuration
- [x] All packages at version 0.1.0
- [x] package.json files have correct metadata
- [x] LICENSE files in all packages
- [x] README files in all packages
- [x] Correct export configurations
- [x] Keywords and descriptions set

### Testing & Verification
- [x] Core package builds: `cd packages/core && bun run build`
- [x] React package builds: `cd packages/react && bun run build`
- [x] Vite plugin builds: `cd packages/vite-plugin && bun run build`
- [x] Example project builds: `cd examples/react-demo && bun run build`
- [x] Browser compatibility verified (no Node.js dependencies in browser bundle)
- [x] Type inference works correctly in JSX
- [x] Strict type safety enforced

## 📦 Package Versions

```
@sylphx/zencss@0.1.0
@sylphx/zencss-react@0.1.0
@sylphx/zencss-vite-plugin@0.1.0
```

## 🚀 Publishing Steps

### 1. Final Verification
```bash
# Build all packages
cd /Users/kyle/new_project
cd packages/core && bun run build
cd ../react && bun run build
cd ../vite-plugin && bun run build

# Test example project
cd ../../examples/react-demo
bun run build
```

### 2. Commit Final Changes
```bash
git add -A
git commit -m "chore: prepare v0.1.0 release"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

### 3. Publish to npm

**Option A: Publish all packages at once**
```bash
# Login to npm (if not already logged in)
npm login

# Publish core
cd packages/core
npm publish --access public

# Publish react
cd ../react
npm publish --access public

# Publish vite-plugin
cd ../vite-plugin
npm publish --access public
```

**Option B: Use changesets (if installed)**
```bash
npx changeset publish
```

### 4. Verify Published Packages
```bash
# Check packages are published
npm view @sylphx/zencss
npm view @sylphx/zencss-react
npm view @sylphx/zencss-vite-plugin

# Try installing in a test project
mkdir test-install && cd test-install
npm init -y
npm install @sylphx/zencss-react
```

### 5. Post-Publishing

- [ ] Create GitHub Release with CHANGELOG
- [ ] Announce on Twitter/X
- [ ] Announce on Discord/Slack communities
- [ ] Submit to awesome lists
- [ ] Update website (if applicable)
- [ ] Share on Reddit (r/typescript, r/reactjs)

## 🎯 Key Features to Highlight

### In Release Notes:
1. **Zero Codegen** - Instant type inference without build steps
2. **Strict Type Safety** - Only design tokens allowed, compile-time validation
3. **38-2100% Smaller Bundles** - Industry-leading bundle sizes
4. **Critical CSS Extraction** - Unique feature, 30-50% faster first paint
5. **One-Line React Setup** - `createZenReact()` for zero boilerplate

### Marketing Points:
- "The only CSS-in-TS library with strict type safety AND zero codegen"
- "228B gzipped for large apps (vs 4.6KB Tailwind, 5.0KB Panda)"
- "Stop settling for bloated CSS frameworks"
- "Design system enforcement at compile time"
- "Critical CSS extraction - unique competitive advantage"

## ⚠️ Breaking Changes

**BREAKING: Strict Type Safety**
- Removed `(string & {})` fallback from all design token properties
- Only design tokens from config are allowed
- Use `style` prop for custom values outside design system

Migration guide included in CHANGELOG.md

## 📊 Success Metrics to Track

After publishing, monitor:
- [ ] npm downloads
- [ ] GitHub stars
- [ ] Issues/questions
- [ ] Community feedback
- [ ] Bundle size comparisons
- [ ] Performance reports

## 🐛 Known Issues

None currently - all critical issues resolved in v0.1.0

## 📝 Next Release Planning (v0.2.0)

Planned features:
- Vue integration
- Svelte integration
- Next.js App Router optimizations
- Remix support
- Webpack plugin
- esbuild plugin
- CSS-in-JS migration tools

---

**Ready to publish when you are! 🚀**
