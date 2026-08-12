# Implementation Plan

1. Replace Vue 2 build dependencies with Vue 3, TypeScript, Vue Test Utils 2, Vite declaration generation, and `@shuyuncong/vue-hierarchy@2.0.0-alpha.1` metadata.
2. Add typed node/edge/fragment contracts, guarded JSON values, import limits, validation, indexes, traversal, search, transactional lazy merging, JSON parsing/serialization, and cycle detection.
3. Add immutable editing commands for adding/removing/reparenting child relationships and spouse/cross relationships under single- and multiple-parent policies, including family IDs and deterministic collision-safe IDs.
4. Add deterministic visible-graph layout and SVG edge routing.
5. Build `HierarchyView` with controlled document/expanded/selected/checked state, ARIA and keyboard behavior, transactional lazy loading, search, permission propagation, drag/drop, slots, toolbar actions, and exposed JSON/image functions.
6. Build four landing-page examples: organization chart, a real checked/half-checked/disabled permission tree, genealogy with family-linked dual parents/multiple spouses/cross links, and a simulated 10,000-node lazy source with measurable loaded/DOM counts.
7. Rewrite README, roadmap, changelog, contributing/release guidance, package verification, CI, Pages, and prerelease publishing behavior. Create a `1.x` maintenance branch before v2 replaces `master`; release workflow verifies prerelease tags and publishes `2.0.0-alpha.*` with `--tag next`.
8. Run unit/component/E2E/package/type/build verification, independent final review, focused commits, and a local `v2.0.0-alpha.1` tag.

## Compatibility and rollback

The `v1.0.0` tag preserves the Vue 2 source. v2 is an intentional breaking release with a migration section. If alpha verification fails, do not move the `latest` npm tag; publish only under `next` after repairs.

## Verification commands

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run build:demo
npm run test:package
npm run test:e2e
npm pack --dry-run
```
