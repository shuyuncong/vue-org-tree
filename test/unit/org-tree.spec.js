import Vue from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import OrgTreePlugin, { install } from '../../src/components/org-tree'
import OrgTree from '../../src/components/org-tree/org-tree.vue'

const defaultTree = () => ({
  label: 'Root',
  expand: true,
  children: [
    { label: 'Child', children: [] }
  ]
})

describe('Vue2OrgTree', () => {
  it('keeps the public plugin contract', () => {
    const localVue = createLocalVue()
    install.installed = false
    install(localVue)

    expect(OrgTreePlugin.name).toBe('Vue2OrgTree')
    expect(OrgTreePlugin.install).toBe(install)
    expect(localVue.options.components.Vue2OrgTree.options.name).toBe(OrgTreePlugin.name)
  })

  it('renders root and child labels', () => {
    const wrapper = mount(OrgTree, {
      propsData: {
        data: defaultTree(),
        collapsable: true
      }
    })

    expect(wrapper.text()).toContain('Root')
    expect(wrapper.text()).toContain('Child')
  })

  it('supports custom label, children, and expand fields', async () => {
    const tree = {
      name: 'Custom root',
      open: false,
      nodes: [{ name: 'Custom child', nodes: [] }]
    }
    const wrapper = mount(OrgTree, {
      propsData: {
        data: tree,
        collapsable: true,
        props: {
          label: 'name',
          children: 'nodes',
          expand: 'open'
        }
      }
    })

    expect(wrapper.text()).toContain('Custom root')
    expect(wrapper.text()).not.toContain('Custom child')

    await wrapper.find('.org-tree-node-btn').trigger('click')

    expect(tree.open).toBe(true)
    expect(wrapper.text()).toContain('Custom child')
    expect(wrapper.emitted('on-expand')[0]).toEqual([tree, true])
    expect(wrapper.emitted('resetOrg')[0]).toEqual([tree])
  })

  it('forwards click, focus, mouse, and drag events with node data', async () => {
    const tree = defaultTree()
    const wrapper = mount(OrgTree, {
      attachTo: document.body,
      propsData: {
        data: tree,
        collapsable: true
      }
    })
    const labels = wrapper.findAll('.org-tree-node-label')

    await labels.at(0).find('.org-tree-node-label-inner').trigger('click')
    labels.at(0).element.focus()
    await Vue.nextTick()
    await labels.at(0).find('.org-tree-node-label-inner').trigger('mouseover')
    await labels.at(0).find('.org-tree-node-label-inner').trigger('mouseout')
    await labels.at(0).trigger('dragstart')
    await labels.at(1).trigger('dragover')
    await labels.at(1).trigger('drop')

    expect(wrapper.emitted('on-node-click')[0][1]).toBe(tree)
    expect(wrapper.emitted('on-node-focus')[0][1]).toBe(tree)
    expect(wrapper.emitted('on-node-mouseover')[0][1]).toBe(tree)
    expect(wrapper.emitted('on-node-mouseout')[0][1]).toBe(tree)
    expect(wrapper.emitted('on-node-drag-start')[0][1]).toBe(tree)
    expect(wrapper.emitted('on-node-drag-over')[0][1]).toBe(tree.children[0])
    expect(wrapper.emitted('on-node-drop')[0].slice(1)).toEqual([tree, tree.children[0]])
    wrapper.destroy()
  })

  it('applies a selected class', () => {
    const tree = { label: 'Selected', selected: true, children: [] }
    const wrapper = mount(OrgTree, {
      propsData: {
        data: tree,
        selectedKey: 'selected',
        selectedClassName: 'is-selected'
      }
    })

    expect(wrapper.find('.org-tree-node-label-inner').classes()).toContain('is-selected')
  })

  it('renders side nodes with custom field mappings', () => {
    const tree = {
      name: 'Root',
      open: true,
      nodes: [
        { name: 'Side node', selected: true, stuckNeckFlag: true, leftOrRight: 'left', nodes: [] },
        { name: 'Ordinary node', nodes: [] }
      ]
    }
    const wrapper = mount(OrgTree, {
      propsData: {
        data: tree,
        collapsable: true,
        selectedKey: 'selected',
        selectedClassName: node => node.selected ? 'is-selected' : '',
        labelClassName: node => node.stuckNeckFlag ? 'is-side-node' : '',
        props: {
          label: 'name',
          children: 'nodes',
          expand: 'open'
        }
      }
    })

    expect(wrapper.find('.org-tree-node-label-stuck-neck-left').text()).toContain('Side node')
    expect(wrapper.find('.org-tree-node-label-stuck-neck-left .org-tree-node-label-inner').classes()).toEqual(expect.arrayContaining(['is-selected', 'is-side-node']))
    expect(wrapper.text()).toContain('Ordinary node')
    expect(wrapper.find('.org-tree-node-children').element.style.top).toBe('59px')
  })

  it('supports HTML strings and VNodes from render-content', () => {
    const htmlWrapper = mount(OrgTree, {
      propsData: {
        data: defaultTree(),
        renderContent: (h, node) => `<strong>${node.label}</strong>`
      }
    })
    const vnodeWrapper = mount(OrgTree, {
      propsData: {
        data: defaultTree(),
        renderContent: (h, node) => h('em', node.label)
      }
    })

    expect(htmlWrapper.find('strong').text()).toBe('Root')
    expect(vnodeWrapper.find('em').text()).toBe('Root')
  })

  it('escapes ordinary node labels', () => {
    const wrapper = mount(OrgTree, {
      propsData: {
        data: { label: '<img src=x onerror=alert(1)>', children: [] }
      }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })

  it('does not require a consumer render callback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(OrgTree, { propsData: { data: defaultTree() } })

    expect(wrapper.exists()).toBe(true)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
