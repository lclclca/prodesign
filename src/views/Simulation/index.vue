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
      originalType: node.type
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

  if (e.button === 2) {
    e.preventDefault()
    isDragging.value = true
    dragStartX.value = mouseX
    dragStartY.value = mouseY
    lastOffsetX.value = offsetX.value
    lastOffsetY.value = offsetY.value
    battleCanvas.value.style.cursor = 'grabbing'
    return
  }

  if (e.button === 0) {
    const worldPos = screenToWorld(mouseX, mouseY)

    blueNodes.value.forEach(node => {
      const dist = Math.sqrt((worldPos.x - node.x) ** 2 + (worldPos.y - node.y) ** 2)
      if (dist < 28 && node.hp > 0) {
        selectedNodeId.value = node.id
        drawBattlefield()
        addLog(`选中 ${node.name}`)
      }
    })
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return

  const rect = battleCanvas.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  offsetX.value = lastOffsetX.value + (mouseX - dragStartX.value)
  offsetY.value = lastOffsetY.value + (mouseY - dragStartY.value)

  drawBattlefield()
}

const handleMouseUp = () => {
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