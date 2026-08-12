import Vue from 'vue'
import Router from 'vue-router'
import OrgTreeDemo from '../components/OrgTreeDemo.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/demo'
    },
    {
      path: '/demo',
      name: 'OrgTreeDemo',
      component: OrgTreeDemo
    }
  ]
})
