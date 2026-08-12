import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HierarchyView from '../../src/lib/HierarchyView.vue'
import type { HierarchyDocument, HierarchyFragment, HierarchyNode } from '../../src/lib/types'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(async () => 'data:image/png;base64,png'),
  toSvg: vi.fn(async () => 'data:image/svg+xml;base64,svg')
}))

function document(): HierarchyDocument {
  return {
    version: '2.0',
    nodes: [
      { id: 'root', label: 'Root', data: { title: 'Director' } },
      { id: 'child', label: 'Child', hasChildren: true, childrenLoaded: false },
      { id: 'shared', label: 'Shared' }
    ],
    edges: [
      { id: 'root-child', source: 'root', target: 'child', type: 'child' },
      { id: 'root-shared', source: 'root', target: 'shared', type: 'child' }
    ]
  }
}

describe('HierarchyView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders visible nodes with the default presentation and ARIA tree roles', () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document() } })
    expect(wrapper.get('[role="tree"]').attributes('aria-label')).toBe('Hierarchy visualization')
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3)
    expect(wrapper.text()).toContain('Director')
  })

  it('renders custom node, action, edge-label, and empty slots', () => {
    const wrapper = mount(HierarchyView, {
      props: { modelValue: document() },
      slots: {
        node: '<span class="custom-node">custom node</span>',
        'node-actions': '<button class="custom-action">action</button>',
        'edge-label': '<tspan>custom edge</tspan>'
      }
    })
    expect(wrapper.find('.custom-node').exists()).toBe(true)
    expect(wrapper.find('.custom-action').exists()).toBe(true)
    const empty = mount(HierarchyView, {
      props: { modelValue: { version: '2.0', nodes: [], edges: [] } },
      slots: { empty: 'Nothing here' }
    })
    expect(empty.text()).toContain('Nothing here')
  })

  it('selects a node and emits complete controlled values', async () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document() } })
    await wrapper.get('[data-node-id="child"]').trigger('click')
    expect(wrapper.emitted('update:selectedId')?.[0]).toEqual(['child'])
    expect(wrapper.emitted('node-click')?.[0]?.[0]).toMatchObject({ id: 'child' })
    expect(wrapper.get('[data-node-id="child"]').classes()).toContain('is-selected')
  })

  it('searches data, reveals matches, and exposes focus/search methods', async () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document() } })
    const input = wrapper.get('input[type="search"]')
    await input.setValue('director')
    expect(wrapper.text()).toContain('1 match')
    expect(wrapper.get('[data-node-id="root"]').classes()).toContain('is-match')
    expect((wrapper.vm as unknown as { search: (query: string) => unknown[] }).search('shared')).toHaveLength(1)
  })

  it('cascades permission checks and emits globally aggregated IDs', async () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document(), checkable: true } })
    const checkbox = wrapper.get('[data-node-id="root"] input[type="checkbox"]')
    await checkbox.setValue(true)
    const emitted = wrapper.emitted('update:checkedIds')?.at(-1)?.[0] as string[]
    expect(emitted).toEqual(expect.arrayContaining(['root', 'child', 'shared']))
  })

  it('loads children transactionally once and expands the node', async () => {
    const loadChildren = vi.fn(async () => ({
      nodes: [{ id: 'lazy', label: 'Lazy child' }],
      edges: [{ id: 'child-lazy', source: 'child', target: 'lazy', type: 'child' as const }]
    }))
    const wrapper = mount(HierarchyView, { props: { modelValue: document(), loadChildren } })
    await wrapper.get('button[aria-label="Expand Child"]').trigger('click')
    await vi.waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Lazy child'))
    expect(wrapper.emitted('load-success')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({ version: '2.0' })
  })

  it('keeps failed lazy loads retryable and emits a typed error', async () => {
    const loadChildren = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ nodes: [], edges: [] })
    const wrapper = mount(HierarchyView, { props: { modelValue: document(), loadChildren } })
    await wrapper.get('button[aria-label="Expand Child"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.emitted('load-error')).toHaveLength(1))
    await wrapper.get('button[aria-label="Expand Child"]').trigger('click')
    await vi.waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
  })

  it('aborts in-flight lazy loading when unmounted', async () => {
    let signal: AbortSignal | undefined
    const loadChildren = vi.fn((_node: HierarchyNode, context: { signal: AbortSignal }): Promise<HierarchyFragment> => {
      signal = context.signal
      return new Promise(() => undefined)
    })
    const wrapper = mount(HierarchyView, { props: { modelValue: document(), loadChildren } })
    await wrapper.get('button[aria-label="Expand Child"]').trigger('click')
    wrapper.unmount()
    expect(signal?.aborted).toBe(true)
  })

  it('supports single-parent drag editing and rejects cycles', async () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document(), editable: true } })
    const dataTransfer = { value: '', setData(_type: string, value: string) { this.value = value }, getData() { return this.value }, effectAllowed: '' }
    await wrapper.get('[data-node-id="root"]').trigger('dragstart', { dataTransfer })
    await wrapper.get('[data-node-id="child"]').trigger('drop', { dataTransfer })
    expect(wrapper.emitted('edit-rejected')).toHaveLength(1)

    await wrapper.get('[data-node-id="child"]').trigger('dragstart', { dataTransfer })
    await wrapper.get('[data-node-id="shared"]').trigger('drop', { dataTransfer })
    expect(wrapper.emitted('relationship-change')).toHaveLength(1)
    const next = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as HierarchyDocument
    expect(next.edges).toContainEqual(expect.objectContaining({ source: 'shared', target: 'child' }))
  })

  it('imports and exports JSON through exposed methods', () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document() } })
    const api = wrapper.vm as unknown as { exportJson: () => string; importJson: (text: string) => HierarchyDocument }
    expect(JSON.parse(api.exportJson())).toMatchObject({ version: '2.0' })
    expect(api.importJson('{"version":"2.0","nodes":[],"edges":[]}').nodes).toEqual([])
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('exports PNG and SVG through the image helpers', async () => {
    const wrapper = mount(HierarchyView, { props: { modelValue: document() } })
    const api = wrapper.vm as unknown as { exportPng: () => Promise<{ dataUrl: string }>; exportSvg: () => Promise<{ dataUrl: string }> }
    expect((await api.exportPng()).dataUrl).toMatch(/^data:image\/png/)
    expect((await api.exportSvg()).dataUrl).toMatch(/^data:image\/svg\+xml/)
  })
})
