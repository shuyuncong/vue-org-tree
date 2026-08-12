# Review Log

## Design and plan review

Reviewer: independent Codex reviewer subagent.

Accepted findings:

- Retain the upstream MIT copyright notice and document derivation.
- Expand compatibility coverage to plugin exports, auto-install, CSS, UMD, all event contracts, custom mappings, and external Vue.
- Add Playwright and tarball-consumer checks beyond jsdom.
- Correct the live-demo strategy and Vite Pages base path.
- Harden release automation with version checks, least privilege, protected environment, and publish-before-release ordering.
- Separate maintainer runtime support from consumer browser support and define focused commit boundaries.

Open confirmation:

- Final public npm package name and scope.
- Preferred private security-reporting contact if GitHub private vulnerability reporting is unavailable.

## Final code review

Reviewer: independent Codex reviewer subagent.

Accepted findings and repairs:

- Removed data-driven HTML construction from the demo, escaped ordinary labels, and documented that string `render-content` output is trusted HTML.
- Removed maintainer Node/npm requirements from package `engines` so consumers are not unnecessarily constrained.
- Fixed string/function class handling for specialized side nodes and added regression coverage.
- Added Playwright verification to the release workflow and pinned every GitHub Action to an immutable commit SHA.
- Labeled the linked Pages site as the existing demo until the new deployment runs, and removed the unsupported pre-publication GitHub-install claim.

Expected final step:

- Create focused commits and the annotated local `v1.0.0` tag only after the repair verification and reviewer re-check pass. Remote publication remains credential-dependent.

Reviewer re-check: passed. No release-blocking or medium-severity findings remained after the repairs.
