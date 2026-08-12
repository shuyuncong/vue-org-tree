# Test Plan

## Core model tests

- Validate correct documents and reject unsupported versions, duplicate IDs, missing endpoints, duplicate edge IDs, self relationships, invalid spouse/family rules, child cycles, dangerous keys, excessive depth/size, and non-JSON payload values.
- Build incoming/outgoing indexes and treat spouse lookup symmetrically.
- Find roots and ancestors with dual-parent graphs.
- Search labels and caller-provided data text without mutating data.
- Merge lazy results transactionally, accept references to existing nodes, deduplicate identical records, reject conflicting IDs, and preserve the latest controlled document.
- Serialize/parse a document without semantic loss.

## Editing command tests

- Reparent in single mode while reporting removed parents, retain parents in multiple mode, explicitly remove a parent, avoid duplicate edges, and reject self/cyclic moves.
- Add/remove spouse and cross relationships with family/relationship metadata and collision-safe generated IDs.
- Preserve the original document on rejected commands.

## Layout tests

- Rank ordinary trees, forests, spouse partners, dual-parent children, and cross-linked graphs deterministically.
- Hide descendants with no expanded root path, retain a multi-parent child when another parent path is expanded, reveal every loaded ancestor path during search, and render spouse/cross edges only when both endpoints are visible.
- Produce distinct SVG path shapes for child, spouse, and cross edges.

## Vue component tests

- Render default nodes and each named slot.
- Expand/collapse branches, lazy-load once, show loading/error states, and emit document updates.
- Coalesce concurrent lazy requests, retry failure, abort on unmount, and reject an invalid fragment atomically.
- Search, highlight, reveal ancestors, select nodes, and clear results.
- Drag/drop valid and invalid moves in both parent modes.
- Synchronize shared descendants globally, cascade checks/unchecks through every enabled path, stop at disabled nodes and their subgraphs, ignore disabled children in aggregation, and preserve explicit state for parents without participating children.
- Import valid JSON, reject invalid JSON, export JSON, and call PNG/SVG export helpers.
- Validate keyboard navigation and ARIA state for expansion, selection, checking, loading, and errors.
- Validate primary accessible-parent projection and descriptions for secondary parents, spouses, and cross edges.

## Browser and package tests

- All four demo cards are visible within the landing page.
- Organization, permission, and genealogy examples render their distinctive relationships.
- Lazy demo loads another branch and updates its loaded count.
- Search and drag editing work in Chromium.
- Installed tarball separately verifies ESM import, CommonJS require, TypeScript declarations, CSS export, SSR rendering, core helpers, package contents, and external Vue peer dependency.
- Release workflow verifies tag/version equality and publishes prereleases with npm `--tag next` while stable versions use `latest`.
- `npm run benchmark` uses a fixed seeded 500-node fixture, one warm-up and five iterations, and enforces median layout/search time below one second.
