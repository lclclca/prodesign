import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    avatar: (state) => state.userInfo?.avatar || '',
    role: (state) => state.userInfo?.role || ''
  },

  actions: {
    // 登录
    async login(credentials) {
      try {
        console.log('开始登录，用户名:', credentials.username)
        const response = await login(credentials)
        console.log('登录响应数据:', response)
        
        const { token, user } = response
        
        if (!token || !user) {
          console.error('登录响应数据格式错误:', response)
          throw new Error('登录响应数据格式错误')
        }
        
        this.token = token
        this.userInfo = user
        
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(user))
        
        console.log('登录成功，Token已保存')
        return Promise.resolve(response)
      } catch (error) {
        console.error('登录失败:', error)
        return Promise.reject(error)
      }
    },

    // 退出登录
    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const userInfo = await getUserInfo()
        this.userInfo = userInfo
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        return Promise.resolve(userInfo)
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
    }
  }
})
