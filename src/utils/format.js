import dayjs from 'dayjs'

/**
 * 格式化日期时间
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 */
export function formatDate(date) {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 */
export function formatTime(date) {
  return formatDateTime(date, 'HH:mm:ss')
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num) {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化百分比
 */
export function formatPercent(num, decimals = 2) {
  if (typeof num !== 'number') return '0%'
  return (num * 100).toFixed(decimals) + '%'
}

/**
 * 格式化装备类型
 */
export function formatEquipmentType(type) {
  const types = {
    sensor: '传感器',
    decision: '决策',
    effector: '影响器',
    support: '支援保障'
  }
  return types[type] || type
}

/**
 * 格式化阵营
 */
export function formatFaction(faction) {
  const factions = {
    red: '红方',
    blue: '蓝方',
    neutral: '中立'
  }
  return factions[faction] || faction
}

/**
 * 格式化任务类型
 */
export function formatMissionType(type) {
  const types = {
    strike: '打击',
    recon: '侦察',
    blockade: '封锁',
    defense: '防御'
  }
  return types[type] || type
}

/**
 * 格式化状态
 */
export function formatStatus(status) {
  const statuses = {
    active: '活跃',
    inactive: '停用',
    pending: '待处理',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    destroyed: '已损毁',
    damaged: '已损坏'
  }
  return statuses[status] || status
}
