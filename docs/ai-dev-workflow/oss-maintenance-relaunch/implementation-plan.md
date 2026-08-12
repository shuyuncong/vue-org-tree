# Implementation Plan

1. Add licensing, project governance, roadmap, changelog, and GitHub templates.
2. Confirm the public npm package identity; replace package metadata and scripts with a Vue 2.7 + Vite maintenance toolchain; separate library and demo builds.
3. Add Vitest coverage for the complete public install/render/event contract, including custom-field expansion and specialized side-node rendering.
4. Rewrite README and update `AGENTS.md` to match the new commands and release structure.
5. Add Playwright demo smoke coverage, tarball consumer validation, CI, Pages deployment, and a protected tag-driven npm/GitHub release workflow.
6. Rebuild `package-lock.json` against the public npm registry.
7. Run clean install, tests, library/demo builds, package inspection, and manual demo smoke checks.
8. Review the complete diff, repair findings, then create focused governance, tooling/tests, docs/demo, and automation commits. Create an annotated local `v1.0.0` tag only after the final verification record.

Actual remote pushes, GitHub Release creation, and npm publication require authenticated maintainer credentials and are not reported as complete unless executed successfully.
