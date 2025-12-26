// src/store/modules/network.js
import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    // 当前网络的节点列表
    nodes: [],
    // 当前网络的连接关系
    edges: [],
    // 当前项目信息
    currentProject: null,
    // 是否已加载网络数据
    isLoaded: false
  }),

  getters: {
    // 获取我方节点（蓝方）
    blueNodes: (state) => {
      return state.nodes.filter(node => node.faction === 'blue' || node.type === 'friendly')
    },

    // 获取敌方节点（红方）
    redNodes: (state) => {
      return state.nodes.filter(node => node.faction === 'red' || node.type === 'enemy')
    },

    // 获取所有节点的ID列表
    nodeIds: (state) => {
      return state.nodes.map(node => node.id)
    },

    // 检查网络是否为空
    isEmpty: (state) => {
      return state.nodes.length === 0
    }
  },

  actions: {
    // 设置网络数据
    setNetwork(data) {
      this.nodes = data.nodes || []
      this.edges = data.edges || []
      this.currentProject = data.project || null
      this.isLoaded = true
      console.log('网络数据已加载:', this.nodes.length, '个节点')
    },

    // 添加节点
    addNode(node) {
      // 确保节点有必要的属性
      const newNode = {
        id: node.id || `node_${Date.now()}`,
        name: node.name || '未命名节点',
        type: node.type || 'unknown',
        faction: node.faction || 'blue',
        x: node.x || 100,
        y: node.y || 100,
        hp: node.hp || 100,
        color: node.color || (node.faction === 'red' ? '#F56C6C' : '#409EFF'),
        ...node
      }
      this.nodes.push(newNode)
      return newNode
    },

    // 删除节点
    removeNode(nodeId) {
      const index = this.nodes.findIndex(n => n.id === nodeId)
      if (index > -1) {
        this.nodes.splice(index, 1)
        // 同时删除相关的连接
        this.edges = this.edges.filter(e =>
          e.source !== nodeId && e.target !== nodeId
        )
      }
    },

    // 更新节点
    updateNode(nodeId, updates) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        Object.assign(node, updates)
      }
    },

    // 添加连接
    addEdge(edge) {
      const newEdge = {
        id: edge.id || `edge_${Date.now()}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        ...edge
      }
      this.edges.push(newEdge)
      return newEdge
    },

    // 清空网络
    clearNetwork() {
      this.nodes = []
      this.edges = []
      this.currentProject = null
      this.isLoaded = false
    },

    // 从网络构建页面导入数据
    importFromNetworkCanvas(canvasData) {
      console.log('从网络构建导入数据:', canvasData)

      // 转换Canvas数据格式为推演格式
      const nodes = canvasData.nodes.map(node => ({
        id: node.id,
        name: node.label || node.name || node.id,
        type: node.type || 'unknown',
        faction: node.faction || (node.data?.faction) || 'blue',
        x: node.position?.x || node.x || 100,
        y: node.position?.y || node.y || 100,
        hp: 100,
        color: node.faction === 'red' ? '#F56C6C' : '#409EFF',
        originalData: node // 保存原始数据
      }))

      const edges = canvasData.edges || []

      this.setNetwork({ nodes, edges, project: canvasData.project })
    },

    // 创建示例网络（用于测试）
    createSampleNetwork() {
      const sampleNodes = [
        { id: 'b1', name: '侦察机-01', type: 'recon', faction: 'blue', x: 120, y: 150, hp: 100 },
        { id: 'b2', name: '战斗机-01', type: 'fighter', faction: 'blue', x: 140, y: 280, hp: 100 },
        { id: 'b3', name: '指挥所', type: 'command', faction: 'blue', x: 100, y: 400, hp: 100 },
        { id: 'r1', name: '敌雷达站', type: 'radar', faction: 'red', x: 660, y: 120, hp: 100 },
        { id: 'r2', name: '敌导弹阵地', type: 'missile', faction: 'red', x: 700, y: 260, hp: 100 },
        { id: 'r3', name: '敌指挥部', type: 'hq', faction: 'red', x: 680, y: 400, hp: 100 }
      ]

      const sampleEdges = [
        { id: 'e1', source: 'b1', target: 'b3', type: 'communication' },
        { id: 'e2', source: 'b2', target: 'b3', type: 'communication' },
        { id: 'e3', source: 'r1', target: 'r3', type: 'communication' },
        { id: 'e4', source: 'r2', target: 'r3', type: 'communication' }
      ]

      this.setNetwork({
        nodes: sampleNodes,
        edges: sampleEdges,
        project: { name: '示例网络' }
      })
    }
  }
})