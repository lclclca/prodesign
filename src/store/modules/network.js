// 网络状态管理（重构版 v2.0）
// 位置: src/store/modules/network.js

import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    // 数据版本
    version: '2.0',
    
    // 节点列表（包含完整装备属性）
    nodes: [],
    
    // 边列表
    edges: [],
    
    // 网络元数据
    metadata: {
      name: '',
      version: '2.0',
      timestamp: null,
      description: ''
    },
    
    // 是否已加载网络
    isLoaded: false
  }),

  getters: {
    // 是否为空网络
    isEmpty: (state) => state.nodes.length === 0,
    
    // 蓝方节点
    blueNodes: (state) => state.nodes.filter(n => n.faction === 'blue'),
    
    // 红方节点
    redNodes: (state) => state.nodes.filter(n => n.faction === 'red'),
    
    // 各类型节点统计
    nodeStats: (state) => ({
      total: state.nodes.length,
      blue: state.nodes.filter(n => n.faction === 'blue').length,
      red: state.nodes.filter(n => n.faction === 'red').length,
      sensor: state.nodes.filter(n => n.baseType === 'sensor').length,
      command: state.nodes.filter(n => n.baseType === 'command').length,
      striker: state.nodes.filter(n => n.baseType === 'striker').length,
      support: state.nodes.filter(n => n.baseType === 'support').length
    }),
    
    // 节点按类型分组
    nodesByType: (state) => {
      const grouped = {
        sensor: [],
        command: [],
        striker: [],
        support: []
      }
      state.nodes.forEach(node => {
        if (grouped[node.baseType]) {
          grouped[node.baseType].push(node)
        }
      })
      return grouped
    }
  },

  actions: {
    /**
     * 添加节点（包含完整装备属性）
     * @param {Object} node - 节点对象，必须包含完整的装备属性
     */
    addNode(node) {
      // 验证必填字段
      if (!node.id || !node.baseType || !node.faction) {
        console.error('节点缺少必填字段:', node)
        ElMessage.error('节点数据不完整')
        return false
      }
      
      // 检查节点ID是否已存在
      if (this.nodes.find(n => n.id === node.id)) {
        console.warn(`节点 ${node.id} 已存在`)
        return false
      }
      
      // 确保节点包含完整属性
      const completeNode = {
        ...node,
        hp: node.hp ?? 100,
        performance: node.performance || {},
        createdAt: node.createdAt || new Date().toISOString()
      }
      
      this.nodes.push(completeNode)
      this.isLoaded = true
      
      console.log('节点已添加:', completeNode.id, completeNode.name)
      return true
    },

    /**
     * 批量添加节点
     */
    addNodes(nodes) {
      nodes.forEach(node => this.addNode(node))
    },

    /**
     * 删除节点
     */
    deleteNode(nodeId) {
      // 删除节点
      const index = this.nodes.findIndex(n => n.id === nodeId)
      if (index !== -1) {
        this.nodes.splice(index, 1)
      }
      
      // 删除相关的边
      this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      
      return true
    },

    /**
     * 更新节点
     */
    updateNode(nodeId, updates) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        Object.assign(node, updates)
        return true
      }
      return false
    },

    /**
     * 添加边
     */
    addEdge(edge) {
      // 检查边ID是否已存在
      if (this.edges.find(e => e.id === edge.id)) {
        console.warn(`边 ${edge.id} 已存在`)
        return false
      }
      
      // 检查起始和目标节点是否存在
      const sourceExists = this.nodes.find(n => n.id === edge.source)
      const targetExists = this.nodes.find(n => n.id === edge.target)
      
      if (!sourceExists || !targetExists) {
        console.error('边的起始或目标节点不存在')
        return false
      }
      
      // 计算边的质量参数（基于节点属性）
      const edgeWithQuality = {
        ...edge,
        quality: this.calculateEdgeQuality(edge),
        createdAt: edge.createdAt || new Date().toISOString()
      }
      
      this.edges.push(edgeWithQuality)
      return true
    },

    /**
     * 计算边的质量
     */
    calculateEdgeQuality(edge) {
      const source = this.nodes.find(n => n.id === edge.source)
      const target = this.nodes.find(n => n.id === edge.target)
      
      if (!source || !target) return 0.5
      
      // 简化计算：基于距离
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 根据边类型获取最大范围
      let maxRange = 200
      if (edge.type === 'detection' && source.performance?.detectionRange) {
        maxRange = source.performance.detectionRange
      } else if (edge.type === 'communication') {
        maxRange = Math.min(
          source.performance?.commDistance || source.performance?.commandRange || 200,
          target.performance?.commDistance || target.performance?.commandRange || 200
        )
      } else if (edge.type === 'strike' && source.performance?.strikeRange) {
        maxRange = source.performance.strikeRange
      }
      
      // 距离越近质量越高
      const quality = Math.max(0, 1 - distance / maxRange)
      return Math.min(1, quality)
    },

    /**
     * 批量添加边
     */
    addEdges(edges) {
      edges.forEach(edge => this.addEdge(edge))
    },

    /**
     * 删除边
     */
    deleteEdge(edgeId) {
      const index = this.edges.findIndex(e => e.id === edgeId)
      if (index !== -1) {
        this.edges.splice(index, 1)
        return true
      }
      return false
    },

    /**
     * 更新边
     */
    updateEdge(edgeId, updates) {
      const edge = this.edges.find(e => e.id === edgeId)
      if (edge) {
        Object.assign(edge, updates)
        return true
      }
      return false
    },

    /**
     * 加载网络数据（支持v1.0和v2.0格式）
     */
    loadNetwork(data) {
      try {
        console.log('加载网络数据，版本:', data.version || '1.0')
        
        // 清空现有数据
        this.nodes = []
        this.edges = []
        
        // 加载元数据
        if (data.metadata) {
          this.metadata = { ...data.metadata }
        }
        
        if (data.name) {
          this.metadata.name = data.name
        }
        
        if (data.version) {
          this.metadata.version = data.version
        }
        
        if (data.timestamp) {
          this.metadata.timestamp = data.timestamp
        }
        
        // 加载节点（确保保留完整属性）
        if (data.nodes && Array.isArray(data.nodes)) {
          this.nodes = data.nodes.map(node => ({
            ...node,
            hp: node.hp ?? 100,
            performance: node.performance || {},
            // 兼容旧格式
            model: node.model || '未知型号',
            createdAt: node.createdAt || new Date().toISOString()
          }))
        }
        
        // 加载边
        if (data.edges && Array.isArray(data.edges)) {
          this.edges = data.edges.map(edge => ({
            ...edge,
            quality: edge.quality ?? 0.9,
            createdAt: edge.createdAt || new Date().toISOString()
          }))
        }
        
        this.isLoaded = true
        
        console.log('网络加载成功:', {
          nodes: this.nodes.length,
          edges: this.edges.length,
          version: this.metadata.version
        })
        
        ElMessage.success(`网络加载成功：${this.nodes.length}个节点，${this.edges.length}条连接`)
        return true
      } catch (error) {
        console.error('加载网络失败:', error)
        ElMessage.error('加载网络失败')
        return false
      }
    },

    /**
     * 导出网络数据（v2.0格式，包含完整装备属性）
     */
    exportNetwork() {
      return {
        version: '2.0',
        name: this.metadata.name || '未命名网络',
        timestamp: new Date().toISOString(),
        description: this.metadata.description || '',
        metadata: {
          nodeCount: this.nodes.length,
          edgeCount: this.edges.length,
          ...this.nodeStats
        },
        nodes: this.nodes.map(node => ({
          // 基础信息
          id: node.id,
          type: node.type,
          baseType: node.baseType,
          faction: node.faction,
          
          // 装备信息
          equipmentId: node.equipmentId,
          name: node.name,
          model: node.model,
          icon: node.icon,
          color: node.color,
          
          // 性能属性（完整保存）
          performance: { ...node.performance },
          
          // 位置和状态
          x: node.x,
          y: node.y,
          hp: node.hp,
          
          // 元数据
          description: node.description,
          createdAt: node.createdAt
        })),
        edges: this.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          label: edge.label,
          quality: edge.quality,
          distance: edge.distance,
          latency: edge.latency,
          createdAt: edge.createdAt
        }))
      }
    },

    /**
     * 导出为JSON文件
     */
    exportToFile(filename) {
      const data = this.exportNetwork()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `network_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      ElMessage.success('网络导出成功')
    },

    /**
     * 从JSON文件导入
     */
    async importFromFile(file) {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        if (this.loadNetwork(data)) {
          ElMessage.success(`导入成功：${data.name || '未命名网络'}`)
          return true
        }
        return false
      } catch (error) {
        console.error('导入失败:', error)
        ElMessage.error('导入失败：文件格式错误')
        return false
      }
    },

    /**
     * 清空网络
     */
    clearNetwork() {
      this.nodes = []
      this.edges = []
      this.metadata = {
        name: '',
        version: '2.0',
        timestamp: null,
        description: ''
      }
      this.isLoaded = false
    },

    /**
     * 重置所有节点HP
     */
    resetAllHP() {
      this.nodes.forEach(node => {
        node.hp = 100
      })
    },
    
    /**
     * 验证网络数据完整性
     */
    validateNetwork() {
      const errors = []
      const warnings = []
      
      // 检查节点
      this.nodes.forEach(node => {
        if (!node.performance || Object.keys(node.performance).length === 0) {
          warnings.push(`节点 ${node.name} 缺少性能属性`)
        }
        
        if (!node.model) {
          warnings.push(`节点 ${node.name} 缺少型号信息`)
        }
      })
      
      // 检查边
      this.edges.forEach(edge => {
        const source = this.nodes.find(n => n.id === edge.source)
        const target = this.nodes.find(n => n.id === edge.target)
        
        if (!source) {
          errors.push(`边 ${edge.id} 的起点节点不存在`)
        }
        
        if (!target) {
          errors.push(`边 ${edge.id} 的终点节点不存在`)
        }
      })
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    }
  }
})
