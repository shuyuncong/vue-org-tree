import { createIndex, getVisibleNodeIds } from './model'
import type { HierarchyDocument, HierarchyLayout, HierarchyNode, JSONValue, PositionedEdge, PositionedNode } from './types'

export interface LayoutOptions {
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
  padding?: number
}

export function createEdgePath(
  type: 'child' | 'spouse' | 'cross',
  source: { x: number; y: number },
  target: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number
) {
  const sx = source.x + nodeWidth / 2
  const sy = source.y + nodeHeight / 2
  const tx = target.x + nodeWidth / 2
  const ty = target.y + nodeHeight / 2
  if (type === 'spouse') return `M ${sx} ${sy} L ${tx} ${ty}`
  if (type === 'cross') return `M ${sx} ${sy} Q ${(sx + tx) / 2} ${Math.min(sy, ty) - 40} ${tx} ${ty}`
  const middle = (sy + ty) / 2
  return `M ${sx} ${source.y + nodeHeight} C ${sx} ${middle}, ${tx} ${middle}, ${tx} ${target.y}`
}

export function layoutHierarchy<T extends JSONValue>(
  document: HierarchyDocument<T>,
  expandedIds: Iterable<string>,
  options: LayoutOptions = {}
): HierarchyLayout<T> {
  const nodeWidth = options.nodeWidth ?? 190
  const nodeHeight = options.nodeHeight ?? 76
  const columnGap = options.columnGap ?? 36
  const rowGap = options.rowGap ?? 86
  const padding = options.padding ?? 32
  const expanded = new Set(expandedIds)
  const visible = getVisibleNodeIds(document, expanded)
  const index = createIndex(document)
  const rank = new Map<string, number>()
  const visibleNodes = document.nodes.filter(node => visible.has(node.id))
  const remaining = new Set(visibleNodes.map(node => node.id))
  while (remaining.size) {
    let progressed = false
    for (const node of visibleNodes) {
      if (!remaining.has(node.id)) continue
      const parents = (index.incomingChildren.get(node.id) ?? []).filter(edge => visible.has(edge.source))
      if (parents.every(edge => rank.has(edge.source))) {
        rank.set(node.id, parents.length ? Math.max(...parents.map(edge => rank.get(edge.source)!)) + 1 : 0)
        remaining.delete(node.id)
        progressed = true
      }
    }
    if (!progressed) {
      for (const id of remaining) rank.set(id, 0)
      break
    }
  }
  const spouseNeighbors = new Map<string, string[]>()
  for (const edge of document.edges) {
    if (edge.type !== 'spouse' || !visible.has(edge.source) || !visible.has(edge.target)) continue
    spouseNeighbors.set(edge.source, [...(spouseNeighbors.get(edge.source) ?? []), edge.target])
    spouseNeighbors.set(edge.target, [...(spouseNeighbors.get(edge.target) ?? []), edge.source])
  }
  const spouseVisited = new Set<string>()
  for (const start of spouseNeighbors.keys()) {
    if (spouseVisited.has(start)) continue
    const component: string[] = []
    const queue = [start]
    spouseVisited.add(start)
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const id = queue[cursor]
      component.push(id)
      for (const neighbor of spouseNeighbors.get(id) ?? []) {
        if (spouseVisited.has(neighbor)) continue
        spouseVisited.add(neighbor)
        queue.push(neighbor)
      }
    }
    const anchoredRanks = component
      .filter(id => (index.incomingChildren.get(id)?.length ?? 0) > 0)
      .map(id => rank.get(id) ?? 0)
    if (!anchoredRanks.length) continue
    const inherited = Math.min(...anchoredRanks)
    for (const id of component) {
      if ((index.incomingChildren.get(id)?.length ?? 0) === 0) rank.set(id, inherited)
    }
  }
  const rows = new Map<number, HierarchyNode<T>[]>()
  for (const node of visibleNodes) {
    const depth = rank.get(node.id) ?? 0
    if (!rows.has(depth)) rows.set(depth, [])
    rows.get(depth)!.push(node)
  }
  const maxColumns = Math.max(1, ...Array.from(rows.values(), row => row.length))
  const width = padding * 2 + maxColumns * nodeWidth + Math.max(0, maxColumns - 1) * columnGap
  const maxDepth = Math.max(0, ...rank.values())
  const height = padding * 2 + (maxDepth + 1) * nodeHeight + maxDepth * rowGap
  const nodes: PositionedNode<T>[] = []
  for (const [depth, row] of Array.from(rows.entries()).sort(([a], [b]) => a - b)) {
    const rowWidth = row.length * nodeWidth + Math.max(0, row.length - 1) * columnGap
    const start = (width - rowWidth) / 2
    row.forEach((node, column) => nodes.push({
      node,
      x: start + column * (nodeWidth + columnGap),
      y: padding + depth * (nodeHeight + rowGap),
      depth
    }))
  }
  const positions = new Map(nodes.map(node => [node.node.id, node]))
  const edges: PositionedEdge<T>[] = document.edges
    .filter(edge => positions.has(edge.source) && positions.has(edge.target) && (edge.type !== 'child' || expanded.has(edge.source)))
    .map(edge => {
      const source = positions.get(edge.source)!
      const target = positions.get(edge.target)!
      return {
        edge,
        path: createEdgePath(edge.type, source, target, nodeWidth, nodeHeight),
        labelX: (source.x + target.x + nodeWidth) / 2,
        labelY: (source.y + target.y + nodeHeight) / 2
      }
    })
  return { nodes, edges, width, height }
}
