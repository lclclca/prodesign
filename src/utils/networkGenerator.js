/**
 * 作战网络连接生成算法
 * 根据节点位置、类型和阵营自动生成连接关系
 * 支持三种网络模式:我方网络、敌方网络、混合网络
 */

/**
 * 计算两点之间的欧几里得距离
 */
export function calculateDistance(node1, node2) {
  const dx = node1.x - node2.x
  const dy = node1.y - node2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 获取节点类型配置
 */
function getNodeTypeConfig(nodeType, allNodeTypes) {
  return allNodeTypes.find(t => t.type === nodeType)
}

/**
 * 判断两个节点是否可以建立探测连接
 * 规则：传感器节点在探测半径内可以探测目标
 * 阵营规则：
 * - 同阵营：可以相互探测（协同）
 * - 不同阵营：可以探测敌方节点（敌情侦察）
 */
function canDetect(sourceNode, targetNode, allNodeTypes) {
  if (sourceNode.baseType !== 'sensor') return false
  
  const sensorConfig = getNodeTypeConfig(sourceNode.type, allNodeTypes)
  if (!sensorConfig) return false
  
  const distance = calculateDistance(sourceNode, targetNode)
  return distance <= sensorConfig.detection_radius
}

/**
 * 判断两个节点是否可以建立通信连接
 * 规则：节点间距离小于双方通信半径的最大值
 * 阵营规则：
 * - 同阵营：可以通信
 * - 不同阵营：不能通信（通信加密）
 */
function canCommunicate(node1, node2, allNodeTypes) {
  // 跨阵营不能通信
  if (node1.faction !== node2.faction) return false
  
  const config1 = getNodeTypeConfig(node1.type, allNodeTypes)
  const config2 = getNodeTypeConfig(node2.type, allNodeTypes)
  
  if (!config1 || !config2) return false
  
  const maxRadius = Math.max(
    config1.communication_radius || 0,
    config2.communication_radius || 0
  )
  
  const distance = calculateDistance(node1, node2)
  return distance <= maxRadius
}

/**
 * 判断打击节点是否可以打击目标
 * 规则：打击单元在打击半径内可以打击目标
 * 阵营规则：
 * - 同阵营：可以打击（火力支援）
 * - 不同阵营：可以打击（对敌打击）
 */
function canStrike(sourceNode, targetNode, allNodeTypes) {
  if (sourceNode.baseType !== 'striker') return false
  
  const strikerConfig = getNodeTypeConfig(sourceNode.type, allNodeTypes)
  if (!strikerConfig || !strikerConfig.strike_radius) return false
  
  const distance = calculateDistance(sourceNode, targetNode)
  return distance <= strikerConfig.strike_radius
}

/**
 * 根据网络模式过滤节点
 * @param {Array} nodes - 所有节点
 * @param {String} networkMode - 网络模式 (friendly/enemy/mixed)
 * @returns {Array} 过滤后的节点
 */
function filterNodesByMode(nodes, networkMode) {
  if (networkMode === 'friendly') {
    return nodes.filter(n => n.faction === 'blue')
  } else if (networkMode === 'enemy') {
    return nodes.filter(n => n.faction === 'red')
  } else {
    return nodes // mixed模式返回所有节点
  }
}

/**
 * 生成作战网络连接
 * @param {Array} nodes - 节点数组
 * @param {Array} nodeTypes - 节点类型定义
 * @param {String} networkMode - 网络模式 (friendly/enemy/mixed)
 * @returns {Promise<Array>} - 生成的连接数组
 */
export async function generateConnections(nodes, nodeTypes, networkMode = 'mixed') {
  return new Promise((resolve) => {
    // 模拟异步处理
    setTimeout(() => {
      const edges = []
      
      // 根据网络模式过滤节点
      const activeNodes = filterNodesByMode(nodes, networkMode)
      
      if (activeNodes.length < 2) {
        resolve([])
        return
      }
      
      // 遍历所有节点对
      for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
          const node1 = activeNodes[i]
          const node2 = activeNodes[j]
          
          const sameFaction = node1.faction === node2.faction
          
          // 1. 检查探测连接（传感器 -> 任意节点）
          // 同阵营探测：协同感知
          // 跨阵营探测：敌情侦察
          if (canDetect(node1, node2, nodeTypes)) {
            edges.push({
              source: node1.id,
              target: node2.id,
              type: 'detection',
              label: sameFaction ? '探测' : '侦察',
              crossFaction: !sameFaction
            })
          }
          if (canDetect(node2, node1, nodeTypes)) {
            edges.push({
              source: node2.id,
              target: node1.id,
              type: 'detection',
              label: sameFaction ? '探测' : '侦察',
              crossFaction: !sameFaction
            })
          }
          
          // 2. 检查通信连接（仅同阵营）
          if (sameFaction && canCommunicate(node1, node2, nodeTypes)) {
            // 避免重复，只添加一条双向通信连接
            if (!edges.some(e => 
              (e.source === node1.id && e.target === node2.id && e.type === 'communication') ||
              (e.source === node2.id && e.target === node1.id && e.type === 'communication')
            )) {
              edges.push({
                source: node1.id,
                target: node2.id,
                type: 'communication',
                label: '通信',
                crossFaction: false
              })
            }
          }
          
          // 3. 检查打击连接（打击单元 -> 目标）
          // 同阵营打击：火力支援
          // 跨阵营打击：对敌打击
          if (canStrike(node1, node2, nodeTypes)) {
            edges.push({
              source: node1.id,
              target: node2.id,
              type: 'strike',
              label: sameFaction ? '支援' : '打击',
              crossFaction: !sameFaction
            })
          }
          if (canStrike(node2, node1, nodeTypes)) {
            edges.push({
              source: node2.id,
              target: node1.id,
              type: 'strike',
              label: sameFaction ? '支援' : '打击',
              crossFaction: !sameFaction
            })
          }
        }
      }
      
      // 在混合模式下，如果有跨阵营连接，添加额外的标记
      if (networkMode === 'mixed') {
        edges.forEach(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source)
          const targetNode = nodes.find(n => n.id === edge.target)
          
          if (sourceNode && targetNode && sourceNode.faction !== targetNode.faction) {
            edge.crossFaction = true
          }
        })
      }
      
      resolve(edges)
    }, 500)
  })
}

/**
 * 手动创建连接
 * @param {Object} sourceNode - 起始节点
 * @param {Object} targetNode - 目标节点
 * @returns {Object} - 连接对象
 */
export function createManualConnection(sourceNode, targetNode) {
  return {
    source: sourceNode.id,
    target: targetNode.id,
    type: 'manual',
    label: '手动',
    crossFaction: sourceNode.faction !== targetNode.faction
  }
}

/**
 * 检查连接是否已存在
 * @param {Array} edges - 现有连接数组
 * @param {String} sourceId - 起始节点ID
 * @param {String} targetId - 目标节点ID
 * @returns {Boolean}
 */
export function connectionExists(edges, sourceId, targetId) {
  return edges.some(e => 
    (e.source === sourceId && e.target === targetId) ||
    (e.source === targetId && e.target === sourceId)
  )
}

/**
 * 获取节点的所有连接
 * @param {Array} edges - 连接数组
 * @param {String} nodeId - 节点ID
 * @returns {Array} - 相关的连接数组
 */
export function getNodeConnections(edges, nodeId) {
  return edges.filter(e => e.source === nodeId || e.target === nodeId)
}

/**
 * 计算网络的平均连接度
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 连接数组
 * @returns {Number}
 */
export function calculateAverageDegree(nodes, edges) {
  if (nodes.length === 0) return 0
  
  const degrees = nodes.map(node => {
    return edges.filter(e => e.source === node.id || e.target === node.id).length
  })
  
  const sum = degrees.reduce((acc, val) => acc + val, 0)
  return sum / nodes.length
}

/**
 * 查找关键节点（连接度最高的节点）
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 连接数组
 * @param {Number} topN - 返回前N个关键节点
 * @returns {Array}
 */
export function findCriticalNodes(nodes, edges, topN = 3) {
  const nodeDegrees = nodes.map(node => ({
    node,
    degree: edges.filter(e => e.source === node.id || e.target === node.id).length
  }))
  
  return nodeDegrees
    .sort((a, b) => b.degree - a.degree)
    .slice(0, topN)
    .map(item => ({
      ...item.node,
      connectionCount: item.degree
    }))
}

/**
 * 检测网络中的孤立节点
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 连接数组
 * @returns {Array}
 */
export function findIsolatedNodes(nodes, edges) {
  return nodes.filter(node => {
    return !edges.some(e => e.source === node.id || e.target === node.id)
  })
}

/**
 * 按阵营分组节点
 * @param {Array} nodes - 节点数组
 * @returns {Object} - { blue: [], red: [] }
 */
export function groupNodesByFaction(nodes) {
  return {
    blue: nodes.filter(n => n.faction === 'blue'),
    red: nodes.filter(n => n.faction === 'red')
  }
}

/**
 * 统计跨阵营连接
 * @param {Array} edges - 连接数组
 * @param {Array} nodes - 节点数组
 * @returns {Object} - { total: Number, detection: Number, strike: Number }
 */
export function countCrossFactionEdges(edges, nodes) {
  const crossEdges = edges.filter(edge => {
    const source = nodes.find(n => n.id === edge.source)
    const target = nodes.find(n => n.id === edge.target)
    return source && target && source.faction !== target.faction
  })
  
  return {
    total: crossEdges.length,
    detection: crossEdges.filter(e => e.type === 'detection').length,
    strike: crossEdges.filter(e => e.type === 'strike').length
  }
}

/**
 * 计算阵营网络的完整性
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 连接数组
 * @param {String} faction - 阵营 ('blue' 或 'red')
 * @returns {Object} - { hasFullChain: Boolean, missingSensor: Boolean, missingCommand: Boolean, missingStriker: Boolean }
 */
export function evaluateFactionCompleteness(nodes, edges, faction) {
  const factionNodes = nodes.filter(n => n.faction === faction)
  
  const hasSensor = factionNodes.some(n => n.baseType === 'sensor')
  const hasCommand = factionNodes.some(n => n.baseType === 'command')
  const hasStriker = factionNodes.some(n => n.baseType === 'striker')
  
  return {
    hasFullChain: hasSensor && hasCommand && hasStriker,
    missingSensor: !hasSensor,
    missingCommand: !hasCommand,
    missingStriker: !hasStriker
  }
}

export default {
  generateConnections,
  createManualConnection,
  connectionExists,
  getNodeConnections,
  calculateAverageDegree,
  findCriticalNodes,
  findIsolatedNodes,
  calculateDistance,
  groupNodesByFaction,
  countCrossFactionEdges,
  evaluateFactionCompleteness
}
