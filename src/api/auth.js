import request from './request'

/**
 * 认证相关API
 */

// 用户登录
export function login(data) {
  return request({
    url: '/auth/login/',
    method: 'post',
    data
  })
}

// 用户登出
export function logout() {
  return request({
    url: '/auth/logout/',
    method: 'post'
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/auth/user/',
    method: 'get'
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/auth/password/',
    method: 'put',
    data
  })
}
