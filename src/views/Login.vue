<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>作战网络系统</h1>
        <p>Operational Network System</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            size="large"
            style="width: 100%"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <el-alert
          title="演示账号"
          type="info"
          :closable="false"
        >
          <p>用户名：admin / 密码：任意</p>
          <p style="margin-top: 5px; font-size: 12px; opacity: 0.8;">
            注：当前使用Mock数据，后端接口未连接
          </p>
        </el-alert>
      </div>
    </div>

    <div class="login-footer">
      <p>© 2024 作战网络系统 v1.0</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) {
      console.log('表单验证失败')
      return
    }

    console.log('开始登录流程...')
    loading.value = true
    try {
      console.log('调用 userStore.login()...')
      await userStore.login(loginForm)
      console.log('userStore.login() 成功')

      ElMessage.success('登录成功')
      console.log('准备跳转到首页...')

      await router.push('/')
      console.log('路由跳转完成')
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    margin: 0 0 10px 0;
    font-size: 28px;
    font-weight: 600;
    color: #333;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #909399;
    letter-spacing: 1px;
  }
}

.login-form {
  margin-bottom: 20px;
}

.login-tips {
  margin-top: 20px;

  :deep(.el-alert__description) {
    p {
      margin: 0;
      line-height: 1.8;
    }
  }
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

@media (max-width: 768px) {
  .login-box {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>