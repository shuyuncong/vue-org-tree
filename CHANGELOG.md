# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0-alpha.1] - 2026-08-12

### Added

- Vue 3 and TypeScript `@shuyuncong/vue-hierarchy` package with typed hierarchy documents, structural/family child, spouse, and cross edges, and JSON-safe custom data.
- Deterministic multi-parent DAG layout with SVG edge routing and per-parent edge visibility.
- Immutable editing commands for adding, removing, and reparenting relationships under single- and multiple-parent policies.
- Permission propagation with checked, half-checked, and disabled-subgraph protection.
- Transactional lazy loading, search, JSON serialization, import validation, and image export.
- `HierarchyView` component with slots, drag/drop, toolbar actions, and ARIA support.
- Four demo pages plus unit, component, browser, and package-consumer verification.

### Changed

- Vue 2 `org-tree` moves to the `1.x` maintenance line; v2 is an intentional breaking rewrite.
- Modernized tooling to Vite 7, Vitest 4, Playwright, and vue-tsc.

## [1.0.0] - 2026-08-12

### Added

- MIT license with retained upstream attribution.
- Vue 2.7 component tests, browser smoke tests, package-consumer verification, and GitHub Actions.
- Contributor, roadmap, security, issue, pull-request, and release documentation.
- ESM, UMD, and standalone CSS library builds.

### Changed

- Replaced the active webpack scripts with Vite while preserving the Vue 2 public component API.
- Rebuilt dependencies from the public npm registry.
- Repaired the demo paths and project documentation.

### Fixed

- Custom field mappings now apply consistently to expansion, child traversal, and specialized side nodes.
- Focus and drag lifecycle events are forwarded to component consumers.

[Unreleased]: https://github.com/shuyuncong/vue-org-tree/compare/v2.0.0-alpha.1...HEAD
[2.0.0-alpha.1]: https://github.com/shuyuncong/vue-org-tree/compare/v1.0.0...v2.0.0-alpha.1
[1.0.0]: https://github.com/shuyuncong/vue-org-tree/releases/tag/v1.0.0
