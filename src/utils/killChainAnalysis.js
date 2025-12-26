// 杀伤链分析工具类
// 位置: src/utils/killChainAnalysis.js

export class KillChainAnalyzer {
  constructor(nodes, edges) {
    this.nodes = nodes
    this.edges = edges
  }
  
  // ========== 1. 探测阶段 ==========
  checkDetection(attacker, target) {
    // 查找探测链路（简化版：检查是否有探测关系）
    const detectionPath = this.findDetectionPath(attacker, target)
    
    // 计算探测概率（基于路径长度）
    const detectionProb = this.calculateDetectionProbability(detectionPath, attacker, target)
    
    // 计算探测时间
    const detectionTime = this.calculateDetectionTime(detectionPath)
    
    return {
      canDetect: detectionProb > 0.5,
      probability: detectionProb,
      time: detectionTime,
      path: detectionPath,
      pathLength: detectionPath.length
    }
  }
  
  // 查找探测路径（简化：直接探测或通过传感器）
  findDetectionPath(attacker, target) {
    // 1. 检查攻击者自身是否能探测
    if (attacker.type === 'sensor' || attacker.type === 'striker') {
      return [attacker, target]
    }
    
    // 2. 查找友军传感器
    const sensors = this.nodes.filter(n => 
      n.faction === attacker.faction && 
      n.type === 'sensor' && 
      n.hp > 0
    )
    
    if (sensors.length > 0) {
      // 返回最近的传感器
      const nearestSensor = sensors.reduce((nearest, sensor) => {
        const dist = this.calculateDistance(sensor, target)
        const nearestDist = this.calculateDistance(nearest, target)
        return dist < nearestDist ? sensor : nearest
      })
      return [attacker, nearestSensor, target]
    }
    
    // 3. 没有传感器，依赖自身（降低概率）
    return [attacker, target]
  }
  
  // 计算探测概率
  calculateDetectionProbability(path, attacker, target) {
    let baseProb = 0.8
    
    // 传感器类型加成
    if (path.length > 2) {
      const sensor = path[1]
      if (sensor.type === 'sensor') {
        baseProb = 0.9
      }
    } else if (attacker.type === 'sensor') {
      baseProb = 0.85
    }
    
    // 距离惩罚
    const distance = this.calculateDistance(attacker, target)
    const distancePenalty = Math.min(distance / 800, 0.3)
    
    // 路径长度惩罚
    const pathPenalty = (path.length - 2) * 0.1
    
    return Math.max(0.3, Math.min(1.0, baseProb - distancePenalty - pathPenalty))
  }
  
  // 计算探测时间
  calculateDetectionTime(path) {
    return path.length * 1.5 // 每跳1.5秒
  }
  
  // ========== 2. 决策阶段 ==========
  makeDecision(attacker, target, detectionResult) {
    // 计算打击距离
    const distance = this.calculateDistance(attacker, target)
    
    // 检查打击范围（简化：500px）
    const strikeRange = attacker.strikeRange || 500
    const inRange = distance <= strikeRange
    
    // 计算威胁等级
    const threatLevel = this.assessThreat(target)
    
    // 决策时间（基于威胁等级）
    const decisionTime = 2 + (5 - threatLevel) * 0.5 // 2-4.5秒
    
    // 决策批准条件
    const approved = detectionResult.canDetect && inRange
    
    return {
      approved,
      distance,
      inRange,
      strikeRange,
      threatLevel,
      time: decisionTime,
      reason: !detectionResult.canDetect ? '探测失败' : !inRange ? '超出射程' : '批准打击'
    }
  }
  
  // 评估目标威胁等级（1-5）
  assessThreat(target) {
    const threatMap = {
      'command': 5,  // 指挥中心最高威胁
      'striker': 4,  // 打击单元高威胁
      'sensor': 3    // 传感器中等威胁
    }
    return threatMap[target.type] || 3
  }
  
  // ========== 3. 打击阶段 ==========
  executeStrike(attacker, target, decisionResult) {
    if (!decisionResult.approved) {
      return {
        success: false,
        hit: false,
        damage: 0,
        hitProbability: 0,
        time: 0,
        reason: decisionResult.reason
      }
    }
    
    // 计算命中概率
    const hitProb = this.calculateHitProbability(attacker, target, decisionResult.distance)
    
    // 判定是否命中（随机数判定）
    const hit = Math.random() < hitProb
    
    // 计算伤害
    const damage = hit ? this.calculateDamage(attacker, target) : 0
    
    // 打击时间（基于距离）
    const strikeTime = decisionResult.distance / 150 + 1 // 飞行时间
    
    return {
      success: true,
      hit,
      damage,
      hitProbability: hitProb,
      time: strikeTime,
      reason: hit ? '命中目标' : '脱靶'
    }
  }
  
  // 计算命中概率
  calculateHitProbability(attacker, target, distance) {
    // 基础命中率
    let baseProb = 0.75
    
    // 攻击者类型加成
    if (attacker.type === 'striker') {
      baseProb = 0.85
    }
    
    // 距离惩罚（距离越远命中率越低）
    const distancePenalty = Math.min(distance / 1000, 0.4)
    
    // 目标类型影响（指挥中心较大，容易命中）
    const targetBonus = target.type === 'command' ? 0.1 : 0
    
    return Math.max(0.2, Math.min(0.95, baseProb - distancePenalty + targetBonus))
  }
  
  // 计算伤害
  calculateDamage(attacker, target) {
    // 基础伤害 20-50
    const baseDamage = 20 + Math.random() * 30
    
    // 攻击者类型加成
    const attackerBonus = attacker.type === 'striker' ? 1.3 : 1.0
    
    // 目标类型影响（传感器较脆弱）
    const targetMultiplier = target.type === 'sensor' ? 1.2 : 1.0
    
    return Math.floor(baseDamage * attackerBonus * targetMultiplier)
  }
  
  // ========== 4. 评估阶段 ==========
  assessEffect(strikeResult, target) {
    if (!strikeResult.success || !strikeResult.hit) {
      return {
        effectiveness: 0,
        targetStatus: 'active',
        remainingHP: target.hp,
        damageRatio: 0,
        recommendation: strikeResult.success ? '目标脱靶，建议重新打击' : '打击条件不满足'
      }
    }
    
    const remainingHP = Math.max(0, target.hp - strikeResult.damage)
    const damageRatio = strikeResult.damage / target.hp
    const effectiveness = Math.min(1.0, damageRatio * 1.2) // 效能评分
    
    let targetStatus, recommendation
    
    if (remainingHP <= 0) {
      targetStatus = 'destroyed'
      recommendation = '目标已摧毁，任务完成'
    } else if (remainingHP < 30) {
      targetStatus = 'critical'
      recommendation = '目标重伤，建议补充打击确保摧毁'
    } else if (remainingHP < 70) {
      targetStatus = 'damaged'
      recommendation = '目标受损，建议继续打击'
    } else {
      targetStatus = 'minor'
      recommendation = '目标轻伤，建议集中火力或更换打击方式'
    }
    
    return {
      effectiveness,
      targetStatus,
      remainingHP,
      damageRatio,
      recommendation
    }
  }
  
  // ========== 完整杀伤链分析 ==========
  analyzeKillChain(attacker, target) {
    const startTime = Date.now()
    
    // 阶段1: 探测
    const detection = this.checkDetection(attacker, target)
    
    // 阶段2: 决策
    const decision = this.makeDecision(attacker, target, detection)
    
    // 阶段3: 打击
    const strike = this.executeStrike(attacker, target, decision)
    
    // 阶段4: 评估
    const assessment = this.assessEffect(strike, target)
    
    // 总时间
    const totalTime = detection.time + decision.time + strike.time
    
    // 杀伤链完整性
    const chainComplete = detection.canDetect && decision.approved && strike.success && strike.hit
    
    // 总体效能（0-1）
    let overallEffectiveness = 0
    if (chainComplete) {
      overallEffectiveness = (
        (detection.probability * 0.2) +
        (decision.approved ? 0.2 : 0) +
        (strike.hitProbability * 0.3) +
        (assessment.effectiveness * 0.3)
      )
    }
    
    return {
      // 各阶段结果
      detection,
      decision,
      strike,
      assessment,
      
      // 总体指标
      totalTime: parseFloat(totalTime.toFixed(2)),
      chainComplete,
      overallEffectiveness: parseFloat(overallEffectiveness.toFixed(3)),
      
      // 时间戳
      timestamp: Date.now(),
      
      // 摘要信息
      summary: {
        success: chainComplete,
        stages: [
          { name: '探测', success: detection.canDetect, time: detection.time },
          { name: '决策', success: decision.approved, time: decision.time },
          { name: '打击', success: strike.hit, time: strike.time },
          { name: '评估', success: assessment.effectiveness > 0, time: 0 }
        ]
      }
    }
  }
  
  // ========== 辅助工具方法 ==========
  
  // 计算两节点间距离
  calculateDistance(node1, node2) {
    const dx = node1.x - node2.x
    const dy = node1.y - node2.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  // 查找节点
  findNode(nodeId) {
    return this.nodes.find(n => n.id === nodeId)
  }
}

// 默认导出
export default KillChainAnalyzer
