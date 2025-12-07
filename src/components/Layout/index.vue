<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth">
        <Sidebar />
      </el-aside>
      
      <!-- 主体区域 -->
      <el-container>
        <!-- 头部 -->
        <el-header>
          <Header />
        </el-header>
        
        <!-- 内容区域 -->
        <el-main>
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const appStore = useAppStore()

const sidebarWidth = computed(() => {
  return appStore.sidebarCollapsed ? '64px' : '200px'
})
</script>

<style scoped lang="scss">
.app-layout {
  width: 100%;
  height: 100%;
  
  .el-container {
    height: 100%;
  }
  
  .el-aside {
    background: #304156;
    transition: width 0.3s;
    overflow-x: hidden;
  }
  
  .el-header {
    background: #fff;
    padding: 0;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .el-main {
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
