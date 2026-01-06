<template>
  <div class="simulation-page">
    <!-- 如果没有网络数据，显示提示 -->
    <el-empty
      v-if="!hasNetwork"
      description="请先导入网络或加载示例"
      class="empty-container"
    >
      <el-space direction="vertical" :size="15">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".json"
          :on-change="handleFileSelect"
        >
          <el-button type="primary" size="large">
            📁 导入网络文件
          </el-button>
        </el-upload>

        <el-divider>或</el-divider>

        <el-button @click="loadSampleNetwork" size="large">
          📊 加载示例网络
        </el-button>

        <el-button @click="$router.push('/network')" size="large">
          🔧 前往网络构建
        </el-button>
      </el-space>
    </el-empty>

    <!-- 推演界面 -->
    <div v-else class="simulation-content">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <el-card shadow="never" class="control-card">
          <template #header>
            <div class="card-header">
              <span>作战控制台</span>
              <el-tag :type="simStatus === 'running' ? 'success' : 'info'" size="small">
                {{ simStatus === 'running' ? '运行中' : '待命' }}
              </el-tag>
            </div>
          </template>

          <el-scrollbar height="100%">
            <div class="control-content">
              <!-- 当前网络信息 -->
              <el-alert
                :title="networkInfo"
                type="info"
                :closable="false"
                class="network-info"
              >
                <template #default>
                  <div class="network-stats">
                    我方: {{ blueNodes.length }} | 敌方: {{ redNodes.length }}
                  </div>
                  <div class="network-stats" style="margin-top: 4px">
                    传感器: {{ sensorCount }} | 打击: {{ strikerCount }} | 指挥: {{ commandCount }}
                  </div>
                </template>
              </el-alert>

              <!-- 文件操作 -->
              <div class="control-section">
                <div class="section-title">文件操作</div>
                <el-space direction="vertical" style="width: 100%" :size="8">
                  <el-upload
                    ref="uploadRef"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".json"
                    :on-change="handleFileSelect"
                  >
                    <el-button style="width: 100%">
                      📁 导入网络
                    </el-button>
                  </el-upload>
                  <el-button
                    style="width: 100%"
                    @click="exportNetwork"
                  >
                    💾 导出当前网络
                  </el-button>
                </el-space>
              </div>

              <!-- 基础控制 -->
              <div class="control-section">
                <div class="section-title">推演控制</div>
                <el-space direction="vertical" style="width: 100%" :size="8">
                  <el-button
                    type="primary"
                    style="width: 100%"
                    @click="toggleSimulation"
                  >
                    {{ simStatus === 'running' ? '⏸ 暂停' : '▶ 开始' }}
                  </el-button>
                  <el-button
                    style="width: 100%"
                    @click="resetAll"
                  >
                    🔄 重置
                  </el-button>
                  <el-button
                    style="width: 100%"
                    @click="reloadNetwork"
                  >
                    🔃 重新加载网络
                  </el-button>
                </el-space>
              </div>

              <!-- 动态移动控制 -->
              <div class="control-section">
                <div class="section-title">
                  动态移动系统
                  <el-tag
                    :type="movementEnabled ? 'success' : 'info'"
                    size="small"
                    style="margin-left: 8px"
                  >
                    {{ movementEnabled ? '运行中' : '已停止' }}
                  </el-tag>
                </div>

                <el-space direction="vertical" style="width: 100%" :size="8">
                  <!-- 启动/停止按钮 -->
                  <el-button
                    :type="movementEnabled ? 'warning' : 'success'"
                    style="width: 100%"
                    @click="toggleMovementSystem"
                  >
                    {{ movementEnabled ? '⏸ 停止移动' : '▶ 启动移动' }}
                  </el-button>

                  <!-- 速度控制 -->
                  <div style="margin-top: 8px">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
                      <el-text size="small">移动速度</el-text>
                      <el-text size="small" type="primary">{{ movementSpeed.toFixed(1) }}x</el-text>
                    </div>
                    <el-slider
                      v-model="movementSpeed"
                      :min="0.5"
                      :max="5"
                      :step="0.5"
                      :disabled="!movementEnabled"
                    />
                  </div>

                  <!-- 快捷战术指令 -->
                  <el-divider style="margin: 8px 0">快捷指令</el-divider>

                  <el-button
                    size="small"
                    style="width: 100%"
                    @click="autoPatrol"
                    :disabled="!movementEnabled"
                  >
                    🔄 自动巡逻
                  </el-button>

                  <el-button
                    size="small"
                    style="width: 100%"
                    @click="formDefensiveLine"
                    :disabled="!movementEnabled"
                  >
                    🛡 防御阵型
                  </el-button>

                  <el-button
                    size="small"
                    style="width: 100%"
                    @click="attackFormation"
                    :disabled="!movementEnabled"
                  >
                    ⚔ 进攻阵型
                  </el-button>
                </el-space>

                <!-- 操作提示 -->
                <el-alert
                  v-if="movementEnabled"
                  type="info"
                  :closable="false"
                  style="margin-top: 12px"
                >
                  <template #default>
                    <div style="font-size: 11px; line-height: 1.5">
                      <div>• 左键拖拽节点直接移动</div>
                      <div>• 选中节点后右键设置目标</div>
                      <div>• 打击敌方会触发战术响应</div>
                    </div>
                  </template>
                </el-alert>
              </div>

              <!-- 视图控制 -->
              <div class="control-section">
                <div class="section-title">视图控制</div>
                <div class="view-controls">
                  <el-button-group style="width: 100%; display: flex">
                    <el-button style="flex: 1" @click="zoomIn" size="small">🔍+</el-button>
                    <el-button style="flex: 1" @click="zoomOut" size="small">🔍-</el-button>
                    <el-button style="flex: 1" @click="resetView" size="small">⚙</el-button>
                  </el-button-group>
                </div>
                <div style="margin-top: 8px; text-align: center">
                  <el-text size="small" type="info">
                    缩放: {{ (scale * 100).toFixed(0) }}%
                  </el-text>
                </div>
                <el-button
                  style="width: 100%; margin-top: 8px"
                  @click="fitToScreen"
                  size="small"
                >
                  📐 自适应屏幕
                </el-button>
              </div>

              <!-- 杀伤链搜索 -->
              <div class="control-section">
                <div class="section-title">杀伤链搜索</div>
                <el-select
                  v-model="targetNodeId"
                  placeholder="选择敌方目标"
                  style="width: 100%; margin-bottom: 10px"
                  size="default"
                  filterable
                  @change="killChains = []; selectedChainId = null"
                >
                  <el-option
                    v-for="node in redNodes.filter(n => n.hp > 0)"
                    :key="node.id"
                    :label="`${node.name} (HP:${node.hp})`"
                    :value="node.id"
                  />
                </el-select>
                <el-button
                  type="primary"
                  style="width: 100%"
                  @click="searchKillChains"
                  :disabled="!targetNodeId"
                  :loading="searching"
                >
                  🔍 搜索杀伤链
                </el-button>
                
                <!-- 搜索结果提示 -->
                <div v-if="killChains.length > 0" style="margin-top: 10px">
                  <el-alert
                    :title="`找到 ${killChains.length} 条杀伤链`"
                    type="success"
                    :closable="false"
                  />
                </div>
                <div v-else-if="showChainList && killChains.length === 0" style="margin-top: 10px">
                  <el-alert
                    title="未找到可用杀伤链"
                    type="warning"
                    :closable="false"
                  />
                </div>
              </div>

              <!-- 杀伤链列表 -->
              <div v-if="killChains.length > 0" class="control-section">
                <div class="section-title">杀伤链列表</div>
                <el-scrollbar max-height="300px">
                  <div class="kill-chain-list">
                    <div
                      v-for="chain in killChains"
                      :key="chain.id"
                      :class="['chain-item', { 'chain-selected': selectedChainId === chain.id }]"
                      @click="selectChain(chain.id)"
                    >
                      <div class="chain-header">
                        <el-tag size="small" type="success">
                          效能: {{ (chain.effectiveness * 100).toFixed(1) }}%
                        </el-tag>
                        <el-tag size="small" type="info">
                          {{ chain.length }} 节点
                        </el-tag>
                      </div>
                      <div class="chain-path">
                        {{ chain.nodeDetails.map(n => n.name).join(' → ') }}
                      </div>
                    </div>
                  </div>
                </el-scrollbar>
                
                <!-- 执行打击按钮 -->
                <el-button
                  v-if="selectedChainId"
                  type="danger"
                  style="width: 100%; margin-top: 10px"
                  @click="executeStrike"
                >
                  🎯 执行打击
                </el-button>
              </div>

              <!-- 战况统计 -->
              <div class="control-section">
                <div class="section-title">战况</div>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-label">我方存活</span>
                    <span class="stat-value">{{ blueNodes.filter(n => n.hp > 0).length }}/{{ blueNodes.length }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">敌方存活</span>
                    <span class="stat-value">{{ redNodes.filter(n => n.hp > 0).length }}/{{ redNodes.length }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">打击次数</span>
                    <span class="stat-value">{{ attackCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">命中率</span>
                    <span class="stat-value">{{ hitRate }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </div>

      <!-- 右侧内容区 -->
      <div class="main-area">
        <!-- 战场画布 -->
        <div class="battlefield-container">
          <el-card shadow="never" class="battlefield-card">
            <template #header>
              <div class="card-header">
                <span>战场态势图</span>
                <el-space>
                  <el-tag size="small">{{ displayNodes.length }} 节点</el-tag>
                  <el-button
                    size="small"
                    @click="autoArrange"
                  >
                    自动排列
                  </el-button>
                  <el-button
                    size="small"
                    @click="toggleFullscreen"
                  >
                    {{ isFullscreen ? '退出全屏' : '全屏' }}
                  </el-button>
                </el-space>
              </div>
            </template>
            <div class="canvas-wrapper" ref="canvasWrapper">
              <canvas
                ref="battleCanvas"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                @wheel="handleWheel"
              ></canvas>
              <div class="canvas-tips">
                <el-text size="small" type="info">
                  💡 提示: 鼠标滚轮缩放 | 右键拖拽画布 | 左键选择节点
                  <span v-if="movementEnabled"> | 左键拖拽节点移动 | 选中后右键设置目标</span>
                </el-text>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 底部日志 -->
        <div class="log-container">
          <el-card shadow="never" class="log-card">
            <template #header>
              <div class="card-header">
                <span>作战日志</span>
                <el-button size="small" text @click="battleLogs = []">清空</el-button>
              </div>
            </template>
            <el-scrollbar height="100%">
              <div class="log-content">
                <div
                  v-for="(log, idx) in battleLogs"
                  :key="idx"
                  :class="['log-line', `log-${log.type}`]"
                >
                  [{{ log.time }}] {{ log.msg }}
                </div>
              </div>
            </el-scrollbar>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useNetworkStore } from '@/store/modules/network'
import { KillChainSearchEngine } from '@/utils/killChainSearch'

// Store
const networkStore = useNetworkStore()

// 文件上传
const uploadRef = ref(null)

// 画布相关
const battleCanvas = ref(null)
const canvasWrapper = ref(null)
let ctx = null

// 视图控制
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isFullscreen = ref(false)

// 鼠标交互
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastOffsetX = ref(0)
const lastOffsetY = ref(0)

// 推演状态
const simStatus = ref('idle')
const selectedNodeId = ref(null)
const targetNodeId = ref(null)
const attackCount = ref(0)
const hitRate = ref(100)

// 动态移动系统
const movementEnabled = ref(false)     // 是否启用节点移动
const movementSpeed = ref(2)           // 移动速度倍率
const movementMode = ref('auto')       // 移动模式: 'auto' | 'manual' | 'hybrid'
let animationFrameId = null            // 动画帧ID
let lastFrameTime = 0                  // 上一帧时间

// 节点拖拽
const draggingNode = ref(null)         // 正在拖拽的节点
const nodeOffsetX = ref(0)             // 拖拽偏移量
const nodeOffsetY = ref(0)

// 杀伤链相关
const killChains = ref([])           // 搜索到的杀伤链列表
const selectedChainId = ref(null)    // 选中的杀伤链ID
const showChainList = ref(false)     // 是否显示杀伤链列表
const searching = ref(false)         // 搜索状态

// 日志
const battleLogs = ref([])

// 计算属性
const hasNetwork = computed(() => networkStore.isLoaded && networkStore.nodes.length > 0)

const displayNodes = computed(() => {
  return networkStore.nodes.map(node => ({
    ...node,
    hp: node.hp ?? 100,
    color: node.color || (node.faction === 'red' ? '#F56C6C' : '#409EFF')
  }))
})

const blueNodes = computed(() => displayNodes.value.filter(n => n.faction === 'blue'))
const redNodes = computed(() => displayNodes.value.filter(n => n.faction === 'red'))

const networkInfo = computed(() => {
  const project = networkStore.currentProject
  return project?.name || '当前网络'
})

const sensorCount = computed(() =>
  displayNodes.value.filter(n => n.baseType === 'sensor' || n.type === 'sensor').length
)

const strikerCount = computed(() =>
  displayNodes.value.filter(n => n.baseType === 'striker' || n.type === 'striker').length
)

const commandCount = computed(() =>
  displayNodes.value.filter(n => n.baseType === 'command' || n.type === 'command').length
)

// ==================== 动态移动系统工具函数 ====================

// 根据节点类型获取移动速度
const getNodeSpeed = (baseType) => {
  const speedMap = {
    sensor: 3,      // 传感器：中速
    command: 1.5,   // 指挥中心：慢速
    striker: 4,     // 打击单元：快速
    support: 2.5    // 支援保障：中速
  }
  return speedMap[baseType] || 2
}

// 初始化节点移动属性
const initNodeMovement = (node) => {
  if (!node.movement) {
    node.movement = {
      enabled: false,
      mode: 'idle',
      targetX: node.x,
      targetY: node.y,
      velocityX: 0,
      velocityY: 0,
      speed: getNodeSpeed(node.baseType || node.type),
      path: [],
      currentPathIndex: 0
    }
  }
}

// 更新节点位置（物理系统）
const updateNodePosition = (node, deltaTime) => {
  if (!node.movement.enabled || node.hp <= 0) return

  const dx = node.movement.targetX - node.x
  const dy = node.movement.targetY - node.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // 如果已到达目标，停止移动
  if (distance < 5) {
    node.movement.velocityX = 0
    node.movement.velocityY = 0

    // 如果有航路点，移动到下一个
    if (node.movement.path.length > 0) {
      node.movement.currentPathIndex++
      if (node.movement.currentPathIndex >= node.movement.path.length) {
        node.movement.currentPathIndex = 0
        node.movement.mode = 'idle'
        node.movement.enabled = false
      } else {
        const nextPoint = node.movement.path[node.movement.currentPathIndex]
        node.movement.targetX = nextPoint.x
        node.movement.targetY = nextPoint.y
      }
    } else {
      node.movement.mode = 'idle'
      node.movement.enabled = false
    }
    return
  }

  // 计算移动方向
  const dirX = dx / distance
  const dirY = dy / distance

  // 计算速度（考虑全局速度倍率）
  const actualSpeed = node.movement.speed * movementSpeed.value

  // 更新速度
  node.movement.velocityX = dirX * actualSpeed
  node.movement.velocityY = dirY * actualSpeed

  // 更新位置
  node.x += node.movement.velocityX * deltaTime
  node.y += node.movement.velocityY * deltaTime

  // 更新 networkStore 中的节点位置
  networkStore.updateNode(node.id, { x: node.x, y: node.y })
}

// 事件驱动的战术移动
const handleCombatEvent = (eventType, node, params = {}) => {
  switch (eventType) {
    case 'attacked':
      // 受到攻击 → 撤退
      if (params.attacker) {
        const dx = node.x - params.attacker.x
        const dy = node.y - params.attacker.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          // 向后撤退
          const retreatDistance = 150
          node.movement.targetX = node.x + (dx / distance) * retreatDistance
          node.movement.targetY = node.y + (dy / distance) * retreatDistance
          node.movement.mode = 'retreat'
          node.movement.enabled = true

          addLog(`${node.name} 正在撤退`, 'warning')
        }
      }
      break

    case 'enemyDetected':
      // 发现敌方 → 根据类型响应
      if (params.enemy) {
        if (node.baseType === 'striker') {
          // 打击单元接近目标
          node.movement.targetX = params.enemy.x
          node.movement.targetY = params.enemy.y
          node.movement.mode = 'attack'
          node.movement.enabled = true

          addLog(`${node.name} 正在接近目标 ${params.enemy.name}`, 'info')
        } else if (node.baseType === 'sensor') {
          // 传感器保持安全距离侦察
          const safeDistance = 150
          const angle = Math.atan2(params.enemy.y - node.y, params.enemy.x - node.x)
          node.movement.targetX = params.enemy.x - Math.cos(angle) * safeDistance
          node.movement.targetY = params.enemy.y - Math.sin(angle) * safeDistance
          node.movement.mode = 'recon'
          node.movement.enabled = true

          addLog(`${node.name} 正在侦察 ${params.enemy.name}`, 'info')
        }
      }
      break

    case 'communicationLost':
      // 通信中断 → 移动以恢复通信
      const nearestFriendly = findNearestFriendly(node)
      if (nearestFriendly) {
        const dx = nearestFriendly.x - node.x
        const dy = nearestFriendly.y - node.y
        node.movement.targetX = node.x + dx * 0.5
        node.movement.targetY = node.y + dy * 0.5
        node.movement.mode = 'relink'
        node.movement.enabled = true

        addLog(`${node.name} 正在恢复通信`, 'warning')
      }
      break
  }
}

// 查找最近的友军节点
const findNearestFriendly = (node) => {
  const friendlyNodes = displayNodes.value.filter(n =>
    n.faction === node.faction && n.id !== node.id && n.hp > 0
  )

  if (friendlyNodes.length === 0) return null

  let nearest = friendlyNodes[0]
  let minDistance = Infinity

  friendlyNodes.forEach(n => {
    const dist = Math.sqrt((n.x - node.x) ** 2 + (n.y - node.y) ** 2)
    if (dist < minDistance) {
      minDistance = dist
      nearest = n
    }
  })

  return nearest
}

// 动画循环
const animationLoop = (timestamp) => {
  if (!movementEnabled.value) {
    animationFrameId = null
    return
  }

  // 计算时间差（秒）
  const deltaTime = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0
  lastFrameTime = timestamp

  // 更新所有启用移动的节点
  displayNodes.value.forEach(node => {
    if (node.movement && node.movement.enabled) {
      updateNodePosition(node, deltaTime)
    }
  })

  // 重绘画布
  drawBattlefield()

  // 继续下一帧
  animationFrameId = requestAnimationFrame(animationLoop)
}

// 启动移动系统
const startMovementSystem = () => {
  if (movementEnabled.value) return

  movementEnabled.value = true
  lastFrameTime = 0

  // 确保所有节点都有移动属性
  displayNodes.value.forEach(node => initNodeMovement(node))

  // 启动动画循环
  animationFrameId = requestAnimationFrame(animationLoop)

  addLog('节点移动系统已启动', 'success')
  ElMessage.success('节点移动系统已启动')
}

// 停止移动系统
const stopMovementSystem = () => {
  movementEnabled.value = false

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // 停止所有节点移动
  displayNodes.value.forEach(node => {
    if (node.movement) {
      node.movement.enabled = false
      node.movement.velocityX = 0
      node.movement.velocityY = 0
    }
  })

  addLog('节点移动系统已停止', 'warning')
  ElMessage.info('节点移动系统已停止')
}

// 切换移动系统
const toggleMovementSystem = () => {
  if (movementEnabled.value) {
    stopMovementSystem()
  } else {
    startMovementSystem()
  }
}

// ==================== 战术指令 ====================

// 自动巡逻
const autoPatrol = () => {
  if (!battleCanvas.value) return

  const canvas = battleCanvas.value
  const worldWidth = canvas.width / scale.value
  const worldHeight = canvas.height / scale.value

  blueNodes.value.forEach((node, idx) => {
    if (node.hp <= 0) return

    initNodeMovement(node)

    // 创建巡逻路径（矩形巡逻）
    const patrolWidth = 200
    const patrolHeight = 200
    const startX = worldWidth * 0.2
    const startY = 100 + idx * 150

    node.movement.path = [
      { x: startX, y: startY },
      { x: startX + patrolWidth, y: startY },
      { x: startX + patrolWidth, y: startY + patrolHeight },
      { x: startX, y: startY + patrolHeight }
    ]

    node.movement.currentPathIndex = 0
    node.movement.targetX = node.movement.path[0].x
    node.movement.targetY = node.movement.path[0].y
    node.movement.mode = 'patrol'
    node.movement.enabled = true
  })

  addLog('我方单位开始巡逻', 'info')
  ElMessage.success('巡逻指令已下达')
}

// 防御阵型
const formDefensiveLine = () => {
  if (!battleCanvas.value) return

  const canvas = battleCanvas.value
  const worldWidth = canvas.width / scale.value
  const worldHeight = canvas.height / scale.value

  const defensiveX = worldWidth * 0.3
  const startY = 100
  const spacing = 120

  blueNodes.value.forEach((node, idx) => {
    if (node.hp <= 0) return

    initNodeMovement(node)

    node.movement.targetX = defensiveX
    node.movement.targetY = startY + idx * spacing
    node.movement.mode = 'defensive'
    node.movement.enabled = true
    node.movement.path = []
  })

  addLog('我方单位进入防御阵型', 'info')
  ElMessage.success('防御阵型已形成')
}

// 进攻阵型
const attackFormation = () => {
  if (!battleCanvas.value) return
  if (redNodes.value.length === 0) {
    ElMessage.warning('没有可攻击的敌方目标')
    return
  }

  // 计算敌方中心位置
  let centerX = 0
  let centerY = 0
  let count = 0

  redNodes.value.forEach(node => {
    if (node.hp > 0) {
      centerX += node.x
      centerY += node.y
      count++
    }
  })

  if (count === 0) {
    ElMessage.warning('所有敌方目标已被摧毁')
    return
  }

  centerX /= count
  centerY /= count

  // 我方节点向敌方中心靠近，保持扇形阵型
  blueNodes.value.forEach((node, idx) => {
    if (node.hp <= 0) return

    initNodeMovement(node)

    // 计算扇形位置
    const angleSpread = Math.PI / 3  // 60度扇形
    const angle = -angleSpread / 2 + (idx / Math.max(1, blueNodes.value.length - 1)) * angleSpread
    const distance = 200  // 距离敌方中心200单位

    const dx = centerX - node.x
    const dy = centerY - node.y
    const baseAngle = Math.atan2(dy, dx)

    node.movement.targetX = centerX - Math.cos(baseAngle + angle) * distance
    node.movement.targetY = centerY - Math.sin(baseAngle + angle) * distance
    node.movement.mode = 'attack'
    node.movement.enabled = true
    node.movement.path = []
  })

  addLog('我方单位进入进攻阵型', 'danger')
  ElMessage.success('进攻阵型已形成')
}

// ==================== 文件操作 ====================

// 文件导入
const handleFileSelect = (file) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const jsonData = JSON.parse(e.target.result)
      importNetworkData(jsonData)
    } catch (error) {
      ElMessage.error('文件格式错误，请检查JSON格式')
      console.error('解析错误:', error)
    }
  }

  reader.readAsText(file.raw)
}

// 导入网络数据
const importNetworkData = (data) => {
  try {
    // 转换节点数据 - 完整保留所有装备属性
    const nodes = data.nodes.map(node => ({
      // 基础信息
      id: node.id,
      name: node.label || node.name || node.id,
      type: node.baseType || node.type || 'unknown',
      baseType: node.baseType || node.type || 'unknown',
      faction: node.faction,

      // 位置和状态
      x: node.x,
      y: node.y,
      hp: node.hp ?? 100,

      // 装备详细信息（完整保留）
      equipmentId: node.equipmentId,
      model: node.model || '未知型号',
      icon: node.icon || '📍',
      color: node.color || (node.faction === 'red' ? '#F56C6C' : '#409EFF'),

      // ⭐ 关键：完整保留性能属性
      performance: node.performance || {},

      // 其他属性
      description: node.description,
      createdAt: node.createdAt,
      originalType: node.type,

      // ⭐ 动态移动属性
      movement: {
        enabled: false,
        mode: 'idle',           // 'idle' | 'patrol' | 'attack' | 'retreat' | 'recon' | 'manual'
        targetX: node.x,
        targetY: node.y,
        velocityX: 0,
        velocityY: 0,
        speed: getNodeSpeed(node.baseType || node.type),  // 根据类型设置速度
        path: [],               // 航路点
        currentPathIndex: 0
      }
    }))

    // 转换边数据
    const edges = data.edges || []

    // 使用 loadNetwork 而不是 setNetwork
    networkStore.loadNetwork({
      version: data.version || '2.0',
      name: data.name || '导入的网络',
      timestamp: data.timestamp,
      description: data.description,
      metadata: data.metadata,
      nodes,
      edges
    })

    ElMessage.success(`成功导入网络: ${nodes.length} 个节点`)
    addLog(`导入网络成功: ${data.name || '未命名网络'}`, 'success')
    addLog(`节点数: ${nodes.length}, 我方: ${nodes.filter(n => n.faction === 'blue').length}, 敌方: ${nodes.filter(n => n.faction === 'red').length}`, 'info')

    // 自动适应视图
    nextTick(() => {
      fitToScreen()
    })

  } catch (error) {
    ElMessage.error('导入失败: ' + error.message)
    console.error('导入错误:', error)
  }
}

// 导出网络
const exportNetwork = () => {
  const data = {
    version: '1.0',
    name: networkStore.currentProject?.name || '推演网络',
    networkMode: 'mixed',
    timestamp: new Date().toISOString(),
    metadata: {
      nodeCount: displayNodes.value.length,
      edgeCount: networkStore.edges.length,
      friendlyNodeCount: blueNodes.value.length,
      enemyNodeCount: redNodes.value.length
    },
    nodes: displayNodes.value.map(node => ({
      id: node.id,
      type: node.originalType || node.type + '_' + node.faction,
      baseType: node.baseType || node.type,
      faction: node.faction,
      label: node.name,
      x: node.x,
      y: node.y
    })),
    edges: networkStore.edges,
    viewTransform: {
      scale: scale.value,
      translateX: offsetX.value,
      translateY: offsetY.value
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `simulation_network_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('网络已导出')
  addLog('导出当前网络', 'success')
}

// 监听网络数据变化
watch(() => networkStore.nodes.length, (newLen) => {
  if (newLen > 0) {
    nextTick(() => {
      initCanvas()
      addLog('网络数据已加载', 'success')
    })
  }
})

// 加载示例网络
const loadSampleNetwork = () => {
  networkStore.createSampleNetwork()
  ElMessage.success('示例网络已加载')
}

// 重新加载网络
const reloadNetwork = () => {
  if (networkStore.isEmpty) {
    ElMessage.warning('没有可用的网络数据')
    return
  }

  networkStore.nodes.forEach(node => {
    networkStore.updateNode(node.id, { hp: 100 })
  })

  attackCount.value = 0
  hitRate.value = 100
  selectedNodeId.value = null
  targetNodeId.value = null
  
  // 清空杀伤链搜索结果
  killChains.value = []
  selectedChainId.value = null
  showChainList.value = false

  drawBattlefield()
  addLog('网络已重新加载', 'info')
  ElMessage.success('网络已重新加载')
}

// 添加日志
const addLog = (msg, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  battleLogs.value.unshift({ time, msg, type })
  if (battleLogs.value.length > 50) battleLogs.value.pop()
}

// 初始化画布
const initCanvas = () => {
  if (!battleCanvas.value) return

  const canvas = battleCanvas.value
  const container = canvas.parentElement

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  ctx = canvas.getContext('2d')
  drawBattlefield()
}

// 转换坐标
const screenToWorld = (screenX, screenY) => {
  return {
    x: (screenX - offsetX.value) / scale.value,
    y: (screenY - offsetY.value) / scale.value
  }
}

const worldToScreen = (worldX, worldY) => {
  return {
    x: worldX * scale.value + offsetX.value,
    y: worldY * scale.value + offsetY.value
  }
}

// 绘制战场
const drawBattlefield = () => {
  if (!ctx || !battleCanvas.value) return

  const canvas = battleCanvas.value
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(offsetX.value, offsetY.value)
  ctx.scale(scale.value, scale.value)

  const worldWidth = width / scale.value
  const worldHeight = height / scale.value

  // 背景
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(-offsetX.value / scale.value, -offsetY.value / scale.value, worldWidth, worldHeight)

  // 网格
  drawGrid(worldWidth, worldHeight)

  // 中线
  ctx.strokeStyle = '#DCDFE6'
  ctx.lineWidth = 2 / scale.value
  ctx.setLineDash([10 / scale.value, 5 / scale.value])
  ctx.beginPath()
  ctx.moveTo(worldWidth / 2, 0)
  ctx.lineTo(worldWidth / 2, worldHeight)
  ctx.stroke()
  ctx.setLineDash([])

  // 区域标识
  ctx.font = `${20 / scale.value}px Arial`
  ctx.fillStyle = '#909399'
  ctx.fillText('我方', 50, 40)
  ctx.fillText('敌方', worldWidth - 100, 40)

  // 绘制所有edges（网络连接）
  drawAllEdges()

  // 如果选中了杀伤链，高亮显示
  if (selectedChainId.value) {
    highlightKillChain()
  }

  // 绘制节点
  displayNodes.value.forEach(node => {
    drawNode(node, node.id === selectedNodeId.value)
  })

  ctx.restore()
}

// 绘制网格
const drawGrid = (width, height) => {
  const gridSize = 50
  ctx.strokeStyle = '#E4E7ED'
  ctx.lineWidth = 0.5 / scale.value

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

// 绘制单个节点
const drawNode = (node, selected) => {
  const radius = 28

  ctx.fillStyle = node.hp > 0 ? node.color : '#C0C4CC'
  ctx.beginPath()
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
  ctx.fill()

  if (selected) {
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  ctx.strokeStyle = node.hp > 0 ? '#303133' : '#909399'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let displayName = node.name
  if (displayName.length > 8) {
    displayName = displayName.substring(0, 7) + '...'
  }

  ctx.fillText(displayName, node.x, node.y)

  // HP条
  const barWidth = 45
  const barHeight = 5
  const barX = node.x - barWidth / 2
  const barY = node.y + radius + 10

  ctx.fillStyle = '#DCDFE6'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  ctx.fillStyle = node.hp > 50 ? '#67C23A' : '#F56C6C'
  ctx.fillRect(barX, barY, barWidth * (node.hp / 100), barHeight)
}

// 绘制所有edges
const drawAllEdges = () => {
  if (!networkStore.edges || networkStore.edges.length === 0) return
  
  const edgeStyles = {
    'detection': { color: '#409EFF', width: 1.5, dash: [5, 5] },
    'communication': { color: '#67C23A', width: 2, dash: [] },
    'strike': { color: '#F56C6C', width: 2, dash: [10, 5] }
  }
  
  networkStore.edges.forEach(edge => {
    const source = displayNodes.value.find(n => n.id === edge.source)
    const target = displayNodes.value.find(n => n.id === edge.target)
    
    if (!source || !target) return
    
    const style = edgeStyles[edge.type] || edgeStyles.communication
    
    ctx.strokeStyle = style.color
    ctx.lineWidth = style.width / scale.value
    ctx.setLineDash(style.dash.map(d => d / scale.value))
    ctx.globalAlpha = 0.3
    
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)
    ctx.stroke()
    
    // 绘制箭头
    drawArrow(source, target, style.color)
    
    ctx.globalAlpha = 1
    ctx.setLineDash([])
  })
}

// 绘制箭头
const drawArrow = (source, target, color) => {
  const angle = Math.atan2(target.y - source.y, target.x - source.x)
  const arrowSize = 8 / scale.value
  const arrowX = target.x - Math.cos(angle) * 32
  const arrowY = target.y - Math.sin(angle) * 32
  
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5 / scale.value
  ctx.globalAlpha = 0.5
  
  ctx.beginPath()
  ctx.moveTo(arrowX, arrowY)
  ctx.lineTo(
    arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
    arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
  )
  ctx.moveTo(arrowX, arrowY)
  ctx.lineTo(
    arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
    arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
  )
  ctx.stroke()
}

// 高亮杀伤链
const highlightKillChain = () => {
  const chain = killChains.value.find(c => c.id === selectedChainId.value)
  if (!chain) return
  
  // 绘制高亮的edges
  chain.edges.forEach((edge, idx) => {
    const source = displayNodes.value.find(n => n.id === edge.source)
    const target = displayNodes.value.find(n => n.id === edge.target)
    
    if (!source || !target) return
    
    // 高亮线条
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 4 / scale.value
    ctx.setLineDash([])
    ctx.globalAlpha = 0.9
    
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)
    ctx.stroke()
    
    // 绘制序号
    const midX = (source.x + target.x) / 2
    const midY = (source.y + target.y) / 2
    
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(midX, midY, 12 / scale.value, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#000'
    ctx.font = `bold ${14 / scale.value}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((idx + 1).toString(), midX, midY)
    
    ctx.globalAlpha = 1
  })
  
  // 高亮节点
  chain.nodeDetails.forEach((node, idx) => {
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 5 / scale.value
    ctx.globalAlpha = 0.9
    
    ctx.beginPath()
    ctx.arc(node.x, node.y, 32, 0, Math.PI * 2)
    ctx.stroke()
    
    // 绘制节点序号
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(node.x, node.y - 45, 15 / scale.value, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#000'
    ctx.font = `bold ${16 / scale.value}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((idx + 1).toString(), node.x, node.y - 45)
    
    ctx.globalAlpha = 1
  })
}


// 缩放控制
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 3)
  drawBattlefield()
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.3)
  drawBattlefield()
}

const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  drawBattlefield()
}

// 自适应屏幕
const fitToScreen = () => {
  if (displayNodes.value.length === 0) return

  const canvas = battleCanvas.value
  if (!canvas) return

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  displayNodes.value.forEach(node => {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x)
    maxY = Math.max(maxY, node.y)
  })

  const padding = 100
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY

  const scaleX = canvas.width / contentWidth
  const scaleY = canvas.height / contentHeight
  scale.value = Math.min(scaleX, scaleY, 2) * 0.9

  offsetX.value = (canvas.width - contentWidth * scale.value) / 2 - minX * scale.value
  offsetY.value = (canvas.height - contentHeight * scale.value) / 2 - minY * scale.value

  drawBattlefield()
  addLog('视图已自适应', 'success')
}

// 鼠标滚轮缩放
const handleWheel = (e) => {
  e.preventDefault()

  const rect = battleCanvas.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const worldPos = screenToWorld(mouseX, mouseY)

  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.3, Math.min(3, scale.value * delta))

  offsetX.value = mouseX - worldPos.x * newScale
  offsetY.value = mouseY - worldPos.y * newScale

  scale.value = newScale
  drawBattlefield()
}

// 鼠标拖拽
const handleMouseDown = (e) => {
  const rect = battleCanvas.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const worldPos = screenToWorld(mouseX, mouseY)

  // 右键：设置移动目标或拖拽画布
  if (e.button === 2) {
    e.preventDefault()

    // 检查是否点击在我方节点上
    let clickedNode = null
    blueNodes.value.forEach(node => {
      const dist = Math.sqrt((worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2)
      if (dist < 28 && node.hp > 0) {
        clickedNode = node
      }
    })

    // 如果点击在节点上，设置为该节点的移动目标
    if (clickedNode && movementEnabled.value) {
      // 右键点击其他位置设置移动目标（需要先选中节点）
      return
    } else if (selectedNodeId.value && movementEnabled.value) {
      // 为选中的节点设置移动目标
      const selectedNode = blueNodes.value.find(n => n.id === selectedNodeId.value)
      if (selectedNode && selectedNode.hp > 0) {
        initNodeMovement(selectedNode)
        selectedNode.movement.targetX = worldPos.x
        selectedNode.movement.targetY = worldPos.y
        selectedNode.movement.mode = 'manual'
        selectedNode.movement.enabled = true
        selectedNode.movement.path = []

        addLog(`${selectedNode.name} 移动目标已设置`, 'info')

        // 绘制目标点指示
        drawBattlefield()
        return
      }
    }

    // 否则拖拽画布
    isDragging.value = true
    dragStartX.value = mouseX
    dragStartY.value = mouseY
    lastOffsetX.value = offsetX.value
    lastOffsetY.value = offsetY.value
    battleCanvas.value.style.cursor = 'grabbing'
    return
  }

  // 左键：选中节点或开始拖拽节点
  if (e.button === 0) {
    // 检查是否点击在我方节点上
    let clickedNode = null
    blueNodes.value.forEach(node => {
      const dist = Math.sqrt((worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2)
      if (dist < 28 && node.hp > 0) {
        clickedNode = node
      }
    })

    if (clickedNode) {
      selectedNodeId.value = clickedNode.id

      // 如果移动系统启用，可以拖拽节点
      if (movementEnabled.value) {
        draggingNode.value = clickedNode
        nodeOffsetX.value = worldPos.x - clickedNode.x
        nodeOffsetY.value = worldPos.y - clickedNode.y
        battleCanvas.value.style.cursor = 'move'

        addLog(`拖拽 ${clickedNode.name}`, 'info')
      } else {
        addLog(`选中 ${clickedNode.name}`)
      }

      drawBattlefield()
    }
  }
}

const handleMouseMove = (e) => {
  const rect = battleCanvas.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const worldPos = screenToWorld(mouseX, mouseY)

  // 如果正在拖拽节点
  if (draggingNode.value) {
    const newX = worldPos.x - nodeOffsetX.value
    const newY = worldPos.y - nodeOffsetY.value

    // 更新节点位置
    draggingNode.value.x = newX
    draggingNode.value.y = newY

    // 更新移动目标
    initNodeMovement(draggingNode.value)
    draggingNode.value.movement.targetX = newX
    draggingNode.value.movement.targetY = newY
    draggingNode.value.movement.enabled = false  // 拖拽时禁用自动移动

    // 更新 store
    networkStore.updateNode(draggingNode.value.id, { x: newX, y: newY })

    drawBattlefield()
    return
  }

  // 如果正在拖拽画布
  if (isDragging.value) {
    offsetX.value = lastOffsetX.value + (mouseX - dragStartX.value)
    offsetY.value = lastOffsetY.value + (mouseY - dragStartY.value)
    drawBattlefield()
  }
}

const handleMouseUp = () => {
  // 完成节点拖拽
  if (draggingNode.value) {
    draggingNode.value = null
    battleCanvas.value.style.cursor = 'crosshair'
  }

  // 完成画布拖拽
  if (isDragging.value) {
    isDragging.value = false
    battleCanvas.value.style.cursor = 'crosshair'
  }
}

// 搜索杀伤链
const searchKillChains = async () => {
  if (!targetNodeId.value) {
    ElMessage.warning('请先选择敌方目标')
    return
  }
  
  searching.value = true
  showChainList.value = true
  
  try {
    addLog(`━━━━ 开始搜索杀伤链 ━━━━`, 'info')
    const targetNode = redNodes.value.find(n => n.id === targetNodeId.value)
    addLog(`目标: ${targetNode?.name}`, 'info')
    
    // 创建搜索引擎
    const searchEngine = new KillChainSearchEngine(
      displayNodes.value,
      networkStore.edges
    )
    
    // 执行搜索
    const result = searchEngine.searchKillChains(targetNodeId.value)
    
    if (result.success) {
      killChains.value = result.killChains
      addLog(`✓ 找到 ${result.killChains.length} 条可行杀伤链`, 'success')
      
      // 显示每条杀伤链的信息
      result.killChains.forEach((chain, idx) => {
        const desc = searchEngine.getChainDescription(chain)
        addLog(`  ${idx + 1}. ${desc}`, 'info')
      })
      
      ElMessage.success(`找到 ${result.killChains.length} 条杀伤链`)
      
      // 重绘画布（显示所有edges）
      drawBattlefield()
    } else {
      killChains.value = []
      addLog(`✗ 未找到杀伤链`, 'warning')
      addLog(`原因: ${result.reason}`, 'warning')
      
      // 显示详细分析
      if (result.analysis) {
        addLog(`━━ 网络状态分析 ━━`, 'info')
        Object.entries(result.analysis.networkStatus || {}).forEach(([key, value]) => {
          addLog(`  ${key}: ${value}`, 'info')
        })
        
        if (result.analysis.suggestions) {
          addLog(`━━ 建议 ━━`, 'info')
          result.analysis.suggestions.forEach(s => {
            addLog(`  • ${s}`, 'info')
          })
        }
      }
      
      ElMessage.warning(result.reason)
    }
    
    addLog(`━━━━━━━━━━━━━━━━━━`, 'info')
    
  } catch (error) {
    console.error('搜索错误:', error)
    ElMessage.error('搜索过程出错: ' + error.message)
  } finally {
    searching.value = false
  }
}

// 选择杀伤链
const selectChain = (chainId) => {
  selectedChainId.value = chainId
  drawBattlefield()
  
  const chain = killChains.value.find(c => c.id === chainId)
  if (chain) {
    addLog(`选中杀伤链: ${chain.nodeDetails.map(n => n.name).join(' → ')}`, 'success')
  }
}

// 执行打击
const executeStrike = () => {
  const chain = killChains.value.find(c => c.id === selectedChainId.value)
  if (!chain) return
  
  const target = displayNodes.value.find(n => n.id === targetNodeId.value)
  if (!target || target.hp <= 0) {
    ElMessage.warning('目标已被摧毁')
    return
  }
  
  addLog(`━━━━ 执行打击 ━━━━`, 'danger')
  addLog(`使用杀伤链: ${chain.nodeDetails.map(n => n.name).join(' → ')}`, 'info')
  addLog(`杀伤链效能: ${(chain.effectiveness * 100).toFixed(1)}%`, 'info')
  
  // 计算伤害（基于杀伤链效能）
  const baseDamage = 30
  const damage = Math.floor(baseDamage * (1 + chain.effectiveness))
  
  // 判定是否命中（基于效能）
  const hit = Math.random() < chain.effectiveness
  
  if (hit) {
    const newHp = Math.max(0, target.hp - damage)
    networkStore.updateNode(target.id, { hp: newHp })

    addLog(`✓ 打击命中! 造成 ${damage} 点伤害`, 'danger')
    addLog(`目标剩余HP: ${newHp}`, 'info')

    // ⭐ 触发事件驱动移动：目标受到攻击
    if (movementEnabled.value && newHp > 0) {
      const striker = chain.nodeDetails.find(n => n.baseType === 'striker')
      if (striker) {
        initNodeMovement(target)
        handleCombatEvent('attacked', target, { attacker: striker })
      }
    }

    if (newHp === 0) {
      addLog(`✓✓ 目标已摧毁!`, 'success')
      ElMessage.success(`${target.name} 已被摧毁！`)
    }

    attackCount.value++
    const previousHits = Math.round((hitRate.value / 100) * (attackCount.value - 1))
    hitRate.value = ((previousHits + 1) / attackCount.value) * 100
  } else {
    addLog(`✗ 打击脱靶`, 'warning')
    attackCount.value++
    const previousHits = Math.round((hitRate.value / 100) * (attackCount.value - 1))
    hitRate.value = (previousHits / attackCount.value) * 100
  }
  
  addLog(`━━━━━━━━━━━━━━━━━━`, 'info')
  
  drawBattlefield()
}


// 切换推演
const toggleSimulation = () => {
  if (simStatus.value === 'idle') {
    simStatus.value = 'running'
    addLog('推演开始', 'success')
    ElMessage.success('推演已启动')
  } else {
    simStatus.value = 'idle'
    addLog('推演暂停', 'warning')
  }
}

// 重置
const resetAll = () => {
  networkStore.nodes.forEach(node => {
    networkStore.updateNode(node.id, { hp: 100 })
  })

  attackCount.value = 0
  hitRate.value = 100
  selectedNodeId.value = null
  targetNodeId.value = null
  simStatus.value = 'idle'
  
  // 清空杀伤链搜索结果
  killChains.value = []
  selectedChainId.value = null
  showChainList.value = false

  drawBattlefield()
  addLog('系统已重置', 'info')
  ElMessage.info('已重置')
}

// 自动排列
const autoArrange = () => {
  const canvas = battleCanvas.value
  if (!canvas) return

  const worldWidth = canvas.width / scale.value
  const blueX = worldWidth * 0.25
  const redX = worldWidth * 0.75
  const spacing = 120

  blueNodes.value.forEach((node, idx) => {
    const y = 100 + idx * spacing
    networkStore.updateNode(node.id, { x: blueX, y })
  })

  redNodes.value.forEach((node, idx) => {
    const y = 100 + idx * spacing
    networkStore.updateNode(node.id, { x: redX, y })
  })

  drawBattlefield()
  addLog('节点已自动排列', 'info')
  ElMessage.success('节点已自动排列')
}

// 全屏
const toggleFullscreen = () => {
  const elem = canvasWrapper.value

  if (!document.fullscreenElement) {
    elem.requestFullscreen().then(() => {
      isFullscreen.value = true
      setTimeout(() => initCanvas(), 100)
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      setTimeout(() => initCanvas(), 100)
    })
  }
}

// 窗口大小改变时重绘
const handleResize = () => {
  if (battleCanvas.value) {
    initCanvas()
  }
}

onMounted(async () => {
  await nextTick()

  if (networkStore.isEmpty) {
    addLog('等待导入网络数据...', 'warning')
  } else {
    initCanvas()
    fitToScreen()
    addLog('推演系统初始化完成', 'success')
  }

  // 禁用右键菜单
  if (battleCanvas.value) {
    battleCanvas.value.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // 清理移动系统
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (ctx) {
    ctx = null
  }
})
</script>

<style scoped>
/* 样式与之前相同，这里省略 */
.simulation-page {
  width: 100%;
  height: calc(100vh - 60px);
  padding: 0;
  overflow: hidden;
}

.empty-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simulation-content {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.control-panel {
  width: 300px;
  flex-shrink: 0;
}

.control-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.control-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.control-content {
  padding: 16px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.battlefield-container {
  flex: 1;
  min-height: 0;
}

.battlefield-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.battlefield-card :deep(.el-card__body) {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.canvas-wrapper canvas {
  flex: 1;
  width: 100%;
  border: 2px solid #DCDFE6;
  border-radius: 4px;
  background: #fafafa;
  cursor: crosshair;
  display: block;
}

.canvas-tips {
  margin-top: 8px;
  text-align: center;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 4px;
}

.log-container {
  height: 160px;
  flex-shrink: 0;
}

.log-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.log-content {
  padding: 8px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.network-info {
  margin-bottom: 16px;
}

.network-stats {
  font-size: 12px;
}

.control-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #EBEEF5;
}

.control-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.view-controls {
  margin-bottom: 8px;
}

.direction-control {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.log-line {
  padding: 4px 8px;
  margin-bottom: 4px;
  border-left: 3px solid transparent;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
}

.log-info {
  border-left-color: #409EFF;
  background: #ecf5ff;
}

.log-success {
  border-left-color: #67C23A;
  background: #f0f9ff;
}

.log-warning {
  border-left-color: #E6A23C;
  background: #fdf6ec;
}

.log-danger {
  border-left-color: #F56C6C;
  background: #fef0f0;
}

.kill-chain-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-item {
  padding: 12px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.chain-item:hover {
  border-color: #409EFF;
  background: #ECF5FF;
}

.chain-item.chain-selected {
  border-color: #FFD700;
  background: #FFFBF0;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.chain-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chain-path {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  word-break: break-all;
}
</style>