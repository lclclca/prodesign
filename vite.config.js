import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@api': resolve(__dirname, 'src/api'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@store': resolve(__dirname, 'src/store'),
      '@assets': resolve(__dirname, 'src/assets'),
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // 添加 bypass 配置来处理 Mock 数据
        bypass: (req, res, options) => {
          const { method, url } = req

          // 登录接口 Mock
          if (method === 'POST' && url.includes('/api/auth/login')) {
            console.log('使用 Mock 登录数据')

            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })

            req.on('end', () => {
              try {
                const credentials = JSON.parse(body)
                console.log('登录请求用户名:', credentials.username)

                const mockResponse = {
                  code: 200,
                  message: '登录成功',
                  data: {
                    token: 'mock-jwt-token-1234567890',
                    user: {
                      id: 1,
                      username: credentials.username || 'testuser',
                      name: '测试用户',
                      email: 'test@example.com',
                      avatar: '/src/assets/default-avatar.png',
                      role: 'admin',
                      permissions: ['dashboard', 'user_manage', 'system_manage']
                    }
                  }
                }

                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify(mockResponse))
              } catch (error) {
                console.error('解析请求体错误:', error)
                res.statusCode = 400
                res.end(JSON.stringify({ code: 400, message: '请求格式错误' }))
              }
            })

            return true // 跳过代理，直接返回 Mock 数据
          }

          // 用户信息接口 Mock
          if (method === 'GET' && url.includes('/api/auth/user')) {
            console.log('使用 Mock 用户信息数据')

            const mockResponse = {
              code: 200,
              message: '获取用户信息成功',
              data: {
                id: 1,
                username: 'testuser',
                name: '测试用户',
                email: 'test@example.com',
                avatar: '/src/assets/default-avatar.png',
                role: 'admin',
                department: '技术部',
                phone: '13800138000',
                createTime: '2024-01-01 10:00:00',
                permissions: ['dashboard', 'user_manage', 'system_manage']
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(mockResponse))
            return true
          }

          // 退出登录接口 Mock
          if (method === 'POST' && url.includes('/api/auth/logout')) {
            console.log('使用 Mock 退出登录数据')

            const mockResponse = {
              code: 200,
              message: '退出登录成功',
              data: null
            }

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(mockResponse))
            return true
          }

          // 其他接口继续走代理
          return false
        }
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'chart-vendor': ['echarts', 'cytoscape'],
        }
      }
    }
  }
})