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
      {
        path: 'simulation',  // ⚠️ 不要用 '/simulation'，用相对路径
        name: 'Simulation',
        component: () => import('@/views/Simulation/index.vue'),
        meta: {
          title: '推演仿真',
          icon: 'VideoPlay'
        }
      }
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