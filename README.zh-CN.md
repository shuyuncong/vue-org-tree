# Vue Hierarchy

[English](README.md) | [简体中文](README.zh-CN.md)

Vue 3 + TypeScript 可编辑层级、谱系、权限与关系可视化框架。一份带类型的节点-边文档即可驱动组织架构图、权限 DAG、真实家谱和懒加载关系视图。

- 包名：`@shuyuncong/vue-hierarchy`（Vue 3，当前 `2.0.0-alpha.1` 发布在 npm `next` tag）
- Vue 2 兼容线：`tapn-org-tree` `1.x`，维护中（见[版本与迁移](#版本与迁移)）
- 协议：[MIT](LICENSE)

## 截图

| 组织架构图 | 权限树 |
| --- | --- |
| ![组织架构图](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-organization.png) | ![权限树](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-permission.png) |

| 家谱 | 大数据集 |
| --- | --- |
| ![家谱](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-genealogy.png) | ![大数据集](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/hierarchy-large.png) |

## 在线演示

https://shuyuncong.github.io/vue-org-tree/

## 特性

- 基于 Vue 3 Composition API，严格的 TypeScript 契约与 JSON 安全数据。
- 多父节点 DAG 布局：确定性的层级排布、配偶对齐、按父节点控制连线可见性。
- 家庭关联的谱系语义：双亲、多配偶、离异关系、收养与继亲角色。
- 全局权限传播：勾选、半选、禁用子图保护。
- 事务式懒加载：请求合并、中止信号、重试、过期/冲突检测。
- 不可变编辑命令：单/多父节点拖拽策略与显式关系移除。
- 搜索、JSON 导入/导出、PNG/SVG 图片导出。
- 默认无障碍：键盘导航与 ARIA live region。
- 无头插槽：节点、节点操作、连线标签与空状态均可自定义。

## 安装

```bash
npm install @shuyuncong/vue-hierarchy@next
```

## 快速开始

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

## 数据模型

文档是一个扁平的节点-边图（没有嵌套 `children`），因此多父、配偶和交叉关系都是一等公民。

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

边按 `type` 区分：

- `child` — 结构性关系（`relationship: 'hierarchy'`）或家庭关联（`biological` / `adoptive` / `step` / `guardian`，带 `familyId`）。
- `spouse` — `married` / `partnered` / `separated` / `divorced` / `widowed`，带 `familyId`。
- `cross` — 任意带标签的关系（例如 `mentor`），可选 `directed: true`。

## API 参考

### Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `HierarchyDocument` | 必填 | 受控文档（使用 `v-model`）。 |
| `expandedIds` | `string[]` | `[]` | 受控展开节点 id 列表。 |
| `selectedId` | `string \| null` | `null` | 受控选中节点 id。 |
| `checkedIds` | `string[]` | `[]` | 受控勾选节点 id 列表（权限模式）。 |
| `editable` | `boolean` | `false` | 启用拖拽改父与关系移除。 |
| `parentMode` | `'single' \| 'multiple'` | `'single'` | 拖拽行为：替换现有父节点，或新增一个父节点。 |
| `searchable` | `boolean` | `true` | 显示搜索框并自动展开匹配项。 |
| `checkable` | `boolean` | `false` | 显示权限勾选框并全局 DAG 传播。 |
| `cascadeChecks` | `boolean` | `true` | 勾选状态级联到后代。 |
| `loadChildren` | `(node, ctx) => Promise<HierarchyFragment>` | — | 未加载分支的懒加载函数。 |
| `nodeWidth` / `nodeHeight` | `number` | `190` / `76` | 节点尺寸（px）。 |
| `columnGap` / `rowGap` | `number` | `36` / `86` | 布局间距（px）。 |

### Events

| 事件 | 载荷 |
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

| 插槽 | Props | 说明 |
| --- | --- | --- |
| `node` | `{ node, selected, expanded, checked, indeterminate }` | 自定义节点内容。 |
| `node-actions` | `{ node, selected, expanded, checked, indeterminate }` | 额外的节点操作。 |
| `edge-label` | `{ edge, source, target }` | 自定义连线标签。 |
| `empty` | — | 空状态内容。 |

### 暴露的方法

| 方法 | 说明 |
| --- | --- |
| `search(query)` | 搜索标签与 JSON 数据，并展开匹配项。 |
| `focusNode(id)` | 选中节点并将其滚动到可视区域。 |
| `importJson(text)` | 校验并导入 JSON 文档。 |
| `exportJson()` | 序列化当前文档。 |
| `exportPng(options)` / `exportSvg(options)` | 将渲染结果导出为图片。 |

## 懒加载

从 `loadChildren` 返回 `HierarchyFragment`，组件会处理请求合并、中止与事务式合并。

```ts
async function loadChildren(node: HierarchyNode, ctx: { signal: AbortSignal }): Promise<HierarchyFragment> {
  const rows = await fetch(`/api/children/${node.id}`, { signal: ctx.signal }).then(r => r.json())
  return {
    nodes: rows.map((row: any) => ({ id: row.id, label: row.label, hasChildren: row.hasChildren })),
    edges: rows.map((row: any) => ({ id: `${node.id}-${row.id}`, source: node.id, target: row.id, type: 'child' }))
  }
}
```

## 版本与迁移

- `2.x` — Vue 3 重写版，发布为 `@shuyuncong/vue-hierarchy`；稳定版 `2.0.0` 发布前，预发布版本挂在 npm `next` tag 下。
- `1.x` — Vue 2.7 维护线，发布为 `tapn-org-tree`，保留原有 `Vue2OrgTree` 组件 API。维护计划见 [ROADMAP.md](ROADMAP.md)。
- 从 `vue-org-tree` 1.x 迁移：将嵌套的 `children` 树转换为扁平的 `nodes` + `edges` 文档，并把 `@on-node-click` 改名为 `node-click`（载荷顺序为 `(node, event)`）。

## 开发

需要 Node `20.19+` 或 `22.12+` 与 npm `10+`。

```bash
npm ci
npm run dev          # Vite 演示服务器 http://localhost:8080/
npm test             # 单元与组件测试（Vitest）
npm run test:e2e     # 生产演示的 Chromium 冒烟测试
npm run verify       # 类型检查、测试、基准测试、构建与包校验
npm run build        # ESM/CJS 库 + TypeScript 声明 + CSS，输出到 dist/
npm run build:demo   # GitHub Pages 演示，输出到 demo-dist/
npm run test:package # 安装并校验生成的 npm tarball
```

## 致谢与许可

本项目是 [hukaibaihu/vue-org-tree](https://github.com/hukaibaihu/vue-org-tree) 的 Vue 3 延续，保留上游 MIT 版权声明（`Copyright (c) 2018 Ste7en and others`）。基于 [MIT 协议](LICENSE) 发布。
