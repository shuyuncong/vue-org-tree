import { describe, expect, it } from 'vitest'
import { addRelationship, removeRelationship, reparentNode } from '../../src/lib/commands'
import type { HierarchyDocument } from '../../src/lib/types'

function document(): HierarchyDocument {
  return {
    version: '2.0',
    nodes: ['root', 'other', 'child', 'grandchild'].map(id => ({ id, label: id })),
    edges: [
      { id: 'root-child', source: 'root', target: 'child', type: 'child' },
      { id: 'child-grandchild', source: 'child', target: 'grandchild', type: 'child' }
    ]
  }
}

describe('editing commands', () => {
  it('replaces incoming parents in single-parent mode', () => {
    const result = reparentNode(document(), 'child', 'other', { idFactory: () => 'other-child' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.removedEdges.map(edge => edge.id)).toEqual(['root-child'])
    expect(result.document.edges).toContainEqual(expect.objectContaining({ id: 'other-child', source: 'other', target: 'child' }))
  })

  it('adds another parent in multiple-parent mode', () => {
    const result = reparentNode(document(), 'child', 'other', { parentMode: 'multiple', idFactory: () => 'other-child' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.removedEdges).toEqual([])
    expect(result.document.edges.filter(edge => edge.type === 'child' && edge.target === 'child')).toHaveLength(2)
  })

  it('creates a typed family child edge for genealogy editing', () => {
    const result = reparentNode(document(), 'child', 'other', {
      parentMode: 'multiple',
      idFactory: () => 'adoptive-edge',
      edge: { relationship: 'adoptive', familyId: 'family-b', label: 'adopted' }
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.addedEdges[0]).toMatchObject({ relationship: 'adoptive', familyId: 'family-b' })
  })

  it('rejects self-parenting and cycles without mutating the source', () => {
    const source = document()
    expect(reparentNode(source, 'child', 'child')).toMatchObject({ ok: false, error: { code: 'EDIT_REJECTED' } })
    expect(reparentNode(source, 'root', 'grandchild')).toMatchObject({ ok: false, error: { code: 'CHILD_CYCLE' } })
    expect(source.edges.map(edge => edge.id)).toEqual(['root-child', 'child-grandchild'])
  })

  it('does not add duplicate parent relationships in multiple mode', () => {
    const result = reparentNode(document(), 'child', 'root', { parentMode: 'multiple' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.addedEdges).toEqual([])
    expect(result.document.edges).toHaveLength(2)
  })

  it('adds spouse and cross relationships with generated collision-safe IDs', () => {
    const values = ['root-child', 'marriage']
    const spouse = addRelationship(document(), {
      source: 'root', target: 'other', type: 'spouse', relationship: 'married', familyId: 'family-a'
    }, { idFactory: () => values.shift()! })
    expect(spouse.ok).toBe(true)
    if (!spouse.ok) return
    expect(spouse.addedEdges[0].id).toBe('marriage')

    const cross = addRelationship(spouse.document, {
      source: 'root', target: 'grandchild', type: 'cross', relationship: 'mentor', directed: true
    }, { idFactory: () => 'mentor-edge' })
    expect(cross).toMatchObject({ ok: true, addedEdges: [{ id: 'mentor-edge', type: 'cross' }] })
  })

  it('normalizes cross edges with an explicit directed default', () => {
    const result = addRelationship(document(), {
      source: 'root', target: 'grandchild', type: 'cross', relationship: 'mentor'
    }, { idFactory: () => 'mentor-edge' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.addedEdges[0]).toMatchObject({ type: 'cross', directed: false })
  })

  it('removes one explicit relationship and reports unknown IDs', () => {
    const removed = removeRelationship(document(), 'root-child')
    expect(removed).toMatchObject({ ok: true, removedEdges: [{ id: 'root-child' }] })
    expect(removeRelationship(document(), 'unknown')).toMatchObject({ ok: false, error: { code: 'EDIT_REJECTED' } })
  })

  it('rejects invalid relationship input without mutating the document', () => {
    const source = document()
    const result = addRelationship(source, {
      source: 'root', target: 'other', type: 'spouse', relationship: 'married', familyId: ''
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_RELATIONSHIP' } })
    expect(source.edges).toHaveLength(2)
  })
})
