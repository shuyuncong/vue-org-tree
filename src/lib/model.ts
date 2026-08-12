import { HierarchyError } from './errors'
import type {
  HierarchyDocument,
  HierarchyEdge,
  HierarchyFragment,
  HierarchyNode,
  ImportLimits,
  JSONValue,
  SearchMatch
} from './types'

export const DEFAULT_IMPORT_LIMITS: ImportLimits = {
  maxBytes: 5 * 1024 * 1024,
  maxDepth: 64,
  maxNodes: 100_000,
  maxEdges: 200_000
}

const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor'])
const familyRelationships = new Set(['biological', 'adoptive', 'step', 'guardian'])
const spouseRelationships = new Set(['married', 'partnered', 'separated', 'divorced', 'widowed'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export interface GraphIndex<T extends JSONValue = JSONValue> {
  nodes: Map<string, HierarchyNode<T>>
  incomingChildren: Map<string, HierarchyEdge<T>[]>
  outgoingChildren: Map<string, HierarchyEdge<T>[]>
  related: Map<string, HierarchyEdge<T>[]>
  order: Map<string, number>
}

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HierarchyError('INVALID_DOCUMENT', `${field} must be a non-empty string`)
  }
}

function assertOptionalBoolean(value: unknown, field: string) {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new HierarchyError('INVALID_DOCUMENT', `${field} must be a boolean`)
  }
}

function assertOptionalString(value: unknown, field: string) {
  if (value !== undefined && typeof value !== 'string') {
    throw new HierarchyError('INVALID_DOCUMENT', `${field} must be a string`)
  }
}

function assertFamilyId(value: unknown, edgeId: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HierarchyError('INVALID_RELATIONSHIP', `Edge ${edgeId} familyId must be a non-empty string`)
  }
}

export function isJsonValue(value: unknown, maxDepth = DEFAULT_IMPORT_LIMITS.maxDepth, depth = 0): value is JSONValue {
  if (depth > maxDepth) return false
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(item => isJsonValue(item, maxDepth, depth + 1))
  if (typeof value !== 'object') return false
  const object = value as Record<string, unknown>
  return Object.keys(object).every(key => !dangerousKeys.has(key) && isJsonValue(object[key], maxDepth, depth + 1))
}

export function createIndex<T extends JSONValue>(document: HierarchyDocument<T>): GraphIndex<T> {
  const nodes = new Map<string, HierarchyNode<T>>()
  const incomingChildren = new Map<string, HierarchyEdge<T>[]>()
  const outgoingChildren = new Map<string, HierarchyEdge<T>[]>()
  const related = new Map<string, HierarchyEdge<T>[]>()
  const order = new Map<string, number>()
  document.nodes.forEach((node, index) => {
    nodes.set(node.id, node)
    order.set(node.id, index)
  })
  for (const edge of document.edges) {
    if (!related.has(edge.source)) related.set(edge.source, [])
    if (!related.has(edge.target)) related.set(edge.target, [])
    related.get(edge.source)!.push(edge)
    related.get(edge.target)!.push(edge)
    if (edge.type === 'child') {
      if (!outgoingChildren.has(edge.source)) outgoingChildren.set(edge.source, [])
      if (!incomingChildren.has(edge.target)) incomingChildren.set(edge.target, [])
      outgoingChildren.get(edge.source)!.push(edge)
      incomingChildren.get(edge.target)!.push(edge)
    }
  }
  return { nodes, incomingChildren, outgoingChildren, related, order }
}

function assertNoChildCycle<T extends JSONValue>(document: HierarchyDocument<T>) {
  const index = createIndex(document)
  const incomingCount = new Map(document.nodes.map(node => [node.id, index.incomingChildren.get(node.id)?.length ?? 0]))
  const queue = document.nodes.filter(node => incomingCount.get(node.id) === 0).map(node => node.id)
  let visited = 0
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor]
    visited++
    for (const edge of index.outgoingChildren.get(id) ?? []) {
      const nextCount = (incomingCount.get(edge.target) ?? 0) - 1
      incomingCount.set(edge.target, nextCount)
      if (nextCount === 0) queue.push(edge.target)
    }
  }
  if (visited !== document.nodes.length) {
    const cycleNode = document.nodes.find(node => (incomingCount.get(node.id) ?? 0) > 0)
    throw new HierarchyError('CHILD_CYCLE', `Child relationship cycle detected at ${cycleNode?.id ?? 'unknown'}`)
  }
}

export function validateDocument<T extends JSONValue>(document: HierarchyDocument<T>, limits: ImportLimits = DEFAULT_IMPORT_LIMITS) {
  if (!isRecord(document) || document.version !== '2.0') {
    throw new HierarchyError('INVALID_DOCUMENT', 'Document version must be 2.0')
  }
  if (!Array.isArray(document.nodes) || !Array.isArray(document.edges)) {
    throw new HierarchyError('INVALID_DOCUMENT', 'Document nodes and edges must be arrays')
  }
  if (document.nodes.length > limits.maxNodes || document.edges.length > limits.maxEdges) {
    throw new HierarchyError('IMPORT_LIMIT', 'Document exceeds node or edge limits')
  }
  const nodeIds = new Set<string>()
  for (const value of document.nodes as unknown[]) {
    if (!isRecord(value)) throw new HierarchyError('INVALID_DOCUMENT', 'Every node must be an object')
    const node = value as unknown as HierarchyNode<T>
    assertString(node.id, 'node.id')
    assertString(node.label, 'node.label')
    assertOptionalBoolean(node.hasChildren, `node ${node.id} hasChildren`)
    assertOptionalBoolean(node.childrenLoaded, `node ${node.id} childrenLoaded`)
    assertOptionalBoolean(node.disabled, `node ${node.id} disabled`)
    if (nodeIds.has(node.id)) throw new HierarchyError('DUPLICATE_ID', `Duplicate node id: ${node.id}`)
    if (node.data !== undefined && !isJsonValue(node.data, limits.maxDepth)) {
      throw new HierarchyError('INVALID_DOCUMENT', `Node ${node.id} data must be valid JSON`)
    }
    nodeIds.add(node.id)
  }
  const edgeIds = new Set<string>()
  const spouseKeys = new Set<string>()
  const crossKeys = new Set<string>()
  for (const value of document.edges as unknown[]) {
    if (!isRecord(value)) throw new HierarchyError('INVALID_DOCUMENT', 'Every edge must be an object')
    const edge = value as unknown as HierarchyEdge<T>
    assertString(edge.id, 'edge.id')
    assertString(edge.source, 'edge.source')
    assertString(edge.target, 'edge.target')
    assertOptionalString(edge.label, `edge ${edge.id} label`)
    if (edgeIds.has(edge.id)) throw new HierarchyError('DUPLICATE_ID', `Duplicate edge id: ${edge.id}`)
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new HierarchyError('MISSING_NODE', `Edge ${edge.id} references a missing node`)
    }
    if (edge.source === edge.target) throw new HierarchyError('INVALID_RELATIONSHIP', `Edge ${edge.id} cannot connect a node to itself`)
    if (edge.data !== undefined && !isJsonValue(edge.data, limits.maxDepth)) {
      throw new HierarchyError('INVALID_DOCUMENT', `Edge ${edge.id} data must be valid JSON`)
    }
    if (edge.type === 'child') {
      if (edge.relationship && edge.relationship !== 'hierarchy' && !familyRelationships.has(edge.relationship)) {
        throw new HierarchyError('INVALID_RELATIONSHIP', `Invalid child relationship on ${edge.id}`)
      }
      if (edge.relationship && edge.relationship !== 'hierarchy') {
        assertFamilyId(edge.familyId, edge.id)
      }
      if ((!edge.relationship || edge.relationship === 'hierarchy') && 'familyId' in edge && edge.familyId) {
        throw new HierarchyError('INVALID_RELATIONSHIP', `Structural child edge ${(edge as HierarchyEdge<T>).id} cannot have familyId`)
      }
    } else if (edge.type === 'spouse') {
      assertFamilyId(edge.familyId, edge.id)
      if (!spouseRelationships.has(edge.relationship)) {
        throw new HierarchyError('INVALID_RELATIONSHIP', `Spouse edge ${edge.id} requires familyId and a valid relationship`)
      }
      const pair = [edge.source, edge.target].sort().join('|')
      const key = `${pair}|${edge.familyId}`
      if (spouseKeys.has(key)) throw new HierarchyError('INVALID_RELATIONSHIP', `Duplicate spouse relationship for family ${edge.familyId}`)
      spouseKeys.add(key)
    } else if (edge.type === 'cross') {
      assertString(edge.relationship, `cross edge ${edge.id} relationship`)
      assertOptionalBoolean(edge.directed, `cross edge ${edge.id} directed`)
      const endpoints = edge.directed ? `${edge.source}|${edge.target}` : [edge.source, edge.target].sort().join('|')
      const key = `${endpoints}|${edge.relationship.trim()}`
      if (crossKeys.has(key)) throw new HierarchyError('INVALID_RELATIONSHIP', `Parallel cross edges require distinct relationship labels: ${edge.id}`)
      crossKeys.add(key)
    } else {
      throw new HierarchyError('INVALID_RELATIONSHIP', 'Unknown edge type')
    }
    edgeIds.add(edge.id)
  }
  assertNoChildCycle(document)
  return document
}

export function normalizeDocument<T extends JSONValue>(document: HierarchyDocument<T>): HierarchyDocument<T> {
  return {
    version: '2.0',
    nodes: document.nodes.map(node => ({ ...node })),
    edges: document.edges.map(edge => edge.type === 'cross' ? { ...edge, directed: edge.directed ?? false } : { ...edge })
  }
}

export function getRootIds<T extends JSONValue>(document: HierarchyDocument<T>) {
  const index = createIndex(document)
  return document.nodes.filter(node => !(index.incomingChildren.get(node.id)?.length)).map(node => node.id)
}

export function getAncestorIds<T extends JSONValue>(document: HierarchyDocument<T>, nodeId: string) {
  const index = createIndex(document)
  const ancestors = new Set<string>()
  const queue = [nodeId]
  while (queue.length) {
    const current = queue.shift()!
    for (const edge of index.incomingChildren.get(current) ?? []) {
      if (!ancestors.has(edge.source)) {
        ancestors.add(edge.source)
        queue.push(edge.source)
      }
    }
  }
  return document.nodes.filter(node => ancestors.has(node.id)).map(node => node.id)
}

export function searchHierarchy<T extends JSONValue>(document: HierarchyDocument<T>, query: string): SearchMatch<T>[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return []
  return document.nodes
    .filter(node => `${node.label} ${node.data === undefined ? '' : JSON.stringify(node.data)}`.toLocaleLowerCase().includes(normalized))
    .map(node => ({ node, ancestorIds: getAncestorIds(document, node.id) }))
}

export function getVisibleNodeIds<T extends JSONValue>(document: HierarchyDocument<T>, expandedIds: Iterable<string>) {
  const expanded = new Set(expandedIds)
  const index = createIndex(document)
  const visible = new Set<string>()
  const queue = getRootIds(document)
  for (const root of queue) visible.add(root)
  while (queue.length) {
    const current = queue.shift()!
    if (!expanded.has(current)) continue
    for (const edge of index.outgoingChildren.get(current) ?? []) {
      if (!visible.has(edge.target)) {
        visible.add(edge.target)
        queue.push(edge.target)
      }
    }
  }
  return visible
}

function jsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => jsonEqual(value, right[index]))
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && jsonEqual(left[key], right[key]))
}

export function mergeHierarchyFragment<T extends JSONValue>(
  document: HierarchyDocument<T>,
  parentId: string,
  fragment: HierarchyFragment<T>
) {
  const current = createIndex(document)
  const parent = current.nodes.get(parentId)
  if (!parent || parent.childrenLoaded) throw new HierarchyError('STALE_LOAD', `Lazy load for ${parentId} is stale`)
  const addedNodes: HierarchyNode<T>[] = []
  const addedEdges: HierarchyEdge<T>[] = []
  const edgeById = new Map(document.edges.map(edge => [edge.id, edge]))
  for (const node of fragment.nodes) {
    const existing = current.nodes.get(node.id)
    if (existing && !jsonEqual(existing, node)) throw new HierarchyError('LAZY_CONFLICT', `Conflicting lazy node: ${node.id}`)
    if (!existing) addedNodes.push({ ...node })
  }
  for (const edge of fragment.edges) {
    const existing = edgeById.get(edge.id)
    if (existing && !jsonEqual(existing, edge)) throw new HierarchyError('LAZY_CONFLICT', `Conflicting lazy edge: ${edge.id}`)
    if (!existing) addedEdges.push({ ...edge })
  }
  const next = normalizeDocument<T>({
    version: '2.0',
    nodes: document.nodes.map(node => node.id === parentId ? { ...node, childrenLoaded: true } : { ...node }).concat(addedNodes),
    edges: document.edges.map(edge => ({ ...edge })).concat(addedEdges)
  })
  validateDocument(next)
  return next
}

export function serializeHierarchy<T extends JSONValue>(document: HierarchyDocument<T>, space = 2) {
  validateDocument(document)
  return JSON.stringify(normalizeDocument(document), null, space)
}

export function parseHierarchyJson<T extends JSONValue = JSONValue>(text: string, overrides: Partial<ImportLimits> = {}) {
  const limits = { ...DEFAULT_IMPORT_LIMITS, ...overrides }
  if (new TextEncoder().encode(text).byteLength > limits.maxBytes) {
    throw new HierarchyError('IMPORT_LIMIT', 'JSON input exceeds the byte limit')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text, (key, value) => {
      if (dangerousKeys.has(key)) throw new HierarchyError('INVALID_DOCUMENT', `Dangerous JSON key: ${key}`)
      return value
    })
  } catch (error) {
    if (error instanceof HierarchyError) throw error
    throw new HierarchyError('INVALID_DOCUMENT', error instanceof Error ? error.message : 'Invalid JSON')
  }
  if (!isJsonValue(parsed, limits.maxDepth)) throw new HierarchyError('INVALID_DOCUMENT', 'Input contains unsupported JSON values or excessive nesting')
  const document = parsed as unknown as HierarchyDocument<T>
  validateDocument(document, limits)
  return normalizeDocument(document)
}
