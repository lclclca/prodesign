// 杀伤链搜索算法（重构版 v2.0）
// 位置: src/utils/killChainSearch.js

import { calculateKillChainEffectiveness, calculateCooperativeEffectiveness } from './effectiveness'

/**
 * 搜索所有可行的杀伤链
 * @param {Array} nodes - 节点列表
 * @param {Array} edges - 边列表
 * @param {String} targetId - 目标节点ID
 * @returns {Object} 搜索结果
 */
export function searchKillChains(nodes, edges, targetId) {
  console.log('=== 开始杀伤链搜索 ===')
  console.log('节点数:', nodes.length)
  console.log('边数:', edges.length)
  console.log('目标ID:', targetId)
  
  // 1. 验证目标节点
  const target = nodes.find(n => n.id === targetId)
  if (!target) {
    return {
      success: false,
      error: '目标节点不存在',
      killChains: [],
      suggestions: ['请选择有效的目标节点']
    }
  }
  
  if (target.faction !== 'red') {
    return {
      success: false,
      error: '只能选择敌方目标',
      killChains: [],
      suggestions: ['请选择红方节点作为目标']
    }
  }
  
  // 2. 构建邻接表
  const adjList = buildAdjacencyList(nodes, edges)
  
  // 3. 检查网络完整性
  const integrityCheck = checkNetworkIntegrity(nodes, adjList)
  if (!integrityCheck.valid) {
    return {
      success: false,
      error: integrityCheck.error,
      killChains: [],
      suggestions: integrityCheck.suggestions
    }
  }
  
  // 4. DFS搜索所有路径
  const allPaths = []
  const sensors = nodes.filter(n => n.baseType === 'sensor' && n.faction === 'blue')
  
  sensors.forEach(sensor => {
    const paths = dfsSearch(sensor.id, targetId, nodes, adjList, [])
    allPaths.push(...paths)
  })
  
  console.log('找到路径数:', allPaths.length)
  
  if (allPaths.length === 0) {
    return {
      success: false,
      error: '未找到可行的杀伤链',
      killChains: [],
      suggestions: analyzeFailureReasons(nodes, edges, targetId)
    }
  }
  
  // 5. 计算每条杀伤链的效能
  const killChains = allPaths.map((path, index) => {
    // ⭐ 修复：正确传递参数给效能计算函数
    const chainObj = { path: path }
    const effectiveness = calculateKillChainEffectiveness(chainObj, nodes, edges)

    // 获取杀伤链中的节点详情
    const nodeDetails = path.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId)
      return node ? {
        id: nodeId,
        name: node.name || node.label || nodeId,
        baseType: node.baseType,
        x: node.x,
        y: node.y,
        performance: node.performance
      } : null
    }).filter(n => n !== null)

    // 获取杀伤链中的边详情
    const edgeDetails = []
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(e =>
        e.source === path[i] && e.target === path[i + 1]
      )
      if (edge) {
        edgeDetails.push({
          source: edge.source,
          target: edge.target,
          type: edge.type
        })
      }
    }

    return {
      id: `chain_${index + 1}`,
      path: path,
      nodeDetails: nodeDetails,  // ⭐ 添加节点详情
      edges: edgeDetails,         // ⭐ 添加边详情
      effectiveness: effectiveness,  // ⭐ 效能值（0-1）
      length: path.length
    }
  })
  
  // 6. 按效能排序
  killChains.sort((a, b) => b.effectiveness - a.effectiveness)
  
  // 7. 计算协同效能
  const cooperative = calculateCooperativeEffectiveness(killChains)
  
  console.log('=== 搜索完成 ===')
  console.log('杀伤链数量:', killChains.length)
  console.log('最高效能:', killChains[0]?.score || 0)
  console.log('协同效能:', cooperative.score)
  
  return {
    success: true,
    killChains,
    cooperative,
    statistics: {
      totalChains: killChains.length,
      avgEffectiveness: killChains.reduce((sum, c) => sum + c.effectiveness, 0) / killChains.length,
      maxEffectiveness: killChains[0]?.effectiveness || 0,
      minEffectiveness: killChains[killChains.length - 1]?.effectiveness || 0
    }
  }
}

/**
 * 构建邻接表
 */
function buildAdjacencyList(nodes, edges) {
  const adjList = {}
  
  // 初始化
  nodes.forEach(node => {
    adjList[node.id] = []
  })
  
  // 添加边
  edges.forEach(edge => {
    if (adjList[edge.source]) {
      adjList[edge.source].push({
        target: edge.target,
        type: edge.type,
        edgeId: edge.id
      })
    }
  })
  
  return adjList
}

/**
 * 检查网络完整性
 */
function checkNetworkIntegrity(nodes, adjList) {
  const blueNodes = nodes.filter(n => n.faction === 'blue')
  const sensors = blueNodes.filter(n => n.baseType === 'sensor')
  const commands = blueNodes.filter(n => n.baseType === 'command')
  const strikers = blueNodes.filter(n => n.baseType === 'striker')
  
  if (sensors.length === 0) {
    return {
      valid: false,
      error: '网络中没有传感器节点',
      suggestions: ['请添加至少一个我方传感器节点']
    }
  }
  
  if (commands.length === 0) {
    return {
      valid: false,
      error: '网络中没有指挥节点',
      suggestions: ['请添加至少一个我方指挥节点']
    }
  }
  
  if (strikers.length === 0) {
    return {
      valid: false,
      error: '网络中没有打击节点',
      suggestions: ['请添加至少一个我方打击节点']
    }
  }
  
  return { valid: true }
}

/**
 * DFS搜索（深度优先搜索）
 * 路径格式: [sensor, command, striker, target]
 */
function dfsSearch(currentId, targetId, nodes, adjList, visited) {
  const paths = []
  const currentNode = nodes.find(n => n.id === currentId)
  if (!currentNode) return paths
  
  // 初始化访问路径
  if (visited.length === 0) {
    visited = [currentId]
  }
  
  // 确定当前应该搜索的边类型和下一个节点类型
  let requiredEdgeType = null
  let nextNodeType = null
  const lastNodeType = currentNode.baseType
  
  switch (lastNodeType) {
    case 'sensor':
      nextNodeType = 'command'
      requiredEdgeType = 'detection'
      break
    case 'command':
      nextNodeType = 'striker'
      requiredEdgeType = 'communication'
      break
    case 'striker':
      nextNodeType = null  // 下一步直接到目标
      requiredEdgeType = 'strike'
      break
  }
  
  // 遍历邻居节点
  const neighbors = adjList[currentId] || []
  
  for (const neighbor of neighbors) {
    // 验证边类型
    if (neighbor.type !== requiredEdgeType) {
      continue
    }
    
    const neighborNode = nodes.find(n => n.id === neighbor.target)
    if (!neighborNode) continue
    
    // 避免循环
    if (visited.includes(neighbor.target)) {
      continue
    }
    
    // 检查是否到达目标
    if (neighbor.target === targetId) {
      // 验证路径长度（必须是4个节点）
      if (visited.length === 3 && lastNodeType === 'striker') {
        paths.push([...visited, targetId])
      }
      continue
    }
    
    // 检查节点类型是否正确
    if (nextNodeType && neighborNode.baseType === nextNodeType) {
      // 继续搜索
      const newVisited = [...visited, neighbor.target]
      const subPaths = dfsSearch(neighbor.target, targetId, nodes, adjList, newVisited)
      paths.push(...subPaths)
    }
  }
  
  return paths
}

/**
 * 分析失败原因
 */
function analyzeFailureReasons(nodes, edges, targetId) {
  const suggestions = []
  
  const blueNodes = nodes.filter(n => n.faction === 'blue')
  const sensors = blueNodes.filter(n => n.baseType === 'sensor')
  const commands = blueNodes.filter(n => n.baseType === 'command')
  const strikers = blueNodes.filter(n => n.baseType === 'striker')
  
  // 检查节点数量
  if (sensors.length === 0) {
    suggestions.push('缺少传感器节点：请添加雷达、卫星或预警机')
  }
  if (commands.length === 0) {
    suggestions.push('缺少指挥节点：请添加指挥中心或指挥所')
  }
  if (strikers.length === 0) {
    suggestions.push('缺少打击节点：请添加导弹、战斗机或火炮')
  }
  
  // 检查连接
  const detectionEdges = edges.filter(e => e.type === 'detection')
  const commEdges = edges.filter(e => e.type === 'communication')
  const strikeEdges = edges.filter(e => e.type === 'strike')
  
  if (detectionEdges.length === 0) {
    suggestions.push('缺少探测连接：请在传感器和指挥节点之间创建探测连接')
  }
  if (commEdges.length === 0) {
    suggestions.push('缺少通信连接：请在指挥节点和打击节点之间创建通信连接')
  }
  if (strikeEdges.length === 0) {
    suggestions.push('缺少打击连接：请在打击节点和目标之间创建打击连接')
  }
  
  // 检查到目标的连接
  const edgesToTarget = edges.filter(e => e.target === targetId)
  if (edgesToTarget.length === 0) {
    suggestions.push('没有到目标的连接：请创建从打击节点到目标的打击连接')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('网络结构可能存在问题，请检查连接的完整性')
  }
  
  return suggestions
}

/**
 * 获取杀伤链描述
 */
export function getKillChainDescription(killChain, nodes) {
  const nodeNames = killChain.path.map(nodeId => {
    const node = nodes.find(n => n.id === nodeId)
    return node?.name || node?.label || nodeId
  })
  
  return `${nodeNames[0]} → ${nodeNames[1]} → ${nodeNames[2]} → ${nodeNames[3]}`
}

/**
 * 导出杀伤链数据
 */
export function exportKillChainData(killChains, cooperative) {
  return {
    version: '2.0',
    timestamp: new Date().toISOString(),
    summary: {
      totalChains: killChains.length,
      avgEffectiveness: killChains.reduce((sum, c) => sum + c.effectiveness, 0) / killChains.length,
      maxEffectiveness: killChains[0]?.effectiveness || 0,
      cooperativeEffectiveness: cooperative.finalEffectiveness,
      cooperativeScore: cooperative.score
    },
    chains: killChains.map(chain => ({
      id: chain.id,
      path: chain.path,
      nodes: chain.nodes,
      effectiveness: chain.effectiveness,
      score: chain.score,
      breakdown: chain.breakdown,
      totalDelay: chain.totalDelay
    })),
    cooperative
  }
}

/**
 * 杀伤链搜索引擎类（面向对象包装器）
 * 为兼容旧代码，提供类式API
 */
export class KillChainSearchEngine {
  constructor(nodes, edges) {
    this.nodes = nodes || []
    this.edges = edges || []
    this.lastSearchResult = null
  }
  
  /**
   * 搜索杀伤链
   * @param {String} targetId - 目标节点ID
   * @returns {Object} 搜索结果
   */
  searchKillChains(targetId) {
    const result = searchKillChains(this.nodes, this.edges, targetId)
    this.lastSearchResult = result
    
    // 转换格式以兼容旧版API
    if (result.success) {
      return {
        success: true,
        killChains: result.killChains,
        cooperative: result.cooperative,
        statistics: result.statistics
      }
    } else {
      return {
        success: false,
        killChains: [],
        reason: result.error,
        suggestions: result.suggestions
      }
    }
  }
  
  /**
   * 获取杀伤链描述
   * @param {Object} chain - 杀伤链对象
   * @returns {String} 描述文本
   */
  getChainDescription(chain) {
    return getKillChainDescription(chain, this.nodes)
  }
  
  /**
   * 导出数据
   * @returns {Object} 导出数据
   */
  exportData() {
    if (!this.lastSearchResult || !this.lastSearchResult.success) {
      return null
    }
    
    return exportKillChainData(
      this.lastSearchResult.killChains,
      this.lastSearchResult.cooperative
    )
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStatistics() {
    return this.lastSearchResult?.statistics || null
  }
}
