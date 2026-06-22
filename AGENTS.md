# Silk Agent Instructions

## Scope

This file is the repo-local operating policy for agents working in
`SylphxAI/silk`. Organization-wide engineering doctrine is owned by
`SylphxAI/doctrine`; `PROJECT.md` and `.doctrine/project.json` own this
repository's local identity, lifecycle, boundary, and delivery facts.

Silk is a TypeScript package monorepo for zero-runtime CSS-in-TypeScript,
framework integrations, build plugins, presets, examples, docs, and package
release.

## Read First

1. `PROJECT.md` and `.doctrine/project.json` for project goals, boundaries,
   delivery proof, package-release facts, and adoption gaps.
2. `README.md` for the public product overview and package map.
3. Package-level READMEs and `package.json` files before changing public APIs,
   build plugins, presets, or framework bindings.
4. `.github/workflows/test.yml`, `.github/workflows/swc-plugin-test.yml`, and
   `.github/workflows/release.yml` before changing validation or release paths.

## Non-Negotiables

- Keep Silk generic. Product-specific design systems, tokens, and application
  styles belong in consuming apps or presets, not core packages.
- Do not publish package changes without CI/release proof and npm registry
  readback for every changed package.
- Preserve package boundaries between core, build plugins, framework bindings,
  presets, examples, and docs.
- Treat SWC/Rust plugin changes as higher risk and validate Rust formatting,
  clippy, WASM build, and integration tests.

## Validation

Use the narrowest meaningful validation first, then broaden as needed:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`
- SWC plugin workflow or equivalent Rust/wasm checks when touching
  `packages/swc-plugin/**`

Docs-only boundary changes may be validated by diff review, referenced-file
checks, and the central project manifest audit.
