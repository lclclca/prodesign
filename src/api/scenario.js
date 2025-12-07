import request from './request'

/**
 * 想定管理API
 */

// 获取想定列表
export function getScenarioList(params) {
  return request({
    url: '/scenarios/',
    method: 'get',
    params
  })
}

// 获取想定详情
export function getScenarioDetail(id) {
  return request({
    url: `/scenarios/${id}/`,
    method: 'get'
  })
}

// 创建想定
export function createScenario(data) {
  return request({
    url: '/scenarios/',
    method: 'post',
    data
  })
}

// 更新想定
export function updateScenario(id, data) {
  return request({
    url: `/scenarios/${id}/`,
    method: 'put',
    data
  })
}

// 删除想定
export function deleteScenario(id) {
  return request({
    url: `/scenarios/${id}/`,
    method: 'delete'
  })
}

// 获取想定的装备实例
export function getScenarioInstances(id) {
  return request({
    url: `/scenarios/${id}/instances/`,
    method: 'get'
  })
}
