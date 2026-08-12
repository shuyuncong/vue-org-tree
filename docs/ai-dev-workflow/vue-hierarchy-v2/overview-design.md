# Overview Design

## Product shape

`@shuyuncong/vue-hierarchy` is a graph-backed hierarchy framework, not an organization-chart-specific widget. A single `HierarchyView` component combines a typed document model, deterministic layout, relationship rendering, optional editing/search controls, and import/export operations. Domain-specific behavior is expressed through data and slots.

## Public data contract

```ts
type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue }

interface HierarchyDocument<T extends JSONValue = JSONValue> {
  version: '2.0'
  nodes: HierarchyNode<T>[]
  edges: HierarchyEdge<T>[]
}

interface HierarchyNode<T extends JSONValue = JSONValue> {
  id: string
  label: string
  data?: T
  hasChildren?: boolean
  childrenLoaded?: boolean
  disabled?: boolean
}

interface StructuralChildEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'child'
  relationship?: 'hierarchy'
  familyId?: never
  data?: T
}

interface FamilyChildEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'child'
  relationship: 'biological' | 'adoptive' | 'step' | 'guardian'
  familyId: string
  data?: T
}

interface SpouseEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'spouse'
  relationship: 'married' | 'partnered' | 'separated' | 'divorced' | 'widowed'
  familyId: string
  label?: string
  data?: T
}

interface CrossEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'cross'
  relationship: string
  label?: string
  directed?: boolean
  data?: T
}

type HierarchyEdge<T extends JSONValue = JSONValue> =
  | StructuralChildEdge<T>
  | FamilyChildEdge<T>
  | SpouseEdge<T>
  | CrossEdge<T>

interface HierarchyFragment<T extends JSONValue = JSONValue> {
  nodes: HierarchyNode<T>[]
  edges: HierarchyEdge<T>[]
}
```

Child edges define the directed acyclic hierarchy. Spouse edges are symmetric for lookup, and cross edges do not alter depth. `familyId` groups spouse and child edges belonging to a marriage, partnership, or family unit, including multiple marriages, former spouses, adoption, and step-parent relationships.

`CrossEdge.directed` defaults to `false`.

```ts
type HierarchyErrorCode =
  | 'INVALID_DOCUMENT' | 'DUPLICATE_ID' | 'MISSING_NODE' | 'CHILD_CYCLE'
  | 'INVALID_RELATIONSHIP' | 'IMPORT_LIMIT' | 'LAZY_CONFLICT' | 'STALE_LOAD'
  | 'EDIT_REJECTED' | 'EXPORT_FAILED'

interface HierarchyError extends Error {
  code: HierarchyErrorCode
  details?: JSONValue
}

interface ImportLimits {
  maxBytes: number
  maxDepth: number
  maxNodes: number
  maxEdges: number
}

interface ImageExportOptions {
  pixelRatio?: number
  backgroundColor?: string
  width?: number
  height?: number
}

interface ImageExportResult<F extends 'png' | 'svg'> {
  format: F
  dataUrl: string
  width: number
  height: number
}
```

## Public Vue contract

```ts
interface HierarchyViewProps<T extends JSONValue = JSONValue> {
  modelValue: HierarchyDocument<T>
  expandedIds?: string[]
  selectedId?: string | null
  checkedIds?: string[]
  editable?: boolean
  parentMode?: 'single' | 'multiple'
  searchable?: boolean
  checkable?: boolean
  cascadeChecks?: boolean
  loadChildren?: (node: HierarchyNode<T>, context: {
    signal: AbortSignal
    document: HierarchyDocument<T>
  }) => Promise<HierarchyFragment<T>>
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
}
```

Defaults are `expandedIds = roots`, `selectedId = null`, `checkedIds = []`, `editable = false`, `parentMode = 'single'`, `searchable = true`, `checkable = false`, `cascadeChecks = true`, `nodeWidth = 190`, `nodeHeight = 76`, `columnGap = 36`, and `rowGap = 86`.

Controlled props are optimistic: the component emits a complete next value and renders it until the parent supplies a newer prop value. Update events carry their complete next value. `node-click` carries `(node, MouseEvent | KeyboardEvent)`. `load-start` carries the node; `load-success` carries `(node, fragment)`; `load-error` carries `(node, error)`. `edit-rejected`, `import-error`, and `export-error` carry `HierarchyError`. `relationship-change` carries a successful `CommandResult`.

Slots use `{ node, selected, expanded, checked, indeterminate, loading, depth }` for `node` and `node-actions`, `{ edge, source, target }` for `edge-label`, `{ node }` for `loading`, and no props for `empty`.

```ts
interface SearchMatch<T extends JSONValue = JSONValue> {
  node: HierarchyNode<T>
  ancestorIds: string[]
}

interface HierarchyViewExpose<T extends JSONValue = JSONValue> {
  search(query: string): SearchMatch<T>[]
  focusNode(id: string): boolean
  importJson(text: string, limits?: Partial<ImportLimits>): HierarchyDocument<T>
  exportJson(space?: number): string
  exportPng(options?: ImageExportOptions): Promise<ImageExportResult<'png'>>
  exportSvg(options?: ImageExportOptions): Promise<ImageExportResult<'svg'>>
}
```

JSON import succeeds atomically, emits `update:modelValue`, and returns the accepted document. Failure throws and emits `import-error`. Image methods resolve to `{ format, dataUrl, width, height }`.

## Public command contract

```ts
type CommandResult<T extends JSONValue = JSONValue> =
  | { ok: true; document: HierarchyDocument<T>; addedEdges: HierarchyEdge<T>[]; removedEdges: HierarchyEdge<T>[] }
  | { ok: false; error: HierarchyError }

type RelationshipInput<T extends JSONValue = JSONValue> = Omit<HierarchyEdge<T>, 'id'> & { id?: string }

interface CommandOptions {
  parentMode?: 'single' | 'multiple'
  idFactory?: () => string
}

interface ReparentOptions<T extends JSONValue = JSONValue> extends CommandOptions {
  edge?: Partial<Omit<StructuralChildEdge<T> | FamilyChildEdge<T>, 'id' | 'source' | 'target' | 'type'>>
}

reparentNode(document, sourceId, targetId, options?: ReparentOptions): CommandResult
addRelationship(document, edge: RelationshipInput, options?: Pick<CommandOptions, 'idFactory'>): CommandResult
removeRelationship(document, edgeId): CommandResult
```

Reparent options include `parentMode`, an optional child-edge template, and `idFactory`. Default IDs combine relationship type and endpoints with a monotonically increasing suffix, retrying until collision-free. Failed commands never mutate the source document.

## Internal layers

- `src/lib/model.ts`: validation, indexing, traversal, search, merge, import/export, and cycle checks.
- `src/lib/layout.ts`: deterministic rank-based positions for visible nodes and edge paths.
- `src/lib/commands.ts`: immutable relationship commands.
- `src/lib/permissions.ts`: global checked and indeterminate state.
- `src/lib/HierarchyView.vue`: interaction, lazy loading, slots, drag/drop, search, and exposed methods.
- `src/lib/export.ts`: DOM image export and JSON helpers.
- `src/demo/`: four executable examples.

## Visibility, loading, and performance

The component traverses only expanded child edges. A multi-parent child is visible when at least one expanded root-to-child path is visible. Search expands every loaded ancestor path.

Nodes marked `hasChildren: true` and `childrenLoaded: false` call `loadChildren(node, { signal, document })`. Per-node requests are coalesced, failures remain retryable, and unmount aborts requests. On resolution, a result is discarded with `STALE_LOAD` if the node no longer exists or is already loaded. Identical records require deep JSON equality; same-ID differences reject the full transaction. A valid fragment merges into the latest optimistic document, marks the node loaded, and emits one update. The parent remains authoritative if it later supplies a different controlled document.

The large demo represents 10,000 logical records and loads at most 50 nodes per request. `npm run benchmark` uses a fixed seeded 500-node/499-edge fixture, one warm-up and five iterations, and requires median pure layout and search durations below one second on GitHub `ubuntu-latest` with Node 22. Browser rendering is outside this threshold; browser flows keep fewer than 500 mounted nodes.

## Editing and permission semantics

Dragging source onto target requests a child edge from target to source. The command rejects self-parenting and cycles. Single mode replaces incoming child edges and reports removals; multiple mode adds a parent. Commands can add or remove a specific child, spouse, or cross edge. Organization and permission examples use single mode; genealogy uses multiple mode.

Permission checking is global per node ID. Checking or unchecking from any path cascades through every enabled descendant, synchronizing shared nodes. A disabled node stops traversal through its entire descendant subgraph and preserves states there. Parent aggregation ignores disabled direct children. A parent is checked when all participating children are checked, indeterminate when some are checked or indeterminate, and retains its explicit state when it has no participating children.

## Layout and accessibility

Visible child edges are topologically ranked. Roots start at rank zero; a child uses the maximum parent rank plus one. Spouse edges never change a node that has child-edge ancestry. A spouse-only root inherits the minimum rank of connected spouses; remaining spouse-only components use rank zero. Placement order uses input node order, then ID. Spouse and cross edges render only when both endpoints are visible.

The accessible tree projects a DAG to one primary path using the incoming child edge whose source has the lowest input order, then lowest ID. `aria-level` and depth-first Arrow Up/Down traversal use this projection. Secondary parents, spouses, and cross relationships appear in `aria-describedby` text. Arrow Left/Right collapse/expand, Enter selects, and Space checks. Programmatic commands provide a keyboard alternative to pointer drag/drop.

## Security and export

Labels are rendered as text and slots return VNodes. JSON import enforces byte/count/depth limits and rejects unsupported versions, dangerous keys, non-JSON values, duplicates, missing references, self relationships, invalid family rules, and child cycles before mutation.

PNG and SVG export accept pixel ratio, background, width, and height. SVG output uses a DOM data URL with supported `foreignObject` content; PNG rasterizes it. Browser tests validate MIME prefixes, dimensions, and downloads. Fonts and cross-origin images are caller responsibilities. Failures emit typed events and appear in an `aria-live` region.

## Non-goals for alpha.1

- Collaborative editing, persistence backends, CRDTs, or access control.
- Optimal collision-free layout for every genealogy.
- Rendering all 10,000 nodes simultaneously.
- Vue 2 or nested-children API compatibility. A `1.x` branch preserves maintenance before v2 replaces `master`.
