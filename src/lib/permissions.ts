import { createIndex } from './model'
import type { HierarchyDocument, JSONValue, PermissionState } from './types'

function collectExcludedSubgraph<T extends JSONValue>(document: HierarchyDocument<T>) {
  const index = createIndex(document)
  const excluded = new Set(document.nodes.filter(node => node.disabled).map(node => node.id))
  const queue = [...excluded]
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const edge of index.outgoingChildren.get(queue[cursor]) ?? []) {
      if (excluded.has(edge.target)) continue
      excluded.add(edge.target)
      queue.push(edge.target)
    }
  }
  return excluded
}

function collectParticipatingDescendants<T extends JSONValue>(document: HierarchyDocument<T>, nodeId: string, excluded: Set<string>) {
  const index = createIndex(document)
  const result = new Set<string>()
  const queue = [nodeId]
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]
    if (excluded.has(current) || result.has(current)) continue
    result.add(current)
    for (const edge of index.outgoingChildren.get(current) ?? []) queue.push(edge.target)
  }
  return result
}

export function calculatePermissionState<T extends JSONValue>(document: HierarchyDocument<T>, checkedIds: Iterable<string>): PermissionState {
  const checked = new Set(checkedIds)
  const indeterminate = new Set<string>()
  const excluded = collectExcludedSubgraph(document)
  const index = createIndex(document)
  const incomingCount = new Map<string, number>()
  const queue: string[] = []
  for (const node of document.nodes) {
    if (excluded.has(node.id)) continue
    const count = (index.incomingChildren.get(node.id) ?? []).filter(edge => !excluded.has(edge.source)).length
    incomingCount.set(node.id, count)
    if (count === 0) queue.push(node.id)
  }
  const order: string[] = []
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor]
    order.push(id)
    for (const edge of index.outgoingChildren.get(id) ?? []) {
      if (excluded.has(edge.target)) continue
      const count = (incomingCount.get(edge.target) ?? 0) - 1
      incomingCount.set(edge.target, count)
      if (count === 0) queue.push(edge.target)
    }
  }
  const state = new Map<string, 'checked' | 'indeterminate' | 'unchecked'>()
  for (let cursor = order.length - 1; cursor >= 0; cursor--) {
    const id = order[cursor]
    const children = (index.outgoingChildren.get(id) ?? []).map(edge => edge.target).filter(childId => !excluded.has(childId))
    let value: 'checked' | 'indeterminate' | 'unchecked'
    if (!children.length) value = checked.has(id) ? 'checked' : 'unchecked'
    else {
      const childStates = children.map(child => state.get(child) ?? 'unchecked')
      if (childStates.every(child => child === 'checked')) value = 'checked'
      else if (childStates.some(child => child !== 'unchecked')) value = 'indeterminate'
      else value = 'unchecked'
    }
    state.set(id, value)
    if (value === 'checked') checked.add(id)
    else checked.delete(id)
    if (value === 'indeterminate') indeterminate.add(id)
  }
  return { checked, indeterminate }
}

export function togglePermission<T extends JSONValue>(
  document: HierarchyDocument<T>,
  checkedIds: Iterable<string>,
  nodeId: string,
  nextChecked: boolean,
  cascade = true
) {
  const checked = new Set(checkedIds)
  const excluded = collectExcludedSubgraph(document)
  if (!document.nodes.some(node => node.id === nodeId) || excluded.has(nodeId)) return calculatePermissionState(document, checked)
  const affected = cascade ? collectParticipatingDescendants(document, nodeId, excluded) : new Set([nodeId])
  for (const id of affected) {
    if (nextChecked) checked.add(id)
    else checked.delete(id)
  }
  return calculatePermissionState(document, checked)
}
