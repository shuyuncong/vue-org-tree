import { describe, expect, it } from 'vitest'
import { HierarchyError } from '../../src/lib/errors'
import {
  createIndex,
  getAncestorIds,
  getRootIds,
  getVisibleNodeIds,
  mergeHierarchyFragment,
  parseHierarchyJson,
  searchHierarchy,
  serializeHierarchy,
  validateDocument
} from '../../src/lib/model'
import type { HierarchyDocument } from '../../src/lib/types'

function document(): HierarchyDocument {
  return {
    version: '2.0',
    nodes: [
      { id: 'alex', label: 'Alex', data: { role: 'parent' } },
      { id: 'sam', label: 'Sam' },
      { id: 'casey', label: 'Casey', hasChildren: true, childrenLoaded: false },
      { id: 'lee', label: 'Lee' }
    ],
    edges: [
      { id: 'marriage', source: 'alex', target: 'sam', type: 'spouse', relationship: 'married', familyId: 'family-a' },
      { id: 'alex-casey', source: 'alex', target: 'casey', type: 'child', relationship: 'biological', familyId: 'family-a' },
      { id: 'sam-casey', source: 'sam', target: 'casey', type: 'child', relationship: 'biological', familyId: 'family-a' },
      { id: 'mentor', source: 'alex', target: 'lee', type: 'cross', relationship: 'mentor', directed: true }
    ]
  }
}

function expectCode(action: () => unknown, code: HierarchyError['code']) {
  expect(action).toThrowError(expect.objectContaining({ code }))
}

describe('hierarchy model', () => {
  it('validates a genealogy document with dual parents and a cross relationship', () => {
    expect(validateDocument(document())).toEqual(document())
  })

  it('builds child and symmetric relationship indexes', () => {
    const index = createIndex(document())
    expect(index.incomingChildren.get('casey')?.map(edge => edge.source)).toEqual(['alex', 'sam'])
    expect(index.related.get('alex')?.map(edge => edge.id)).toContain('marriage')
    expect(index.related.get('sam')?.map(edge => edge.id)).toContain('marriage')
  })

  it('finds roots and every ancestor in a multi-parent graph', () => {
    expect(getRootIds(document())).toEqual(['alex', 'sam', 'lee'])
    expect(getAncestorIds(document(), 'casey')).toEqual(['alex', 'sam'])
  })

  it('keeps a multi-parent child visible through either expanded parent', () => {
    expect(getVisibleNodeIds(document(), ['alex'])).toContain('casey')
    expect(getVisibleNodeIds(document(), ['sam'])).toContain('casey')
  })

  it('searches labels and JSON data and returns ancestor paths', () => {
    expect(searchHierarchy(document(), 'parent')[0]).toMatchObject({ node: { id: 'alex' }, ancestorIds: [] })
    expect(searchHierarchy(document(), 'casey')[0].ancestorIds).toEqual(['alex', 'sam'])
    expect(searchHierarchy(document(), '  ')).toEqual([])
  })

  it('serializes and parses without semantic loss', () => {
    expect(parseHierarchyJson(serializeHierarchy(document()))).toEqual(document())
  })

  it('rejects duplicate nodes and missing endpoints', () => {
    const duplicate = document()
    duplicate.nodes.push({ id: 'alex', label: 'Duplicate' })
    expectCode(() => validateDocument(duplicate), 'DUPLICATE_ID')

    const missing = document()
    missing.edges.push({ id: 'missing', source: 'alex', target: 'unknown', type: 'child' })
    expectCode(() => validateDocument(missing), 'MISSING_NODE')
  })

  it('rejects child cycles and self relationships', () => {
    const cycle = document()
    cycle.edges.push({ id: 'cycle', source: 'casey', target: 'alex', type: 'child' })
    expectCode(() => validateDocument(cycle), 'CHILD_CYCLE')

    const self = document()
    self.edges.push({ id: 'self', source: 'lee', target: 'lee', type: 'cross', relationship: 'peer' })
    expectCode(() => validateDocument(self), 'INVALID_RELATIONSHIP')
  })

  it('rejects invalid family and spouse relationships', () => {
    const family = document() as unknown as { version: '2.0'; nodes: HierarchyDocument['nodes']; edges: Array<Record<string, unknown>> }
    family.edges.push({ id: 'bad-family', source: 'alex', target: 'lee', type: 'child', relationship: 'adoptive' })
    expectCode(() => validateDocument(family as unknown as HierarchyDocument), 'INVALID_RELATIONSHIP')

    const spouse = document() as unknown as { version: '2.0'; nodes: HierarchyDocument['nodes']; edges: Array<Record<string, unknown>> }
    spouse.edges.push({ id: 'bad-spouse', source: 'sam', target: 'lee', type: 'spouse', relationship: 'friend', familyId: 'family-b' })
    expectCode(() => validateDocument(spouse as unknown as HierarchyDocument), 'INVALID_RELATIONSHIP')
  })

  it('rejects dangerous keys, excessive nesting, and byte limits on import', () => {
    expectCode(() => parseHierarchyJson('{"version":"2.0","nodes":[],"edges":[],"__proto__":{}}'), 'INVALID_DOCUMENT')
    const deep = JSON.stringify({ version: '2.0', nodes: [{ id: 'a', label: 'A', data: [[['deep']]] }], edges: [] })
    expectCode(() => parseHierarchyJson(deep, { maxDepth: 2 }), 'INVALID_DOCUMENT')
    expectCode(() => parseHierarchyJson(serializeHierarchy(document()), { maxBytes: 10 }), 'IMPORT_LIMIT')
  })

  it('rejects malformed runtime node and edge shapes with typed errors', () => {
    const nullNode = { version: '2.0', nodes: [null], edges: [] }
    expectCode(() => validateDocument(nullNode as unknown as HierarchyDocument), 'INVALID_DOCUMENT')
    const invalidFlags = { version: '2.0', nodes: [{ id: 'a', label: 'A', disabled: 'yes' }], edges: [] }
    expectCode(() => validateDocument(invalidFlags as unknown as HierarchyDocument), 'INVALID_DOCUMENT')
    const numericLabel = { version: '2.0', nodes: [{ id: 'a', label: 123 }], edges: [] }
    expectCode(() => validateDocument(numericLabel as unknown as HierarchyDocument), 'INVALID_DOCUMENT')
    const invalidDirected = {
      version: '2.0', nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      edges: [{ id: 'x', source: 'a', target: 'b', type: 'cross', relationship: 'peer', directed: 'yes' }]
    }
    expectCode(() => validateDocument(invalidDirected as unknown as HierarchyDocument), 'INVALID_DOCUMENT')
  })

  it('rejects whitespace-only or non-string familyId values on typed edges', () => {
    const blankFamily = document() as unknown as { version: '2.0'; nodes: HierarchyDocument['nodes']; edges: Array<Record<string, unknown>> }
    blankFamily.edges.push({ id: 'blank-family', source: 'alex', target: 'lee', type: 'child', relationship: 'adoptive', familyId: '   ' })
    expectCode(() => validateDocument(blankFamily as unknown as HierarchyDocument), 'INVALID_RELATIONSHIP')

    const numericSpouse = document() as unknown as { version: '2.0'; nodes: HierarchyDocument['nodes']; edges: Array<Record<string, unknown>> }
    numericSpouse.edges.push({ id: 'numeric-family', source: 'sam', target: 'lee', type: 'spouse', relationship: 'married', familyId: 123 })
    expectCode(() => validateDocument(numericSpouse as unknown as HierarchyDocument), 'INVALID_RELATIONSHIP')
  })

  it('requires distinct relationship labels for parallel cross edges', () => {
    const parallel: HierarchyDocument = {
      version: '2.0', nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      edges: [
        { id: 'x1', source: 'a', target: 'b', type: 'cross', relationship: 'peer' },
        { id: 'x2', source: 'b', target: 'a', type: 'cross', relationship: 'peer' }
      ]
    }
    expectCode(() => validateDocument(parallel), 'INVALID_RELATIONSHIP')
  })

  it('merges a lazy fragment transactionally and marks the parent loaded', () => {
    const next = mergeHierarchyFragment(document(), 'casey', {
      nodes: [{ id: 'jordan', label: 'Jordan' }],
      edges: [{ id: 'casey-jordan', source: 'casey', target: 'jordan', type: 'child' }]
    })
    expect(next.nodes.find(node => node.id === 'casey')).toMatchObject({ childrenLoaded: true })
    expect(next.nodes.map(node => node.id)).toContain('jordan')
    expect(document().nodes.map(node => node.id)).not.toContain('jordan')
  })

  it('accepts identical lazy records but rejects conflicts without mutation', () => {
    const source = document()
    const next = mergeHierarchyFragment(source, 'casey', { nodes: [{ id: 'lee', label: 'Lee' }], edges: [] })
    expect(next.nodes.filter(node => node.id === 'lee')).toHaveLength(1)

    expectCode(() => mergeHierarchyFragment(source, 'casey', { nodes: [{ id: 'lee', label: 'Changed' }], edges: [] }), 'LAZY_CONFLICT')
    expect(source.nodes.find(node => node.id === 'casey')?.childrenLoaded).toBe(false)
  })

  it('treats reordered JSON object keys as identical lazy data', () => {
    const source = document()
    source.nodes.find(node => node.id === 'lee')!.data = { first: 'one', second: 'two' }
    const next = mergeHierarchyFragment(source, 'casey', {
      nodes: [{ id: 'lee', label: 'Lee', data: { second: 'two', first: 'one' } }], edges: []
    })
    expect(next.nodes.filter(node => node.id === 'lee')).toHaveLength(1)
  })

  it('defaults cross-edge directed to false in lazy merges', () => {
    const next = mergeHierarchyFragment(document(), 'casey', {
      nodes: [{ id: 'jordan', label: 'Jordan' }],
      edges: [{ id: 'mentor-jordan', source: 'lee', target: 'jordan', type: 'cross', relationship: 'mentor' }]
    })
    expect(next.edges.find(edge => edge.id === 'mentor-jordan')).toMatchObject({ directed: false })
  })

  it('validates a deep acyclic chain without recursive stack overflow', () => {
    const count = 10_000
    const deep: HierarchyDocument = {
      version: '2.0',
      nodes: Array.from({ length: count }, (_, index) => ({ id: `n-${index}`, label: `Node ${index}` })),
      edges: Array.from({ length: count - 1 }, (_, index) => ({ id: `e-${index}`, source: `n-${index}`, target: `n-${index + 1}`, type: 'child' as const }))
    }
    expect(() => validateDocument(deep)).not.toThrow()
  })

  it('rejects stale lazy loads', () => {
    const loaded = document()
    loaded.nodes.find(node => node.id === 'casey')!.childrenLoaded = true
    expectCode(() => mergeHierarchyFragment(loaded, 'casey', { nodes: [], edges: [] }), 'STALE_LOAD')
  })
})
