import { performance } from 'node:perf_hooks'
import { layoutHierarchy, searchHierarchy } from '../dist/vue-hierarchy.js'

const nodeCount = 500
const document = {
  version: '2.0',
  nodes: Array.from({ length: nodeCount }, (_, index) => ({ id: `node-${index}`, label: `Node ${index}`, data: { group: `group-${index % 17}` } })),
  edges: Array.from({ length: nodeCount - 1 }, (_, index) => ({ id: `edge-${index}`, source: `node-${Math.floor(index / 3)}`, target: `node-${index + 1}`, type: 'child' }))
}
const expanded = document.nodes.map(node => node.id)

function measure(task) {
  const start = performance.now()
  task()
  return performance.now() - start
}

layoutHierarchy(document, expanded)
searchHierarchy(document, 'group-7')
const layoutRuns = []
const searchRuns = []
for (let index = 0; index < 5; index++) {
  layoutRuns.push(measure(() => layoutHierarchy(document, expanded)))
  searchRuns.push(measure(() => searchHierarchy(document, 'group-7')))
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const layoutMedian = median(layoutRuns)
const searchMedian = median(searchRuns)
process.stdout.write(`500-node median layout: ${layoutMedian.toFixed(2)}ms; search: ${searchMedian.toFixed(2)}ms\n`)
if (layoutMedian >= 1000 || searchMedian >= 1000) process.exitCode = 1
