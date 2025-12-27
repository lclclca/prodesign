// networkGenerator.js v2.0 - 适配Equipment v2.0属性结构
// 位置: src/utils/networkGenerator.js

/**
 * 计算两点间距离
 */
export function calculateDistance(node1, node2) {
  if (!node1 || !node2) return 0
  const dx = (node2.x || 0) - (node1.x || 0)
  const dy = (node2.y || 0) - (node1.y || 0)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 自动生成网络连接（基于v2.0性能属性）
 * @param {Array} nodes - 节点数组（v2.0格式）
 * @param {Object} options - 配置选项
 * @returns {Array} 生成的边数组
 */
export function generateConnections(nodes, options = {}) {
  const {
    minDistance = 50,
    maxConnectionsPerNode = 5,
    enableCrossFaction = false,
    strictRangeCheck = true
  } = options
  
  const edges = []
  let edgeId = 0
  
  for (const sourceNode of nodes) {
    const sourcePerf = sourceNode.performance || {}
    let connectionCount = 0
    
    for (const targetNode of nodes) {
      if (sourceNode.id === targetNode.id) continue
      if (connectionCount >= maxConnectionsPerNode) break
      
      // 检查阵营
      const sameFaction = sourceNode.faction === targetNode.faction
      const crossFaction = !sameFaction && enableCrossFaction
      
      if (!sameFaction && !crossFaction) continue
      
      const distance = calculateDistance(sourceNode, targetNode)
      
      // 太近不建立连接
      if (distance < minDistance) continue
      
      // 根据源节点类型和性能属性判断可建立的连接
      const possibleConnections = []
      
      switch(sourceNode.baseType) {
        case 'sensor':
          // 传感器可以探测
          const detectionRange = sourcePerf.detectionRange || 0
          if (distance <= detectionRange || !strictRangeCheck) {
            possibleConnections.push({
              type: 'detection',
              range: detectionRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'detection', distance)
            })
          }
          
          // 传感器也有通信能力
          const sensorCommRange = sourcePerf.commDistance || 100
          if (sameFaction && (distance <= sensorCommRange || !strictRangeCheck)) {
            possibleConnections.push({
              type: 'communication',
              range: sensorCommRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'communication', distance)
            })
          }
          break
          
        case 'command':
          // 指挥节点可以指挥和通信
          const commandRange = sourcePerf.commandRange || 0
          if (sameFaction && (distance <= commandRange || !strictRangeCheck)) {
            possibleConnections.push({
              type: 'command',
              range: commandRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'command', distance)
            })
            
            possibleConnections.push({
              type: 'communication',
              range: commandRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'communication', distance)
            })
          }
          break
          
        case 'striker':
          // 打击节点可以打击敌方
          const strikeRange = sourcePerf.strikeRange || 0
          if (!sameFaction && (distance <= strikeRange || !strictRangeCheck)) {
            possibleConnections.push({
              type: 'strike',
              range: strikeRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'strike', distance)
            })
          }
          
          // 同阵营可以通信
          if (sameFaction) {
            possibleConnections.push({
              type: 'communication',
              range: 100,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'communication', distance)
            })
          }
          break
          
        case 'support':
          // 支援节点主要负责通信
          const supportCommRange = sourcePerf.commDistance || 0
          if (sameFaction && (distance <= supportCommRange || !strictRangeCheck)) {
            possibleConnections.push({
              type: 'communication',
              range: supportCommRange,
              quality: calculateEdgeQuality(sourceNode, targetNode, 'communication', distance)
            })
          }
          break
      }
      
      // 创建边
      for (const conn of possibleConnections) {
        edges.push({
          id: `edge_${edgeId++}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: conn.type,
          distance: Math.round(distance * 10) / 10,
          quality: conn.quality,
          maxRange: conn.range
        })
        
        connectionCount++
        if (connectionCount >= maxConnectionsPerNode) break
      }
    }
  }
  
  return edges
}

/**
 * 计算边的质量（基于v2.0性能属性）
 */
function calculateEdgeQuality(sourceNode, targetNode, edgeType, distance) {
  const sourcePerf = sourceNode.performance || {}
  const targetPerf = targetNode.performance || {}
  
  let quality = 0.9
  
  switch(edgeType) {
    case 'detection':
      const detectionRange = sourcePerf.detectionRange || 200
      const detectionProb = sourcePerf.detectionProbability || 0.8
      const antiJam = sourcePerf.antiJamming || 0.7
      
      // 距离衰减
      const rangeFactor = Math.max(0, 1 - distance / detectionRange)
      quality = detectionProb * antiJam * (0.5 + 0.5 * rangeFactor)
      break
      
    case 'communication':
      const sourceCommRange = sourcePerf.commDistance || 
                              sourcePerf.commandRange || 200
      const sourceReliability = sourcePerf.reliability || 0.9
      const targetReliability = targetPerf.reliability || 0.9
      
      const avgReliability = (sourceReliability + targetReliability) / 2
      const commRangeFactor = Math.max(0, 1 - distance / sourceCommRange)
      
      quality = avgReliability * (0.6 + 0.4 * commRangeFactor)
      break
      
    case 'command':
      const commandRange = sourcePerf.commandRange || 200
      const processingCapacity = sourcePerf.processingCapacity || 100
      
      const cmdRangeFactor = Math.max(0, 1 - distance / commandRange)
      const capacityFactor = Math.min(1, processingCapacity / 500)
      
      quality = (0.5 + 0.5 * cmdRangeFactor) * (0.8 + 0.2 * capacityFactor)
      break
      
    case 'strike':
      const strikeRange = sourcePerf.strikeRange || 100
      const damageRate = sourcePerf.damageRate || 0.7
      const accuracy = sourcePerf.accuracy || 20 // CEP
      
      const strikeRangeFactor = Math.max(0, 1 - distance / strikeRange)
      const accuracyFactor = Math.max(0.5, 1 - accuracy / 50)
      
      quality = damageRate * (0.5 + 0.3 * strikeRangeFactor + 0.2 * accuracyFactor)
      break
  }
  
  return Math.max(0, Math.min(1, quality))
}

/**
 * 智能布局算法 - 力导向布局
 */
export function applyForceLayout(nodes, options = {}) {
  const {
    iterations = 100,
    attraction = 0.01,
    repulsion = 100,
    damping = 0.9
  } = options
  
  // 为每个节点添加速度属性
  const nodeStates = nodes.map(node => ({
    node: node,
    vx: 0,
    vy: 0
  }))
  
  for (let iter = 0; iter < iterations; iter++) {
    // 计算斥力（节点间相互排斥）
    for (let i = 0; i < nodeStates.length; i++) {
      for (let j = i + 1; j < nodeStates.length; j++) {
        const state1 = nodeStates[i]
        const state2 = nodeStates[j]
        
        const dx = state2.node.x - state1.node.x
        const dy = state2.node.y - state1.node.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = repulsion / (distance * distance)
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        
        state1.vx -= fx
        state1.vy -= fy
        state2.vx += fx
        state2.vy += fy
      }
    }
    
    // 更新位置
    nodeStates.forEach(state => {
      state.vx *= damping
      state.vy *= damping
      
      state.node.x += state.vx
      state.node.y += state.vy
    })
  }
  
  return nodes
}

/**
 * 圆形布局
 */
export function applyCircleLayout(nodes, options = {}) {
  const {
    centerX = 400,
    centerY = 400,
    radius = 300
  } = options
  
  const angleStep = (2 * Math.PI) / nodes.length
  
  nodes.forEach((node, index) => {
    const angle = index * angleStep
    node.x = centerX + radius * Math.cos(angle)
    node.y = centerY + radius * Math.sin(angle)
  })
  
  return nodes
}

/**
 * 网格布局
 */
export function applyGridLayout(nodes, options = {}) {
  const {
    startX = 100,
    startY = 100,
    spacing = 150
  } = options
  
  const cols = Math.ceil(Math.sqrt(nodes.length))
  
  nodes.forEach((node, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    
    node.x = startX + col * spacing
    node.y = startY + row * spacing
  })
  
  return nodes
}

/**
 * 层次布局（基于节点类型）
 */
export function applyHierarchyLayout(nodes, options = {}) {
  const {
    startX = 100,
    startY = 100,
    layerSpacing = 200,
    nodeSpacing = 150
  } = options
  
  // 按类型分组
  const layers = {
    sensor: [],
    command: [],
    striker: [],
    support: []
  }
  
  nodes.forEach(node => {
    const type = node.baseType || 'sensor'
    if (layers[type]) {
      layers[type].push(node)
    }
  })
  
  // 布局每一层
  let currentY = startY
  Object.keys(layers).forEach(layerType => {
    const layerNodes = layers[layerType]
    
    layerNodes.forEach((node, index) => {
      node.x = startX + index * nodeSpacing
      node.y = currentY
    })
    
    if (layerNodes.length > 0) {
      currentY += layerSpacing
    }
  })
  
  return nodes
}

/**
 * 查找孤立节点（没有任何连接的节点）
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @returns {Array} 孤立节点数组
 */
export function findIsolatedNodes(nodes, edges) {
  const connectedNodeIds = new Set()
  
  // 收集所有有连接的节点ID
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  
  // 找出没有连接的节点
  return nodes.filter(node => !connectedNodeIds.has(node.id))
}

/**
 * 查找关键节点（度中心性最高的节点）
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {Number} topN - 返回前N个关键节点
 * @returns {Array} 关键节点数组
 */
export function findCriticalNodes(nodes, edges, topN = 5) {
  // 计算每个节点的度（连接数）
  const nodeDegrees = {}
  
  nodes.forEach(node => {
    nodeDegrees[node.id] = 0
  })
  
  edges.forEach(edge => {
    if (nodeDegrees[edge.source] !== undefined) {
      nodeDegrees[edge.source]++
    }
    if (nodeDegrees[edge.target] !== undefined) {
      nodeDegrees[edge.target]++
    }
  })
  
  // 按度排序
  const sortedNodes = nodes
    .map(node => ({
      node,
      degree: nodeDegrees[node.id] || 0
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, topN)
    .map(item => item.node)
  
  return sortedNodes
}

// 默认导出
export default {
  generateConnections,
  applyForceLayout,
  applyCircleLayout,
  applyGridLayout,
  applyHierarchyLayout,
  calculateDistance,
  findIsolatedNodes,
  findCriticalNodes
}
