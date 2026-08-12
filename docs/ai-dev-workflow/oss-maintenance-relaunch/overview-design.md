# Overview Design

## Maintenance strategy

Version `1.x` becomes the stable Vue 2.7 maintenance line. It retains the `Vue2OrgTree` API while improving build reproducibility, documentation, tests, and releases. Vue 3 support is tracked as a separate `2.x` effort because a direct migration would change rendering and plugin contracts.

## Build and package boundaries

Vite replaces the active webpack scripts. Development serves the existing demo application; library builds start from `src/components/org-tree/index.js`, externalize Vue, and emit ESM, UMD, and CSS files under `dist/`. Demo-only packages remain development dependencies. Existing webpack files remain temporarily for history but are no longer used by package scripts.

## Verification architecture

Vitest, jsdom, and Vue Test Utils exercise the component API without a browser. Playwright smoke tests validate the built demo and key browser interactions. GitHub Actions runs on Node 22 and performs clean installation, tests, library build, demo build, browser smoke tests, and tarball consumer validation. A separate tag-driven workflow requires tag/package-version equality, rebuilds from a clean checkout, repeats browser and package verification, publishes to npm through a protected environment, and creates a GitHub release only after publication succeeds.

## Documentation and governance

The README is Chinese-first and includes an English summary, screenshot, verified live-demo URL, exact API tables, maintenance status, consumer browser support, maintainer runtime support, and development commands. `CONTRIBUTING.md`, `ROADMAP.md`, `SECURITY.md`, issue forms, a pull-request template, and a changelog make future maintenance visible and actionable.

## Risks and mitigations

- Vue 2 is end-of-life: state this plainly and limit `1.x` to maintenance.
- Modernizing tooling can change output: preserve API-level tests and validate package contents.
- Current GitHub Pages content is stale: fix the username typo, use the currently working `/docs/` demo link, and configure future Pages builds with the `/vue-org-tree/` base path.
- Publication credentials are unavailable locally: prepare automation and report publication as pending, not complete.
- Vue 2 consumers may still target IE: the maintenance release documents modern evergreen-browser support because Vite output and automated tests do not guarantee IE compatibility.
