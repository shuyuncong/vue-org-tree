# Requirements

## Goal

Restore `shuyuncong/vue-org-tree` as a verifiably maintained open-source Vue component and prepare a trustworthy `v1.0.0` public release.

## Required outcomes

- Add an MIT license that retains the upstream `Ste7en and others` notice, plus accurate package metadata.
- Replace the damaged/minimal README with installation, usage, API, demo, screenshot, maintenance-status, and support information.
- Maintain Vue 2 in the `1.x` line; document Vue 3 as a planned `2.x` line rather than silently breaking compatibility.
- Add reproducible CI for install, tests, library build, demo build, and package validation.
- Add component tests for installation, rendering, interaction, custom mappings, and events.
- Prepare semantic-version release automation and an npm package suitable for public publication.
- Add contribution, roadmap, security, issue, and pull-request guidance.
- Create several focused Git commits and a local `v1.0.0` tag after verification.

## Constraints

- Preserve the current public component name, props, and emitted events in `1.x`.
- Preserve the default export, Vue plugin install hook, browser auto-install behavior, UMD global, and standalone stylesheet.
- Declare Vue 2.7 as a peer dependency so consumers do not receive a second Vue runtime.
- Do not claim that npm or GitHub publication occurred unless authenticated commands succeed.
- Do not fabricate users, download counts, issues, or maintenance activity.
- Generated demo files are deployed by automation; source documentation remains reviewable.

## Acceptance criteria

`npm ci`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run build:demo`, and `npm pack --dry-run` succeed on the supported Node version. The public package contains compiled library assets, README, and LICENSE, and does not bundle Vue or the demo application as its entry point. A tarball consumer fixture verifies plugin registration, CSS import, and rendering.
