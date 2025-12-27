// migrateUtils.js - 数据迁移工具
// 位置: src/utils/migrateUtils.js
// 用于将旧格式数据转换为v2.0格式

/**
 * 将旧格式节点转换为v2.0格式
 * @param {Object} oldNode - 旧格式节点
 * @returns {Object} v2.0格式节点
 */
export function migrateNodeToV2(oldNode) {
  // 确定基础类型
  const baseType = oldNode.type || oldNode.baseType || 'sensor'
  
  // 构建performance对象
  const performance = buildPerformanceObject(oldNode, baseType)
  
  return {
    ...oldNode,
    // 确保有model字段
    model: oldNode.model || oldNode.code || '未知型号',
    // 统一使用baseType
    baseType: baseType,
    // 性能参数对象化
    performance: performance,
    // 保留原有position
    x: oldNode.x ?? 0,
    y: oldNode.y ?? 0,
    // 保留HP
    hp: oldNode.hp ?? 100,
    // 添加创建时间
    createdAt: oldNode.createdAt || new Date().toISOString()
  }
}

/**
 * 构建性能对象
 */
function buildPerformanceObject(oldNode, baseType) {
  const performance = {}
  
  switch(baseType) {
    case 'sensor':
      performance.detectionRange = oldNode.detection_range || 
                                    oldNode.detectionRange || 150
      performance.detectionAccuracy = oldNode.detection_accuracy || 
                                      oldNode.detectionAccuracy || 10
      performance.detectionProbability = oldNode.detection_probability || 
                                          oldNode.detectionProbability || 0.8
      performance.resolution = oldNode.resolution || 1.0
      performance.frequency = oldNode.frequency || 'X-band'
      performance.antiJamming = oldNode.anti_jamming || 
                                oldNode.antiJamming || 0.7
      break
      
    case 'command':
      performance.commandRange = oldNode.command_range || 
                                 oldNode.commandRange || 
                                 oldNode.communication_range || 200
      performance.processingCapacity = oldNode.processing_capacity || 
                                       oldNode.processingCapacity || 100
      performance.decisionDelay = oldNode.decision_delay || 
                                  oldNode.decisionDelay || 5
      performance.maxNodes = oldNode.max_nodes || 
                            oldNode.maxNodes || 20
      break
      
    case 'striker':
      performance.strikeRange = oldNode.strike_range || 
                                oldNode.strikeRange || 100
      performance.damageRate = oldNode.damage_rate || 
                               oldNode.damageRate || 0.7
      performance.responseTime = oldNode.response_time || 
                                oldNode.responseTime || 10
      performance.ammunition = oldNode.ammunition || 10
      performance.accuracy = oldNode.accuracy || 15
      break
      
    case 'support':
      performance.commDistance = oldNode.communication_range || 
                                 oldNode.commDistance || 200
      performance.bandwidth = oldNode.bandwidth || 50
      performance.relayCapacity = oldNode.relay_capacity || 
                                  oldNode.relayCapacity || 5
      performance.reliability = oldNode.reliability || 0.9
      break
      
    default:
      // 未知类型，尝试保留所有数值属性
      Object.keys(oldNode).forEach(key => {
        if (typeof oldNode[key] === 'number' && 
            !['id', 'x', 'y', 'hp'].includes(key)) {
          performance[key] = oldNode[key]
        }
      })
  }
  
  return performance
}

/**
 * 批量迁移节点数组
 */
export function migrateNodes(oldNodes) {
  if (!Array.isArray(oldNodes)) return []
  
  return oldNodes.map(node => migrateNodeToV2(node))
}

/**
 * 迁移边
 */
export function migrateEdge(oldEdge) {
  return {
    ...oldEdge,
    quality: oldEdge.quality ?? 0.9,
    createdAt: oldEdge.createdAt || new Date().toISOString()
  }
}

/**
 * 批量迁移边数组
 */
export function migrateEdges(oldEdges) {
  if (!Array.isArray(oldEdges)) return []
  
  return oldEdges.map(edge => migrateEdge(edge))
}

/**
 * 迁移整个网络
 */
export function migrateNetworkToV2(oldNetwork) {
  return {
    version: '2.0',
    name: oldNetwork.name || '未命名网络',
    timestamp: new Date().toISOString(),
    description: oldNetwork.description || '',
    metadata: {
      nodeCount: oldNetwork.nodes?.length || 0,
      edgeCount: oldNetwork.edges?.length || 0,
      originalVersion: oldNetwork.version || '1.0'
    },
    nodes: migrateNodes(oldNetwork.nodes || []),
    edges: migrateEdges(oldNetwork.edges || [])
  }
}

/**
 * 从localStorage迁移数据
 */
export function migrateFromLocalStorage() {
  const migrations = []
  
  // 迁移旧的项目数据
  try {
    const oldProject = localStorage.getItem('currentProject')
    if (oldProject) {
      const data = JSON.parse(oldProject)
      
      if (!data.version || data.version !== '2.0') {
        const migratedNetwork = migrateNetworkToV2(data)
        
        migrations.push({
          type: 'currentProject',
          original: data,
          migrated: migratedNetwork
        })
      }
    }
  } catch (error) {
    console.error('迁移currentProject失败:', error)
  }
  
  // 迁移装备数据
  try {
    const oldEquipments = localStorage.getItem('equipments')
    if (oldEquipments) {
      const data = JSON.parse(oldEquipments)
      
      if (Array.isArray(data)) {
        const migratedEquipments = data.map(eq => ({
          ...eq,
          model: eq.model || eq.code || '未知型号',
          baseType: eq.type || eq.baseType,
          performance: buildPerformanceObject(eq, eq.type || eq.baseType)
        }))
        
        migrations.push({
          type: 'equipments',
          original: data,
          migrated: migratedEquipments
        })
      }
    }
  } catch (error) {
    console.error('迁移equipments失败:', error)
  }
  
  return migrations
}

/**
 * 应用迁移（保存到localStorage）
 */
export function applyMigrations(migrations) {
  migrations.forEach(migration => {
    try {
      switch(migration.type) {
        case 'currentProject':
          localStorage.setItem('currentProject', 
            JSON.stringify(migration.migrated))
          console.log('✅ currentProject已迁移')
          break
          
        case 'equipments':
          localStorage.setItem('customEquipment_v2', 
            JSON.stringify(migration.migrated))
          console.log('✅ equipments已迁移')
          break
      }
    } catch (error) {
      console.error(`应用迁移失败 (${migration.type}):`, error)
    }
  })
}

/**
 * 一键迁移所有数据
 */
export function migrateAll() {
  console.log('开始数据迁移...')
  
  const migrations = migrateFromLocalStorage()
  
  console.log(`发现 ${migrations.length} 项需要迁移`)
  
  if (migrations.length > 0) {
    applyMigrations(migrations)
    console.log('✅ 数据迁移完成')
    
    return {
      success: true,
      migratedCount: migrations.length,
      migrations: migrations
    }
  } else {
    console.log('没有需要迁移的数据')
    
    return {
      success: true,
      migratedCount: 0,
      migrations: []
    }
  }
}

// 默认导出
export default {
  migrateNodeToV2,
  migrateNodes,
  migrateEdge,
  migrateEdges,
  migrateNetworkToV2,
  migrateFromLocalStorage,
  applyMigrations,
  migrateAll
}
