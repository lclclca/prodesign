import request from './request'

/**
 * 装备管理API
 */

// 获取装备列表
export function getEquipmentList(params) {
  return request({
    url: '/equipments/',
    method: 'get',
    params
  })
}

// 获取装备详情
export function getEquipmentDetail(id) {
  return request({
    url: `/equipments/${id}/`,
    method: 'get'
  })
}

// 创建装备
export function createEquipment(data) {
  return request({
    url: '/equipments/',
    method: 'post',
    data
  })
}

// 更新装备
export function updateEquipment(id, data) {
  return request({
    url: `/equipments/${id}/`,
    method: 'put',
    data
  })
}

// 删除装备
export function deleteEquipment(id) {
  return request({
    url: `/equipments/${id}/`,
    method: 'delete'
  })
}

// 获取装备类型列表
export function getEquipmentTypes() {
  return request({
    url: '/equipments/types/',
    method: 'get'
  })
}

// 获取装备模板
export function getEquipmentTemplates() {
  return request({
    url: '/equipments/templates/',
    method: 'get'
  })
}
