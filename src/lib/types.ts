export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue }

export interface HierarchyNode<T extends JSONValue = JSONValue> {
  id: string
  label: string
  data?: T
  hasChildren?: boolean
  childrenLoaded?: boolean
  disabled?: boolean
}

export interface StructuralChildEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'child'
  relationship?: 'hierarchy'
  familyId?: never
  label?: string
  data?: T
}

export interface FamilyChildEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'child'
  relationship: 'biological' | 'adoptive' | 'step' | 'guardian'
  familyId: string
  label?: string
  data?: T
}

export interface SpouseEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'spouse'
  relationship: 'married' | 'partnered' | 'separated' | 'divorced' | 'widowed'
  familyId: string
  label?: string
  data?: T
}

export interface CrossEdge<T extends JSONValue = JSONValue> {
  id: string
  source: string
  target: string
  type: 'cross'
  relationship: string
  label?: string
  directed?: boolean
  data?: T
}

export type HierarchyEdge<T extends JSONValue = JSONValue> =
  | StructuralChildEdge<T>
  | FamilyChildEdge<T>
  | SpouseEdge<T>
  | CrossEdge<T>

export interface HierarchyDocument<T extends JSONValue = JSONValue> {
  version: '2.0'
  nodes: HierarchyNode<T>[]
  edges: HierarchyEdge<T>[]
}

export interface HierarchyFragment<T extends JSONValue = JSONValue> {
  nodes: HierarchyNode<T>[]
  edges: HierarchyEdge<T>[]
}

export type HierarchyErrorCode =
  | 'INVALID_DOCUMENT'
  | 'DUPLICATE_ID'
  | 'MISSING_NODE'
  | 'CHILD_CYCLE'
  | 'INVALID_RELATIONSHIP'
  | 'IMPORT_LIMIT'
  | 'LAZY_CONFLICT'
  | 'STALE_LOAD'
  | 'EDIT_REJECTED'
  | 'EXPORT_FAILED'

export interface ImportLimits {
  maxBytes: number
  maxDepth: number
  maxNodes: number
  maxEdges: number
}

export interface SearchMatch<T extends JSONValue = JSONValue> {
  node: HierarchyNode<T>
  ancestorIds: string[]
}

export interface ImageExportOptions {
  pixelRatio?: number
  backgroundColor?: string
  width?: number
  height?: number
}

export interface ImageExportResult<F extends 'png' | 'svg'> {
  format: F
  dataUrl: string
  width: number
  height: number
}

export interface PositionedNode<T extends JSONValue = JSONValue> {
  node: HierarchyNode<T>
  x: number
  y: number
  depth: number
}

export interface PositionedEdge<T extends JSONValue = JSONValue> {
  edge: HierarchyEdge<T>
  path: string
  labelX: number
  labelY: number
}

export interface HierarchyLayout<T extends JSONValue = JSONValue> {
  nodes: PositionedNode<T>[]
  edges: PositionedEdge<T>[]
  width: number
  height: number
}

export type RelationshipInput<T extends JSONValue = JSONValue> =
  | Omit<StructuralChildEdge<T>, 'id'> & { id?: string }
  | Omit<FamilyChildEdge<T>, 'id'> & { id?: string }
  | Omit<SpouseEdge<T>, 'id'> & { id?: string }
  | Omit<CrossEdge<T>, 'id'> & { id?: string }

export type CommandSuccess<T extends JSONValue = JSONValue> = {
  ok: true
  document: HierarchyDocument<T>
  addedEdges: HierarchyEdge<T>[]
  removedEdges: HierarchyEdge<T>[]
}

export type CommandFailure = { ok: false; error: import('./errors').HierarchyError }
export type CommandResult<T extends JSONValue = JSONValue> = CommandSuccess<T> | CommandFailure

export interface CommandOptions {
  parentMode?: 'single' | 'multiple'
  idFactory?: () => string
}

export interface ReparentOptions<T extends JSONValue = JSONValue> extends CommandOptions {
  edge?: Partial<Omit<StructuralChildEdge<T> | FamilyChildEdge<T>, 'id' | 'source' | 'target' | 'type'>>
}

export interface PermissionState {
  checked: Set<string>
  indeterminate: Set<string>
}
