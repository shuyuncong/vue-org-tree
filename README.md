# Vue Hierarchy

[English](README.md) | [简体中文](README.zh-CN.md)

Vue 3 + TypeScript framework for editable hierarchy, genealogy, permission, and relationship visualizations. One typed node-and-edge document drives organization charts, permission DAGs, real family trees, and lazy-loaded relationship views.

- Package: `@shuyuncong/vue-hierarchy` (Vue 3, currently `2.0.0-alpha.1` on the `next` npm tag)
- Vue 2 line: `tapn-org-tree` `1.x`, in maintenance (see [Versioning](#versioning-and-migration))
- License: [MIT](LICENSE)

## Screenshots

| Organization chart | Permission tree |
| --- | --- |
| ![Organization chart](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-organization.png) | ![Permission tree](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-permission.png) |

| Genealogy | Large dataset |
| --- | --- |
| ![Genealogy](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-genealogy.png) | ![Large dataset](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-large.png) |

## Live demo

https://shuyuncong.github.io/vue-org-tree/

## Features

- Vue 3 Composition API with strict TypeScript contracts and JSON-safe payloads.
- Multi-parent DAG layout with deterministic ranks, spouse alignment, and per-parent edge visibility.
- Family-linked genealogy semantics: dual parents, multiple spouses, former relationships, adoption, and step-parent roles.
- Global permission propagation with checked, half-checked, and disabled-subgraph protection.
- Transactional lazy loading with coalescing, abort signals, retry, and stale/conflict detection.
- Immutable editing commands with single- and multiple-parent drag policies and explicit relationship removal.
- Search, JSON import/export, and PNG/SVG image export.
- Accessible by default: keyboard navigation and ARIA live regions.
- Headless slots for nodes, node actions, edge labels, and the empty state.

## Installation

```bash
npm install @shuyuncong/vue-hierarchy@next
```

## Quick start

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { HierarchyView } from '@shuyuncong/vue-hierarchy'
import type { HierarchyDocument } from '@shuyuncong/vue-hierarchy'
import '@shuyuncong/vue-hierarchy/style.css'

const document = ref<HierarchyDocument>({
  version: '2.0',
  nodes: [
    { id: 'ceo', label: 'Maya Chen', data: { title: 'CEO' } },
    { id: 'product', label: 'Noah Williams', data: { title: 'VP Product' } },
    { id: 'engineering', label: 'Ava Patel', data: { title: 'VP Engineering' } }
  ],
  edges: [
    { id: 'ceo-product', source: 'ceo', target: 'product', type: 'child' },
    { id: 'ceo-engineering', source: 'ceo', target: 'engineering', type: 'child' }
  ]
})
</script>

<template>
  <HierarchyView v-model="document" editable searchable />
</template>
```

## Data model

A document is a flat node-and-edge graph (no nested `children`), which makes multi-parent, spouse, and cross relationships first-class.

```ts
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
```

Edges are discriminated by `type`:

- `child` ? structural (`relationship: 'hierarchy'`) or family-linked (`biological` / `adoptive` / `step` / `guardian` with a `familyId`).
- `spouse` ? `married` / `partnered` / `separated` / `divorced` / `widowed` with a `familyId`.
- `cross` ? arbitrary labeled relationships (for example `mentor`), optionally `directed: true`.

## API reference

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `HierarchyDocument` | required | Controlled document (use `v-model`). |
| `expandedIds` | `string[]` | `[]` | Controlled expanded node ids. |
| `selectedId` | `string \| null` | `null` | Controlled selected node id. |
| `checkedIds` | `string[]` | `[]` | Controlled checked node ids (permission mode). |
| `editable` | `boolean` | `false` | Enable drag/drop reparenting and relationship removal. |
| `parentMode` | `'single' \| 'multiple'` | `'single'` | Drag behavior: replace incoming parents, or add another parent. |
| `searchable` | `boolean` | `true` | Show the search box and auto-expand matches. |
| `checkable` | `boolean` | `false` | Show permission checkboxes with global DAG propagation. |
| `cascadeChecks` | `boolean` | `true` | Cascade check state to descendants. |
| `loadChildren` | `(node, ctx) => Promise<HierarchyFragment>` | ? | Lazy loader for unloaded branches. |
| `nodeWidth` / `nodeHeight` | `number` | `190` / `76` | Node size in px. |
| `columnGap` / `rowGap` | `number` | `36` / `86` | Layout gaps in px. |

### Events

| Event | Payload |
| --- | --- |
| `update:modelValue` | `(document)` |
| `update:expandedIds` | `(ids: string[])` |
| `update:selectedId` | `(id: string \| null)` |
| `update:checkedIds` | `(ids: string[])` |
| `node-click` | `(node, event)` |
| `load-start` / `load-success` / `load-error` | `(node, fragment \| error)` |
| `edit-rejected` | `(error: HierarchyError)` |
| `relationship-change` | `(result: CommandResult)` |
| `import-error` / `export-error` | `(error: HierarchyError)` |

### Slots

| Slot | Props | Description |
| --- | --- | --- |
| `node` | `{ node, selected, expanded, checked, indeterminate }` | Custom node content. |
| `node-actions` | `{ node, selected, expanded, checked, indeterminate }` | Extra node actions. |
| `edge-label` | `{ edge, source, target }` | Custom edge labels. |
| `empty` | ? | Empty state content. |

### Exposed methods

| Method | Description |
| --- | --- |
| `search(query)` | Search labels and JSON data, expanding matches. |
| `focusNode(id)` | Select and scroll a node into view. |
| `importJson(text)` | Validate and import a JSON document. |
| `exportJson()` | Serialize the current document. |
| `exportPng(options)` / `exportSvg(options)` | Export the rendered graph as an image. |

## Lazy loading

Return a `HierarchyFragment` from `loadChildren`; the component handles coalescing, aborting, and transactional merging.

```ts
async function loadChildren(node: HierarchyNode, ctx: { signal: AbortSignal }): Promise<HierarchyFragment> {
  const rows = await fetch(`/api/children/${node.id}`, { signal: ctx.signal }).then(r => r.json())
  return {
    nodes: rows.map((row: any) => ({ id: row.id, label: row.label, hasChildren: row.hasChildren })),
    edges: rows.map((row: any) => ({ id: `${node.id}-${row.id}`, source: node.id, target: row.id, type: 'child' }))
  }
}
```

## Versioning and migration

- `2.x` ? Vue 3 rewrite published as `@shuyuncong/vue-hierarchy`; prereleases are published under the `next` npm tag until the stable `2.0.0`.
- `1.x` ? Vue 2.7 maintenance line published as `tapn-org-tree`, preserving the original `Vue2OrgTree` component API. See [ROADMAP.md](ROADMAP.md) for the maintenance plan.
- Migrating from `vue-org-tree` 1.x: convert nested `children` trees into a flat `nodes` + `edges` document and rename `@on-node-click` to `node-click` (payload order is `(node, event)`).

## Development

Requires Node `20.19+` or `22.12+` and npm `10+`.

```bash
npm ci
npm run dev          # Vite demo server at http://localhost:8080/
npm test             # unit and component tests (Vitest)
npm run test:e2e     # Chromium smoke tests for the production demo
npm run verify       # typecheck, tests, benchmark, builds, and package verification
npm run build        # ESM/CJS library plus TypeScript declarations and CSS in dist/
npm run build:demo   # GitHub Pages demo in demo-dist/
npm run test:package # install and validate the generated npm tarball
```

## Credits and license

This project is a Vue 3 continuation of [hukaibaihu/vue-org-tree](https://github.com/hukaibaihu/vue-org-tree), retaining the upstream MIT copyright notice (`Copyright (c) 2018 Ste7en and others`). Released under the [MIT License](LICENSE).


## 中文简介

Vue Hierarchy 是一个基于 Vue 3 + TypeScript 的可编辑层级、谱系、权限与关系可视化框架：一份带类型的节点-边文档即可驱动组织架构图、权限 DAG、真实家谱和懒加载关系视图。当前版本 `2.0.0-alpha.1` 通过 npm `next` tag 发布（`@shuyuncong/vue-hierarchy`）；Vue 2 兼容线为 `tapn-org-tree`（`1.x`，维护中）。完整中文文档见 [README.zh-CN.md](README.zh-CN.md)，在线演示：https://shuyuncong.github.io/vue-org-tree/
