import { describe, expect, it } from 'vitest'
import { createEdgePath, layoutHierarchy } from '../../src/lib/layout'
import type { HierarchyDocument } from '../../src/lib/types'

function graph(): HierarchyDocument {
  return {
    version: '2.0',
    nodes: ['parent-a', 'parent-b', 'child', 'hidden', 'peer'].map(id => ({ id, label: id })),
    edges: [
      { id: 'partners', source: 'parent-a', target: 'parent-b', type: 'spouse', relationship: 'married', familyId: 'f1' },
      { id: 'a-child', source: 'parent-a', target: 'child', type: 'child', relationship: 'biological', familyId: 'f1' },
      { id: 'b-child', source: 'parent-b', target: 'child', type: 'child', relationship: 'biological', familyId: 'f1' },
      { id: 'child-hidden', source: 'child', target: 'hidden', type: 'child' },
      { id: 'peer-link', source: 'child', target: 'peer', type: 'cross', relationship: 'peer' }
    ]
  }
}

describe('hierarchy layout', () => {
  it('ranks a dual-parent child below both parents', () => {
    const layout = layoutHierarchy(graph(), ['parent-a', 'parent-b'])
    expect(layout.nodes.find(item => item.node.id === 'parent-a')?.depth).toBe(0)
    expect(layout.nodes.find(item => item.node.id === 'parent-b')?.depth).toBe(0)
    expect(layout.nodes.find(item => item.node.id === 'child')?.depth).toBe(1)
  })

  it('hides collapsed descendants and their incident edges', () => {
    const layout = layoutHierarchy(graph(), ['parent-a'])
    expect(layout.nodes.map(item => item.node.id)).not.toContain('hidden')
    expect(layout.edges.map(item => item.edge.id)).not.toContain('child-hidden')
  })

  it('keeps multi-parent children visible through one expanded path', () => {
    expect(layoutHierarchy(graph(), ['parent-b']).nodes.map(item => item.node.id)).toContain('child')
  })

  it('does not render a child connector from a collapsed alternate parent', () => {
    const layout = layoutHierarchy(graph(), ['parent-a'])
    expect(layout.edges.map(item => item.edge.id)).toContain('a-child')
    expect(layout.edges.map(item => item.edge.id)).not.toContain('b-child')
  })

  it('aligns spouse-only nodes with an ancestrally ranked spouse', () => {
    const family: HierarchyDocument = {
      version: '2.0',
      nodes: ['root', 'ranked', 'spouse-a', 'spouse-b'].map(id => ({ id, label: id })),
      edges: [
        { id: 'root-ranked', source: 'root', target: 'ranked', type: 'child' },
        { id: 's1', source: 'ranked', target: 'spouse-a', type: 'spouse', relationship: 'partnered', familyId: 'f1' },
        { id: 's2', source: 'spouse-a', target: 'spouse-b', type: 'spouse', relationship: 'divorced', familyId: 'f2' }
      ]
    }
    const positions = layoutHierarchy(family, ['root']).nodes
    expect(positions.find(item => item.node.id === 'spouse-a')?.depth).toBe(1)
    expect(positions.find(item => item.node.id === 'spouse-b')?.depth).toBe(1)
  })

  it('is deterministic for identical input', () => {
    expect(layoutHierarchy(graph(), ['parent-a', 'parent-b'])).toEqual(layoutHierarchy(graph(), ['parent-a', 'parent-b']))
  })

  it('renders related edges only when both endpoints are visible', () => {
    const collapsed = layoutHierarchy(graph(), [])
    expect(collapsed.edges.map(item => item.edge.id)).not.toContain('peer-link')
    const expanded = layoutHierarchy(graph(), ['parent-a'])
    expect(expanded.edges.map(item => item.edge.id)).toContain('peer-link')
  })

  it('uses distinct path shapes for child, spouse, and cross edges', () => {
    const source = { x: 0, y: 0 }
    const target = { x: 200, y: 150 }
    expect(createEdgePath('child', source, target, 100, 50)).toContain(' C ')
    expect(createEdgePath('spouse', source, target, 100, 50)).toContain(' L ')
    expect(createEdgePath('cross', source, target, 100, 50)).toContain(' Q ')
  })
})
