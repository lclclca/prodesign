// effectiveness.js v2.0 - 适配Equipment v2.0属性结构
// 位置: src/utils/effectiveness.js

/**
 * 计算两节点间的欧几里得距离
 */
function calculateDistance(node1, node2) {
  if (!node1 || !node2) return Infinity
  const dx = (node2.x || 0) - (node1.x || 0)
  const dy = (node2.y || 0) - (node1.y || 0)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算单段效能（杀伤链中的一条边）
 * @param {Object} sourceNode - 源节点（包含v2.0 performance属性）
 * @param {Object} targetNode - 目标节点
 * @param {String} edgeType - 边类型 (detection/communication/command/strike)
 * @returns {Number} 0-1之间的概率值
 */
function calculateSegmentProbability(sourceNode, targetNode, edgeType) {
  if (!sourceNode || !targetNode) return 0
  
  const sourcePerf = sourceNode.performance || {}
  const targetPerf = targetNode.performance || {}
  const distance = calculateDistance(sourceNode, targetNode)
  
  let probability = 0.9 // 基础概率
  
  switch(edgeType) {
    case 'detection':
      // 探测环节：基于探测概率和距离
      probability = sourcePerf.detectionProbability || 0.8
      
      const detectionRange = sourcePerf.detectionRange || 200
      if (distance > detectionRange) {
        probability *= 0.1 // 超出范围大幅降低
      } else {
        const rangeFactor = 1 - (distance / detectionRange)
        probability *= (0.5 + 0.5 * rangeFactor) // 距离越近概率越高
      }
      
      // 考虑抗干扰能力
      const antiJamming = sourcePerf.antiJamming || 0.7
      probability *= antiJamming
      break
      
    case 'communication':
      // 通信环节：基于通信可靠性和距离
      const sourceReliability = sourcePerf.reliability || 0.9
      const targetReliability = targetPerf.reliability || 0.9
      const avgReliability = (sourceReliability + targetReliability) / 2
      
      const commRange = sourcePerf.commDistance || 
                        sourcePerf.commandRange || 200
      
      if (distance > commRange) {
        probability = avgReliability * 0.2 // 超出范围但仍有微小可能
      } else {
        const rangeFactor = 1 - (distance / commRange)
        probability = avgReliability * (0.7 + 0.3 * rangeFactor)
      }
      break
      
    case 'command':
      // 指挥环节：基于处理能力和决策时延
      const processingCapacity = sourcePerf.processingCapacity || 100
      const decisionDelay = sourcePerf.decisionDelay || 5
      
      // 处理能力越强，概率越高（归一化到0-1）
      const capacityFactor = Math.min(1, processingCapacity / 500)
      
      // 时延越短，概率越高
      const delayFactor = Math.max(0.5, 1 - (decisionDelay / 10))
      
      probability = (capacityFactor + delayFactor) / 2
      
      // 考虑指挥范围
      const commandRange = sourcePerf.commandRange || 200
      if (distance > commandRange) {
        probability *= 0.3
      }
      break
      
    case 'strike':
      // 打击环节：基于毁伤概率、距离和精度
      const damageRate = sourcePerf.damageRate || 0.7
      const strikeRange = sourcePerf.strikeRange || 100
      const accuracy = sourcePerf.accuracy || 20 // CEP (m)
      
      probability = damageRate
      
      // 距离因素
      if (distance > strikeRange) {
        probability *= 0.1 // 超出射程
      } else {
        const rangeFactor = 1 - (distance / strikeRange)
        // 精度因素（CEP越小越准确）
        const accuracyFactor = Math.max(0.5, 1 - (accuracy / 50))
        
        probability *= (0.6 + 0.2 * rangeFactor + 0.2 * accuracyFactor)
      }
      break
      
    default:
      probability = 0.8
  }
  
  // 确保概率在0-1范围内
  return Math.max(0, Math.min(1, probability))
}

/**
 * 计算杀伤链的总体效能
 * @param {Object} chain - 杀伤链对象 {path: [...nodeIds], ...}
 * @param {Array} nodes - 所有节点数组（v2.0格式）
 * @param {Array} edges - 所有边数组
 * @returns {Number} 杀伤链的成功概率 (0-1)
 */
export function calculateKillChainEffectiveness(chain, nodes, edges) {
  if (!chain || !chain.path || chain.path.length === 0) {
    return 0
  }

  let totalProbability = 1.0

  // 遍历杀伤链路径中的每一步
  for (let i = 0; i < chain.path.length - 1; i++) {
    const sourceId = chain.path[i]
    const targetId = chain.path[i + 1]
    
    const sourceNode = nodes.find(n => n.id === sourceId)
    const targetNode = nodes.find(n => n.id === targetId)
    
    if (!sourceNode || !targetNode) {
      console.warn(`节点不存在: ${sourceId} 或 ${targetId}`)
      continue
    }

    // 查找对应的边，确定边的类型
    const edge = edges.find(e => 
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId) // 双向边
    )
    
    const edgeType = edge?.type || 'communication' // 默认为通信类型
    
    // 计算这一段的成功概率
    const segmentProb = calculateSegmentProbability(
      sourceNode, 
      targetNode, 
      edgeType
    )
    
    // 累乘概率
    totalProbability *= segmentProb
  }

  return totalProbability
}

/**
 * 计算网络整体效能
 * @param {Array} nodes - 节点数组（v2.0格式）
 * @param {Array} edges - 边数组
 * @param {Array} killChains - 杀伤链数组
 * @returns {Object} 网络效能评估结果
 */
export function calculateNetworkEffectiveness(nodes, edges, killChains) {
  if (!killChains || killChains.length === 0) {
    return {
      overall: 0,
      avgChainEffectiveness: 0,
      maxChainEffectiveness: 0,
      minChainEffectiveness: 0,
      validChains: 0,
      totalChains: 0,
      chainDistribution: []
    }
  }

  // 计算每条杀伤链的效能
  const chainEffectiveness = killChains.map(chain => ({
    chain: chain,
    effectiveness: calculateKillChainEffectiveness(chain, nodes, edges)
  }))

  const validEffectiveness = chainEffectiveness
    .filter(item => item.effectiveness > 0)
    .map(item => item.effectiveness)

  if (validEffectiveness.length === 0) {
    return {
      overall: 0,
      avgChainEffectiveness: 0,
      maxChainEffectiveness: 0,
      minChainEffectiveness: 0,
      validChains: 0,
      totalChains: killChains.length,
      chainDistribution: []
    }
  }

  const sum = validEffectiveness.reduce((a, b) => a + b, 0)
  const avg = sum / validEffectiveness.length
  const max = Math.max(...validEffectiveness)
  const min = Math.min(...validEffectiveness)

  // 效能分布统计
  const distribution = {
    high: validEffectiveness.filter(e => e >= 0.7).length,
    medium: validEffectiveness.filter(e => e >= 0.4 && e < 0.7).length,
    low: validEffectiveness.filter(e => e < 0.4).length
  }

  return {
    overall: avg,
    avgChainEffectiveness: avg,
    maxChainEffectiveness: max,
    minChainEffectiveness: min,
    validChains: validEffectiveness.length,
    totalChains: killChains.length,
    chainDistribution: distribution,
    allChainEffectiveness: chainEffectiveness
  }
}

/**
 * 计算节点重要度
 * @param {Object} node - 节点对象（v2.0格式）
 * @param {Array} nodes - 所有节点
 * @param {Array} edges - 所有边
 * @returns {Number} 重要度分数 (0-1)
 */
export function calculateNodeImportance(node, nodes, edges) {
  if (!node) return 0
  
  const perf = node.performance || {}
  
  // 基础重要度
  let importance = 0.5
  
  // 根据节点类型和性能计算重要度
  switch(node.baseType) {
    case 'sensor':
      // 传感器：探测范围越大、概率越高越重要
      const detectionRange = perf.detectionRange || 100
      const detectionProb = perf.detectionProbability || 0.8
      importance += (detectionRange / 500) * detectionProb
      break
      
    case 'command':
      // 指挥节点：处理能力越强、时延越短越重要
      const processingCapacity = perf.processingCapacity || 100
      const decisionDelay = perf.decisionDelay || 5
      importance += (processingCapacity / 1000) * (1 / decisionDelay)
      break
      
    case 'striker':
      // 打击节点：射程远、毁伤率高越重要
      const strikeRange = perf.strikeRange || 100
      const damageRate = perf.damageRate || 0.5
      importance += (strikeRange / 500 + damageRate) / 2
      break
      
    case 'support':
      // 支援节点：通信距离远、带宽大、可靠性高越重要
      const commDistance = perf.commDistance || 100
      const bandwidth = perf.bandwidth || 50
      const reliability = perf.reliability || 0.8
      importance += (commDistance / 500 + bandwidth / 200 + reliability) / 3
      break
  }
  
  // 考虑网络拓扑中的重要性（连接度）
  const inDegree = edges.filter(e => e.target === node.id).length
  const outDegree = edges.filter(e => e.source === node.id).length
  const totalDegree = inDegree + outDegree
  
  // 连接越多越重要
  const degreeFactor = Math.min(0.3, totalDegree / 20)
  importance += degreeFactor
  
  // 介数中心性（粗略估计）
  // 如果节点是连接多个社区的桥接节点，重要度更高
  const betweennessFactor = calculateBetweenness(node, nodes, edges)
  importance += betweennessFactor * 0.2
  
  return Math.min(1, importance)
}

/**
 * 简化的介数中心性计算
 */
function calculateBetweenness(node, nodes, edges) {
  // 简化版本：看节点是否连接了不同阵营
  const connectedNodes = new Set()
  
  edges.forEach(edge => {
    if (edge.source === node.id) {
      connectedNodes.add(edge.target)
    }
    if (edge.target === node.id) {
      connectedNodes.add(edge.source)
    }
  })
  
  const connectedFactions = new Set()
  connectedNodes.forEach(nodeId => {
    const n = nodes.find(nd => nd.id === nodeId)
    if (n) connectedFactions.add(n.faction)
  })
  
  // 连接不同阵营的节点更重要
  return connectedFactions.size > 1 ? 0.5 : 0
}

/**
 * 识别网络中的关键节点
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {Number} topN - 返回前N个关键节点
 * @returns {Array} 关键节点数组，按重要度排序
 */
export function identifyKeyNodes(nodes, edges, topN = 5) {
  const nodesWithImportance = nodes.map(node => ({
    node: node,
    importance: calculateNodeImportance(node, nodes, edges)
  }))
  
  // 按重要度降序排序
  nodesWithImportance.sort((a, b) => b.importance - a.importance)
  
  return nodesWithImportance.slice(0, topN)
}

/**
 * 模拟节点失效对网络的影响
 * @param {String} nodeId - 要移除的节点ID
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {Array} killChains - 杀伤链数组
 * @returns {Object} 影响评估结果
 */
export function assessNodeFailureImpact(nodeId, nodes, edges, killChains) {
  // 移除节点后的网络状态
  const remainingNodes = nodes.filter(n => n.id !== nodeId)
  const remainingEdges = edges.filter(e => 
    e.source !== nodeId && e.target !== nodeId
  )
  
  // 原始网络效能
  const originalEffectiveness = calculateNetworkEffectiveness(
    nodes, edges, killChains
  )
  
  // 受影响的杀伤链
  const affectedChains = killChains.filter(chain => 
    chain.path && chain.path.includes(nodeId)
  )
  
  const survivingChains = killChains.filter(chain =>
    chain.path && !chain.path.includes(nodeId)
  )
  
  // 新网络效能
  const newEffectiveness = calculateNetworkEffectiveness(
    remainingNodes, remainingEdges, survivingChains
  )
  
  return {
    nodeId: nodeId,
    originalEffectiveness: originalEffectiveness.overall,
    newEffectiveness: newEffectiveness.overall,
    effectivenessLoss: originalEffectiveness.overall - newEffectiveness.overall,
    affectedChains: affectedChains.length,
    survivingChains: survivingChains.length,
    impactLevel: getImpactLevel(
      originalEffectiveness.overall - newEffectiveness.overall
    )
  }
}

/**
 * 根据效能损失判断影响级别
 */
function getImpactLevel(loss) {
  if (loss >= 0.5) return 'critical'
  if (loss >= 0.3) return 'high'
  if (loss >= 0.1) return 'medium'
  return 'low'
}

/**
 * 计算多条杀伤链的协同效能
 * @param {Array} killChains - 杀伤链数组
 * @returns {Object} 协同效能评估结果
 */
export function calculateCooperativeEffectiveness(killChains) {
  if (!killChains || killChains.length === 0) {
    return {
      finalEffectiveness: 0,
      score: 0,
      chainCount: 0,
      synergy: 0,
      distribution: {
        high: 0,
        medium: 0,
        low: 0
      }
    }
  }

  // 提取各条链的效能值
  const effectivenessValues = killChains.map(chain => 
    chain.effectiveness || 0
  )

  // 计算基础指标
  const avgEffectiveness = effectivenessValues.reduce((sum, val) => sum + val, 0) / effectivenessValues.length
  const maxEffectiveness = Math.max(...effectivenessValues)
  const minEffectiveness = Math.min(...effectivenessValues)

  // 计算协同增益
  // 多条杀伤链可以相互补充，提高整体成功率
  // 使用概率论：P(至少一条成功) = 1 - P(全部失败) = 1 - ∏(1 - Pi)
  let cooperativeProbability = 1.0
  effectivenessValues.forEach(p => {
    cooperativeProbability *= (1 - p)
  })
  cooperativeProbability = 1 - cooperativeProbability

  // 协同增益 = 协同概率 - 最大单链概率
  const synergy = Math.max(0, cooperativeProbability - maxEffectiveness)

  // 效能分布统计
  const distribution = {
    high: effectivenessValues.filter(e => e >= 0.7).length,
    medium: effectivenessValues.filter(e => e >= 0.4 && e < 0.7).length,
    low: effectivenessValues.filter(e => e < 0.4).length
  }

  // 计算综合得分 (0-100)
  // 考虑因素：平均效能、最大效能、协同增益、链数量
  const avgScore = avgEffectiveness * 40
  const maxScore = maxEffectiveness * 30
  const synergyScore = synergy * 20
  const countBonus = Math.min(10, killChains.length * 2)
  const totalScore = avgScore + maxScore + synergyScore + countBonus

  return {
    finalEffectiveness: parseFloat(cooperativeProbability.toFixed(3)),
    score: parseFloat(totalScore.toFixed(1)),
    chainCount: killChains.length,
    synergy: parseFloat(synergy.toFixed(3)),
    avgEffectiveness: parseFloat(avgEffectiveness.toFixed(3)),
    maxEffectiveness: parseFloat(maxEffectiveness.toFixed(3)),
    minEffectiveness: parseFloat(minEffectiveness.toFixed(3)),
    distribution,
    details: {
      baseSuccess: maxEffectiveness,
      cooperativeSuccess: cooperativeProbability,
      improvement: synergy,
      improvementPercent: maxEffectiveness > 0 
        ? parseFloat(((synergy / maxEffectiveness) * 100).toFixed(1))
        : 0
    }
  }
}

// 默认导出
export default {
  calculateKillChainEffectiveness,
  calculateNetworkEffectiveness,
  calculateNodeImportance,
  identifyKeyNodes,
  assessNodeFailureImpact,
  calculateCooperativeEffectiveness
}
