# Verification

Verification record for `@shuyuncong/vue-hierarchy` `2.0.0-alpha.1` (2026-08-13).

## Commands and results

- `npm ci` ? passed against the locked public registry dependencies.
- `npm run typecheck` ? passed (`vue-tsc --noEmit`, no errors).
- `npm test` ? 56/56 passed across `model`, `commands`, `permissions`, `layout`, and `HierarchyView` specs.
- `npm run benchmark` ? passed.
- `npm run build` ? passed (ESM + CJS + TypeScript declarations + CSS, Vue external).
- `npm run build:demo` ? passed (GitHub Pages build with the `/vue-org-tree/` base).
- `npm run test:package` ? passed (tarball install validates ESM, CJS, declarations, CSS, and SSR).
- `npm run test:e2e` ? 5/5 passed (landing page, organization search/drag, permission DAG, genealogy, large dataset).
- `npm pack --dry-run` ? passed.
- GitHub Actions ? CI on `master` all steps passed; Pages deployment succeeded.

## Visual QA

- Captured 2x screenshots of all four demo cards from the production demo build (`static/images/hierarchy-*.png`).
- Found and fixed vertical clipping: the organization bottom row and the permission `Invoices` row were cut off by fixed viewport heights; `src/App.vue` heights raised to 480/640 px.
- Horizontal overflow on the half-width permission and genealogy cards remains an intentional scrollable viewport in the live demo; README screenshots expand the viewport so the full graph is visible.
- Programmatic layout checks: expected node counts (7/9/7/1), no overlapping node boxes, no clipped nodes after viewport expansion.
