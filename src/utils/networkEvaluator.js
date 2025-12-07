/**
 * 作战网络评估算法
 * 对网络进行多维度效能评估
 */

import {
  calculateDistance,
  findIsolatedNodes,
  findCriticalNodes
} from './networkGenerator'

/**
 * 评估网络连通性
 * 使用BFS算法检查所有节点是否连通
 */
function evaluateConnectivity(nodes, edges) {
  if (nodes.length === 0) return 1
  if (nodes.length === 1) return 1
  
  // 构建邻接表
  const adjacency = {}
  nodes.forEach(node => {
    adjacency[node.id] = []
  })
  
  edges.forEach(edge => {
    if (!adjacency[edge.source]) adjacency[edge.source] = []
    if (!adjacency[edge.target]) adjacency[edge.target] = []
    adjacency[edge.source].push(edge.target)
    adjacency[edge.target].push(edge.source)
  })
  
  // BFS遍历
  const visited = new Set()
  const queue = [nodes[0].id]
  visited.add(nodes[0].id)
  
  while (queue.length > 0) {
    const current = queue.shift()
    const neighbors = adjacency[current] || []
    
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    })
  }
  
  // 连通节点比例
  return visited.size / nodes.length
}

/**
 * 评估覆盖率
 * 计算传感器覆盖的区域占总区域的比例
 */
function evaluateCoverage(nodes, nodeTypes) {
  const sensors = nodes.filter(n => n.type === 'sensor')
  if (sensors.length === 0) return 0
  
  // 找到画布边界
  const minX = Math.min(...nodes.map(n => n.x)) - 100
  const maxX = Math.max(...nodes.map(n => n.x)) + 100
  const minY = Math.min(...nodes.map(n => n.y)) - 100
  const maxY = Math.max(...nodes.map(n => n.y)) + 100
  
  // 使用网格法估算覆盖率
  const gridSize = 20
  const cols = Math.ceil((maxX - minX) / gridSize)
  const rows = Math.ceil((maxY - minY) / gridSize)
  
  let coveredCells = 0
  const sensorType = nodeTypes.find(t => t.type === 'sensor')
  const detectionRadius = sensorType?.detection_radius || 150
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cellX = minX + j * gridSize + gridSize / 2
      const cellY = minY + i * gridSize + gridSize / 2
      
      // 检查该网格是否被任何传感器覆盖
      const covered = sensors.some(sensor => {
        const distance = Math.sqrt(
          Math.pow(sensor.x - cellX, 2) + 
          Math.pow(sensor.y - cellY, 2)
        )
        return distance <= detectionRadius
      })
      
      if (covered) coveredCells++
    }
  }
  
  return coveredCells / (rows * cols)
}

/**
 * 评估冗余度
 * 计算网络中存在多条路径的节点对比例
 */
function evaluateRedundancy(nodes, edges) {
  if (nodes.length < 2) return 0
  
  // 构建邻接表
  const adjacency = {}
  nodes.forEach(node => {
    adjacency[node.id] = []
  })
  
  edges.forEach(edge => {
    if (!adjacency[edge.source]) adjacency[edge.source] = []
    if (!adjacency[edge.target]) adjacency[edge.target] = []
    adjacency[edge.source].push(edge.target)
    adjacency[edge.target].push(edge.source)
  })
  
  // 计算平均节点度
  const degrees = nodes.map(node => adjacency[node.id].length)
  const avgDegree = degrees.reduce((sum, d) => sum + d, 0) / nodes.length
  
  // 冗余度与平均度相关，归一化到0-1
  // 假设平均度>=3时冗余度较好
  return Math.min(avgDegree / 3, 1)
}

/**
 * 评估鲁棒性
 * 模拟移除关键节点后网络性能保持率
 */
function evaluateRobustness(nodes, edges) {
  if (nodes.length === 0) return 1
  
  const originalConnectivity = evaluateConnectivity(nodes, edges)
  
  // 找到关键节点
  const criticalNodes = findCriticalNodes(nodes, edges, Math.min(3, nodes.length))
  
  if (criticalNodes.length === 0) return 1
  
  let totalPerformance = 0
  
  // 模拟移除每个关键节点
  criticalNodes.forEach(criticalNode => {
    const remainingNodes = nodes.filter(n => n.id !== criticalNode.id)
    const remainingEdges = edges.filter(e => 
      e.source !== criticalNode.id && e.target !== criticalNode.id
    )
    
    const newConnectivity = evaluateConnectivity(remainingNodes, remainingEdges)
    const performanceRetention = remainingNodes.length > 0 
      ? newConnectivity / originalConnectivity 
      : 0
    
    totalPerformance += performanceRetention
  })
  
  return totalPerformance / criticalNodes.length
}

/**
 * 评估效率
 * 计算从传感器到打击单元的平均路径长度
 */
function evaluateEfficiency(nodes, edges) {
  const sensors = nodes.filter(n => n.type === 'sensor')
  const strikers = nodes.filter(n => n.type === 'striker')
  
  if (sensors.length === 0 || strikers.length === 0) return 0.5
  
  // 构建邻接表
  const adjacency = {}
  nodes.forEach(node => {
    adjacency[node.id] = []
  })
  
  edges.forEach(edge => {
    if (!adjacency[edge.source]) adjacency[edge.source] = []
    if (!adjacency[edge.target]) adjacency[edge.target] = []
    adjacency[edge.source].push(edge.target)
    adjacency[edge.target].push(edge.source)
  })
  
  // BFS计算最短路径
  function bfs(startId, endId) {
    const queue = [[startId, 0]]
    const visited = new Set([startId])
    
    while (queue.length > 0) {
      const [current, distance] = queue.shift()
      
      if (current === endId) return distance
      
      const neighbors = adjacency[current] || []
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([neighbor, distance + 1])
        }
      })
    }
    
    return Infinity
  }
  
  // 计算所有传感器到打击单元的平均路径长度
  let totalPaths = 0
  let reachablePaths = 0
  let totalDistance = 0
  
  sensors.forEach(sensor => {
    strikers.forEach(striker => {
      totalPaths++
      const distance = bfs(sensor.id, striker.id)
      if (distance !== Infinity) {
        reachablePaths++
        totalDistance += distance
      }
    })
  })
  
  if (reachablePaths === 0) return 0
  
  const avgDistance = totalDistance / reachablePaths
  
  // 路径越短效率越高，归一化（假设3跳以内为高效）
  const efficiency = Math.max(0, 1 - (avgDistance - 1) / 3)
  return Math.min(efficiency, 1)
}

/**
 * 评估可靠性
 * 基于节点类型分布和连接质量
 */
function evaluateReliability(nodes, edges, nodeTypes) {
  if (nodes.length === 0) return 0
  
  // 统计节点类型分布
  const typeCount = {}
  nodes.forEach(node => {
    typeCount[node.type] = (typeCount[node.type] || 0) + 1
  })
  
  // 检查是否有完整的侦察-指挥-打击链
  const hasSensor = typeCount.sensor > 0
  const hasCommand = typeCount.command > 0
  const hasStriker = typeCount.striker > 0
  
  let typeScore = 0
  if (hasSensor && hasCommand && hasStriker) {
    typeScore = 1
  } else if ((hasSensor && hasCommand) || (hasCommand && hasStriker)) {
    typeScore = 0.6
  } else if (hasSensor || hasCommand || hasStriker) {
    typeScore = 0.3
  }
  
  // 连接密度得分
  const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2
  const densityScore = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0
  
  // 综合可靠性
  return (typeScore * 0.6 + Math.min(densityScore * 2, 1) * 0.4)
}

/**
 * 识别脆弱性
 */
function identifyVulnerabilities(nodes, edges, nodeTypes) {
  const vulnerabilities = []
  
  // 1. 检查孤立节点
  const isolatedNodes = findIsolatedNodes(nodes, edges)
  if (isolatedNodes.length > 0) {
    vulnerabilities.push({
      type: 'isolated_nodes',
      severity: 'high',
      title: '存在孤立节点',
      description: `发现 ${isolatedNodes.length} 个孤立节点，它们没有与网络中其他节点建立连接，无法参与信息传递。`,
      affectedNodes: isolatedNodes.map(n => n.id)
    })
  }
  
  // 2. 检查单点故障
  const criticalNodes = findCriticalNodes(nodes, edges, 3)
  const highDegreeNodes = criticalNodes.filter(n => n.connectionCount >= nodes.length / 2)
  if (highDegreeNodes.length > 0) {
    vulnerabilities.push({
      type: 'single_point_failure',
      severity: 'high',
      title: '存在关键节点',
      description: `节点 ${highDegreeNodes.map(n => n.label).join(', ')} 连接度过高，一旦失效将严重影响网络性能。`,
      affectedNodes: highDegreeNodes.map(n => n.id)
    })
  }
  
  // 3. 检查覆盖盲区
  const coverage = evaluateCoverage(nodes, nodeTypes)
  if (coverage < 0.5) {
    vulnerabilities.push({
      type: 'coverage_gap',
      severity: 'medium',
      title: '传感器覆盖不足',
      description: `当前传感器覆盖率仅为 ${(coverage * 100).toFixed(1)}%，存在较大盲区，建议增加传感器部署。`
    })
  }
  
  // 4. 检查缺少节点类型
  const typeCount = {}
  nodes.forEach(node => {
    typeCount[node.type] = (typeCount[node.type] || 0) + 1
  })
  
  if (!typeCount.sensor || typeCount.sensor === 0) {
    vulnerabilities.push({
      type: 'missing_sensor',
      severity: 'high',
      title: '缺少传感器节点',
      description: '网络中没有传感器节点，无法进行目标探测。'
    })
  }
  
  if (!typeCount.command || typeCount.command === 0) {
    vulnerabilities.push({
      type: 'missing_command',
      severity: 'high',
      title: '缺少指挥中心',
      description: '网络中没有指挥中心节点，缺乏指挥控制能力。'
    })
  }
  
  if (!typeCount.striker || typeCount.striker === 0) {
    vulnerabilities.push({
      type: 'missing_striker',
      severity: 'medium',
      title: '缺少打击单元',
      description: '网络中没有打击单元，无法执行火力打击任务。'
    })
  }
  
  // 5. 检查连通性问题
  const connectivity = evaluateConnectivity(nodes, edges)
  if (connectivity < 1 && nodes.length > 1) {
    vulnerabilities.push({
      type: 'disconnected_network',
      severity: 'high',
      title: '网络未完全连通',
      description: `网络连通性为 ${(connectivity * 100).toFixed(1)}%，存在节点无法相互通信。`
    })
  }
  
  return vulnerabilities
}

/**
 * 生成优化建议
 */
function generateSuggestions(nodes, edges, nodeTypes, vulnerabilities) {
  const suggestions = []
  
  // 基于脆弱性生成建议
  vulnerabilities.forEach(vuln => {
    switch (vuln.type) {
      case 'isolated_nodes':
        suggestions.push({
          priority: 'high',
          title: '连接孤立节点',
          description: '将孤立节点移动到其他节点的通信范围内，或增加中继节点建立连接。',
          expected_effect: '提高网络连通性和可靠性'
        })
        break
      
      case 'single_point_failure':
        suggestions.push({
          priority: 'high',
          title: '增加冗余节点',
          description: '在关键节点周围部署备份节点，建立多条通信路径，避免单点故障。',
          expected_effect: '提高网络鲁棒性和抗毁性'
        })
        break
      
      case 'coverage_gap':
        suggestions.push({
          priority: 'medium',
          title: '增加传感器部署',
          description: '在覆盖盲区增加传感器节点，扩大探测范围。',
          expected_effect: '提高区域覆盖率和目标探测能力'
        })
        break
      
      case 'missing_sensor':
      case 'missing_command':
      case 'missing_striker':
        suggestions.push({
          priority: 'high',
          title: '补充缺失的节点类型',
          description: `添加${vuln.title.replace('缺少', '')}，构建完整的侦察-指挥-打击链。`,
          expected_effect: '形成完整的作战体系'
        })
        break
      
      case 'disconnected_network':
        suggestions.push({
          priority: 'high',
          title: '建立网络连接',
          description: '调整节点位置或增加中继节点，确保所有节点互联互通。',
          expected_effect: '提高网络连通性'
        })
        break
    }
  })
  
  // 基于节点数量和密度的建议
  if (nodes.length < 5) {
    suggestions.push({
      priority: 'medium',
      title: '增加节点数量',
      description: '当前节点数量较少，建议增加到5个以上以提高网络冗余度。',
      expected_effect: '提高网络规模和可靠性'
    })
  }
  
  // 基于连接密度的建议
  const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2
  const density = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0
  
  if (density < 0.3 && nodes.length >= 3) {
    suggestions.push({
      priority: 'low',
      title: '优化节点布局',
      description: '当前节点间距离较远，建议调整节点位置或增大通信半径以增加连接。',
      expected_effect: '提高网络连接密度和信息传递效率'
    })
  }
  
  return suggestions
}

/**
 * 主评估函数
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 连接数组
 * @param {Array} nodeTypes - 节点类型定义
 * @returns {Promise<Object>} - 评估报告
 */
export async function evaluateNetwork(nodes, edges, nodeTypes) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 计算各项指标
      const connectivity = evaluateConnectivity(nodes, edges)
      const coverage = evaluateCoverage(nodes, nodeTypes)
      const redundancy = evaluateRedundancy(nodes, edges)
      const robustness = evaluateRobustness(nodes, edges)
      const efficiency = evaluateEfficiency(nodes, edges)
      const reliability = evaluateReliability(nodes, edges, nodeTypes)
      
      // 计算综合得分（加权平均）
      const weights = {
        connectivity: 0.20,
        coverage: 0.15,
        redundancy: 0.15,
        robustness: 0.20,
        efficiency: 0.15,
        reliability: 0.15
      }
      
      const overall_score = 
        connectivity * weights.connectivity * 100 +
        coverage * weights.coverage * 100 +
        redundancy * weights.redundancy * 100 +
        robustness * weights.robustness * 100 +
        efficiency * weights.efficiency * 100 +
        reliability * weights.reliability * 100
      
      // 识别问题
      const vulnerabilities = identifyVulnerabilities(nodes, edges, nodeTypes)
      
      // 生成建议
      const suggestions = generateSuggestions(nodes, edges, nodeTypes, vulnerabilities)
      
      const report = {
        overall_score: Math.round(overall_score * 10) / 10,
        metrics: {
          connectivity: Math.round(connectivity * 1000) / 1000,
          coverage: Math.round(coverage * 1000) / 1000,
          redundancy: Math.round(redundancy * 1000) / 1000,
          robustness: Math.round(robustness * 1000) / 1000,
          efficiency: Math.round(efficiency * 1000) / 1000,
          reliability: Math.round(reliability * 1000) / 1000
        },
        vulnerabilities,
        suggestions,
        timestamp: new Date().toISOString(),
        network_stats: {
          node_count: nodes.length,
          edge_count: edges.length,
          sensor_count: nodes.filter(n => n.type === 'sensor').length,
          command_count: nodes.filter(n => n.type === 'command').length,
          striker_count: nodes.filter(n => n.type === 'striker').length
        }
      }
      
      resolve(report)
    }, 1000)
  })
}

export default {
  evaluateNetwork,
  evaluateConnectivity,
  evaluateCoverage,
  evaluateRedundancy,
  evaluateRobustness,
  evaluateEfficiency,
  evaluateReliability,
  identifyVulnerabilities,
  generateSuggestions
}
