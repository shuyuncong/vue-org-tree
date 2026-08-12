import Vue from 'vue'

Vue.config.productionTip = false
Vue.config.devtools = false

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 40
  }
})

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 120
  }
})
