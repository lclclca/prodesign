import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 登录页
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },

  // 主布局
  {
    path: '/',
    component: () => import('@/views/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      // 系统概览
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '系统概览' }
      },

      // 装备管理
      {
        path: 'equipment',
        name: 'Equipment',
        component: () => import('@/views/EquipmentManagement.vue'),
        meta: { title: '装备管理' }
      },

      // 网络构建
      {
        path: 'network',
        name: 'Network',
        component: () => import('@/views/NetworkCanvas.vue'),
        meta: { title: '网络构建' }
      },

      // 项目管理
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/Projects.vue'),
        meta: { title: '项目管理' }
      },

      // 以下是您项目中存在的其他页面，如果对应的 .vue 文件存在就保留，不存在就注释掉

      // 想定管理
      // {
      //   path: 'scenario',
      //   name: 'Scenario',
      //   component: () => import('@/views/Scenario.vue'),
      //   meta: { title: '想定管理' }
      // },

      // 效能评估
      // {
      //   path: 'assessment',
      //   name: 'Assessment',
      //   component: () => import('@/views/Assessment.vue'),
      //   meta: { title: '效能评估' }
      // },

      // 仿真推演
      // {
      //   path: 'simulation',
      //   name: 'Simulation',
      //   component: () => import('@/views/Simulation.vue'),
      //   meta: { title: '仿真推演' }
      // },

      // 报告管理
      // {
      //   path: 'report',
      //   name: 'Report',
      //   component: () => import('@/views/Report.vue'),
      //   meta: { title: '报告管理' }
      // },

      // 系统设置
      // {
      //   path: 'system',
      //   name: 'System',
      //   component: () => import('@/views/System.vue'),
      //   meta: { title: '系统设置' }
      // }
    ]
  },

  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - ProDesign` : 'ProDesign'

  // 登录验证
  const token = localStorage.getItem('token')

  if (to.path === '/login') {
    // 如果已登录，跳转到首页
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    // 其他页面需要登录
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router