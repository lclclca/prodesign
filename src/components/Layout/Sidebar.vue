<template>
  <div class="sidebar">
    <!-- Logo -->
    <div class="logo-container">
      <span class="logo-title">杀伤链评估</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="$route.path"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <!-- 仪表盘 -->
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>仪表盘</template>
      </el-menu-item>

      <!-- 装备管理 -->
      <el-menu-item index="/equipment">
        <el-icon><Box /></el-icon>
        <template #title>装备管理</template>
      </el-menu-item>

      <!-- 网络构建 -->
      <el-menu-item index="/network">
        <el-icon><Share /></el-icon>
        <template #title>网络构建</template>
      </el-menu-item>

      <!-- 项目管理 -->
      <el-menu-item index="/projects">
        <el-icon><Files /></el-icon>
        <template #title>项目管理</template>
      </el-menu-item>

      <!-- 推演仿真 - 重点在这里！ -->
      <el-menu-item index="/simulation">
        <el-icon><VideoPlay /></el-icon>
        <template #title>推演仿真</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import {
  Odometer,
  Box,
  Share,
  Files,
  VideoPlay
} from '@element-plus/icons-vue'
console.log('Sidebar 已加载！')
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #304156;

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
  }

  .el-menu {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    width: 200px;
  }
}

:deep(.el-menu-item) {
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