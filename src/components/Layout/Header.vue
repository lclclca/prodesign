<template>
  <div class="header">
    <div class="header-left">
      <h2>网络拓扑管理系统</h2>
    </div>

    <div class="header-right">
      <!-- 用户信息 -->
      <div class="user-info">
        <span class="user-icon">👤</span>
        <span class="username">{{ userInfo.username || '用户' }}</span>
      </div>

      <!-- 退出登录按钮 -->
      <el-button
        type="danger"
        size="small"
        @click="handleLogout"
        class="logout-btn"
      >
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useStore()
const router = useRouter()

// 获取用户信息
const userInfo = computed(() => store.state.user.userInfo || {})

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 执行退出
    await store.dispatch('user/logout')

    ElMessage.success('退出成功')

    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    // 用户取消退出
    if (error !== 'cancel') {
      console.error('退出失败:', error)
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
  background: #fff;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.user-icon {
  font-size: 18px;
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.logout-btn {
  font-weight: 500;
}
</style>