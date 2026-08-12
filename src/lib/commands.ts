import { HierarchyError } from './errors'
import { normalizeDocument, validateDocument } from './model'
import type {
  CommandResult,
  HierarchyDocument,
  HierarchyEdge,
  JSONValue,
  RelationshipInput,
  ReparentOptions
} from './types'

let generatedId = 0

function createEdgeId<T extends JSONValue>(document: HierarchyDocument<T>, base: string, factory?: () => string) {
  const ids = new Set(document.edges.map(edge => edge.id))
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const candidate = factory ? factory() : `${base}-${++generatedId}`
    if (candidate && !ids.has(candidate)) return candidate
  }
  throw new HierarchyError('EDIT_REJECTED', 'Unable to generate a unique edge id')
}

function success<T extends JSONValue>(document: HierarchyDocument<T>, addedEdges: HierarchyEdge<T>[], removedEdges: HierarchyEdge<T>[]): CommandResult<T> {
  return { ok: true, document, addedEdges, removedEdges }
}

function failure(error: unknown): CommandResult<never> {
  return {
    ok: false,
    error: error instanceof HierarchyError ? error : new HierarchyError('EDIT_REJECTED', error instanceof Error ? error.message : String(error))
  }
}

export function addRelationship<T extends JSONValue>(
  document: HierarchyDocument<T>,
  input: RelationshipInput<T>,
  options: { idFactory?: () => string } = {}
): CommandResult<T> {
  try {
    const id = input.id || createEdgeId(document, `${input.type}-${input.source}-${input.target}`, options.idFactory)
    const edge = { ...input, id } as HierarchyEdge<T>
    const next = normalizeDocument<T>({ version: '2.0', nodes: document.nodes.map(node => ({ ...node })), edges: document.edges.map(item => ({ ...item })).concat(edge) })
    validateDocument(next)
    return success(next, [next.edges.find(item => item.id === id) ?? edge], [])
  } catch (error) {
    return failure(error) as CommandResult<T>
  }
}

export function removeRelationship<T extends JSONValue>(document: HierarchyDocument<T>, edgeId: string): CommandResult<T> {
  const removed = document.edges.find(edge => edge.id === edgeId)
  if (!removed) return failure(new HierarchyError('EDIT_REJECTED', `Unknown edge: ${edgeId}`)) as CommandResult<T>
  const next = {
    version: '2.0' as const,
    nodes: document.nodes.map(node => ({ ...node })),
    edges: document.edges.filter(edge => edge.id !== edgeId).map(edge => ({ ...edge }))
  }
  return success(next, [], [removed])
}

export function reparentNode<T extends JSONValue>(
  document: HierarchyDocument<T>,
  sourceId: string,
  targetId: string,
  options: ReparentOptions<T> = {}
): CommandResult<T> {
  try {
    if (sourceId === targetId) throw new HierarchyError('EDIT_REJECTED', 'A node cannot be its own parent')
    if (!document.nodes.some(node => node.id === sourceId) || !document.nodes.some(node => node.id === targetId)) {
      throw new HierarchyError('MISSING_NODE', 'Drag source or target does not exist')
    }
    const parentMode = options.parentMode ?? 'single'
    const removedEdges = parentMode === 'single'
      ? document.edges.filter(edge => edge.type === 'child' && edge.target === sourceId)
      : []
    const remaining = document.edges.filter(edge => !removedEdges.includes(edge))
    const duplicate = remaining.find(edge => edge.type === 'child' && edge.source === targetId && edge.target === sourceId)
    if (duplicate) return success(document, [], removedEdges)
    const relationship = options.edge?.relationship
    const base = `${relationship && relationship !== 'hierarchy' ? 'family-child' : 'child'}-${targetId}-${sourceId}`
    const edge: HierarchyEdge<T> = relationship && relationship !== 'hierarchy'
      ? {
          id: createEdgeId({ ...document, edges: remaining }, base, options.idFactory),
          source: targetId,
          target: sourceId,
          type: 'child',
          relationship,
          familyId: options.edge?.familyId || `family-${targetId}-${sourceId}`,
          label: options.edge?.label,
          data: options.edge?.data
        }
      : {
          id: createEdgeId({ ...document, edges: remaining }, base, options.idFactory),
          source: targetId,
          target: sourceId,
          type: 'child',
          relationship: 'hierarchy',
          label: options.edge?.label,
          data: options.edge?.data
        }
    const next = normalizeDocument<T>({
      version: '2.0' as const,
      nodes: document.nodes.map(node => ({ ...node })),
      edges: remaining.map(item => ({ ...item })).concat(edge)
    })
    validateDocument(next)
    return success(next, [edge], removedEdges)
  } catch (error) {
    return failure(error) as CommandResult<T>
  }
}
