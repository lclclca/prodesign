import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false 
    }
  },
  {
    path: '/',
    redirect: '/network-canvas'
  },
  {
    path: '/network-canvas',
    name: 'NetworkCanvas',
    component: () => import('@/views/NetworkCanvas.vue'),
    meta: { 
      title: '作战网络构建',
      requiresAuth: true 
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/Projects.vue'),
    meta: { 
      title: '项目管理',
      requiresAuth: true 
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  console.log('路由守卫 - 从:', from.path, '到:', to.path)
  console.log('路由守卫 - Token:', userStore.token ? '存在' : '不存在')
  console.log('路由守卫 - 需要认证:', to.meta.requiresAuth)
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 作战网络系统` : '作战网络系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.token) {
    console.log('路由守卫 - 需要认证但无Token，跳转到登录页')
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    console.log('路由守卫 - 已登录且访问登录页，跳转到首页')
    next('/')
  } else {
    console.log('路由守卫 - 允许通过')
    next()
  }
})

export default router
