<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { reparentNode } from './commands'
import { asHierarchyError, HierarchyError } from './errors'
import { exportHierarchyPng, exportHierarchySvg } from './export'
import { layoutHierarchy } from './layout'
import {
  createIndex,
  getAncestorIds,
  getRootIds,
  mergeHierarchyFragment,
  normalizeDocument,
  parseHierarchyJson,
  searchHierarchy,
  serializeHierarchy
} from './model'
import { calculatePermissionState, togglePermission } from './permissions'
import type {
  CommandResult,
  HierarchyLayout,
  HierarchyDocument,
  HierarchyFragment,
  HierarchyNode,
  ImageExportOptions,
  ImportLimits,
  JSONValue,
  SearchMatch
} from './types'
import type { GraphIndex } from './model'

interface LoadContext {
  signal: AbortSignal
  document: HierarchyDocument
}

interface Props {
  modelValue: HierarchyDocument
  expandedIds?: string[]
  selectedId?: string | null
  checkedIds?: string[]
  editable?: boolean
  parentMode?: 'single' | 'multiple'
  searchable?: boolean
  checkable?: boolean
  cascadeChecks?: boolean
  loadChildren?: (node: HierarchyNode, context: LoadContext) => Promise<HierarchyFragment>
  nodeWidth?: number
  nodeHeight?: number
  columnGap?: number
  rowGap?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  checkedIds: () => [],
  editable: false,
  parentMode: 'single',
  searchable: true,
  checkable: false,
  cascadeChecks: true,
  nodeWidth: 190,
  nodeHeight: 76,
  columnGap: 36,
  rowGap: 86
})

const emit = defineEmits<{
  'update:modelValue': [document: HierarchyDocument]
  'update:expandedIds': [ids: string[]]
  'update:selectedId': [id: string | null]
  'update:checkedIds': [ids: string[]]
  'node-click': [node: HierarchyNode, event: MouseEvent | KeyboardEvent]
  'load-start': [node: HierarchyNode]
  'load-success': [node: HierarchyNode, fragment: HierarchyFragment]
  'load-error': [node: HierarchyNode, error: unknown]
  'edit-rejected': [error: HierarchyError]
  'relationship-change': [result: CommandResult]
  'import-error': [error: HierarchyError]
  'export-error': [error: HierarchyError]
}>()

const workingDocument = shallowRef<HierarchyDocument>(normalizeDocument(props.modelValue))
const expanded = ref(new Set(props.expandedIds ?? getRootIds(props.modelValue)))
const selected = ref<string | null>(props.selectedId)
const explicitChecked = ref(new Set(props.checkedIds))
const query = ref('')
const matches = shallowRef<SearchMatch[]>([])
const loadingIds = ref(new Set<string>())
const loadErrors = ref(new Map<string, string>())
const liveMessage = ref('')
const canvas = ref<HTMLElement | null>(null)
const inflight = new Map<string, Promise<void>>()
const controllers = new Map<string, AbortController>()
const draggedId = ref<string | null>(null)

watch(() => props.modelValue, value => {
  workingDocument.value = normalizeDocument(value)
})
watch(() => props.expandedIds, value => {
  if (value) expanded.value = new Set(value)
})
watch(() => props.selectedId, value => {
  selected.value = value
})
watch(() => props.checkedIds, value => {
  explicitChecked.value = new Set(value)
})

const index = computed<GraphIndex>(() => createIndex<JSONValue>(workingDocument.value))
const permission = computed(() => calculatePermissionState(workingDocument.value, explicitChecked.value))
const layout = computed<HierarchyLayout>(() => layoutHierarchy(workingDocument.value, expanded.value, {
  nodeWidth: props.nodeWidth,
  nodeHeight: props.nodeHeight,
  columnGap: props.columnGap,
  rowGap: props.rowGap
}))
const matchedIds = computed(() => new Set(matches.value.map(match => match.node.id)))

function commitDocument(document: HierarchyDocument) {
  workingDocument.value = document
  emit('update:modelValue', document)
}

function commitExpanded(next: Set<string>) {
  expanded.value = next
  emit('update:expandedIds', [...next])
}

function commitSelected(id: string | null) {
  selected.value = id
  emit('update:selectedId', id)
}

function commitChecked(ids: Set<string>) {
  explicitChecked.value = ids
  emit('update:checkedIds', [...ids])
}

function isExpandable(node: HierarchyNode) {
  return Boolean(node.hasChildren || index.value.outgoingChildren.get(node.id)?.length)
}

async function loadNode(node: HierarchyNode) {
  if (!props.loadChildren || !node.hasChildren || node.childrenLoaded !== false) return
  const existing = inflight.get(node.id)
  if (existing) return existing
  const controller = new AbortController()
  controllers.set(node.id, controller)
  loadingIds.value = new Set(loadingIds.value).add(node.id)
  loadErrors.value = new Map(loadErrors.value)
  loadErrors.value.delete(node.id)
  emit('load-start', node)
  const request = (async () => {
    try {
      const fragment = await props.loadChildren!(node, { signal: controller.signal, document: workingDocument.value })
      if (controller.signal.aborted) return
      const next = mergeHierarchyFragment(workingDocument.value, node.id, fragment)
      commitDocument(next)
      emit('load-success', node, fragment)
      liveMessage.value = `${node.label} loaded`
    } catch (error) {
      if (controller.signal.aborted) return
      const normalized = error instanceof HierarchyError ? error : asHierarchyError(error, 'LAZY_CONFLICT')
      const errors = new Map(loadErrors.value)
      errors.set(node.id, normalized.message)
      loadErrors.value = errors
      liveMessage.value = normalized.message
      emit('load-error', node, normalized)
    } finally {
      const nextLoading = new Set(loadingIds.value)
      nextLoading.delete(node.id)
      loadingIds.value = nextLoading
      controllers.delete(node.id)
      inflight.delete(node.id)
    }
  })()
  inflight.set(node.id, request)
  return request
}

async function toggleExpanded(node: HierarchyNode) {
  const next = new Set(expanded.value)
  if (next.has(node.id)) {
    next.delete(node.id)
    commitExpanded(next)
    return
  }
  await loadNode(node)
  if (!loadErrors.value.has(node.id)) {
    next.add(node.id)
    commitExpanded(next)
  }
}

function selectNode(node: HierarchyNode, event: MouseEvent | KeyboardEvent) {
  commitSelected(node.id)
  emit('node-click', node, event)
}

function checkNode(node: HierarchyNode, nextChecked: boolean) {
  const state = togglePermission(workingDocument.value, explicitChecked.value, node.id, nextChecked, props.cascadeChecks)
  commitChecked(state.checked)
}

function relationshipDescription(node: HierarchyNode) {
  const descriptions: string[] = []
  const incoming = index.value.incomingChildren.get(node.id) ?? []
  if (incoming.length > 1) descriptions.push(`${incoming.length} parents`)
  for (const edge of index.value.related.get(node.id) ?? []) {
    if (edge.type === 'spouse') descriptions.push(`${edge.relationship} partner: ${index.value.nodes.get(edge.source === node.id ? edge.target : edge.source)?.label ?? ''}`)
    if (edge.type === 'cross') descriptions.push(`${edge.relationship}: ${index.value.nodes.get(edge.source === node.id ? edge.target : edge.source)?.label ?? ''}`)
  }
  return descriptions.join('. ')
}

function nodeMeta(node: HierarchyNode) {
  if (!node.data || Array.isArray(node.data) || typeof node.data !== 'object') return ''
  const data = node.data as Record<string, JSONValue>
  const value = data.title ?? data.role ?? data.subtitle ?? data.status
  return typeof value === 'string' ? value : ''
}

function edgeLabel(edge: HierarchyDocument['edges'][number]) {
  return edge.label ?? (edge.type === 'child' && edge.relationship === 'hierarchy' ? '' : edge.relationship ?? '')
}

function runSearch(value = query.value) {
  query.value = value
  matches.value = searchHierarchy(workingDocument.value, value)
  if (matches.value.length) {
    const next = new Set(expanded.value)
    for (const match of matches.value) for (const id of match.ancestorIds) next.add(id)
    commitExpanded(next)
    commitSelected(matches.value[0].node.id)
    nextTick(() => focusNode(matches.value[0].node.id))
  }
  liveMessage.value = value.trim() ? `${matches.value.length} matches` : ''
  return matches.value
}

function clearSearch() {
  query.value = ''
  matches.value = []
  liveMessage.value = ''
}

function focusNode(id: string) {
  const element = Array.from(canvas.value?.querySelectorAll<HTMLElement>('[data-node-id]') ?? [])
    .find(candidate => candidate.dataset.nodeId === id)
  if (!element) return false
  element.focus()
  element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  return true
}

function visibleNodeIds() {
  return layout.value.nodes.map(item => item.node.id)
}

function onKeydown(node: HierarchyNode, event: KeyboardEvent) {
  const ids = visibleNodeIds()
  const current = ids.indexOf(node.id)
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const offset = event.key === 'ArrowDown' ? 1 : -1
    focusNode(ids[Math.max(0, Math.min(ids.length - 1, current + offset))])
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    if (isExpandable(node) && !expanded.value.has(node.id)) void toggleExpanded(node)
    else focusNode(index.value.outgoingChildren.get(node.id)?.[0]?.target ?? node.id)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (expanded.value.has(node.id)) void toggleExpanded(node)
    else focusNode(index.value.incomingChildren.get(node.id)?.[0]?.source ?? node.id)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    selectNode(node, event)
  } else if (event.key === ' ' && props.checkable) {
    event.preventDefault()
    checkNode(node, !permission.value.checked.has(node.id))
  }
}

function onDragStart(node: HierarchyNode, event: DragEvent) {
  if (!props.editable) return
  draggedId.value = node.id
  event.dataTransfer?.setData('text/plain', node.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(target: HierarchyNode, event: DragEvent) {
  if (!props.editable) return
  event.preventDefault()
  const sourceId = event.dataTransfer?.getData('text/plain') || draggedId.value
  draggedId.value = null
  if (!sourceId) return
  const options = props.parentMode === 'multiple'
    ? { parentMode: 'multiple' as const, edge: { relationship: 'biological' as const, familyId: `family-${target.id}` } }
    : { parentMode: 'single' as const }
  const result = reparentNode(workingDocument.value, sourceId, target.id, options)
  if (result.ok) {
    commitDocument(result.document)
    emit('relationship-change', result)
    liveMessage.value = `Relationship updated for ${sourceId}`
  } else {
    emit('edit-rejected', result.error)
    liveMessage.value = result.error.message
  }
}

function importJson(text: string, limits?: Partial<ImportLimits>) {
  try {
    const document = parseHierarchyJson(text, limits)
    commitDocument(document)
    commitExpanded(new Set(getRootIds(document)))
    return document
  } catch (error) {
    const normalized = asHierarchyError(error)
    emit('import-error', normalized)
    liveMessage.value = normalized.message
    throw normalized
  }
}

function exportJson(space = 2) {
  return serializeHierarchy(workingDocument.value, space)
}

async function exportPng(options?: ImageExportOptions) {
  if (!canvas.value) throw new HierarchyError('EXPORT_FAILED', 'Hierarchy canvas is not mounted')
  try {
    return await exportHierarchyPng(canvas.value, options)
  } catch (error) {
    const normalized = asHierarchyError(error, 'EXPORT_FAILED')
    emit('export-error', normalized)
    throw normalized
  }
}

async function exportSvg(options?: ImageExportOptions) {
  if (!canvas.value) throw new HierarchyError('EXPORT_FAILED', 'Hierarchy canvas is not mounted')
  try {
    return await exportHierarchySvg(canvas.value, options)
  } catch (error) {
    const normalized = asHierarchyError(error, 'EXPORT_FAILED')
    emit('export-error', normalized)
    throw normalized
  }
}

onBeforeUnmount(() => {
  for (const controller of controllers.values()) controller.abort()
  controllers.clear()
})

defineExpose({
  search: runSearch,
  focusNode,
  importJson,
  exportJson,
  exportPng,
  exportSvg
})
</script>

<template>
  <section class="vh-view">
    <div v-if="searchable" class="vh-toolbar">
      <label class="vh-search">
        <span class="vh-visually-hidden">Search hierarchy</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
        <input v-model="query" type="search" placeholder="Search nodes…" @input="runSearch()">
      </label>
      <span v-if="query" class="vh-result-count">{{ matches.length }} match{{ matches.length === 1 ? '' : 'es' }}</span>
      <button v-if="query" class="vh-clear" type="button" @click="clearSearch">Clear</button>
    </div>

    <div ref="canvas" class="vh-viewport">
      <div
        v-if="layout.nodes.length"
        class="vh-canvas"
        role="tree"
        aria-label="Hierarchy visualization"
        :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
      >
        <svg class="vh-edges" :width="layout.width" :height="layout.height" aria-hidden="true">
          <g v-for="item in layout.edges" :key="item.edge.id" :class="['vh-edge', `vh-edge--${item.edge.type}`, `vh-edge--${item.edge.relationship ?? 'hierarchy'}`]">
            <path :d="item.path" />
            <text v-if="edgeLabel(item.edge)" :x="item.labelX" :y="item.labelY">
              <slot name="edge-label" :edge="item.edge" :source="index.nodes.get(item.edge.source)" :target="index.nodes.get(item.edge.target)">
                {{ edgeLabel(item.edge) }}
              </slot>
            </text>
          </g>
        </svg>

        <article
          v-for="item in layout.nodes"
          :key="item.node.id"
          :data-node-id="item.node.id"
          :class="[
            'vh-node',
            { 'is-selected': selected === item.node.id, 'is-match': matchedIds.has(item.node.id), 'is-loading': loadingIds.has(item.node.id), 'is-disabled': item.node.disabled }
          ]"
          :style="{ left: `${item.x}px`, top: `${item.y}px`, width: `${nodeWidth}px`, height: `${nodeHeight}px` }"
          role="treeitem"
          tabindex="0"
          :aria-level="item.depth + 1"
          :aria-selected="selected === item.node.id"
          :aria-expanded="isExpandable(item.node) ? expanded.has(item.node.id) : undefined"
          :aria-checked="checkable ? (permission.indeterminate.has(item.node.id) ? 'mixed' : permission.checked.has(item.node.id)) : undefined"
          :aria-disabled="item.node.disabled || undefined"
          :draggable="editable && !item.node.disabled"
          @click="selectNode(item.node, $event)"
          @keydown="onKeydown(item.node, $event)"
          @dragstart="onDragStart(item.node, $event)"
          @dragend="draggedId = null"
          @dragover.prevent
          @drop="onDrop(item.node, $event)"
        >
          <div class="vh-node__main">
            <input
              v-if="checkable"
              class="vh-checkbox"
              type="checkbox"
              :checked="permission.checked.has(item.node.id)"
              :indeterminate="permission.indeterminate.has(item.node.id)"
              :disabled="item.node.disabled"
              :aria-label="`Check ${item.node.label}`"
              @click.stop
              @change="checkNode(item.node, ($event.target as HTMLInputElement).checked)"
            >
            <slot
              name="node"
              :node="item.node"
              :selected="selected === item.node.id"
              :expanded="expanded.has(item.node.id)"
              :checked="permission.checked.has(item.node.id)"
              :indeterminate="permission.indeterminate.has(item.node.id)"
              :loading="loadingIds.has(item.node.id)"
              :depth="item.depth"
            >
              <span class="vh-node__avatar">{{ item.node.label.slice(0, 1).toUpperCase() }}</span>
              <span class="vh-node__copy">
                <strong>{{ item.node.label }}</strong>
                <small v-if="nodeMeta(item.node)">{{ nodeMeta(item.node) }}</small>
              </span>
            </slot>
          </div>

          <div class="vh-node__actions" @click.stop>
            <slot
              name="node-actions"
              :node="item.node"
              :selected="selected === item.node.id"
              :expanded="expanded.has(item.node.id)"
              :checked="permission.checked.has(item.node.id)"
              :indeterminate="permission.indeterminate.has(item.node.id)"
              :loading="loadingIds.has(item.node.id)"
              :depth="item.depth"
            >
              <button
                v-if="isExpandable(item.node)"
                class="vh-expand"
                type="button"
                :aria-label="`${expanded.has(item.node.id) ? 'Collapse' : 'Expand'} ${item.node.label}`"
                :disabled="loadingIds.has(item.node.id)"
                @click="toggleExpanded(item.node)"
              >
                <span v-if="loadingIds.has(item.node.id)" class="vh-spinner" />
                <span v-else>{{ expanded.has(item.node.id) ? '−' : '+' }}</span>
              </button>
            </slot>
          </div>

          <span v-if="relationshipDescription(item.node)" class="vh-visually-hidden">
            {{ relationshipDescription(item.node) }}
          </span>
          <span v-if="loadErrors.get(item.node.id)" class="vh-node__error" role="alert">Retry</span>
        </article>
      </div>
      <div v-else class="vh-empty"><slot name="empty">No hierarchy data</slot></div>
    </div>
    <p class="vh-visually-hidden" aria-live="polite">{{ liveMessage }}</p>
  </section>
</template>

<style>
.vh-view {
  --vh-ink: #172033;
  --vh-muted: #64748b;
  --vh-line: #cbd5e1;
  --vh-accent: #635bff;
  --vh-surface: #fff;
  color: var(--vh-ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.vh-toolbar { display: flex; min-height: 44px; align-items: center; gap: 10px; margin-bottom: 14px; }
.vh-search { display: flex; width: min(360px, 100%); align-items: center; gap: 9px; border: 1px solid #dbe2ea; border-radius: 10px; background: #fff; padding: 0 12px; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.vh-search:focus-within { border-color: var(--vh-accent); box-shadow: 0 0 0 3px rgba(99, 91, 255, .12); }
.vh-search svg { width: 17px; fill: none; stroke: #94a3b8; stroke-width: 1.8; }
.vh-search input { min-width: 0; flex: 1; border: 0; outline: 0; padding: 11px 0; color: var(--vh-ink); font: inherit; background: transparent; }
.vh-result-count { color: var(--vh-muted); font-size: 12px; }
.vh-clear { border: 0; background: transparent; color: var(--vh-accent); cursor: pointer; font: inherit; font-size: 12px; }
.vh-viewport { overflow: auto; min-height: 270px; border: 1px solid #e5eaf0; border-radius: 16px; background-color: #f8fafc; background-image: radial-gradient(#dbe3ec 1px, transparent 1px); background-size: 20px 20px; }
.vh-canvas { position: relative; min-width: 100%; min-height: 100%; }
.vh-edges { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.vh-edge path { fill: none; stroke: var(--vh-line); stroke-width: 2; }
.vh-edge text { fill: #64748b; font-size: 11px; text-anchor: middle; paint-order: stroke; stroke: #f8fafc; stroke-width: 4px; }
.vh-edge--spouse path { stroke: #ec4899; stroke-width: 2.5; }
.vh-edge--cross path { stroke: #0ea5e9; stroke-dasharray: 5 5; }
.vh-edge--adoptive path, .vh-edge--step path, .vh-edge--guardian path { stroke-dasharray: 7 4; }
.vh-node { position: absolute; display: flex; box-sizing: border-box; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #dbe2ea; border-radius: 13px; background: var(--vh-surface); padding: 13px 12px; box-shadow: 0 7px 20px rgba(30, 41, 59, .08); cursor: pointer; transition: border-color .16s, box-shadow .16s, transform .16s; }
.vh-node:hover { transform: translateY(-2px); border-color: #b7bdfc; box-shadow: 0 10px 24px rgba(30, 41, 59, .12); }
.vh-node:focus-visible { outline: 3px solid rgba(99, 91, 255, .25); outline-offset: 2px; }
.vh-node.is-selected { border-color: var(--vh-accent); box-shadow: 0 0 0 3px rgba(99, 91, 255, .12), 0 8px 22px rgba(30, 41, 59, .1); }
.vh-node.is-match { background: #fffbeb; border-color: #f59e0b; }
.vh-node.is-disabled { opacity: .58; cursor: not-allowed; }
.vh-node__main { display: flex; min-width: 0; align-items: center; gap: 9px; }
.vh-node__avatar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 10px; color: #5148e8; background: #eeedff; font-size: 13px; font-weight: 800; }
.vh-node__copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; text-align: left; }
.vh-node__copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.vh-node__copy small { overflow: hidden; color: var(--vh-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.vh-node__actions { display: flex; align-items: center; }
.vh-expand { display: grid; width: 25px; height: 25px; place-items: center; border: 1px solid #dbe2ea; border-radius: 8px; background: #f8fafc; color: #475569; cursor: pointer; font-size: 17px; line-height: 1; }
.vh-expand:hover { color: var(--vh-accent); border-color: #b7bdfc; }
.vh-expand:disabled { cursor: wait; opacity: .65; }
.vh-checkbox { width: 16px; height: 16px; accent-color: var(--vh-accent); }
.vh-spinner { width: 11px; height: 11px; border: 2px solid #cbd5e1; border-top-color: var(--vh-accent); border-radius: 50%; animation: vh-spin .7s linear infinite; }
.vh-node__error { position: absolute; right: 8px; bottom: -18px; color: #dc2626; font-size: 10px; }
.vh-empty { display: grid; min-height: 270px; place-items: center; color: var(--vh-muted); }
.vh-visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0 0 0 0) !important; white-space: nowrap !important; }
@keyframes vh-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .vh-node { transition: none; } .vh-spinner { animation-duration: 1.4s; } }
</style>
