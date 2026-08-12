<script setup lang="ts">
import { computed, ref } from 'vue'
import { HierarchyView } from './lib'
import type { HierarchyDocument, HierarchyFragment, HierarchyNode } from './lib'

const organization = ref<HierarchyDocument>({
  version: '2.0',
  nodes: [
    { id: 'ceo', label: 'Maya Chen', data: { title: 'Chief Executive Officer' } },
    { id: 'product', label: 'Noah Williams', data: { title: 'VP Product' } },
    { id: 'engineering', label: 'Ava Patel', data: { title: 'VP Engineering' } },
    { id: 'operations', label: 'Liam Garcia', data: { title: 'VP Operations' } },
    { id: 'design', label: 'Sofia Kim', data: { title: 'Design Lead' } },
    { id: 'platform', label: 'Ethan Brown', data: { title: 'Platform Lead' } },
    { id: 'growth', label: 'Olivia Davis', data: { title: 'Growth Lead' } }
  ],
  edges: [
    { id: 'ceo-product', source: 'ceo', target: 'product', type: 'child' },
    { id: 'ceo-engineering', source: 'ceo', target: 'engineering', type: 'child' },
    { id: 'ceo-operations', source: 'ceo', target: 'operations', type: 'child' },
    { id: 'product-design', source: 'product', target: 'design', type: 'child' },
    { id: 'engineering-platform', source: 'engineering', target: 'platform', type: 'child' },
    { id: 'operations-growth', source: 'operations', target: 'growth', type: 'child' }
  ]
})

const permissions = ref<HierarchyDocument>({
  version: '2.0',
  nodes: [
    { id: 'workspace', label: 'Workspace', data: { role: 'All permissions' } },
    { id: 'content', label: 'Content', data: { role: 'Publishing' } },
    { id: 'analytics', label: 'Analytics', data: { role: 'Reporting' } },
    { id: 'users', label: 'Users', data: { role: 'Identity' } },
    { id: 'view', label: 'View', data: { role: 'Read access' } },
    { id: 'edit', label: 'Edit', data: { role: 'Write access' } },
    { id: 'export', label: 'Export', data: { role: 'Shared permission' } },
    { id: 'billing', label: 'Billing', data: { role: 'Owner only' }, disabled: true },
    { id: 'invoices', label: 'Invoices', data: { role: 'Protected branch' } }
  ],
  edges: [
    { id: 'w-content', source: 'workspace', target: 'content', type: 'child' },
    { id: 'w-analytics', source: 'workspace', target: 'analytics', type: 'child' },
    { id: 'w-users', source: 'workspace', target: 'users', type: 'child' },
    { id: 'content-view', source: 'content', target: 'view', type: 'child' },
    { id: 'content-edit', source: 'content', target: 'edit', type: 'child' },
    { id: 'content-export', source: 'content', target: 'export', type: 'child' },
    { id: 'analytics-export', source: 'analytics', target: 'export', type: 'child' },
    { id: 'users-billing', source: 'users', target: 'billing', type: 'child' },
    { id: 'billing-invoices', source: 'billing', target: 'invoices', type: 'child' }
  ]
})
const checkedPermissions = ref(['view'])

const genealogy = ref<HierarchyDocument>({
  version: '2.0',
  nodes: [
    { id: 'eleanor', label: 'Eleanor', data: { title: '1948 · Grandmother' } },
    { id: 'james', label: 'James', data: { title: '1946 · Grandfather' } },
    { id: 'robert', label: 'Robert', data: { title: '1950 · Former spouse' } },
    { id: 'anna', label: 'Anna', data: { title: '1975 · Daughter' } },
    { id: 'michael', label: 'Michael', data: { title: '1974 · Son-in-law' } },
    { id: 'claire', label: 'Claire', data: { title: '2002 · Biological child' } },
    { id: 'leo', label: 'Leo', data: { title: '2007 · Adopted child' } }
  ],
  edges: [
    { id: 'ej', source: 'eleanor', target: 'james', type: 'spouse', relationship: 'married', familyId: 'family-ej' },
    { id: 'er', source: 'eleanor', target: 'robert', type: 'spouse', relationship: 'divorced', familyId: 'family-er', label: 'divorced' },
    { id: 'e-anna', source: 'eleanor', target: 'anna', type: 'child', relationship: 'biological', familyId: 'family-ej' },
    { id: 'j-anna', source: 'james', target: 'anna', type: 'child', relationship: 'biological', familyId: 'family-ej' },
    { id: 'am', source: 'anna', target: 'michael', type: 'spouse', relationship: 'married', familyId: 'family-am' },
    { id: 'a-claire', source: 'anna', target: 'claire', type: 'child', relationship: 'biological', familyId: 'family-am' },
    { id: 'm-claire', source: 'michael', target: 'claire', type: 'child', relationship: 'biological', familyId: 'family-am' },
    { id: 'a-leo', source: 'anna', target: 'leo', type: 'child', relationship: 'adoptive', familyId: 'family-am', label: 'adopted' },
    { id: 'm-leo', source: 'michael', target: 'leo', type: 'child', relationship: 'adoptive', familyId: 'family-am', label: 'adopted' },
    { id: 'mentor', source: 'james', target: 'michael', type: 'cross', relationship: 'mentor', directed: true, label: 'mentor' }
  ]
})

const largeDataset = ref<HierarchyDocument>({
  version: '2.0',
  nodes: [{ id: 'catalog', label: 'Global catalog', data: { title: '10,000 logical nodes' }, hasChildren: true, childrenLoaded: false }],
  edges: []
})
const loadedCount = computed(() => largeDataset.value.nodes.length)
const lazyRequests = ref(0)

async function loadLargeChildren(node: HierarchyNode, context: { signal: AbortSignal }): Promise<HierarchyFragment> {
  lazyRequests.value++
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 350)
    context.signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
  const start = largeDataset.value.nodes.length
  const count = node.id === 'catalog' ? 8 : 4
  const nodes = Array.from({ length: count }, (_, index) => {
    const id = `${node.id}-${start + index}`
    return {
      id,
      label: node.id === 'catalog' ? `Region ${index + 1}` : `Record ${start + index}`,
      data: { title: node.id === 'catalog' ? 'Lazy branch · 1,250 records' : 'Loaded on demand' },
      hasChildren: node.id === 'catalog',
      childrenLoaded: false
    }
  })
  return {
    nodes,
    edges: nodes.map(child => ({ id: `${node.id}-${child.id}`, source: node.id, target: child.id, type: 'child' as const }))
  }
}

const orgView = ref<InstanceType<typeof HierarchyView> | null>(null)
const activeCode = ref<'install' | 'template'>('install')
const copied = ref(false)
const installCode = 'npm install @shuyuncong/vue-hierarchy@next'
const templateCode = `<script setup lang="ts">\nimport { HierarchyView } from '@shuyuncong/vue-hierarchy'\nimport '@shuyuncong/vue-hierarchy/style.css'\n<\/script>\n\n<template>\n  <HierarchyView v-model="document" editable searchable />\n</template>`

function scrollToDemo() {
  document.querySelector('#live-demo')?.scrollIntoView({ behavior: 'smooth' })
}

async function copyCode() {
  await navigator.clipboard?.writeText(activeCode.value === 'install' ? installCode : templateCode)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1400)
}

function download(dataUrl: string, name: string) {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = name
  anchor.click()
}

async function exportOrganization() {
  const result = await orgView.value?.exportSvg({ backgroundColor: '#f8fafc' })
  if (result) download(result.dataUrl, 'organization-chart.svg')
}
</script>

<template>
  <div class="app-shell">
    <nav class="nav">
      <a class="brand" href="#top" aria-label="Vue Hierarchy home">
        <span class="brand-mark"><i /><i /><i /></span>
        <span>Vue Hierarchy</span>
      </a>
      <div class="nav-links">
        <a href="#live-demo">Examples</a>
        <a href="#features">Features</a>
        <a href="#quick-start">Docs</a>
        <a class="github-link" href="https://github.com/shuyuncong/vue-org-tree">GitHub <span>↗</span></a>
      </div>
    </nav>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="pulse" /> v2.0.0-alpha.1 · Vue 3 + TypeScript</div>
          <h1>Vue Hierarchy<br><em>Visualization Framework</em></h1>
          <p>Build organization charts, permission DAGs, real family trees, and lazy-loaded relationship views with one typed, editable Vue 3 component.</p>
          <div class="hero-actions">
            <button class="primary-button" type="button" @click="scrollToDemo">Explore Live Demo <span>↓</span></button>
            <a class="secondary-button" href="https://github.com/shuyuncong/vue-org-tree">View on GitHub <span>↗</span></a>
          </div>
          <ul class="hero-points">
            <li><span>✓</span> MIT licensed</li>
            <li><span>✓</span> Headless slots</li>
            <li><span>✓</span> JSON in & out</li>
          </ul>
        </div>
        <div class="hero-visual" aria-label="Relationship graph preview">
          <div class="preview-grid" />
          <svg viewBox="0 0 620 420" aria-hidden="true">
            <path class="preview-line" d="M310 96V142H168V188M310 142H452V188M168 254V302H104V344M168 302H238V344M452 254V344" />
            <path class="preview-cross" d="M238 368Q345 282 452 368" />
          </svg>
          <div class="preview-node preview-node--root"><span class="avatar avatar--purple">MC</span><div><strong>Maya Chen</strong><small>Chief Executive Officer</small></div></div>
          <div class="preview-node preview-node--left"><span class="avatar avatar--blue">NW</span><div><strong>Noah Williams</strong><small>VP Product</small></div></div>
          <div class="preview-node preview-node--right"><span class="avatar avatar--green">AP</span><div><strong>Ava Patel</strong><small>VP Engineering</small></div></div>
          <div class="preview-node preview-node--leaf-a"><span class="avatar avatar--pink">SK</span><div><strong>Sofia Kim</strong><small>Design Lead</small></div></div>
          <div class="preview-node preview-node--leaf-b"><span class="avatar avatar--amber">EB</span><div><strong>Ethan Brown</strong><small>Platform Lead</small></div></div>
          <span class="floating-tag floating-tag--edit">↕ Drag to edit</span>
          <span class="floating-tag floating-tag--live"><i /> Live data</span>
        </div>
      </section>

      <section id="features" class="feature-strip">
        <div><strong>Vue 3</strong><span>Composition API</span></div>
        <div><strong>TypeScript</strong><span>Strict contracts</span></div>
        <div><strong>DAG ready</strong><span>Multi-parent nodes</span></div>
        <div><strong>10k+</strong><span>Lazy data source</span></div>
        <div><strong>Accessible</strong><span>Keyboard + ARIA</span></div>
      </section>

      <section id="live-demo" class="demo-section section-wrap">
        <div class="section-heading">
          <span class="section-kicker">Live Demo</span>
          <h2>One framework. Four hierarchy problems.</h2>
          <p>Search, expand, check, drag, and export. Every card below runs the same public component API.</p>
        </div>

        <article id="organization-example" class="demo-card demo-card--wide">
          <header class="demo-card__header">
            <div><span class="demo-number">01</span><div><h3>Organization Chart Example</h3><p>Drag a person onto another manager to update reporting lines.</p></div></div>
            <div class="card-actions"><span class="status-pill">Editable</span><button type="button" @click="exportOrganization">Export SVG</button></div>
          </header>
          <HierarchyView ref="orgView" v-model="organization" editable :expanded-ids="['ceo', 'product', 'engineering', 'operations']" />
        </article>

        <div class="demo-grid">
          <article id="permission-example" class="demo-card">
            <header class="demo-card__header">
              <div><span class="demo-number">02</span><div><h3>Permission Tree Example</h3><p>Global DAG state with shared and disabled branches.</p></div></div>
              <span class="status-pill status-pill--mint">Checkable</span>
            </header>
            <HierarchyView v-model="permissions" v-model:checked-ids="checkedPermissions" checkable :expanded-ids="['workspace', 'content', 'analytics', 'users', 'billing']" :node-width="168" />
          </article>

          <article id="genealogy-example" class="demo-card">
            <header class="demo-card__header">
              <div><span class="demo-number">03</span><div><h3>Genealogy Example</h3><p>Dual parents, spouses, adoption, and cross relationships.</p></div></div>
              <span class="status-pill status-pill--pink">Multi-parent</span>
            </header>
            <HierarchyView v-model="genealogy" editable parent-mode="multiple" :expanded-ids="['eleanor', 'james', 'anna', 'michael']" :node-width="168" />
          </article>
        </div>

        <article id="large-dataset-example" class="demo-card demo-card--large">
          <header class="demo-card__header">
            <div><span class="demo-number">04</span><div><h3>Large Dataset Example</h3><p>Only loaded and expanded nodes reach the DOM.</p></div></div>
            <div class="metrics"><span><strong>10,000</strong> logical</span><span><strong>{{ loadedCount }}</strong> loaded</span><span><strong>{{ lazyRequests }}</strong> requests</span></div>
          </header>
          <HierarchyView v-model="largeDataset" :load-children="loadLargeChildren" :expanded-ids="[]" :node-width="176" />
        </article>
      </section>

      <section id="quick-start" class="quick-start section-wrap">
        <div class="quick-copy">
          <span class="section-kicker">Quick Start</span>
          <h2>From install to interactive graph in minutes.</h2>
          <p>Bring a typed node-and-edge document. Vue Hierarchy handles traversal, state, layout, editing, and export.</p>
          <a href="https://github.com/shuyuncong/vue-org-tree#api-reference">Read the API reference <span>→</span></a>
        </div>
        <div class="code-panel">
          <div class="code-tabs"><button :class="{ active: activeCode === 'install' }" @click="activeCode = 'install'">Install</button><button :class="{ active: activeCode === 'template' }" @click="activeCode = 'template'">Vue</button><button class="copy-button" @click="copyCode">{{ copied ? 'Copied' : 'Copy' }}</button></div>
          <pre><code>{{ activeCode === 'install' ? installCode : templateCode }}</code></pre>
        </div>
      </section>
    </main>

    <footer><div class="brand"><span class="brand-mark"><i /><i /><i /></span><span>Vue Hierarchy</span></div><p>Open source under MIT · Built for complex relationships.</p><a href="https://github.com/shuyuncong/vue-org-tree">GitHub ↗</a></footer>
  </div>
</template>

<style>
:root { color: #172033; background: #fbfcfe; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-synthesis: none; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; background: #fbfcfe; }
button, input { font: inherit; }
a { color: inherit; text-decoration: none; }
.app-shell { min-height: 100vh; overflow: hidden; }
.nav { position: relative; z-index: 20; display: flex; width: min(1180px, calc(100% - 48px)); height: 74px; margin: 0 auto; align-items: center; justify-content: space-between; border-bottom: 1px solid #e7ebf0; }
.brand { display: flex; align-items: center; gap: 11px; font-size: 15px; font-weight: 800; letter-spacing: -.02em; }
.brand-mark { position: relative; display: block; width: 29px; height: 27px; }
.brand-mark i { position: absolute; display: block; width: 8px; height: 8px; border: 2px solid #635bff; border-radius: 3px; }
.brand-mark i:nth-child(1) { top: 0; left: 10px; background: #635bff; }
.brand-mark i:nth-child(2) { bottom: 0; left: 0; }
.brand-mark i:nth-child(3) { right: 0; bottom: 0; }
.brand-mark::before, .brand-mark::after { position: absolute; top: 9px; width: 12px; height: 8px; border-bottom: 1.5px solid #635bff; content: ''; }
.brand-mark::before { left: 4px; border-left: 1.5px solid #635bff; }
.brand-mark::after { right: 4px; border-right: 1.5px solid #635bff; }
.nav-links { display: flex; align-items: center; gap: 30px; color: #526075; font-size: 13px; font-weight: 600; }
.nav-links a:hover { color: #635bff; }
.github-link { border-left: 1px solid #dce2e9; padding-left: 28px; color: #172033 !important; }
.hero { position: relative; display: grid; width: min(1180px, calc(100% - 48px)); min-height: 620px; margin: 0 auto; align-items: center; grid-template-columns: .9fr 1.1fr; gap: 66px; padding: 70px 0 86px; }
.hero::before { position: absolute; z-index: -1; top: -190px; left: -300px; width: 630px; height: 630px; border-radius: 50%; background: radial-gradient(circle, rgba(99,91,255,.1), transparent 67%); content: ''; }
.eyebrow { display: inline-flex; align-items: center; gap: 9px; border: 1px solid #deddfb; border-radius: 99px; background: #f7f6ff; padding: 7px 12px; color: #554de0; font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: #5cdb95; box-shadow: 0 0 0 4px rgba(92,219,149,.17); }
.hero h1 { margin: 25px 0 21px; color: #141b2d; font-size: clamp(50px, 5.1vw, 74px); font-weight: 820; letter-spacing: -.065em; line-height: .98; }
.hero h1 em { color: #635bff; font-style: normal; }
.hero-copy > p { max-width: 570px; margin: 0; color: #5e6b7e; font-size: 17px; line-height: 1.75; }
.hero-actions { display: flex; gap: 12px; margin-top: 30px; }
.primary-button, .secondary-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 17px; border-radius: 10px; padding: 0 19px; cursor: pointer; font-size: 13px; font-weight: 750; }
.primary-button { border: 1px solid #635bff; color: #fff; background: #635bff; box-shadow: 0 9px 24px rgba(99,91,255,.24); }
.primary-button:hover { background: #5148e8; transform: translateY(-1px); }
.secondary-button { border: 1px solid #dce2e9; background: #fff; }
.secondary-button:hover { border-color: #b9c0ca; }
.hero-points { display: flex; gap: 20px; margin: 24px 0 0; padding: 0; color: #748095; font-size: 11px; list-style: none; }
.hero-points span { color: #26a269; font-weight: 900; }
.hero-visual { position: relative; height: 480px; overflow: hidden; border: 1px solid #e2e7ed; border-radius: 26px; background: linear-gradient(145deg, #fff, #f7f8fb); box-shadow: 0 32px 80px rgba(34, 44, 70, .13); transform: perspective(1300px) rotateY(-2deg) rotateX(1deg); }
.preview-grid { position: absolute; inset: 0; opacity: .58; background-image: radial-gradient(#cfd7e4 1px, transparent 1px); background-size: 23px 23px; mask-image: linear-gradient(to bottom, #000, transparent 90%); }
.hero-visual svg { position: absolute; inset: 33px 0 0; width: 100%; height: 100%; }
.preview-line { fill: none; stroke: #bfc8d6; stroke-width: 2; }
.preview-cross { fill: none; stroke: #5aaee4; stroke-width: 2; stroke-dasharray: 6 5; }
.preview-node { position: absolute; display: flex; width: 184px; height: 67px; align-items: center; gap: 10px; border: 1px solid #e1e6ed; border-radius: 12px; background: rgba(255,255,255,.95); padding: 10px; box-shadow: 0 7px 20px rgba(23,32,51,.09); }
.preview-node strong, .preview-node small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-node strong { font-size: 11px; }
.preview-node small { margin-top: 4px; color: #7a8799; font-size: 8px; }
.avatar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 9px; font-size: 9px; font-weight: 850; }
.avatar--purple { color: #5b52e8; background: #edecff; }.avatar--blue { color: #1976b9; background: #e5f4ff; }.avatar--green { color: #1e8e62; background: #e4f8ef; }.avatar--pink { color: #c23a77; background: #fce8f2; }.avatar--amber { color: #b66c14; background: #fff1d8; }
.preview-node--root { top: 44px; left: calc(50% - 92px); }.preview-node--left { top: 186px; left: 36px; }.preview-node--right { top: 186px; right: 36px; }.preview-node--leaf-a { bottom: 43px; left: 57px; }.preview-node--leaf-b { right: 57px; bottom: 43px; }
.floating-tag { position: absolute; border: 1px solid #e1e6ed; border-radius: 8px; background: #fff; padding: 8px 10px; color: #58667b; box-shadow: 0 7px 20px rgba(23,32,51,.09); font-size: 9px; font-weight: 750; }
.floating-tag--edit { top: 130px; right: 25px; color: #5b52e8; }.floating-tag--live { bottom: 126px; left: 18px; }.floating-tag--live i { display: inline-block; width: 6px; height: 6px; margin-right: 4px; border-radius: 50%; background: #44c785; }
.feature-strip { display: grid; width: min(1180px, calc(100% - 48px)); margin: 0 auto 112px; grid-template-columns: repeat(5, 1fr); border-block: 1px solid #e5eaf0; }
.feature-strip div { display: flex; min-height: 86px; flex-direction: column; justify-content: center; border-right: 1px solid #e5eaf0; padding-left: 24px; }.feature-strip div:first-child { padding-left: 0; }.feature-strip div:last-child { border: 0; }
.feature-strip strong { font-size: 15px; }.feature-strip span { margin-top: 5px; color: #8390a2; font-size: 10px; }
.section-wrap { width: min(1180px, calc(100% - 48px)); margin-inline: auto; }
.section-heading { max-width: 650px; margin: 0 auto 45px; text-align: center; }
.section-kicker { color: #635bff; font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.section-heading h2, .quick-copy h2 { margin: 12px 0 13px; color: #172033; font-size: clamp(32px, 4vw, 46px); letter-spacing: -.045em; line-height: 1.08; }
.section-heading p, .quick-copy p { margin: 0; color: #728095; font-size: 14px; line-height: 1.7; }
.demo-section { padding-bottom: 115px; }
.demo-card { overflow: hidden; border: 1px solid #e1e7ee; border-radius: 19px; background: #fff; padding: 18px; box-shadow: 0 13px 38px rgba(23,32,51,.06); }
.demo-card--wide { margin-bottom: 22px; }.demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }.demo-card--large { margin-top: 22px; }
.demo-card__header, .demo-card__header > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.demo-card__header { min-height: 64px; padding: 0 5px 15px; }
.demo-number { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 9px; color: #635bff; background: #efefff; font-size: 10px; font-weight: 850; }
.demo-card h3 { margin: 0 0 5px; font-size: 15px; letter-spacing: -.015em; }.demo-card header p { margin: 0; color: #8390a2; font-size: 10px; }
.card-actions { display: flex; align-items: center; gap: 8px; }.card-actions button { border: 1px solid #dce2e9; border-radius: 8px; background: #fff; padding: 7px 10px; color: #526075; cursor: pointer; font-size: 10px; font-weight: 700; }
.status-pill { border-radius: 99px; background: #efefff; padding: 6px 9px; color: #5b52e8; font-size: 9px; font-weight: 800; }.status-pill--mint { color: #187d58; background: #e7f8f0; }.status-pill--pink { color: #b43770; background: #fceaf2; }
.demo-card .vh-viewport { height: 420px; }.demo-grid .vh-viewport { height: 470px; }.demo-card--large .vh-viewport { height: 330px; }
.metrics { display: flex; gap: 14px; }.metrics span { color: #8490a2; font-size: 9px; }.metrics strong { color: #28344a; font-size: 12px; }
.quick-start { display: grid; align-items: center; grid-template-columns: .8fr 1.2fr; gap: 90px; border-top: 1px solid #e5eaf0; padding: 105px 0 120px; }
.quick-copy a { display: inline-flex; margin-top: 23px; align-items: center; gap: 12px; color: #635bff; font-size: 12px; font-weight: 800; }
.code-panel { overflow: hidden; border: 1px solid #293247; border-radius: 15px; background: #151b2b; box-shadow: 0 22px 55px rgba(21,27,43,.18); }
.code-tabs { display: flex; align-items: center; border-bottom: 1px solid #2a3348; padding: 0 15px; }.code-tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; padding: 13px 11px 11px; color: #7f8aa0; cursor: pointer; font-size: 10px; font-weight: 700; }.code-tabs button.active { border-color: #817bff; color: #fff; }.code-tabs .copy-button { margin-left: auto; border: 0; color: #a9b4c8; }
.code-panel pre { min-height: 145px; margin: 0; padding: 25px; color: #d7dded; font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; line-height: 1.7; white-space: pre-wrap; }
footer { display: flex; width: min(1180px, calc(100% - 48px)); min-height: 90px; margin: 0 auto; align-items: center; justify-content: space-between; border-top: 1px solid #e5eaf0; color: #8591a3; font-size: 10px; }footer .brand { color: #263248; font-size: 12px; }footer a { color: #59667a; font-weight: 700; }
@media (max-width: 900px) { .nav-links a:not(.github-link) { display: none; }.hero { grid-template-columns: 1fr; padding-top: 55px; }.hero-visual { height: 440px; }.feature-strip { grid-template-columns: repeat(2, 1fr); }.feature-strip div { border-bottom: 1px solid #e5eaf0; }.demo-grid, .quick-start { grid-template-columns: 1fr; }.quick-start { gap: 45px; }.demo-grid .vh-viewport { height: 420px; } }
@media (max-width: 600px) { .nav, .hero, .feature-strip, .section-wrap, footer { width: min(100% - 28px, 1180px); }.hero { gap: 38px; }.hero h1 { font-size: 47px; }.hero-actions { align-items: stretch; flex-direction: column; }.hero-points { flex-wrap: wrap; }.hero-visual { height: 375px; }.preview-node { width: 145px; }.preview-node--left { left: 12px; }.preview-node--right { right: 12px; }.preview-node--leaf-a { left: 18px; }.preview-node--leaf-b { right: 18px; }.feature-strip { grid-template-columns: 1fr 1fr; }.demo-card__header { align-items: flex-start; flex-direction: column; }.metrics { flex-wrap: wrap; }footer { align-items: flex-start; flex-direction: column; justify-content: center; gap: 8px; } }
</style>
