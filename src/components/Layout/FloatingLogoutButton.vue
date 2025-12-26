<template>
  <div class="floating-logout">
    <div class="user-info">
      <span class="username">👤 {{ username }}</span>
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const username = computed(() => userStore.userInfo?.username || '未登录')

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

    // 退出登录
    await userStore.logout()

    ElMessage.success('退出登录成功')

    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
    }
  }
}
</script>

<style scoped>
.floating-logout {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.logout-btn {
  padding: 6px 15px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
}

.logout-btn:active {
  transform: translateY(0);
}
</style>