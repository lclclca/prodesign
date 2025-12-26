<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>ProDesign</h2>
        <p>杀伤链评估系统</p>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>系统概览</span>
        </el-menu-item>

        <el-menu-item index="/equipment">
          <el-icon><Box /></el-icon>
          <span>装备管理</span>
        </el-menu-item>

        <el-menu-item index="/network">
          <el-icon><Share /></el-icon>
          <span>网络构建</span>
        </el-menu-item>

        <el-menu-item index="/projects">
          <el-icon><FolderOpened /></el-icon>
          <span>项目管理</span>
        </el-menu-item>

        <!-- 以下菜单项被注释，如果对应页面存在，可以取消注释 -->

        <!-- <el-menu-item index="/scenario">
          <el-icon><Map /></el-icon>
          <span>想定管理</span>
        </el-menu-item>

        <el-menu-item index="/assessment">
          <el-icon><TrendCharts /></el-icon>
          <span>效能评估</span>
        </el-menu-item>

        <el-menu-item index="/simulation">
          <el-icon><VideoPlay /></el-icon>
          <span>仿真推演</span>
        </el-menu-item>

        <el-menu-item index="/report">
          <el-icon><Document /></el-icon>
          <span>报告管理</span>
        </el-menu-item>

        <el-menu-item index="/system">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item> -->
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown>
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleProfile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataBoard,
  Box,
  Share,
  FolderOpened,
  // 以下图标如果需要其他菜单项，可以取消注释
  // Map,
  // TrendCharts,
  // VideoPlay,
  // Document,
  // Setting,
  UserFilled,
  User,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前页面标题
const currentTitle = computed(() => route.meta?.title || '首页')

// 用户名
const username = ref('管理员')

// 个人中心
const handleProfile = () => {
  ElMessage.info('跳转到个人中心')
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;

  .sidebar {
    background-color: #001529;
    overflow-y: auto;

    .logo {
      height: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      p {
        margin: 5px 0 0 0;
        font-size: 12px;
        opacity: 0.8;
      }
    }

    .el-menu {
      border-right: none;
    }
  }

  .header {
    background: #fff;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

    .header-left {
      flex: 1;
    }

    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        transition: background 0.3s;

        &:hover {
          background: #f5f5f5;
        }

        .username {
          font-size: 14px;
          color: #333;
        }
      }
    }
  }

  .main-content {
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}

// 页面切换动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>