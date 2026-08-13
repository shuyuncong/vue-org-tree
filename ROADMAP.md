# Roadmap

The project is maintained in two lines:

- `1.x` ? Vue 2.7 compatibility, published as `tapn-org-tree`.
- `2.x` ? Vue 3 + TypeScript rewrite, published as `@shuyuncong/vue-hierarchy`.

This roadmap reflects direction, not a delivery commitment. Feature requests are welcome through GitHub issues.

## 1.x ? Vue 2.7 maintenance

- Publish the reproducible `v1.0.0` npm package and GitHub Release.
- Add regression tests for tree layout, shoulder nodes, drag, and screenshots.
- Fix accessibility, keyboard, and small-screen layout issues.
- Keep the historical component API backward compatible.
- Triage incoming issues and dependency security updates.

## 2.x ? Vue 3 rewrite

- Alpha (released `2.0.0-alpha.1`): typed data contracts, DAG layout, editing commands, permission propagation, transactional lazy loading, `HierarchyView` component, four demo pages, and unit/component/E2E/package verification.
- Beta: stabilize the public API and type declarations; write the Vue 2 to Vue 3 migration guide; expand accessibility and slot documentation; polish PNG/SVG export; add community examples.
- Stable `2.0.0`: promote from the `next` npm tag to `latest` after beta soak and real-world usage validation.

## Non-goals

- No server-side layout or persistence: the component is a pure client-side visualization framework with JSON in/out.
- No visual editor chrome: editing is exposed through props, slots, and commands so applications keep full control.
