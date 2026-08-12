# Test Plan

## Automated component tests

- Plugin installation registers `Vue2OrgTree`.
- A tree renders root and child labels with the default mapping.
- Custom `label`, `children`, and `expand` field mappings render correctly.
- Clicking a node forwards `on-node-click` with the original data object.
- Clicking the collapse control expands a branch and emits `resetOrg`.
- Selected nodes receive the configured selected class.
- Default export, plugin install, browser auto-install, and component name remain stable.
- Custom-field mappings also work during expansion/collapse.
- Mouse and drag/drop events keep their documented argument order.
- Specialized side nodes render from custom field mappings.

## Build and package checks

- `npm ci` installs only from the public registry lock file.
- `npm test` completes in jsdom.
- `npm run build` creates ESM, UMD, and CSS library assets.
- `npm run build:demo` creates a deployable static demo.
- `npm pack --dry-run` includes only intended distributable files.
- A clean fixture installs the tarball, imports the plugin and CSS, server-renders a tree, and confirms Vue remains external.

## Regression and manual checks

Playwright serves the production demo under the repository base path and checks page load, tree rendering, expand/collapse, zoom controls, screenshot control visibility, and asset loading. Manual UAT checks the generated screenshot output and visual placement of specialized side nodes in current Chrome or Edge.
