import type { App } from 'vue'
import HierarchyView from './HierarchyView.vue'

export { HierarchyView }
export default {
  install(app: App) {
    app.component('HierarchyView', HierarchyView)
  }
}

export * from './commands'
export * from './errors'
export * from './export'
export * from './layout'
export * from './model'
export * from './permissions'
export * from './types'
