import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    fullName: (state) => state.userInfo?.fullName || '',
    avatar: (state) => state.userInfo?.avatar || '',
    role: (state) => state.userInfo?.role || ''
  },

  actions: {
    // 前端模拟登录
    async login(credentials) {
      try {
        console.log('开始登录，用户名:', credentials.username)

        // 模拟登录验证 - 这里可以添加简单的验证逻辑
        // 例如：只要用户名不为空就允许登录
        if (!credentials.username) {
          throw new Error('用户名不能为空')
        }

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        // 生成模拟token
        const token = 'mock_token_' + Date.now()

        // 生成用户信息
        const user = {
          id: '1',
          username: credentials.username,
          fullName: credentials.username === 'admin' ? '系统管理员' : credentials.username,
          avatar: '',
          role: credentials.username === 'admin' ? 'admin' : 'user',
          email: `${credentials.username}@example.com`
        }

        // 保存状态
        this.token = token
        this.userInfo = user

        // 保存到localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(user))

        console.log('登录成功，Token已保存')
        return Promise.resolve({ token, user })
      } catch (error) {
        console.error('登录失败:', error)
        return Promise.reject(error)
      }
    },

    // 退出登录
    async logout() {
      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    },

    // 获取用户信息（从本地存储）
    async getUserInfo() {
      try {
        const userInfo = this.userInfo
        if (userInfo) {
          return Promise.resolve(userInfo)
        } else {
          return Promise.reject(new Error('用户信息不存在'))
        }
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 从本地存储恢复状态
    restoreState() {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')

      if (token) {
        this.token = token
      }

      if (userInfo) {
        try {
          this.userInfo = JSON.parse(userInfo)
        } catch (error) {
          console.error('Parse userInfo error:', error)
        }
      }
    },

    // 修改密码（前端模拟）
    async changePassword(data) {
      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        // 简单验证
        if (!data.old_password || !data.new_password) {
          throw new Error('密码不能为空')
        }

        console.log('密码修改成功（前端模拟）')
        return Promise.resolve({ message: '密码修改成功' })
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }
})