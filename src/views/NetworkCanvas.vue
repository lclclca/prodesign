<template>
  <div class="network-canvas-page">
    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <h2>作战网络构建</h2>
        <el-divider direction="vertical" />
        <span class="project-name">{{ currentProject.name || '未命名项目' }}</span>
        <el-divider direction="vertical" />
        
        <!-- 网络模式切换 -->
        <el-radio-group v-model="networkMode" size="default" @change="handleNetworkModeChange">
          <el-radio-button value="friendly">我方网络</el-radio-button>
          <el-radio-button value="enemy">敌方网络</el-radio-button>
          <el-radio-button value="mixed">混合网络</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleSaveProject" :icon="Document" type="primary">
          保存项目
        </el-button>
        <el-button @click="handleEvaluate" :icon="DataAnalysis" type="success">
          评估网络
        </el-button>
        <el-button @click="handleClearCanvas" :icon="Delete" type="danger">
          清空画布
        </el-button>
      </div>
    </div>

    <div class="canvas-container">
      <!-- 左侧工具面板 -->
      <div class="left-panel">
        <el-card class="tool-card">
          <template #header>
            <div class="card-header">
              <span>节点类型</span>
            </div>
          </template>
          <div class="node-types">
            <div
              v-for="nodeType in filteredNodeTypes"
              :key="nodeType.type"
              class="node-type-item"
              :class="{ active: selectedNodeType === nodeType.type }"
              @click="selectNodeType(nodeType.type)"
            >
              <div class="node-icon" :style="{ backgroundColor: nodeType.color }">
                <component :is="nodeType.icon" />
              </div>
              <div class="node-info">
                <div class="node-name">
                  {{ nodeType.name }}
                  <el-tag :type="nodeType.faction === 'blue' ? 'primary' : 'danger'" size="small" style="margin-left: 5px;">
                    {{ nodeType.faction === 'blue' ? '我方' : '敌方' }}
                  </el-tag>
                </div>
                <div class="node-desc">{{ nodeType.description }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="tool-card">
          <template #header>
            <div class="card-header">
              <span>操作工具</span>
            </div>
          </template>
          <div class="tools">
            <el-button 
              @click="handleAutoConnect" 
              :icon="Connection"
              type="primary" 
              :loading="isConnecting"
              style="width: 100%; margin-bottom: 10px;"
            >
              自动生成连接
            </el-button>
            <el-button 
              @click="toggleDeleteMode" 
              :icon="Delete"
              :type="deleteMode ? 'danger' : 'default'"
              style="width: 100%; margin-bottom: 10px;"
            >
              {{ deleteMode ? '退出删除模式' : '删除模式' }}
            </el-button>
            <el-divider />
            <div class="stats">
              <div class="stat-item">
                <span class="label">节点总数：</span>
                <span class="value">{{ visibleNodes.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">我方节点：</span>
                <span class="value" style="color: #409EFF;">{{ friendlyNodeCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">敌方节点：</span>
                <span class="value" style="color: #F56C6C;">{{ enemyNodeCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">连接数量：</span>
                <span class="value">{{ visibleEdges.length }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-area" ref="canvasArea">
        <svg
          ref="svgCanvas"
          class="network-svg"
          @click="handleCanvasClick"
          @contextmenu.prevent
        >
          <!-- 定义箭头标记 -->
          <defs>
            <marker
              id="arrowhead-detection-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3498db" />
            </marker>
            <marker
              id="arrowhead-communication-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#2ecc71" />
            </marker>
            <marker
              id="arrowhead-strike-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#e74c3c" />
            </marker>
            <marker
              id="arrowhead-detection-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#c0392b" />
            </marker>
            <marker
              id="arrowhead-communication-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#e67e22" />
            </marker>
            <marker
              id="arrowhead-strike-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#8e44ad" />
            </marker>
            <marker
              id="arrowhead-manual"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#95a5a6" />
            </marker>
          </defs>

          <!-- 绘制连接线 -->
          <g class="edges-layer">
            <g
              v-for="edge in visibleEdges"
              :key="edge.id"
              class="edge"
              @click.stop="handleEdgeClick(edge)"
            >
              <line
                :x1="getNodeById(edge.source)?.x"
                :y1="getNodeById(edge.source)?.y"
                :x2="getNodeById(edge.target)?.x"
                :y2="getNodeById(edge.target)?.y"
                :stroke="getEdgeColor(edge)"
                :stroke-width="deleteMode ? '4' : '2'"
                :stroke-dasharray="edge.crossFaction ? '5,5' : 'none'"
                :marker-end="getEdgeMarker(edge)"
                :class="{ 'edge-deletable': deleteMode }"
              />
              <text
                :x="(getNodeById(edge.source)?.x + getNodeById(edge.target)?.x) / 2"
                :y="(getNodeById(edge.source)?.y + getNodeById(edge.target)?.y) / 2"
                text-anchor="middle"
                class="edge-label"
                :fill="getEdgeColor(edge)"
              >
                {{ edge.label }}
              </text>
            </g>
          </g>

          <!-- 绘制节点 -->
          <g class="nodes-layer">
            <g
              v-for="node in visibleNodes"
              :key="node.id"
              class="node"
              :transform="`translate(${node.x}, ${node.y})`"
              @click.stop="handleNodeClick(node)"
              @contextmenu.prevent="handleNodeRightClick(node, $event)"
            >
              <!-- 节点半径圈 -->
              <circle
                v-if="node.baseType === 'sensor'"
                :r="getNodeTypeConfig(node.type).detection_radius"
                :fill="getNodeTypeConfig(node.type).color"
                opacity="0.1"
                class="node-radius"
              />
              <circle
                v-if="node.baseType === 'command'"
                :r="getNodeTypeConfig(node.type).communication_radius"
                :fill="getNodeTypeConfig(node.type).color"
                opacity="0.1"
                class="node-radius"
              />
              <circle
                v-if="node.baseType === 'striker'"
                :r="getNodeTypeConfig(node.type).strike_radius"
                :fill="getNodeTypeConfig(node.type).color"
                opacity="0.1"
                class="node-radius"
              />

              <!-- 节点主体 -->
              <circle
                r="20"
                :fill="getNodeTypeConfig(node.type).color"
                stroke="#fff"
                stroke-width="3"
                class="node-body"
                :class="{ 'node-selected': selectedNode?.id === node.id }"
              />
              
              <!-- 节点图标 -->
              <text
                text-anchor="middle"
                dy="0.3em"
                fill="#fff"
                font-size="16"
                class="node-icon-text"
              >
                {{ getNodeIconText(node.baseType) }}
              </text>

              <!-- 阵营标识小圆点 -->
              <circle
                cx="15"
                cy="-15"
                r="6"
                :fill="node.faction === 'blue' ? '#409EFF' : '#F56C6C'"
                stroke="#fff"
                stroke-width="2"
                class="faction-indicator"
              />

              <!-- 节点标签 -->
              <text
                text-anchor="middle"
                dy="35"
                fill="#333"
                font-size="12"
                class="node-label"
              >
                {{ node.label }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- 右侧属性面板 -->
      <div class="right-panel">
        <el-card v-if="selectedNode" class="property-card">
          <template #header>
            <div class="card-header">
              <span>节点属性</span>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDeleteNode(selectedNode)"
              >
                删除
              </el-button>
            </div>
          </template>
          <el-form label-width="80px" label-position="left">
            <el-form-item label="节点ID">
              <el-input v-model="selectedNode.id" disabled />
            </el-form-item>
            <el-form-item label="阵营">
              <el-tag :type="selectedNode.faction === 'blue' ? 'primary' : 'danger'">
                {{ selectedNode.faction === 'blue' ? '我方' : '敌方' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="节点类型">
              <el-tag :color="getNodeTypeConfig(selectedNode.type).color">
                {{ getNodeTypeConfig(selectedNode.type).name }}
              </el-tag>
            </el-form-item>
            <el-form-item label="节点标签">
              <el-input v-model="selectedNode.label" @change="updateNodeLabel" />
            </el-form-item>
            <el-form-item label="X坐标">
              <el-input-number v-model="selectedNode.x" disabled />
            </el-form-item>
            <el-form-item label="Y坐标">
              <el-input-number v-model="selectedNode.y" disabled />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-else class="property-card">
          <template #header>
            <div class="card-header">
              <span>使用说明</span>
            </div>
          </template>
          <div class="instructions">
            <el-alert
              title="操作提示"
              type="info"
              :closable="false"
              style="margin-bottom: 15px;"
            >
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>在顶部选择网络模式（我方/敌方/混合）</li>
                <li>在左侧选择节点类型</li>
                <li>点击画布添加节点</li>
                <li>点击"自动生成连接"建立网络</li>
                <li>点击"评估网络"查看分析结果</li>
                <li>右键点击节点可删除</li>
              </ol>
            </el-alert>
            
            <div class="legend">
              <h4>网络模式说明</h4>
              <div class="mode-desc">
                <p><strong>我方网络：</strong>只显示我方（蓝方）节点和连接</p>
                <p><strong>敌方网络：</strong>只显示敌方（红方）节点和连接</p>
                <p><strong>混合网络：</strong>显示双方节点，包含对抗连接</p>
              </div>
              
              <h4 style="margin-top: 20px;">节点类型说明</h4>
              <div class="legend-item" v-for="type in allNodeTypes.filter(t => t.faction === 'blue')" :key="type.type">
                <div class="legend-icon" :style="{ backgroundColor: type.color }"></div>
                <div class="legend-text">
                  <div class="legend-name">{{ type.name }}</div>
                  <div class="legend-desc">{{ type.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 评估结果对话框 -->
    <el-dialog
      v-model="showEvaluationDialog"
      title="网络评估报告"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="evaluationResult" class="evaluation-result">
        <!-- 综合得分 -->
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="24">
            <el-card class="score-card">
              <div class="score-content">
                <div class="score-label">综合评分</div>
                <div class="score-value" :style="{ color: getScoreColor(evaluationResult.overall_score) }">
                  {{ evaluationResult.overall_score.toFixed(1) }}
                </div>
                <div class="score-desc">{{ getScoreLevel(evaluationResult.overall_score) }}</div>
              </div>
              <el-progress
                :percentage="evaluationResult.overall_score"
                :color="getScoreColor(evaluationResult.overall_score)"
                :stroke-width="20"
              />
            </el-card>
          </el-col>
        </el-row>

        <!-- 各项指标 -->
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="8" v-for="(value, key) in evaluationResult.metrics" :key="key">
            <el-card class="metric-card">
              <el-statistic :title="getMetricName(key)" :value="value.toFixed(2)">
                <template #suffix>
                  <el-progress
                    type="circle"
                    :percentage="value * 100"
                    :width="60"
                    :stroke-width="6"
                  />
                </template>
              </el-statistic>
            </el-card>
          </el-col>
        </el-row>

        <!-- 问题列表 -->
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span>发现的问题</span>
          </template>
          <el-empty v-if="!evaluationResult.vulnerabilities?.length" description="未发现明显问题" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(issue, index) in evaluationResult.vulnerabilities"
              :key="index"
              :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'"
            >
              <div class="issue-item">
                <div class="issue-title">
                  <el-tag :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'">
                    {{ issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '中等' : '轻微' }}
                  </el-tag>
                  <span style="margin-left: 10px;">{{ issue.title }}</span>
                </div>
                <div class="issue-desc">{{ issue.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 优化建议 -->
        <el-card>
          <template #header>
            <span>优化建议</span>
          </template>
          <el-empty v-if="!evaluationResult.suggestions?.length" description="暂无优化建议" />
          <div v-else class="suggestions-list">
            <el-alert
              v-for="(suggestion, index) in evaluationResult.suggestions"
              :key="index"
              :title="suggestion.title"
              :type="suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'info'"
              :closable="false"
              style="margin-bottom: 10px;"
            >
              <div>{{ suggestion.description }}</div>
              <div style="margin-top: 5px; font-size: 12px; opacity: 0.8;">
                预期效果：{{ suggestion.expected_effect }}
              </div>
            </el-alert>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  DataAnalysis,
  Delete,
  Connection,
  Compass,
  Monitor,
  Aim
} from '@element-plus/icons-vue'
import { generateConnections } from '@/utils/networkGenerator'
import { evaluateNetwork } from '@/utils/networkEvaluator'

// 网络模式：friendly(我方), enemy(敌方), mixed(混合)
const networkMode = ref('mixed')

// 所有节点类型定义（包含敌我双方）
const allNodeTypes = ref([
  // 我方节点
  {
    type: 'sensor_blue',
    baseType: 'sensor',
    faction: 'blue',
    name: '我方传感器',
    description: '探测目标',
    color: '#3498db',
    icon: Compass,
    detection_radius: 150,
    communication_radius: 100
  },
  {
    type: 'command_blue',
    baseType: 'command',
    faction: 'blue',
    name: '我方指挥中心',
    description: '指挥控制',
    color: '#2ecc71',
    icon: Monitor,
    detection_radius: 0,
    communication_radius: 200
  },
  {
    type: 'striker_blue',
    baseType: 'striker',
    faction: 'blue',
    name: '我方打击单元',
    description: '火力打击',
    color: '#1abc9c',
    icon: Aim,
    detection_radius: 0,
    communication_radius: 80,
    strike_radius: 120
  },
  // 敌方节点
  {
    type: 'sensor_red',
    baseType: 'sensor',
    faction: 'red',
    name: '敌方传感器',
    description: '探测目标',
    color: '#e74c3c',
    icon: Compass,
    detection_radius: 150,
    communication_radius: 100
  },
  {
    type: 'command_red',
    baseType: 'command',
    faction: 'red',
    name: '敌方指挥中心',
    description: '指挥控制',
    color: '#c0392b',
    icon: Monitor,
    detection_radius: 0,
    communication_radius: 200
  },
  {
    type: 'striker_red',
    baseType: 'striker',
    faction: 'red',
    name: '敌方打击单元',
    description: '火力打击',
    color: '#e67e22',
    icon: Aim,
    detection_radius: 0,
    communication_radius: 80,
    strike_radius: 120
  }
])

// 根据网络模式过滤节点类型
const filteredNodeTypes = computed(() => {
  if (networkMode.value === 'friendly') {
    return allNodeTypes.value.filter(t => t.faction === 'blue')
  } else if (networkMode.value === 'enemy') {
    return allNodeTypes.value.filter(t => t.faction === 'red')
  } else {
    return allNodeTypes.value
  }
})

// 当前项目信息
const currentProject = ref({
  name: '新建作战网络',
  id: null
})

// 画布状态
const nodes = ref([])
const edges = ref([])
const selectedNodeType = ref('sensor_blue')
const selectedNode = ref(null)
const deleteMode = ref(false)
const isConnecting = ref(false)
const nodeCounter = ref(0)
const edgeCounter = ref(0)

// 画布引用
const svgCanvas = ref(null)
const canvasArea = ref(null)

// 评估结果
const showEvaluationDialog = ref(false)
const evaluationResult = ref(null)

// 根据网络模式过滤显示的节点
const visibleNodes = computed(() => {
  if (networkMode.value === 'friendly') {
    return nodes.value.filter(n => n.faction === 'blue')
  } else if (networkMode.value === 'enemy') {
    return nodes.value.filter(n => n.faction === 'red')
  } else {
    return nodes.value
  }
})

// 根据网络模式过滤显示的连接
const visibleEdges = computed(() => {
  return edges.value.filter(edge => {
    const sourceNode = getNodeById(edge.source)
    const targetNode = getNodeById(edge.target)
    
    if (!sourceNode || !targetNode) return false
    
    if (networkMode.value === 'friendly') {
      return sourceNode.faction === 'blue' && targetNode.faction === 'blue'
    } else if (networkMode.value === 'enemy') {
      return sourceNode.faction === 'red' && targetNode.faction === 'red'
    } else {
      return true // 混合模式显示所有连接
    }
  })
})

// 统计节点数量
const friendlyNodeCount = computed(() => nodes.value.filter(n => n.faction === 'blue').length)
const enemyNodeCount = computed(() => nodes.value.filter(n => n.faction === 'red').length)

// 网络模式切换
const handleNetworkModeChange = (mode) => {
  ElMessage.success(`已切换到${mode === 'friendly' ? '我方' : mode === 'enemy' ? '敌方' : '混合'}网络模式`)
  
  // 切换模式时，自动选择对应阵营的第一个节点类型
  if (mode === 'friendly') {
    selectedNodeType.value = 'sensor_blue'
  } else if (mode === 'enemy') {
    selectedNodeType.value = 'sensor_red'
  }
  
  // 清除当前选中的节点（如果该节点在当前模式下不可见）
  if (selectedNode.value && !visibleNodes.value.find(n => n.id === selectedNode.value.id)) {
    selectedNode.value = null
  }
}

// 选择节点类型
const selectNodeType = (type) => {
  selectedNodeType.value = type
  deleteMode.value = false
}

// 画布点击事件 - 添加节点
const handleCanvasClick = (event) => {
  if (deleteMode.value) return

  const rect = svgCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const typeConfig = getNodeTypeConfig(selectedNodeType.value)
  const newNode = {
    id: `node_${nodeCounter.value++}`,
    type: selectedNodeType.value,
    baseType: typeConfig.baseType,
    faction: typeConfig.faction,
    x: x,
    y: y,
    label: `${typeConfig.name}${nodeCounter.value}`
  }

  nodes.value.push(newNode)
  ElMessage.success(`已添加 ${typeConfig.name}`)
}

// 节点点击事件
const handleNodeClick = (node) => {
  if (deleteMode.value) {
    handleDeleteNode(node)
  } else {
    selectedNode.value = node
  }
}

// 节点右键事件
const handleNodeRightClick = (node, event) => {
  ElMessageBox.confirm(
    `确定要删除节点 "${node.label}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    handleDeleteNode(node)
  }).catch(() => {})
}

// 删除节点
const handleDeleteNode = (node) => {
  // 删除相关的连接
  edges.value = edges.value.filter(
    edge => edge.source !== node.id && edge.target !== node.id
  )
  
  // 删除节点
  const index = nodes.value.findIndex(n => n.id === node.id)
  if (index > -1) {
    nodes.value.splice(index, 1)
    ElMessage.success('节点已删除')
    if (selectedNode.value?.id === node.id) {
      selectedNode.value = null
    }
  }
}

// 连接线点击事件
const handleEdgeClick = (edge) => {
  if (deleteMode.value) {
    ElMessageBox.confirm(
      '确定要删除这条连接吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const index = edges.value.findIndex(e => e.id === edge.id)
      if (index > -1) {
        edges.value.splice(index, 1)
        ElMessage.success('连接已删除')
      }
    }).catch(() => {})
  }
}

// 自动生成连接
const handleAutoConnect = async () => {
  if (nodes.value.length < 2) {
    ElMessage.warning('至少需要2个节点才能生成连接')
    return
  }

  isConnecting.value = true
  try {
    // 使用网络生成算法
    const newEdges = await generateConnections(nodes.value, allNodeTypes.value, networkMode.value)
    
    // 重置边的ID
    edgeCounter.value = 0
    edges.value = newEdges.map(edge => ({
      ...edge,
      id: `edge_${edgeCounter.value++}`
    }))

    ElMessage.success(`成功生成 ${edges.value.length} 条连接`)
  } catch (error) {
    ElMessage.error('生成连接失败：' + error.message)
  } finally {
    isConnecting.value = false
  }
}

// 评估网络
const handleEvaluate = async () => {
  if (nodes.value.length === 0) {
    ElMessage.warning('画布中没有节点，无法评估')
    return
  }

  try {
    evaluationResult.value = await evaluateNetwork(
      nodes.value, 
      edges.value, 
      allNodeTypes.value,
      networkMode.value
    )
    showEvaluationDialog.value = true
  } catch (error) {
    ElMessage.error('评估失败：' + error.message)
  }
}

// 保存项目
const handleSaveProject = () => {
  const projectData = {
    name: currentProject.value.name,
    nodes: nodes.value,
    edges: edges.value,
    networkMode: networkMode.value,
    timestamp: new Date().toISOString()
  }

  // 保存到 localStorage
  localStorage.setItem('currentProject', JSON.stringify(projectData))
  ElMessage.success('项目已保存到本地')
}

// 清空画布
const handleClearCanvas = () => {
  ElMessageBox.confirm(
    '确定要清空画布吗？所有节点和连接都会被删除。',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    nodeCounter.value = 0
    edgeCounter.value = 0
    ElMessage.success('画布已清空')
  }).catch(() => {})
}

// 切换删除模式
const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value
  if (deleteMode.value) {
    ElMessage.info('已进入删除模式，点击节点或连接进行删除')
  }
}

// 更新节点标签
const updateNodeLabel = () => {
  ElMessage.success('标签已更新')
}

// 辅助函数
const getNodeById = (id) => {
  return nodes.value.find(node => node.id === id)
}

const getNodeTypeConfig = (type) => {
  return allNodeTypes.value.find(t => t.type === type) || allNodeTypes.value[0]
}

const getNodeIconText = (baseType) => {
  const icons = {
    sensor: '◎',
    command: '★',
    striker: '▲'
  }
  return icons[baseType] || '●'
}

const getEdgeColor = (edge) => {
  const sourceNode = getNodeById(edge.source)
  const targetNode = getNodeById(edge.target)
  
  if (!sourceNode || !targetNode) return '#95a5a6'
  
  // 如果是跨阵营连接，使用特殊颜色
  if (sourceNode.faction !== targetNode.faction) {
    if (edge.type === 'detection') return '#e67e22'
    if (edge.type === 'strike') return '#8e44ad'
    return '#95a5a6'
  }
  
  // 同阵营连接
  const colors = {
    detection: sourceNode.faction === 'blue' ? '#3498db' : '#c0392b',
    communication: sourceNode.faction === 'blue' ? '#2ecc71' : '#e67e22',
    strike: sourceNode.faction === 'blue' ? '#e74c3c' : '#8e44ad',
    manual: '#95a5a6'
  }
  return colors[edge.type] || '#95a5a6'
}

const getEdgeMarker = (edge) => {
  const sourceNode = getNodeById(edge.source)
  const faction = sourceNode?.faction === 'blue' ? 'blue' : 'red'
  
  if (edge.type === 'manual') return 'url(#arrowhead-manual)'
  return `url(#arrowhead-${edge.type}-${faction})`
}

const getMetricName = (key) => {
  const names = {
    connectivity: '连通性',
    coverage: '覆盖率',
    redundancy: '冗余度',
    robustness: '鲁棒性',
    efficiency: '效率',
    reliability: '可靠性'
  }
  return names[key] || key
}

const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getScoreLevel = (score) => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较差'
}

// 组件挂载时加载项目
onMounted(() => {
  // 尝试从 localStorage 加载项目
  const savedProject = localStorage.getItem('currentProject')
  if (savedProject) {
    try {
      const data = JSON.parse(savedProject)
      nodes.value = data.nodes || []
      edges.value = data.edges || []
      networkMode.value = data.networkMode || 'mixed'
      currentProject.value.name = data.name || '新建作战网络'
      
      // 更新计数器
      nodeCounter.value = nodes.value.length
      edgeCounter.value = edges.value.length
      
      ElMessage.success('已加载上次保存的项目')
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.network-canvas-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.top-toolbar {
  height: 60px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 15px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .project-name {
      font-size: 14px;
      color: #909399;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 10px;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  padding: 15px;
  background: #f5f7fa;
  overflow-y: auto;

  .tool-card {
    margin-bottom: 15px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
  }

  .node-types {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .node-type-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      background: #f9fafc;

      &:hover {
        background: #ecf5ff;
        border-color: #d9ecff;
      }

      &.active {
        background: #ecf5ff;
        border-color: #409eff;
      }

      .node-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 20px;
        margin-right: 12px;
      }

      .node-info {
        flex: 1;

        .node-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
        }

        .node-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .tools {
    .stats {
      .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #606266;
          font-size: 14px;
        }

        .value {
          color: #409eff;
          font-weight: 500;
          font-size: 16px;
        }
      }
    }
  }
}

.canvas-area {
  flex: 1;
  background: #fff;
  position: relative;
  overflow: hidden;

  .network-svg {
    width: 100%;
    height: 100%;
    cursor: crosshair;

    .node {
      cursor: pointer;
      transition: all 0.2s;

      &:hover .node-body {
        filter: brightness(1.1);
        transform: scale(1.1);
      }

      .node-body {
        transition: all 0.2s;

        &.node-selected {
          stroke: #409eff;
          stroke-width: 4;
        }
      }

      .node-radius {
        pointer-events: none;
      }
      
      .faction-indicator {
        pointer-events: none;
      }
    }

    .edge {
      cursor: pointer;

      line {
        transition: stroke-width 0.2s;

        &:hover {
          stroke-width: 4 !important;
        }

        &.edge-deletable {
          cursor: pointer;

          &:hover {
            stroke-width: 6 !important;
          }
        }
      }

      .edge-label {
        font-size: 11px;
        pointer-events: none;
        user-select: none;
      }
    }
  }
}

.right-panel {
  width: 320px;
  padding: 15px;
  background: #f5f7fa;
  overflow-y: auto;

  .property-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
  }

  .instructions {
    .mode-desc {
      background: #f9fafc;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      
      p {
        margin: 8px 0;
        font-size: 13px;
        line-height: 1.6;
        
        strong {
          color: #409eff;
        }
      }
    }
    
    .legend {
      margin-top: 20px;

      h4 {
        margin-bottom: 12px;
        font-size: 14px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .legend-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .legend-text {
          flex: 1;

          .legend-name {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 2px;
          }

          .legend-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

.evaluation-result {
  .score-card {
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;

    .score-content {
      margin-bottom: 20px;

      .score-label {
        font-size: 16px;
        opacity: 0.9;
      }

      .score-value {
        font-size: 64px;
        font-weight: bold;
        margin: 10px 0;
      }

      .score-desc {
        font-size: 18px;
      }
    }
  }

  .metric-card {
    text-align: center;

    :deep(.el-statistic__content) {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
    }
  }

  .issue-item {
    .issue-title {
      display: flex;
      align-items: center;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .issue-desc {
      color: #606266;
      font-size: 13px;
    }
  }

  .suggestions-list {
    :deep(.el-alert__description) {
      margin-top: 8px;
    }
  }
}
</style>
