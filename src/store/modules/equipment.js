// 装备库状态管理（重构版 v2.0）
// 位置: src/store/modules/equipment.js

import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

// 预置装备模板（完整属性版）
const EQUIPMENT_TEMPLATES = [
  // ==================== 传感器类 ====================
  {
    id: 'sensor_radar_phased_array',
    name: '相控阵雷达',
    model: 'AN/SPY-1D',
    baseType: 'sensor',
    faction: 'blue',
    icon: '📡',
    color: '#409EFF',
    performance: {
      detectionRange: 300,           // 探测范围（km）
      detectionAccuracy: 10,         // 探测精度（m）
      detectionProbability: 0.85,    // 探测概率（0-1）
      resolution: 1.0,               // 分辨率（m）
      frequency: 'X-band',           // 工作频段
      antiJamming: 0.7              // 抗干扰能力（0-1）
    },
    description: '先进的相控阵雷达，具有强大的多目标跟踪能力'
  },
  {
    id: 'sensor_satellite',
    name: '侦察卫星',
    model: 'KH-12',
    baseType: 'sensor',
    faction: 'blue',
    icon: '🛰️',
    color: '#409EFF',
    performance: {
      detectionRange: 1000,
      detectionAccuracy: 5,
      detectionProbability: 0.9,
      resolution: 0.5,
      frequency: 'optical',
      antiJamming: 0.9
    },
    description: '光学侦察卫星，高分辨率成像'
  },
  {
    id: 'sensor_awacs',
    name: '预警机',
    model: 'E-3',
    baseType: 'sensor',
    faction: 'blue',
    icon: '✈️',
    color: '#409EFF',
    performance: {
      detectionRange: 400,
      detectionAccuracy: 20,
      detectionProbability: 0.8,
      resolution: 2.0,
      frequency: 'S-band',
      antiJamming: 0.6
    },
    description: '空中预警与控制系统'
  },
  
  // ==================== 决策类 ====================
  {
    id: 'command_theater',
    name: '战区指挥中心',
    model: 'C4ISR-T',
    baseType: 'command',
    faction: 'blue',
    icon: '🎯',
    color: '#67C23A',
    performance: {
      commandRange: 500,             // 指挥范围（km）
      processingCapacity: 1000,      // 信息处理能力（条/秒）
      decisionDelay: 5,              // 决策时延（秒）
      maxNodes: 50                   // 可指挥节点数
    },
    description: '战区级指挥控制中心，大规模作战指挥'
  },
  {
    id: 'command_campaign',
    name: '战役指挥所',
    model: 'C4ISR-C',
    baseType: 'command',
    faction: 'blue',
    icon: '🏢',
    color: '#67C23A',
    performance: {
      commandRange: 300,
      processingCapacity: 500,
      decisionDelay: 3,
      maxNodes: 30
    },
    description: '战役级指挥所，中等规模作战指挥'
  },
  {
    id: 'command_tactical',
    name: '战术指挥所',
    model: 'C4ISR-A',
    baseType: 'command',
    faction: 'blue',
    icon: '📍',
    color: '#67C23A',
    performance: {
      commandRange: 100,
      processingCapacity: 200,
      decisionDelay: 2,
      maxNodes: 15
    },
    description: '战术级指挥所，快速决策'
  },
  
  // ==================== 影响器类 ====================
  {
    id: 'striker_missile',
    name: '导弹发射车',
    model: 'M270 MLRS',
    baseType: 'striker',
    faction: 'blue',
    icon: '🚀',
    color: '#F56C6C',
    performance: {
      strikeRange: 200,              // 打击范围（km）
      damageRate: 0.8,               // 毁伤概率（0-1）
      responseTime: 10,              // 反应时间（秒）
      ammunition: 12,                // 弹药量
      accuracy: 10                   // 打击精度 CEP（m）
    },
    description: '多管火箭炮系统，精确打击能力'
  },
  {
    id: 'striker_fighter',
    name: '战斗机',
    model: 'F-16',
    baseType: 'striker',
    faction: 'blue',
    icon: '✈️',
    color: '#F56C6C',
    performance: {
      strikeRange: 500,
      damageRate: 0.75,
      responseTime: 30,
      ammunition: 8,
      accuracy: 15
    },
    description: '多用途战斗机，空对地精确打击'
  },
  {
    id: 'striker_artillery',
    name: '自行火炮',
    model: 'M109A7',
    baseType: 'striker',
    faction: 'blue',
    icon: '💣',
    color: '#F56C6C',
    performance: {
      strikeRange: 50,
      damageRate: 0.6,
      responseTime: 5,
      ammunition: 100,
      accuracy: 20
    },
    description: '自行榴弹炮，火力支援'
  },
  
  // ==================== 支援保障类 ====================
  {
    id: 'support_comm_hub',
    name: '通信枢纽',
    model: 'TCS-2000',
    baseType: 'support',
    faction: 'blue',
    icon: '📶',
    color: '#E6A23C',
    performance: {
      commDistance: 300,             // 通信距离（km）
      bandwidth: 100,                // 通信带宽（Mbps）
      relayCapacity: 10,             // 中继能力
      reliability: 0.95              // 通信可靠性（0-1）
    },
    description: '大型通信枢纽，高带宽数据传输'
  },
  {
    id: 'support_datalink',
    name: '数据链节点',
    model: 'Link-16',
    baseType: 'support',
    faction: 'blue',
    icon: '🔗',
    color: '#E6A23C',
    performance: {
      commDistance: 200,
      bandwidth: 50,
      relayCapacity: 5,
      reliability: 0.9
    },
    description: '战术数据链，实时信息共享'
  },
  
  // ==================== 敌方装备 ====================
  {
    id: 'sensor_radar_red',
    name: '敌方雷达',
    model: 'S-300 Radar',
    baseType: 'sensor',
    faction: 'red',
    icon: '📡',
    color: '#F56C6C',
    performance: {
      detectionRange: 250,
      detectionAccuracy: 15,
      detectionProbability: 0.75,
      resolution: 2.0,
      frequency: 'S-band',
      antiJamming: 0.6
    },
    description: '中程防空雷达'
  },
  {
    id: 'command_red',
    name: '敌方指挥所',
    model: 'Command Post',
    baseType: 'command',
    faction: 'red',
    icon: '🎯',
    color: '#F56C6C',
    performance: {
      commandRange: 200,
      processingCapacity: 300,
      decisionDelay: 5,
      maxNodes: 20
    },
    description: '敌方战术指挥所'
  },
  {
    id: 'striker_red',
    name: '敌方导弹',
    model: 'SS-21',
    baseType: 'striker',
    faction: 'red',
    icon: '🚀',
    color: '#F56C6C',
    performance: {
      strikeRange: 150,
      damageRate: 0.7,
      responseTime: 15,
      ammunition: 4,
      accuracy: 15
    },
    description: '敌方短程弹道导弹'
  }
]

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    // 装备库（所有可用装备模板）
    equipmentLibrary: [...EQUIPMENT_TEMPLATES],
    
    // 自定义装备
    customEquipment: [],
    
    // 数据版本
    version: '2.0'
  }),

  getters: {
    // 获取所有装备
    allEquipment: (state) => [...state.equipmentLibrary, ...state.customEquipment],
    
    // 按类型分组
    equipmentByType: (state) => {
      const all = [...state.equipmentLibrary, ...state.customEquipment]
      return {
        sensor: all.filter(e => e.baseType === 'sensor'),
        command: all.filter(e => e.baseType === 'command'),
        striker: all.filter(e => e.baseType === 'striker'),
        support: all.filter(e => e.baseType === 'support')
      }
    },
    
    // 按阵营分组
    equipmentByFaction: (state) => {
      const all = [...state.equipmentLibrary, ...state.customEquipment]
      return {
        blue: all.filter(e => e.faction === 'blue'),
        red: all.filter(e => e.faction === 'red'),
        neutral: all.filter(e => e.faction === 'neutral')
      }
    },
    
    // 我方装备
    blueEquipment: (state) => {
      return [...state.equipmentLibrary, ...state.customEquipment].filter(e => e.faction === 'blue')
    },
    
    // 敌方装备
    redEquipment: (state) => {
      return [...state.equipmentLibrary, ...state.customEquipment].filter(e => e.faction === 'red')
    }
  },

  actions: {
    /**
     * 根据ID获取装备模板
     */
    getEquipmentById(id) {
      return this.allEquipment.find(e => e.id === id)
    },
    
    /**
     * 创建装备实例（用于添加到网络）
     */
    createEquipmentInstance(equipmentId, overrides = {}) {
      const template = this.getEquipmentById(equipmentId)
      if (!template) {
        console.error(`装备模板不存在: ${equipmentId}`)
        return null
      }
      
      // 深拷贝装备属性
      return {
        ...JSON.parse(JSON.stringify(template)),
        ...overrides,
        // 确保performance是深拷贝
        performance: {
          ...JSON.parse(JSON.stringify(template.performance)),
          ...(overrides.performance || {})
        }
      }
    },
    
    /**
     * 添加自定义装备
     */
    addCustomEquipment(equipment) {
      // 生成唯一ID
      const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 验证必填字段
      if (!equipment.name || !equipment.model || !equipment.baseType || !equipment.faction) {
        ElMessage.error('装备名称、型号、类型和阵营为必填项')
        return null
      }
      
      const newEquipment = {
        id,
        ...equipment,
        isCustom: true,
        createdAt: new Date().toISOString()
      }
      
      this.customEquipment.push(newEquipment)
      this.saveToStorage()
      
      ElMessage.success('装备添加成功')
      return newEquipment
    },
    
    /**
     * 删除自定义装备
     */
    deleteCustomEquipment(id) {
      const index = this.customEquipment.findIndex(e => e.id === id)
      if (index !== -1) {
        this.customEquipment.splice(index, 1)
        this.saveToStorage()
        ElMessage.success('装备删除成功')
        return true
      }
      return false
    },
    
    /**
     * 修改自定义装备
     */
    updateCustomEquipment(id, updates) {
      const equipment = this.customEquipment.find(e => e.id === id)
      if (equipment) {
        Object.assign(equipment, updates)
        this.saveToStorage()
        ElMessage.success('装备修改成功')
        return true
      }
      return false
    },
    
    /**
     * 验证装备性能属性完整性
     */
    validatePerformance(baseType, performance) {
      const requiredFields = {
        sensor: ['detectionRange', 'detectionAccuracy', 'detectionProbability', 'antiJamming'],
        command: ['commandRange', 'processingCapacity', 'decisionDelay', 'maxNodes'],
        striker: ['strikeRange', 'damageRate', 'responseTime', 'ammunition', 'accuracy'],
        support: ['commDistance', 'bandwidth', 'relayCapacity', 'reliability']
      }
      
      const required = requiredFields[baseType] || []
      const missing = required.filter(field => !(field in performance))
      
      return {
        valid: missing.length === 0,
        missing
      }
    },
    
    /**
     * 保存到localStorage
     */
    saveToStorage() {
      localStorage.setItem('customEquipment_v2', JSON.stringify(this.customEquipment))
      localStorage.setItem('equipmentVersion', this.version)
    },
    
    /**
     * 从localStorage恢复
     */
    restoreFromStorage() {
      try {
        const data = localStorage.getItem('customEquipment_v2')
        if (data) {
          this.customEquipment = JSON.parse(data)
        }
      } catch (error) {
        console.error('恢复装备数据失败:', error)
      }
    }
  }
})
