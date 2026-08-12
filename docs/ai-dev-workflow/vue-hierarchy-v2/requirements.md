# Requirements

## Goal

Transform the Vue 2 organization-tree component into `@shuyuncong/vue-hierarchy`, a Vue 3 + TypeScript framework for viewing, editing, searching, loading, and exchanging hierarchical relationship graphs.

## v2.0.0-alpha.1 scope

- Support organization charts, permission trees, genealogy, and arbitrary cross-node relationships.
- Represent hierarchy data as typed nodes and edges. A person may have two parents, spouses, and additional cross relationships.
- Provide async child loading for large remote datasets and render only expanded branches.
- Provide drag-and-drop reparenting with cycle prevention and single- or multiple-parent policies.
- Provide built-in node search, match highlighting, ancestor expansion, and focus/selection.
- Provide Vue slots for nodes, node actions, edge labels, empty state, and loading state.
- Export PNG/SVG images and versioned JSON; import JSON with schema validation and actionable errors.
- Publish Vue 3 ESM/CJS-compatible library assets, CSS, and TypeScript declarations under `@shuyuncong/vue-hierarchy`.
- Put working Organization Chart, Permission Tree, Genealogy, and Large Dataset examples on the demo landing page.

## Compatibility and release policy

- The existing `v1.0.0` tag remains the Vue 2 line; `v2` intentionally breaks the component and data APIs.
- `v2.0.0-alpha.1` is a prerelease and must publish under the npm `next` dist-tag.
- Do not claim npm or GitHub Release publication unless authenticated workflows succeed.
- The package uses the MIT license and retains upstream attribution.

## Data rules

- Node IDs and edge IDs are unique non-empty strings.
- `child` edges are directed and must remain acyclic.
- A child edge may declare `relationship: biological | adoptive | step | guardian` and `familyId`. Edges sharing a `familyId` identify the parents/partners and children of one family relationship without requiring every parent to be a current spouse.
- `spouse` edges are undirected for lookup, require a `familyId`, may declare `married | partnered | separated | divorced | widowed`, allow multiple historical or concurrent relationships, and do not establish ancestry.
- `cross` edges may connect any two distinct existing nodes, may be directed or undirected and labeled, and do not affect hierarchy depth. Parallel cross edges require distinct IDs and relationship labels.
- Single-parent editing replaces existing incoming child edges; multiple-parent editing retains them unless explicitly removed.
- The public command API can add and remove individual child, spouse, and cross relationships. Organization/permission demos use single-parent drag mode; genealogy uses multiple-parent drag mode.
- Permission checking is global per node ID. Checking or unchecking from any path synchronizes every occurrence and cascades through every enabled descendant. Disabled nodes and their entire descendant subgraphs are preserved and excluded from cascading and parent aggregation. Parents ignore disabled direct children; a parent with no participating children retains its explicit state.
- Imported documents must use schema version `2.0` and may not reference missing nodes.
- Node and edge payloads are JSON values only. Import rejects dangerous object keys, excessive nesting, documents over 5 MiB, more than 100,000 nodes, or more than 200,000 edges before mutation.

## Acceptance criteria

- At least 30 automated unit/component tests and browser coverage for all four demos.
- A lazy node loads once successfully, exposes loading/error state, allows retry after failure, coalesces concurrent expansion requests, aborts on unmount, and transactionally merges returned nodes and edges without duplicates or stale-document replacement.
- Invalid cyclic drag moves do not mutate the document and emit an explanatory event.
- Search can reveal a loaded descendant by expanding its ancestor path.
- JSON round trips without semantic loss, invalid imports fail safely, and image export returns downloadable PNG/SVG data.
- The 10,000-node demo loads at most 50 nodes per request and keeps fewer than 500 DOM nodes during its tested flow; core layout and search over 500 loaded nodes complete within one second in CI.
- Tree semantics expose keyboard selection, expansion and checking, ARIA tree/treeitem state, labeled toolbar controls, and announced loading/error messages. Pointer drag editing has an equivalent public command API.
- Clean install, type checking, tests, library build, demo build, package-consumer verification, and Playwright checks pass.
