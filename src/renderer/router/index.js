import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'yaml Editor',
      component: require('@/components/YamlEdit').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
