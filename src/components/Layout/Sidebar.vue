<template>
  <div class="sidebar">
    <!-- Logo -->
    <div class="logo-container">
      <transition name="fade">
        <span v-if="!isCollapsed" class="logo-title">杀伤链评估</span>
        <span v-else class="logo-abbr">KC</span>
      </transition>
    </div>
    
    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :unique-opened="true"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <template v-for="route in menuRoutes" :key="route.path">
        <!-- 有子菜单 -->
        <el-sub-menu v-if="route.children && route.children.length > 0" :index="route.path">
          <template #title>
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <span>{{ route.meta.title }}</span>
          </template>
          <el-menu-item
            v-for="child in route.children"
            :key="child.path"
            :index="child.path"
          >
            {{ child.meta.title }}
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 无子菜单 -->
        <el-menu-item v-else :index="route.path">
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

const route = useRoute()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)

// 过滤出需要显示的菜单项
const menuRoutes = computed(() => {
  const routes = [
    {
      path: '/dashboard',
      meta: { title: '仪表盘', icon: 'Odometer' }
    },
    {
      path: '/equipment',
      meta: { title: '装备管理', icon: 'Box' }
    },
    {
      path: '/scenario',
      meta: { title: '想定管理', icon: 'Map' }
    },
    {
      path: '/network',
      meta: { title: '作战网络', icon: 'Share' }
    },
    {
      path: '/mission',
      meta: { title: '任务管理', icon: 'Flag' }
    },
    {
      path: '/assessment',
      meta: { title: '评估分析', icon: 'TrendCharts' }
    },
    {
      path: '/simulation',
      meta: { title: '推演仿真', icon: 'VideoPlay' }
    },
    {
      path: '/report',
      meta: { title: '报告管理', icon: 'Document' }
    },
    {
      path: '/system',
      meta: { title: '系统管理', icon: 'Setting' },
      children: [
        {
          path: '/system/user',
          meta: { title: '用户管理' }
        },
        {
          path: '/system/log',
          meta: { title: '日志管理' }
        }
      ]
    }
  ]
  return routes
})
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b3a4b;
    
    .logo-title {
      font-size: 20px;
      font-weight: bold;
      color: #fff;
    }
    
    .logo-abbr {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }
  }
  
  .el-menu {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    
    &:not(.el-menu--collapse) {
      width: 200px;
    }
  }
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1) !important;
  }
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.1) !important;
}
</style>
