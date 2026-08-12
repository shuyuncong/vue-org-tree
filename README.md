# Vue Org Tree

[English summary](#english-summary) · [现有在线演示](https://shuyuncong.github.io/vue-org-tree/docs/#/demo) · [路线图](https://github.com/shuyuncong/vue-org-tree/blob/master/ROADMAP.md) · [参与贡献](https://github.com/shuyuncong/vue-org-tree/blob/master/CONTRIBUTING.md)

一个面向 Vue 2.7 的可定制组织结构树组件。除普通组织树之外，本项目还支持自定义节点内容、展开/折叠、选中状态、鼠标与拖放事件、连接线样式，以及位于主节点两侧的“肩膀节点”。仓库内的演示另外提供缩放和截图能力。

![组织结构树演示](https://raw.githubusercontent.com/shuyuncong/vue-org-tree/master/static/images/example.png)

## 项目状态

- `1.x`：Vue 2.7 稳定维护线，保持现有组件 API，接受缺陷修复、测试、文档和安全改进。
- `2.x`：计划中的 Vue 3 版本，将作为独立兼容工作推进，详见 [ROADMAP.md](https://github.com/shuyuncong/vue-org-tree/blob/master/ROADMAP.md)。
- Vue 2 已停止官方维护；新项目如无兼容负担，建议优先评估 Vue 3 生态。

## 安装

公共版本发布后使用 npm 安装：

```bash
npm install tapn-org-tree
```

```js
import Vue from 'vue'
import Vue2OrgTree from 'tapn-org-tree'
import 'tapn-org-tree/style.css'

Vue.use(Vue2OrgTree)
```

```vue
<template>
  <vue2-org-tree
    :data="tree"
    :collapsable="true"
    @on-node-click="onNodeClick"
  />
</template>

<script>
export default {
  data() {
    return {
      tree: {
        label: '总部',
        expand: true,
        children: [
          { label: '研发中心', children: [] },
          { label: '运营中心', children: [] }
        ]
      }
    }
  },
  methods: {
    onNodeClick(event, node) {
      console.log(node)
    }
  }
}
</script>
```

## 数据与 API

默认节点字段为 `label`、`children` 和 `expand`。可通过 `props` 适配其他数据结构：

```vue
<vue2-org-tree
  :data="tree"
  :props="{ label: 'name', children: 'nodes', expand: 'open' }"
/>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `Object` | 必填 | 根节点数据 |
| `props` | `Object` | `{ label, children, expand }` | 字段映射 |
| `horizontal` | `Boolean` | `false` | 使用水平布局 |
| `collapsable` | `Boolean` | `false` | 显示展开/折叠按钮 |
| `render-content` | `Function` | — | 自定义节点内容，参数为 `(h, node)`；可返回 VNode，或仅用于可信内容的 HTML 字符串 |
| `label-width` | `String \| Number` | `150px` | 节点宽度 |
| `label-height` | `String \| Number` | `20px` | 节点最小高度 |
| `label-class-name` | `String \| Function` | — | 节点类名或 `(node) => className` |
| `selected-key` | `String` | — | 判断节点是否选中的字段 |
| `selected-class-name` | `String \| Function` | — | 选中节点类名 |

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `on-expand` | `(node, expanded)` | 展开状态改变 |
| `resetOrg` | `(node)` | 展开后完成内部布局更新 |
| `on-node-click` | `(event, node)` | 点击节点 |
| `on-node-focus` | `(event, node)` | 节点获得焦点 |
| `on-node-mouseover` | `(event, node)` | 鼠标进入节点 |
| `on-node-mouseout` | `(event, node)` | 鼠标离开节点 |
| `on-node-drag-start` | `(event, node)` | 开始拖动 |
| `on-node-drag-over` | `(event, node)` | 拖动经过节点 |
| `on-node-drop` | `(event, draggedNode, targetNode)` | 放置节点 |

### 扩展节点字段

演示使用以下可选字段：`stuckNeckFlag`、`leftOrRight`、`labelWidthExpand`、`lineColor`、`lineWidthHorizontal`、`lineWidthVertical`、`backColor` 和 `borderStyle`。参见 [`OrgTreeDemo.vue`](https://github.com/shuyuncong/vue-org-tree/blob/master/src/components/OrgTreeDemo.vue)。

`render-content` 返回字符串时会按 HTML 渲染。只应传入可信内容；对于用户或服务端数据，请返回 VNode，让 Vue 完成文本转义。

## 本地开发

维护工具要求 Node `20.19+` 或 `22.12+`，npm `10+`；组件消费者使用 Vue `2.7.x`。支持当前 Chrome、Edge、Firefox 和 Safari，不再保证 IE。

```bash
npm ci
npm run dev          # http://localhost:8080/
npm test             # 组件单元测试
npm run test:e2e     # Chromium 演示烟雾测试
npm run build        # ESM/UMD/CSS 库产物
npm run build:demo   # GitHub Pages 演示产物
npm run test:package # 安装并检查本地 npm tarball
```

## 致谢与许可

本项目基于 [hukaibaihu/vue-org-tree](https://github.com/hukaibaihu/vue-org-tree) 的 MIT 许可实现继续扩展，并保留其版权声明。项目按 [MIT License](https://github.com/shuyuncong/vue-org-tree/blob/master/LICENSE) 发布。

## English summary

Vue Org Tree is a maintained Vue 2.7 organization-chart component with custom rendering, collapsible branches, selection and pointer/drag events, connector styling, and specialized side nodes. Version `1.x` preserves Vue 2 compatibility; Vue 3 support is planned for a separate `2.x` line. See the Chinese sections above for the complete API and development guide.
