import request from './request'

/**
 * 项目管理 API（使用新的后端数据库存储）
 */

// 获取项目列表
export function getProjectList(params) {
  return request({
    url: '/api/projects',
    method: 'get',
    params
  })
}

// 获取项目详情（包含完整的节点和边数据）
export function getProjectDetail(id) {
  return request({
    url: `/api/projects/${id}`,
    method: 'get'
  })
}

// 创建项目
export function createProject(data) {
  return request({
    url: '/api/projects',
    method: 'post',
    data
  })
}

// 更新项目
export function updateProject(id, data) {
  return request({
    url: `/api/projects/${id}`,
    method: 'put',
    data
  })
}

// 删除项目
export function deleteProject(id) {
  return request({
    url: `/api/projects/${id}`,
    method: 'delete'
  })
}

// 更新项目状态
export function updateProjectStatus(id, status) {
  return request({
    url: `/api/projects/${id}/status`,
    method: 'patch',
    data: { status }
  })
}

// 添加节点到项目
export function addNodeToProject(projectId, node) {
  return request({
    url: `/api/projects/${projectId}/nodes`,
    method: 'post',
    data: { node }
  })
}

// 更新项目中的节点
export function updateNodeInProject(projectId, nodeId, updates) {
  return request({
    url: `/api/projects/${projectId}/nodes/${nodeId}`,
    method: 'put',
    data: { updates }
  })
}

// 删除项目中的节点
export function deleteNodeFromProject(projectId, nodeId) {
  return request({
    url: `/api/projects/${projectId}/nodes/${nodeId}`,
    method: 'delete'
  })
}

// 添加边到项目
export function addEdgeToProject(projectId, edge) {
  return request({
    url: `/api/projects/${projectId}/edges`,
    method: 'post',
    data: { edge }
  })
}

// 删除项目中的边
export function deleteEdgeFromProject(projectId, edgeId) {
  return request({
    url: `/api/projects/${projectId}/edges/${edgeId}`,
    method: 'delete'
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
 * 评估历史 API（使用新的后端数据库存储）
 */

// 获取评估历史列表
export function getEvaluationList(params) {
  return request({
    url: '/api/evaluations',
    method: 'get',
    params
  })
}

// 获取评估详情
export function getEvaluationDetail(id) {
  return request({
    url: `/api/evaluations/${id}`,
    method: 'get'
  })
}

// 创建评估记录
export function createEvaluation(data) {
  return request({
    url: '/api/evaluations',
    method: 'post',
    data
  })
}

// 更新评估记录
export function updateEvaluation(id, data) {
  return request({
    url: `/api/evaluations/${id}`,
    method: 'put',
    data
  })
}

// 删除评估记录
export function deleteEvaluation(id) {
  return request({
    url: `/api/evaluations/${id}`,
    method: 'delete'
  })
}

// 获取项目的评估历史
export function getProjectEvaluations(projectId) {
  return request({
    url: `/api/evaluations/project/${projectId}`,
    method: 'get'
  })
}

// 获取评估统计
export function getEvaluationStats() {
  return request({
    url: '/api/evaluations/stats/overview',
    method: 'get'
  })
}

// 批量删除评估记录
export function batchDeleteEvaluations(ids) {
  return request({
    url: '/api/evaluations/batch-delete',
    method: 'post',
    data: { ids }
  })
}
