# Silk Project

Silk is a zero-runtime CSS-in-TypeScript framework. It owns the core styling
runtime, build-time extraction, framework integrations, presets, examples, docs,
SWC/Rust plugin, and public npm package release path.

## Lifecycle

- Lifecycle: `production`
- Layer: `foundation`
- Doctrine source of truth: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)
- Machine manifest: `.doctrine/project.json`

## Goals

- Provide type-safe styling with build-time CSS extraction and zero runtime cost.
- Own the Silk package family, public exports, framework integrations, build
  plugins, presets, docs, examples, and release proof.
- Keep product-specific design systems and app styles outside core packages.

## Non-Goals

- Do not own consuming applications' visual identity, product UI, routing, auth,
  persistence, or deployment.
- Do not encode a customer-specific design system into Silk core.
- Do not publish package changes without CI/release proof and npm registry
  readback.

## Boundaries

Silk owns CSS extraction, package exports, framework bindings, plugins, presets,
tests, examples, and docs for the Silk package ecosystem. Consuming apps own
their design tokens, components, deployment, and product-specific styling rules.

## Delivery

Pull requests run the Test workflow for broad package/build coverage. SWC plugin
paths also run the dedicated SWC plugin workflow. Main pushes run the central
reusable release workflow. Published npm packages are forward-fix only and need
registry readback for changed packages.
