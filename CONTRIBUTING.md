# Contributing

感谢你参与 Vue Org Tree。提交代码前，请先搜索现有 Issue；缺陷使用 Bug report，功能建议使用 Feature request。

## 开发环境

需要 Node `20.19+` 或 `22.12+`、npm `10+`：

```bash
npm ci
npm run dev
```

组件源码位于 `src/components/org-tree/`，演示位于 `src/components/OrgTreeDemo.vue`，测试位于 `test/`。`1.x` 必须保持 Vue 2.7 的公开 props、事件和插件安装方式兼容；Vue 3 设计请先在 Issue 中讨论。

## 提交前检查

```bash
npm test
npm run build
npm run build:demo
npm run test:package
```

涉及布局、缩放、截图或肩膀节点时，再运行 `npm run test:e2e` 并在当前 Chrome/Edge 中手工检查。提交信息使用简短祈使句，例如 `Fix custom-field branch expansion`。

Pull Request 应说明问题、实现方式、兼容性影响和验证结果；视觉变化需附截图或录屏。不要提交 `dist/`、`demo-dist/` 或依赖目录。
