# Repository Guidelines

## Project Structure & Module Organization

This Vue 2.7 organization-tree component includes a demo. Reusable code lives in `src/components/org-tree/`: `org-tree.vue` owns behavior, `node.js` renders nodes, and `index.js` exposes the plugin. The demo is `src/components/OrgTreeDemo.vue`; sample data is `src/components/test.json`. Less styles are under `src/styles/`, images under `static/images/`, and tests under `test/`. Vite drives active builds; `build/` and `config/` are legacy webpack files. Do not edit generated `dist/`, `demo-dist/`, or `docs/static/` assets.

## Build, Test, and Development Commands

- `npm ci`: install the exact dependencies in `package-lock.json`.
- `npm run dev`: start the Vite demo server at `http://localhost:8080/`.
- `npm start`: alias for the development server.
- `npm test`: run Vue component tests with Vitest and jsdom.
- `npm run test:e2e`: build and smoke-test the demo in Chromium.
- `npm run build`: create ESM, UMD, and CSS library assets in `dist/`.
- `npm run build:demo`: create the GitHub Pages demo in `demo-dist/`.
- `npm run test:package`: install and validate the generated npm tarball.

Use Node 20.19+ or 22.12+ and npm 10+ for maintenance work.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, LF line endings, two-space indentation, trimmed trailing whitespace, and a final newline. Match the existing semicolon-free JavaScript style and single-quoted imports. Name Vue component definitions in PascalCase (`Vue2OrgTree`), demo/view files in PascalCase (`OrgTreeDemo.vue`), and low-level component modules in kebab-case or lowercase (`org-tree.vue`, `node.js`). Keep public props and emitted event names backward compatible; events currently use names such as `on-node-click`.

No ESLint or Prettier command is configured; review formatting manually. Preserve the Vue 2 plugin, props, event names, argument order, and standalone CSS import in `1.x`.

## Testing Guidelines

Add component regressions to `test/unit/*.spec.js` and production-demo checks to `test/e2e/*.spec.js`. Before submitting, run `npm test`, both builds, package verification, and browser tests when layout or interactions change. Manually verify screenshot output and specialized side-node placement because jsdom cannot measure real browser layout.

## Commit & Pull Request Guidelines

History uses short sentence-case subjects such as `Update README.md`. Prefer concise imperative messages with a clear scope, for example `Fix collapsed node connector alignment`. Pull requests should explain the change, affected component APIs, and verification. Link relevant issues and include screenshots or recordings for visual changes. Do not commit generated build directories; GitHub Actions publishes the demo and tag-driven releases.
