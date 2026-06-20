import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '控制台' }
  },
  {
    path: '/families',
    name: 'Families',
    component: () => import('../views/Families.vue'),
    meta: { title: '家族管理' }
  },
  {
    path: '/members/:familyId?',
    name: 'Members',
    component: () => import('../views/Members.vue'),
    meta: { title: '成员管理' }
  },
  {
    path: '/tree/:familyId',
    name: 'Tree',
    component: () => import('../views/Tree.vue'),
    meta: { title: '家族树图' }
  },
  {
    path: '/books',
    name: 'Books',
    component: () => import('../views/Books.vue'),
    meta: { title: '图书管理' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { title: '历史版本' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
