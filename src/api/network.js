import request from './request'

/**
 * 作战网络API
 */

// 获取项目列表
export function getProjectList(params) {
  return request({
    url: '/projects/',
    method: 'get',
    params
  })
}

// 获取项目详情
export function getProjectDetail(id) {
  return request({
    url: `/projects/${id}/`,
    method: 'get'
  })
}

// 创建项目
export function createProject(data) {
  return request({
    url: '/projects/',
    method: 'post',
    data
  })
}

// 更新项目
export function updateProject(id, data) {
  return request({
    url: `/projects/${id}/`,
    method: 'put',
    data
  })
}

// 删除项目
export function deleteProject(id) {
  return request({
    url: `/projects/${id}/`,
    method: 'delete'
  })
}

// 获取项目的作战网络
export function getProjectNetwork(id) {
  return request({
    url: `/projects/${id}/network/`,
    method: 'get'
  })
}

// 更新作战网络
export function updateProjectNetwork(id, data) {
  return request({
    url: `/projects/${id}/network/`,
    method: 'put',
    data
  })
}

/**
 * 任务管理API
 */

// 获取任务列表
export function getMissionList(params) {
  return request({
    url: '/missions/',
    method: 'get',
    params
  })
}

// 创建任务
export function createMission(data) {
  return request({
    url: '/missions/',
    method: 'post',
    data
  })
}

// 获取任务的杀伤链
export function getMissionKillChains(id) {
  return request({
    url: `/missions/${id}/killchains/`,
    method: 'get'
  })
}

/**
 * 评估分析API
 */

// 创建评估任务
export function createAssessment(data) {
  return request({
    url: '/assessments/',
    method: 'post',
    data
  })
}

// 获取评估结果
export function getAssessmentResult(id) {
  return request({
    url: `/assessments/${id}/`,
    method: 'get'
  })
}

// 获取评估任务列表
export function getAssessmentList(params) {
  return request({
    url: '/assessments/',
    method: 'get',
    params
  })
}
