// 杀伤链搜索引擎
// 位置: src/utils/killChainSearch.js

export class KillChainSearchEngine {
  constructor(nodes, edges) {
    this.nodes = nodes
    this.edges = edges
    
    // 构建邻接表（有向图）
    this.adjacencyList = this.buildAdjacencyList()
  }
  
  // 构建邻接表
  buildAdjacencyList() {
    const adj = new Map()
    
    // 初始化所有节点
    this.nodes.forEach(node => {
      adj.set(node.id, [])
    })
    
    // 添加边
    this.edges.forEach(edge => {
      if (adj.has(edge.source)) {
        adj.get(edge.source).push({
          target: edge.target,
          type: edge.type,
          edgeId: edge.id,
          label: edge.label
        })
      }
    })
    
    return adj
  }
  
  /**
   * 搜索所有可行的杀伤链
   * @param {string} targetId - 敌方目标节点ID
   * @returns {Object} 搜索结果
   */
  searchKillChains(targetId) {
    const target = this.nodes.find(n => n.id === targetId)
    
    if (!target) {
      return {
        success: false,
        killChains: [],
        reason: '目标节点不存在',
        analysis: null
      }
    }
    
    if (target.faction !== 'red') {
      return {
        success: false,
        killChains: [],
        reason: '选择的不是敌方目标',
        analysis: null
      }
    }
    
    // 分析网络结构
    const analysis = this.analyzeNetwork(targetId)
    
    // 搜索所有杀伤链
    const killChains = []
    const visited = new Set()
    
    // 从每个我方传感器开始搜索
    const sensors = this.nodes.filter(n => 
      n.faction === 'blue' && 
      n.baseType === 'sensor' && 
      n.hp > 0
    )
    
    sensors.forEach(sensor => {
      this.dfsSearch(
        sensor.id,
        targetId,
        [sensor.id],
        [],
        visited,
        killChains,
        'sensor'
      )
    })
    
    // 计算每条杀伤链的效能
    killChains.forEach(chain => {
      chain.effectiveness = this.calculateEffectiveness(chain)
    })
    
    // 按效能排序
    killChains.sort((a, b) => b.effectiveness - a.effectiveness)
    
    // 如果没找到杀伤链，给出详细原因
    if (killChains.length === 0) {
      const detailedReason = this.analyzeFailureReason(targetId, analysis)
      return {
        success: false,
        killChains: [],
        reason: detailedReason.reason,
        analysis: detailedReason.details
      }
    }
    
    return {
      success: true,
      killChains,
      reason: null,
      analysis
    }
  }
  
  /**
   * 深度优先搜索杀伤链
   * @param {string} currentId - 当前节点ID
   * @param {string} targetId - 目标节点ID
   * @param {Array} path - 当前路径（节点序列）
   * @param {Array} edgePath - 当前路径（边序列）
   * @param {Set} visited - 已访问节点
   * @param {Array} killChains - 找到的杀伤链列表
   * @param {string} lastNodeType - 上一个节点类型
   */
  dfsSearch(currentId, targetId, path, edgePath, visited, killChains, lastNodeType) {
    // 获取当前节点
    const currentNode = this.nodes.find(n => n.id === currentId)
    if (!currentNode || currentNode.hp <= 0) return
    
    // 标准杀伤链路径：传感器 → 指挥中心 → 打击单元 → 目标
    // 确定下一步应该访问的节点类型和边类型
    let nextNodeType = null
    let requiredEdgeType = null
    
    switch (lastNodeType) {
      case 'sensor':
        nextNodeType = 'command'  // 传感器 → 指挥中心
        requiredEdgeType = 'detection'  // 应该用探测边（传感器发现敌人后上报）
        break
      case 'command':
        nextNodeType = 'striker'  // 指挥中心 → 打击单元
        requiredEdgeType = 'communication'  // 应该用通信边（下达作战命令）
        break
      case 'striker':
        nextNodeType = 'target'   // 打击单元 → 目标
        requiredEdgeType = 'strike'  // 应该用打击边（执行打击）
        break
      default:
        return
    }
    
    // 获取当前节点的所有邻接节点
    const neighbors = this.adjacencyList.get(currentId) || []
    
    for (const neighbor of neighbors) {
      const neighborNode = this.nodes.find(n => n.id === neighbor.target)
      if (!neighborNode || neighborNode.hp <= 0) continue
      
      // 检查是否已访问（避免环路）
      if (visited.has(neighbor.target)) continue
      
      // *** 新增：检查边类型是否符合要求 ***
      if (neighbor.type !== requiredEdgeType) continue
      
      // 检查节点类型是否符合杀伤链要求
      if (nextNodeType === 'target') {
        // 最后一步：打击单元 → 目标
        if (neighbor.target === targetId && neighbor.type === 'strike') {
          // 找到完整杀伤链！
          const completePath = [...path, neighbor.target]
          const completeEdgePath = [...edgePath, {
            id: neighbor.edgeId,
            source: currentId,
            target: neighbor.target,
            type: neighbor.type,
            label: neighbor.label
          }]
          
          killChains.push({
            id: `chain_${killChains.length + 1}`,
            nodes: completePath,
            edges: completeEdgePath,
            nodeDetails: completePath.map(id => this.nodes.find(n => n.id === id)),
            length: completePath.length,
            type: 'standard' // 标准杀伤链
          })
        }
      } else {
        // 中间步骤：检查节点类型
        const requiredType = nextNodeType === 'command' ? 'command' : 'striker'
        
        if (neighborNode.baseType === requiredType && neighborNode.faction === 'blue') {
          // 继续搜索
          visited.add(neighbor.target)
          
          this.dfsSearch(
            neighbor.target,
            targetId,
            [...path, neighbor.target],
            [...edgePath, {
              id: neighbor.edgeId,
              source: currentId,
              target: neighbor.target,
              type: neighbor.type,
              label: neighbor.label
            }],
            visited,
            killChains,
            requiredType
          )
          
          visited.delete(neighbor.target)
        }
      }
    }
  }
  
  /**
   * 计算杀伤链效能
   * @param {Object} chain - 杀伤链对象
   * @returns {number} 效能值 (0-1)
   */
  calculateEffectiveness(chain) {
    // 效能 = 探测概率 × 通信可靠性 × 指挥效率 × 打击概率
    
    let effectiveness = 1.0
    
    // 1. 探测概率（传感器）
    const sensor = chain.nodeDetails[0]
    const detectionProb = 0.85 // 简化：可以根据传感器性能计算
    effectiveness *= detectionProb
    
    // 2. 通信可靠性（路径中的通信环节）
    const commEdges = chain.edges.filter(e => e.type === 'communication')
    const commReliability = Math.pow(0.95, commEdges.length) // 每个通信环节95%可靠性
    effectiveness *= commReliability
    
    // 3. 指挥效率（指挥中心）
    const commandNode = chain.nodeDetails.find(n => n.baseType === 'command')
    const commandEfficiency = 0.9 // 简化：可以根据指挥中心性能计算
    effectiveness *= commandEfficiency
    
    // 4. 打击概率（打击单元）
    const striker = chain.nodeDetails[chain.nodeDetails.length - 2]
    const strikeProb = 0.8 // 简化：可以根据距离、打击单元性能计算
    effectiveness *= strikeProb
    
    // 5. 路径长度惩罚（路径越长，效能越低）
    const lengthPenalty = 1.0 / (1 + (chain.length - 4) * 0.1)
    effectiveness *= lengthPenalty
    
    return parseFloat(effectiveness.toFixed(4))
  }
  
  /**
   * 分析网络结构
   * @param {string} targetId - 目标ID
   * @returns {Object} 分析结果
   */
  analyzeNetwork(targetId) {
    const sensors = this.nodes.filter(n => 
      n.faction === 'blue' && n.baseType === 'sensor' && n.hp > 0
    )
    
    const commands = this.nodes.filter(n => 
      n.faction === 'blue' && n.baseType === 'command' && n.hp > 0
    )
    
    const strikers = this.nodes.filter(n => 
      n.faction === 'blue' && n.baseType === 'striker' && n.hp > 0
    )
    
    // 检查能否打击目标的打击单元
    const strikersCanHitTarget = strikers.filter(striker => {
      const edges = this.adjacencyList.get(striker.id) || []
      return edges.some(e => e.target === targetId && e.type === 'strike')
    })
    
    return {
      sensorCount: sensors.length,
      commandCount: commands.length,
      strikerCount: strikers.length,
      strikersCanHitTarget: strikersCanHitTarget.length,
      hasBasicStructure: sensors.length > 0 && commands.length > 0 && strikers.length > 0
    }
  }
  
  /**
   * 分析失败原因
   * @param {string} targetId - 目标ID
   * @param {Object} analysis - 网络分析结果
   * @returns {Object} 详细原因
   */
  analyzeFailureReason(targetId, analysis) {
    const reasons = []
    const suggestions = []
    
    // 检查基本结构
    if (analysis.sensorCount === 0) {
      reasons.push('缺少我方传感器节点')
      suggestions.push('需要部署传感器以探测敌方目标')
    }
    
    if (analysis.commandCount === 0) {
      reasons.push('缺少我方指挥中心节点')
      suggestions.push('需要部署指挥中心以协调作战')
    }
    
    if (analysis.strikerCount === 0) {
      reasons.push('缺少我方打击单元节点')
      suggestions.push('需要部署打击单元以执行打击任务')
    }
    
    // 检查能否打击目标
    if (analysis.strikerCount > 0 && analysis.strikersCanHitTarget === 0) {
      reasons.push('没有打击单元能够打击该目标')
      suggestions.push('检查打击单元与目标之间是否有"打击"类型的连接')
      suggestions.push('或者目标超出所有打击单元的射程')
    }
    
    // 检查连接性
    if (analysis.hasBasicStructure && reasons.length === 0) {
      reasons.push('网络连接不完整，无法形成杀伤链')
      suggestions.push('检查传感器→指挥中心、指挥中心→打击单元之间的连接')
      suggestions.push('确保存在完整的探测→通信→指挥→通信→打击路径')
    }
    
    return {
      reason: reasons.join('；'),
      details: {
        reasons,
        suggestions,
        networkStatus: {
          传感器: `${analysis.sensorCount}个`,
          指挥中心: `${analysis.commandCount}个`,
          打击单元: `${analysis.strikerCount}个`,
          可打击目标的打击单元: `${analysis.strikersCanHitTarget}个`
        }
      }
    }
  }
  
  /**
   * 获取杀伤链的可读描述
   * @param {Object} chain - 杀伤链对象
   * @returns {string} 描述文本
   */
  getChainDescription(chain) {
    const nodeNames = chain.nodeDetails.map(n => n.name).join(' → ')
    const effectiveness = (chain.effectiveness * 100).toFixed(1)
    return `${nodeNames} (效能: ${effectiveness}%)`
  }
}

export default KillChainSearchEngine
