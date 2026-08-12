import { describe, expect, it } from 'vitest'
import { calculatePermissionState, togglePermission } from '../../src/lib/permissions'
import type { HierarchyDocument } from '../../src/lib/types'

function permissionDag(): HierarchyDocument {
  return {
    version: '2.0',
    nodes: [
      { id: 'admin', label: 'Admin' },
      { id: 'editor', label: 'Editor' },
      { id: 'reports', label: 'Reports' },
      { id: 'shared-export', label: 'Shared export' },
      { id: 'disabled', label: 'Disabled branch', disabled: true },
      { id: 'protected-child', label: 'Protected child' },
      { id: 'leaf-parent', label: 'No participating children' },
      { id: 'disabled-leaf', label: 'Disabled leaf', disabled: true }
    ],
    edges: [
      { id: 'a-r', source: 'admin', target: 'reports', type: 'child' },
      { id: 'e-r', source: 'editor', target: 'reports', type: 'child' },
      { id: 'r-s', source: 'reports', target: 'shared-export', type: 'child' },
      { id: 'a-d', source: 'admin', target: 'disabled', type: 'child' },
      { id: 'd-p', source: 'disabled', target: 'protected-child', type: 'child' },
      { id: 'l-d', source: 'leaf-parent', target: 'disabled-leaf', type: 'child' }
    ]
  }
}

describe('recommended permission DAG semantics', () => {
  it('cascades through every enabled descendant by global node ID', () => {
    const state = togglePermission(permissionDag(), [], 'admin', true)
    expect([...state.checked]).toEqual(expect.arrayContaining(['admin', 'reports', 'shared-export']))
  })

  it('synchronizes a shared descendant across every parent path', () => {
    const checked = togglePermission(permissionDag(), [], 'reports', true)
    expect(checked.checked).toContain('shared-export')
    expect(checked.checked).toContain('admin')
    expect(checked.checked).toContain('editor')

    const unchecked = togglePermission(permissionDag(), checked.checked, 'shared-export', false)
    expect(unchecked.checked).not.toContain('shared-export')
    expect(unchecked.checked).not.toContain('reports')
  })

  it('stops cascading at a disabled node and its descendant subgraph', () => {
    const state = togglePermission(permissionDag(), ['protected-child'], 'admin', true)
    expect(state.checked).toContain('protected-child')

    const cleared = togglePermission(permissionDag(), state.checked, 'admin', false)
    expect(cleared.checked).toContain('protected-child')
    expect(cleared.checked).not.toContain('admin')
  })

  it('globally excludes a disabled subgraph even when a descendant has an enabled path', () => {
    const dag = permissionDag()
    dag.edges.push({ id: 'editor-protected', source: 'editor', target: 'protected-child', type: 'child' })
    const state = togglePermission(dag, [], 'editor', true)
    expect(state.checked).not.toContain('protected-child')
    expect(state.checked).toContain('editor')
  })

  it('ignores disabled direct children during parent aggregation', () => {
    const state = calculatePermissionState(permissionDag(), ['reports', 'shared-export'])
    expect(state.checked).toContain('admin')
  })

  it('retains explicit state when a parent has no participating children', () => {
    expect(calculatePermissionState(permissionDag(), ['leaf-parent']).checked).toContain('leaf-parent')
    expect(calculatePermissionState(permissionDag(), []).checked).not.toContain('leaf-parent')
  })

  it('does nothing when a disabled node is toggled directly', () => {
    const state = togglePermission(permissionDag(), ['disabled', 'protected-child'], 'disabled', false)
    expect(state.checked).toContain('disabled')
    expect(state.checked).toContain('protected-child')
  })

  it('keeps parent aggregation authoritative for non-cascading checks', () => {
    const state = togglePermission(permissionDag(), [], 'reports', true, false)
    expect(state.checked).not.toContain('shared-export')
    expect(state.checked).not.toContain('reports')
    expect(state.indeterminate).not.toContain('reports')
  })

  it('calculates a deep permission chain without recursive stack overflow', () => {
    const count = 10_000
    const deep: HierarchyDocument = {
      version: '2.0',
      nodes: Array.from({ length: count }, (_, index) => ({ id: `n-${index}`, label: `Node ${index}` })),
      edges: Array.from({ length: count - 1 }, (_, index) => ({ id: `e-${index}`, source: `n-${index}`, target: `n-${index + 1}`, type: 'child' as const }))
    }
    expect(togglePermission(deep, [], 'n-0', true).checked.size).toBe(count)
  })
})
