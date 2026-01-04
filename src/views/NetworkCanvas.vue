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
        <!-- 导入导出按钮 -->
        <el-button @click="handleExportNetwork" :icon="Download">
          导出网络
        </el-button>
        <el-button @click="handleImportNetwork" :icon="Upload">
          导入网络
        </el-button>
        <el-button @click="handleSaveProject" :icon="Document" type="primary">
          保存项目
        </el-button>
        <el-button @click="handleEvaluate" :icon="DataAnalysis" type="success">
          评估网络
        </el-button>
        <el-button @click="goToSimulation" type="warning" style="margin-left: 10px;">
          🎯 前往推演
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
                <!-- 新增：添加节点模式切换 -->
    <el-divider content-position="left">添加节点模式</el-divider>
    <el-radio-group v-model="addNodeMode" size="small" style="width: 100%; margin-bottom: 15px;">
      <el-radio-button value="quick" style="width: 50%;">
        <span style="font-size: 12px;">快速添加</span>
      </el-radio-button>
      <el-radio-button value="from-equipment" style="width: 50%;">
        <span style="font-size: 12px;">选择装备</span>
      </el-radio-button>
    </el-radio-group>

    <!-- 提示信息 -->
    <el-alert
      v-if="addNodeMode === 'from-equipment'"
      type="info"
      :closable="false"
      style="margin-bottom: 10px;"
    >
      <template #default>
        <div style="font-size: 12px;">
          点击画布选择装备放置
        </div>
      </template>
    </el-alert>

    <el-divider />
            <!-- 操作模式切换 -->
            <el-radio-group v-model="operationMode" size="small" style="width: 100%; margin-bottom: 10px;">
              <el-radio-button value="add" style="flex: 1;">添加</el-radio-button>
              <el-radio-button value="drag" style="flex: 1;">拖拽</el-radio-button>
              <el-radio-button value="connect" style="flex: 1;">连接</el-radio-button>
            </el-radio-group>

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

            <!-- 视图控制 -->
            <el-divider content-position="left">视图控制</el-divider>
            <el-button-group style="width: 100%; margin-bottom: 10px;">
              <el-button @click="handleZoomIn" :icon="ZoomIn" style="flex: 1;">放大</el-button>
              <el-button @click="handleZoomOut" :icon="ZoomOut" style="flex: 1;">缩小</el-button>
              <el-button @click="handleResetView" :icon="Refresh" style="flex: 1;">重置</el-button>
            </el-button-group>

            <!-- 网格开关 -->
            <el-checkbox v-model="showGrid" @change="handleGridToggle" style="margin-bottom: 10px;">
              显示网格背景
            </el-checkbox>

            <!-- 布局算法 -->
            <el-divider content-position="left">自动布局</el-divider>
            <el-select v-model="selectedLayout" placeholder="选择布局" style="width: 100%; margin-bottom: 10px;">
              <el-option label="圆形布局" value="circle" />
              <el-option label="网格布局" value="grid" />
              <el-option label="层次布局" value="hierarchy" />
              <el-option label="力导向布局" value="force" />
            </el-select>
            <el-button
              @click="applyLayout"
              :icon="Position"
              style="width: 100%; margin-bottom: 10px;"
            >
              应用布局
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
              <div class="stat-item">
                <span class="label">缩放比例：</span>
                <span class="value">{{ (viewTransform.scale * 100).toFixed(0) }}%</span>
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
          :class="{ 'show-grid': showGrid }"
          @click="handleCanvasClick"
          @mousedown="handleCanvasMouseDown"
          @mousemove="handleCanvasMouseMove"
          @mouseup="handleCanvasMouseUp"
          @wheel="handleCanvasWheel"
          @contextmenu.prevent
        >
          <!-- 定义网格图案 -->
          <defs>
            <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="1" fill="#d0d0d0" />
              <circle cx="25" cy="0" r="0.5" fill="#e0e0e0" />
              <circle cx="50" cy="0" r="1" fill="#d0d0d0" />
              <circle cx="0" cy="25" r="0.5" fill="#e0e0e0" />
              <circle cx="25" cy="25" r="0.5" fill="#e0e0e0" />
              <circle cx="50" cy="25" r="0.5" fill="#e0e0e0" />
              <circle cx="0" cy="50" r="1" fill="#d0d0d0" />
              <circle cx="25" cy="50" r="0.5" fill="#e0e0e0" />
              <circle cx="50" cy="50" r="1" fill="#d0d0d0" />
            </pattern>

            <!-- 箭头标记 -->
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

          <!-- 网格背景 -->
          <rect v-if="showGrid" x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid-pattern)" opacity="0.5" />

          <!-- 主画布组 - 应用变换 -->
          <g :transform="getCanvasTransform()">
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
                  :class="{ 'edge-deletable': deleteMode, 'edge-out-of-range': isEdgeOutOfRange(edge) }"
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

              <!-- 正在创建的连接线（预览） -->
              <line
                v-if="connectingEdge.source && connectingEdge.preview"
                :x1="getNodeById(connectingEdge.source)?.x"
                :y1="getNodeById(connectingEdge.source)?.y"
                :x2="connectingEdge.preview.x"
                :y2="connectingEdge.preview.y"
                stroke="#409EFF"
                stroke-width="2"
                stroke-dasharray="5,5"
                class="edge-preview"
              />
            </g>

            <!-- 绘制节点 -->
            <g class="nodes-layer">
              <g
                v-for="node in visibleNodes"
                :key="node.id"
                class="node"
                :class="{
                  'node-dragging': draggingNode?.id === node.id,
                  'node-connecting': connectingEdge.source === node.id
                }"
                :transform="`translate(${node.x}, ${node.y})`"
                @mousedown.stop="handleNodeMouseDown(node, $event)"
                @click.stop="handleNodeClick(node)"
                @contextmenu.prevent="handleNodeRightClick(node, $event)"
              >
                <!-- 节点半径圈 - 根据装备实际范围或默认配置 -->
                <circle
                  v-if="node.baseType === 'sensor'"
                  :r="getNodeRadius(node, 'detection')"
                  :fill="getNodeTypeConfig(node.type).color"
                  opacity="0.1"
                  class="node-radius"
                />
                <circle
                  v-if="node.baseType === 'command'"
                  :r="getNodeRadius(node, 'communication')"
                  :fill="getNodeTypeConfig(node.type).color"
                  opacity="0.1"
                  class="node-radius"
                />
                <circle
                  v-if="node.baseType === 'striker'"
                  :r="getNodeRadius(node, 'strike')"
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
          </g>
        </svg>

        <!-- 视图控制浮动按钮 -->
        <div class="view-controls">
          <el-button-group>
            <el-tooltip content="放大" placement="left">
              <el-button :icon="ZoomIn" @click="handleZoomIn" circle />
            </el-tooltip>
            <el-tooltip content="缩小" placement="left">
              <el-button :icon="ZoomOut" @click="handleZoomOut" circle />
            </el-tooltip>
            <el-tooltip content="适应视图" placement="left">
              <el-button :icon="FullScreen" @click="handleFitView" circle />
            </el-tooltip>
          </el-button-group>
        </div>
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
              <el-input-number v-model="selectedNode.x" :step="10" @change="updateNodePosition" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="Y坐标">
              <el-input-number v-model="selectedNode.y" :step="10" @change="updateNodePosition" style="width: 100%;" />
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
              <div style="margin: 10px 0;">
                <p><strong>添加节点模式：</strong></p>
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>选择节点类型</li>
                  <li>点击画布添加节点</li>
                </ol>

                <p style="margin-top: 10px;"><strong>拖拽模式：</strong></p>
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>切换到"拖拽"模式</li>
                  <li>拖动节点调整位置</li>
                  <li>超出范围的连接会断开</li>
                </ol>

                <p style="margin-top: 10px;"><strong>连接模式：</strong></p>
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>切换到"连接"模式</li>
                  <li>依次点击两个节点</li>
                </ol>

                <p style="margin-top: 10px;"><strong>其他操作：</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>滚轮：缩放视图</li>
                  <li>Shift+拖动：平移画布</li>
                  <li>右键节点：删除节点</li>
                  <li>显示网格：辅助对齐</li>
                </ul>
              </div>
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
    <!-- 新增：装备选择对话框 -->
    <EquipmentSelector
      v-model="showEquipmentSelector"
      :equipments="equipments"
      :network-mode="networkMode"
      @confirm="handleEquipmentSelected"
    />
    <!-- 隐藏的文件输入用于导入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileSelected"
    />

    <!-- 隐藏的下载链接 -->
    <a ref="downloadLink" style="display: none;"></a>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Document,
  DataAnalysis,
  Delete,
  Connection,
  Compass,
  Monitor,
  Aim,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Refresh,
  Position,
  FullScreen
} from '@element-plus/icons-vue'
import { generateConnections } from '@/utils/networkGenerator'
import FloatingLogoutButton from '@/components/Layout/FloatingLogoutButton.vue'
import EquipmentSelector from '@/components/EquipmentSelector.vue'
import { useNetworkStore } from '@/store/modules/network'

// ==================== Store and Router ====================
const networkStore = useNetworkStore()
const router = useRouter()

// ==================== 基础状态 ====================
const networkMode = ref('mixed')
const operationMode = ref('add')
const showGrid = ref(true) // 默认显示网格

// 所有节点类型定义
const allNodeTypes = ref([
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

const filteredNodeTypes = computed(() => {
  if (networkMode.value === 'friendly') {
    return allNodeTypes.value.filter(t => t.faction === 'blue')
  } else if (networkMode.value === 'enemy') {
    return allNodeTypes.value.filter(t => t.faction === 'red')
  } else {
    return allNodeTypes.value
  }
})

const currentProject = ref({
  name: '新建作战网络',
  id: null
})
const equipments = ref([])
const showEquipmentSelector = ref(false)
const addNodeMode = ref('quick') // 'quick' | 'from-equipment'
const pendingNodePosition = ref(null)
const nodes = ref([])
const edges = ref([])
const selectedNodeType = ref('sensor_blue')
const selectedNode = ref(null)
const deleteMode = ref(false)
const isConnecting = ref(false)
const nodeCounter = ref(0)
const edgeCounter = ref(0)

const svgCanvas = ref(null)
const canvasArea = ref(null)
const fileInput = ref(null)
const downloadLink = ref(null)

const showEvaluationDialog = ref(false)
const evaluationResult = ref(null)

// 视图变换状态
const viewTransform = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0
})

// 拖拽状态
const draggingNode = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })

// 连接状态
const connectingEdge = reactive({
  source: null,
  target: null,
  preview: null
})

// 布局状态
const selectedLayout = ref('circle')

// ==================== 计算属性 ====================
const visibleNodes = computed(() => {
  if (networkMode.value === 'friendly') {
    return nodes.value.filter(n => n.faction === 'blue')
  } else if (networkMode.value === 'enemy') {
    return nodes.value.filter(n => n.faction === 'red')
  } else {
    return nodes.value
  }
})

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
      return true
    }
  })
})

const friendlyNodeCount = computed(() => nodes.value.filter(n => n.faction === 'blue').length)
const enemyNodeCount = computed(() => nodes.value.filter(n => n.faction === 'red').length)
// ========== 在方法区域添加（约第850行附近） ==========
// 从装备创建节点
const handleEquipmentSelected = (equipment) => {
  if (!pendingNodePosition.value) return

  // 映射装备类型到节点类型
  const nodeType = `${equipment.type}_${equipment.faction}`
  const typeConfig = getNodeTypeConfig(nodeType)

  if (!typeConfig) {
    ElMessage.error('装备类型映射失败')
    return
  }

  // 创建节点，包含装备信息
  const newNode = {
    id: `node_${nodeCounter.value++}`,
    type: nodeType,
    baseType: equipment.type,
    faction: equipment.faction,
    x: pendingNodePosition.value.x,
    y: pendingNodePosition.value.y,
    label: equipment.name,

    // 保存完整的装备信息
    equipmentId: equipment.id,
    equipmentCode: equipment.code,
    equipmentData: {
      name: equipment.name,
      code: equipment.code,
      manufacturer: equipment.manufacturer,
      detection_range: equipment.detection_range || 0,
      detection_accuracy: equipment.detection_accuracy || 0,
      communication_range: equipment.communication_range || 0,
      command_capacity: equipment.command_capacity || 0,
      strike_range: equipment.strike_range || 0,
      attack_power: equipment.attack_power || 0
    }
  }

  nodes.value.push(newNode)
  ElMessage.success(`已添加装备节点: ${equipment.name}`)

  // 清空待放置位置
  pendingNodePosition.value = null
}
// ==================== 新增：判断边是否超出范围 ====================
const isEdgeOutOfRange = (edge) => {
  const sourceNode = getNodeById(edge.source)
  const targetNode = getNodeById(edge.target)

  if (!sourceNode || !targetNode) return true

  // 跨阵营连接不检查范围
  if (sourceNode.faction !== targetNode.faction) return false

  const dx = targetNode.x - sourceNode.x
  const dy = targetNode.y - sourceNode.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // 根据边类型判断，使用节点的实际范围值
  if (edge.type === 'detection' && sourceNode.baseType === 'sensor') {
    const detectionRadius = getNodeRadius(sourceNode, 'detection')
    return distance > detectionRadius
  } else if (edge.type === 'communication') {
    const communicationRadius = getNodeRadius(sourceNode, 'communication')
    return distance > communicationRadius
  } else if (edge.type === 'strike' && sourceNode.baseType === 'striker') {
    const strikeRadius = getNodeRadius(sourceNode, 'strike')
    return distance > strikeRadius
  }

  return false
}

// 监听节点位置变化，自动清理超出范围的连接
watch(() => nodes.value.map(n => `${n.x},${n.y}`).join('|'), () => {
  if (draggingNode.value) {
    cleanupOutOfRangeEdges()
  }
}, { deep: true })

const cleanupOutOfRangeEdges = () => {
  const edgesToRemove = []

  edges.value.forEach(edge => {
    if (isEdgeOutOfRange(edge)) {
      edgesToRemove.push(edge.id)
    }
  })

  if (edgesToRemove.length > 0) {
    edges.value = edges.value.filter(e => !edgesToRemove.includes(e.id))
  }
}

// ==================== 视图变换方法 ====================
const getCanvasTransform = () => {
  return `translate(${viewTransform.translateX}, ${viewTransform.translateY}) scale(${viewTransform.scale})`
}

const handleZoomIn = () => {
  viewTransform.scale = Math.min(viewTransform.scale * 1.2, 3)
  ElMessage.success(`缩放: ${(viewTransform.scale * 100).toFixed(0)}%`)
}

const handleZoomOut = () => {
  viewTransform.scale = Math.max(viewTransform.scale * 0.8, 0.3)
  ElMessage.success(`缩放: ${(viewTransform.scale * 100).toFixed(0)}%`)
}

const handleResetView = () => {
  viewTransform.scale = 1
  viewTransform.translateX = 0
  viewTransform.translateY = 0
  ElMessage.success('视图已重置')
}

const handleFitView = () => {
  if (nodes.value.length === 0) {
    handleResetView()
    return
  }

  const xs = nodes.value.map(n => n.x)
  const ys = nodes.value.map(n => n.y)
  const minX = Math.min(...xs) - 50
  const maxX = Math.max(...xs) + 50
  const minY = Math.min(...ys) - 50
  const maxY = Math.max(...ys) + 50

  const width = maxX - minX
  const height = maxY - minY

  const canvasRect = canvasArea.value.getBoundingClientRect()
  const scaleX = (canvasRect.width - 100) / width
  const scaleY = (canvasRect.height - 100) / height
  const scale = Math.min(scaleX, scaleY, 1)

  viewTransform.scale = scale
  viewTransform.translateX = (canvasRect.width - width * scale) / 2 - minX * scale
  viewTransform.translateY = (canvasRect.height - height * scale) / 2 - minY * scale

  ElMessage.success('已适应视图')
}

const handleCanvasWheel = (event) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.3, Math.min(3, viewTransform.scale * delta))

  const rect = svgCanvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const scaleRatio = newScale / viewTransform.scale
  viewTransform.translateX = mouseX - (mouseX - viewTransform.translateX) * scaleRatio
  viewTransform.translateY = mouseY - (mouseY - viewTransform.translateY) * scaleRatio
  viewTransform.scale = newScale
}

const handleGridToggle = () => {
  ElMessage.success(showGrid.value ? '已显示网格' : '已隐藏网格')
}

// ==================== 节点拖拽方法 ====================
const handleNodeMouseDown = (node, event) => {
  if (operationMode.value === 'drag') {
    event.stopPropagation()
    draggingNode.value = node

    const rect = svgCanvas.value.getBoundingClientRect()
    const mouseX = (event.clientX - rect.left - viewTransform.translateX) / viewTransform.scale
    const mouseY = (event.clientY - rect.top - viewTransform.translateY) / viewTransform.scale

    dragOffset.x = mouseX - node.x
    dragOffset.y = mouseY - node.y
  } else if (operationMode.value === 'connect') {
    event.stopPropagation()
    handleConnectModeClick(node)
  }
}

const handleCanvasMouseDown = (event) => {
  if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
    isPanning.value = true
    panStart.x = event.clientX
    panStart.y = event.clientY
    event.preventDefault()
  }
}

const handleCanvasMouseMove = (event) => {
  if (draggingNode.value && operationMode.value === 'drag') {
    const rect = svgCanvas.value.getBoundingClientRect()
    const mouseX = (event.clientX - rect.left - viewTransform.translateX) / viewTransform.scale
    const mouseY = (event.clientY - rect.top - viewTransform.translateY) / viewTransform.scale

    draggingNode.value.x = mouseX - dragOffset.x
    draggingNode.value.y = mouseY - dragOffset.y
  }

  if (isPanning.value) {
    const dx = event.clientX - panStart.x
    const dy = event.clientY - panStart.y

    viewTransform.translateX += dx
    viewTransform.translateY += dy

    panStart.x = event.clientX
    panStart.y = event.clientY
  }

  if (connectingEdge.source && operationMode.value === 'connect') {
    const rect = svgCanvas.value.getBoundingClientRect()
    connectingEdge.preview = {
      x: (event.clientX - rect.left - viewTransform.translateX) / viewTransform.scale,
      y: (event.clientY - rect.top - viewTransform.translateY) / viewTransform.scale
    }
  }
}

const handleCanvasMouseUp = (event) => {
  if (draggingNode.value) {
    draggingNode.value = null
  }

  if (isPanning.value) {
    isPanning.value = false
  }
}

const updateNodePosition = () => {
  cleanupOutOfRangeEdges()
  ElMessage.success('位置已更新')
}

// ==================== 手动连接方法 ====================
const handleConnectModeClick = (node) => {
  if (!connectingEdge.source) {
    connectingEdge.source = node.id
    ElMessage.info(`已选择源节点: ${node.label}，请点击目标节点`)
  } else if (connectingEdge.source === node.id) {
    connectingEdge.source = null
    connectingEdge.preview = null
    ElMessage.info('已取消连接')
  } else {
    createManualEdge(connectingEdge.source, node.id)
    connectingEdge.source = null
    connectingEdge.preview = null
  }
}

const createManualEdge = (sourceId, targetId) => {
  const exists = edges.value.some(
    e => (e.source === sourceId && e.target === targetId) ||
         (e.source === targetId && e.target === sourceId)
  )

  if (exists) {
    ElMessage.warning('该连接已存在')
    return
  }

  const sourceNode = getNodeById(sourceId)
  const targetNode = getNodeById(targetId)

  const newEdge = {
    id: `edge_${edgeCounter.value++}`,
    source: sourceId,
    target: targetId,
    type: 'manual',
    label: '手动连接',
    crossFaction: sourceNode.faction !== targetNode.faction
  }

  edges.value.push(newEdge)
  ElMessage.success(`已创建连接: ${sourceNode.label} → ${targetNode.label}`)
}

// ==================== 布局算法 ====================
const applyLayout = () => {
  if (nodes.value.length === 0) {
    ElMessage.warning('没有节点可以布局')
    return
  }

  switch (selectedLayout.value) {
    case 'circle':
      applyCircleLayout()
      break
    case 'grid':
      applyGridLayout()
      break
    case 'hierarchy':
      applyHierarchyLayout()
      break
    case 'force':
      applyForceLayout()
      break
  }

  cleanupOutOfRangeEdges()
  ElMessage.success(`已应用${getLayoutName()}布局`)
  nextTick(() => handleFitView())
}

const getLayoutName = () => {
  const names = {
    circle: '圆形',
    grid: '网格',
    hierarchy: '层次',
    force: '力导向'
  }
  return names[selectedLayout.value] || ''
}

const applyCircleLayout = () => {
  const centerX = 400
  const centerY = 300
  const radius = Math.min(200, 50 + nodes.value.length * 15)

  nodes.value.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.value.length
    node.x = centerX + radius * Math.cos(angle)
    node.y = centerY + radius * Math.sin(angle)
  })
}

const applyGridLayout = () => {
  const cols = Math.ceil(Math.sqrt(nodes.value.length))
  const spacing = 150
  const startX = 100
  const startY = 100

  nodes.value.forEach((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    node.x = startX + col * spacing
    node.y = startY + row * spacing
  })
}

const applyHierarchyLayout = () => {
  const layers = {
    sensor: [],
    command: [],
    striker: []
  }

  nodes.value.forEach(node => {
    if (layers[node.baseType]) {
      layers[node.baseType].push(node)
    }
  })

  let y = 100
  const spacing = 200

  Object.values(layers).forEach(layer => {
    if (layer.length > 0) {
      const startX = 400 - (layer.length - 1) * 100 / 2
      layer.forEach((node, index) => {
        node.x = startX + index * 100
        node.y = y
      })
      y += spacing
    }
  })
}

const applyForceLayout = () => {
  const iterations = 50
  const repulsionStrength = 5000
  const attractionStrength = 0.01
  const centerStrength = 0.01
  const centerX = 400
  const centerY = 300

  for (let iter = 0; iter < iterations; iter++) {
    const forces = nodes.value.map(() => ({ x: 0, y: 0 }))

    for (let i = 0; i < nodes.value.length; i++) {
      for (let j = i + 1; j < nodes.value.length; j++) {
        const dx = nodes.value[j].x - nodes.value[i].x
        const dy = nodes.value[j].y - nodes.value[i].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = repulsionStrength / (distance * distance)

        forces[i].x -= force * dx / distance
        forces[i].y -= force * dy / distance
        forces[j].x += force * dx / distance
        forces[j].y += force * dy / distance
      }
    }

    edges.value.forEach(edge => {
      const sourceIdx = nodes.value.findIndex(n => n.id === edge.source)
      const targetIdx = nodes.value.findIndex(n => n.id === edge.target)

      if (sourceIdx >= 0 && targetIdx >= 0) {
        const dx = nodes.value[targetIdx].x - nodes.value[sourceIdx].x
        const dy = nodes.value[targetIdx].y - nodes.value[sourceIdx].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        forces[sourceIdx].x += attractionStrength * dx
        forces[sourceIdx].y += attractionStrength * dy
        forces[targetIdx].x -= attractionStrength * dx
        forces[targetIdx].y -= attractionStrength * dy
      }
    })

    nodes.value.forEach((node, i) => {
      forces[i].x += (centerX - node.x) * centerStrength
      forces[i].y += (centerY - node.y) * centerStrength
    })

    nodes.value.forEach((node, i) => {
      node.x += forces[i].x
      node.y += forces[i].y
    })
  }
}

// ==================== 修改：导出方法 - 提供保存路径提示 ====================
const handleExportNetwork = () => {
  if (nodes.value.length === 0) {
    ElMessage.warning('画布为空，无法导出')
    return
  }

  // 同步数据到Store
  syncToStore()

  // 统计装备节点数量
  const equipmentNodeCount = nodes.value.filter(n => n.equipmentId).length
  console.log('📤 开始导出网络...')
  console.log(`  总节点数: ${nodes.value.length}`)
  console.log(`  装备节点: ${equipmentNodeCount}`)
  console.log(`  连接数: ${edges.value.length}`)

  const exportData = {
    version: '1.0',
    name: currentProject.value.name,
    networkMode: networkMode.value,
    timestamp: new Date().toISOString(),
    metadata: {
      nodeCount: nodes.value.length,
      edgeCount: edges.value.length,
      friendlyNodeCount: friendlyNodeCount.value,
      enemyNodeCount: enemyNodeCount.value,
      equipmentNodeCount: equipmentNodeCount  // 新增：装备节点统计
    },
    nodes: nodes.value.map(node => {
      const exportNode = {
        id: node.id,
        type: node.type,
        baseType: node.baseType,
        faction: node.faction,
        label: node.label,
        x: node.x,
        y: node.y
      }

      // 如果有装备信息，也导出
      if (node.equipmentId) {
        exportNode.equipmentId = node.equipmentId
        exportNode.equipmentCode = node.equipmentCode
        exportNode.equipmentData = node.equipmentData
        console.log(`  ✓ 节点 ${node.id} 包含装备: ${node.equipmentData?.name || '未知'}`)
      }

      return exportNode
    }),
    edges: edges.value.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: edge.label,
      crossFaction: edge.crossFaction
    })),
    viewTransform: {
      scale: viewTransform.scale,
      translateX: viewTransform.translateX,
      translateY: viewTransform.translateY
    }
  }

  const fileName = `network_${currentProject.value.name}_${Date.now()}.json`
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)

  const link = downloadLink.value
  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)

  console.log('✅ 导出完成！')
  console.log(`  文件名: ${fileName}`)
  console.log(`  装备节点: ${equipmentNodeCount}/${nodes.value.length}`)

  // 提示保存路径
  ElMessage.success({
    message: `网络已导出: ${fileName} (含${equipmentNodeCount}个装备节点)`,
    duration: 5000,
    showClose: true
  })
}

const handleImportNetwork = () => {
  fileInput.value.click()
}

const handleFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (!data.nodes || !data.edges) {
        throw new Error('无效的网络数据格式')
      }

      ElMessageBox.confirm(
        `确定要导入网络 "${data.name || '未命名'}" 吗？当前画布内容将被替换。`,
        '确认导入',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        nodes.value = data.nodes
        edges.value = data.edges
        networkMode.value = data.networkMode || 'mixed'
        currentProject.value.name = data.name || '导入的网络'

        if (data.viewTransform) {
          viewTransform.scale = data.viewTransform.scale
          viewTransform.translateX = data.viewTransform.translateX
          viewTransform.translateY = data.viewTransform.translateY
        }

        nodeCounter.value = Math.max(...nodes.value.map(n => {
          const match = n.id.match(/\d+/)
          return match ? parseInt(match[0]) : 0
        }), 0) + 1

        edgeCounter.value = Math.max(...edges.value.map(e => {
          const match = e.id.match(/\d+/)
          return match ? parseInt(match[0]) : 0
        }), 0) + 1

        selectedNode.value = null

        // 同步到Store
        syncToStore()

        ElMessage.success(`已导入网络: ${data.name || '未命名'}，数据已同步到Store`)
        nextTick(() => handleFitView())
      }).catch(() => {})
    } catch (error) {
      ElMessage.error('导入失败: ' + error.message)
    }
  }

  reader.readAsText(file)
  event.target.value = ''
}

// ==================== 原有方法 ====================
const handleNetworkModeChange = (mode) => {
  ElMessage.success(`已切换到${mode === 'friendly' ? '我方' : mode === 'enemy' ? '敌方' : '混合'}网络模式`)

  if (mode === 'friendly') {
    selectedNodeType.value = 'sensor_blue'
  } else if (mode === 'enemy') {
    selectedNodeType.value = 'sensor_red'
  }

  if (selectedNode.value && !visibleNodes.value.find(n => n.id === selectedNode.value.id)) {
    selectedNode.value = null
  }

  connectingEdge.source = null
  connectingEdge.preview = null
}

const selectNodeType = (type) => {
  selectedNodeType.value = type
  deleteMode.value = false
  operationMode.value = 'add'
}

// ========== 完全替换 handleCanvasClick 方法（约第675行） ==========
// 画布点击事件 - 添加节点
const handleCanvasClick = (event) => {
  if (deleteMode.value) return

  const rect = svgCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 根据添加模式决定行为
  if (addNodeMode.value === 'from-equipment') {
    // 从装备选择模式
    pendingNodePosition.value = { x, y }
    showEquipmentSelector.value = true
  } else {
    // 快速添加模式 - 原有逻辑
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
}

const handleNodeClick = (node) => {
  if (deleteMode.value) {
    handleDeleteNode(node)
  } else if (operationMode.value === 'add' || operationMode.value === 'drag') {
    selectedNode.value = node
  }
}

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

const handleDeleteNode = (node) => {
  edges.value = edges.value.filter(
    edge => edge.source !== node.id && edge.target !== node.id
  )

  const index = nodes.value.findIndex(n => n.id === node.id)
  if (index > -1) {
    nodes.value.splice(index, 1)
    ElMessage.success('节点已删除')
    if (selectedNode.value?.id === node.id) {
      selectedNode.value = null
    }
  }
}

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

const handleAutoConnect = async () => {
  if (nodes.value.length < 2) {
    ElMessage.warning('至少需要2个节点才能生成连接')
    return
  }

  isConnecting.value = true
  try {
    const newEdges = await generateConnections(nodes.value, allNodeTypes.value, networkMode.value)

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

// ==================== 修改：网络评估 - 只评估我方节点 ====================
const handleEvaluate = async () => {
  // 只评估我方节点
  const friendlyNodes = nodes.value.filter(n => n.faction === 'blue')

  if (friendlyNodes.length === 0) {
    ElMessage.warning('没有我方节点，无法评估')
    return
  }

  // 只包含我方节点之间的连接
  const friendlyEdges = edges.value.filter(edge => {
    const sourceNode = getNodeById(edge.source)
    const targetNode = getNodeById(edge.target)
    return sourceNode?.faction === 'blue' && targetNode?.faction === 'blue'
  })

  try {
    evaluationResult.value = evaluateNetworkLocally(friendlyNodes, friendlyEdges)
    showEvaluationDialog.value = true

    // 保存评估历史到 localStorage
    saveEvaluationHistory(evaluationResult.value)
  } catch (error) {
    ElMessage.error('评估失败：' + error.message)
  }
}

// 保存评估历史
const saveEvaluationHistory = (result) => {
  try {
    // 获取现有历史
    const historyData = localStorage.getItem('evaluationHistory')
    let history = historyData ? JSON.parse(historyData) : []

    // 添加新的评估记录
    const newRecord = {
      id: Date.now(),
      projectName: currentProject.value.name || '未命名项目',
      timestamp: new Date().toISOString(),
      overall_score: result.overall_score,
      metrics: result.metrics,
      nodeCount: nodes.value.filter(n => n.faction === 'blue').length,
      edgeCount: edges.value.length
    }

    history.unshift(newRecord) // 添加到开头

    // 只保留最近50条记录
    if (history.length > 50) {
      history = history.slice(0, 50)
    }

    localStorage.setItem('evaluationHistory', JSON.stringify(history))
    console.log('✅ 评估历史已保存')
  } catch (error) {
    console.error('❌ 保存评估历史失败:', error)
  }
}

// 本地评估函数
const evaluateNetworkLocally = (evalNodes, evalEdges) => {
  // 检查节点类型存在性
  const hasSensor = evalNodes.some(n => n.baseType === 'sensor')
  const hasCommand = evalNodes.some(n => n.baseType === 'command')
  const hasStriker = evalNodes.some(n => n.baseType === 'striker')

  const vulnerabilities = []
  const suggestions = []

  if (!hasSensor) {
    vulnerabilities.push({
      severity: 'high',
      title: '缺少传感器节点',
      description: '网络中没有传感器节点，无法进行目标探测'
    })
    suggestions.push({
      priority: 'high',
      title: '添加传感器节点',
      description: '建议至少添加2-3个传感器节点以提供目标探测能力',
      expected_effect: '提升网络的态势感知能力'
    })
  }

  if (!hasCommand) {
    vulnerabilities.push({
      severity: 'high',
      title: '缺少指挥中心节点',
      description: '网络中没有指挥中心节点，无法进行统一指挥控制'
    })
    suggestions.push({
      priority: 'high',
      title: '添加指挥中心节点',
      description: '建议添加1-2个指挥中心节点作为网络核心',
      expected_effect: '建立统一的指挥控制体系'
    })
  }

  if (!hasStriker) {
    vulnerabilities.push({
      severity: 'high',
      title: '缺少打击单元节点',
      description: '网络中没有打击单元节点，无法执行火力打击任务'
    })
    suggestions.push({
      priority: 'high',
      title: '添加打击单元节点',
      description: '建议添加2-4个打击单元节点以提供火力支援',
      expected_effect: '形成完整的杀伤链'
    })
  }

  // 计算连通性（使用BFS检查所有节点是否互相连通）
  let connectivity = 0
  if (evalNodes.length > 0) {
    if (evalNodes.length === 1) {
      connectivity = 1
    } else {
      // 构建邻接表
      const adjacency = {}
      evalNodes.forEach(node => {
        adjacency[node.id] = []
      })

      evalEdges.forEach(edge => {
        if (!adjacency[edge.source]) adjacency[edge.source] = []
        if (!adjacency[edge.target]) adjacency[edge.target] = []
        adjacency[edge.source].push(edge.target)
        adjacency[edge.target].push(edge.source)
      })

      // BFS遍历检查连通性
      const visited = new Set()
      const queue = [evalNodes[0].id]
      visited.add(evalNodes[0].id)

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
      connectivity = visited.size / evalNodes.length
    }
  }

  // 检查连通性问题
  if (connectivity < 1 && evalNodes.length > 1) {
    vulnerabilities.push({
      severity: 'high',
      title: '网络未完全连通',
      description: `网络连通性为 ${(connectivity * 100).toFixed(1)}%，存在节点无法相互通信`
    })
    suggestions.push({
      priority: 'high',
      title: '建立网络连接',
      description: '调整节点位置或增加中继节点，确保所有节点互联互通',
      expected_effect: '提高网络连通性和信息传递效率'
    })
  }

  // 计算冗余度（基于平均节点度）
  const avgDegree = evalNodes.length > 0 ? (evalEdges.length * 2) / evalNodes.length : 0
  const redundancy = Math.min(avgDegree / 4, 1)

  // 检查冗余度问题
  if (redundancy < 0.3 && evalNodes.length >= 3) {
    vulnerabilities.push({
      severity: 'medium',
      title: '网络冗余度不足',
      description: '节点连接度较低，网络抗毁性较弱'
    })
    suggestions.push({
      priority: 'medium',
      title: '增加网络冗余',
      description: '在节点间建立更多连接，或增加备份节点',
      expected_effect: '提高网络的抗毁性和可靠性'
    })
  }

  // 计算覆盖度（有连接的节点比例）
  const connectedNodes = new Set()
  evalEdges.forEach(edge => {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  })
  const coverage = evalNodes.length > 0 ? connectedNodes.size / evalNodes.length : 0

  // 检查孤立节点
  if (coverage < 1 && evalNodes.length > 0) {
    const isolatedCount = evalNodes.length - connectedNodes.size
    vulnerabilities.push({
      severity: 'high',
      title: '存在孤立节点',
      description: `发现 ${isolatedCount} 个孤立节点，它们没有与网络中其他节点建立连接`
    })
    suggestions.push({
      priority: 'high',
      title: '连接孤立节点',
      description: '将孤立节点移动到其他节点的通信范围内，或增加中继节点建立连接',
      expected_effect: '提高网络完整性和资源利用率'
    })
  }

  // 计算综合得分
  const overall_score = (
    (hasSensor ? 20 : 0) +
    (hasCommand ? 20 : 0) +
    (hasStriker ? 20 : 0) +
    connectivity * 15 +
    redundancy * 15 +
    coverage * 10
  )

  return {
    overall_score,
    metrics: {
      connectivity,
      redundancy,
      coverage,
      efficiency: (hasSensor && hasCommand && hasStriker) ? 0.8 : 0.4,
      robustness: redundancy
    },
    vulnerabilities,
    suggestions
  }
}

const handleSaveProject = () => {
  // 同步数据到Store
  syncToStore()

  const projectData = {
    name: currentProject.value.name,
    nodes: nodes.value,
    edges: edges.value,
    networkMode: networkMode.value,
    viewTransform: viewTransform,
    timestamp: new Date().toISOString()
  }

  localStorage.setItem('currentProject', JSON.stringify(projectData))
  ElMessage.success('项目已保存到本地存储和Store')
}

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
    connectingEdge.source = null
    connectingEdge.preview = null
    handleResetView()
    ElMessage.success('画布已清空')
  }).catch(() => {})
}

const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value
  if (deleteMode.value) {
    ElMessage.info('已进入删除模式，点击节点或连接进行删除')
    operationMode.value = 'add'
  }
}

const updateNodeLabel = () => {
  ElMessage.success('标签已更新')
}

const getNodeById = (id) => {
  return nodes.value.find(node => node.id === id)
}

const getNodeTypeConfig = (type) => {
  return allNodeTypes.value.find(t => t.type === type) || allNodeTypes.value[0]
}

/**
 * 获取节点的实际范围半径
 * 优先使用装备数据中的实际范围，否则使用默认配置
 * @param {Object} node - 节点对象
 * @param {String} radiusType - 范围类型：'detection', 'communication', 'strike'
 * @returns {Number} - 半径值（像素）
 */
const getNodeRadius = (node, radiusType) => {
  // 如果节点有装备数据，使用装备的实际范围值
  if (node.equipmentData) {
    const rangeFieldMap = {
      detection: 'detection_range',
      communication: 'communication_range',
      strike: 'strike_range'
    }

    const rangeField = rangeFieldMap[radiusType]
    const rangeValue = node.equipmentData[rangeField]

    // 如果装备有该范围值，使用它（1km = 1像素）
    if (rangeValue && rangeValue > 0) {
      return rangeValue
    }
  }

  // 否则使用默认的节点类型配置
  const typeConfig = getNodeTypeConfig(node.type)
  const radiusFieldMap = {
    detection: 'detection_radius',
    communication: 'communication_radius',
    strike: 'strike_radius'
  }

  return typeConfig[radiusFieldMap[radiusType]] || 0
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

  if (sourceNode.faction !== targetNode.faction) {
    if (edge.type === 'detection') return '#e67e22'
    if (edge.type === 'strike') return '#8e44ad'
    return '#95a5a6'
  }

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

const getScoreColor = (score) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getScoreLevel = (score) => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较差'
}

const getMetricName = (key) => {
  const names = {
    connectivity: '连通性',
    redundancy: '冗余度',
    coverage: '覆盖度',
    efficiency: '效率',
    robustness: '鲁棒性'
  }
  return names[key] || key
}

// ==================== 新增：前往推演 ====================
const goToSimulation = () => {
  if (nodes.value.length === 0) {
    ElMessage.warning('请先构建网络再进行推演')
    return
  }

  // 同步数据到Store
  syncToStore()

  ElMessage.success('网络数据已同步，正在跳转到推演页面...')

  // 跳转到推演页面
  setTimeout(() => {
    router.push('/simulation')
  }, 500)
}

// ==================== 新增：数据同步函数 ====================
// 将本地数据同步到Store
const syncToStore = () => {
  const equipmentNodeCount = nodes.value.filter(n => n.equipmentId).length

  console.log('🔄 同步网络数据到Store...')
  console.log(`  节点数: ${nodes.value.length}`)
  console.log(`  装备节点: ${equipmentNodeCount}`)
  console.log(`  边数: ${edges.value.length}`)

  networkStore.setNetwork({
    nodes: nodes.value.map(node => {
      const storeNode = {
        ...node,
        // 确保有HP属性（推演需要）
        hp: node.hp || 100,
        // 确保有name属性
        name: node.label || node.name || node.id,
        // 确保有color属性
        color: node.color || (node.faction === 'red' ? '#F56C6C' : '#409EFF')
      }

      // ✅ 关键：保留装备信息
      if (node.equipmentId) {
        storeNode.equipmentId = node.equipmentId
        storeNode.equipmentCode = node.equipmentCode
        storeNode.equipmentData = node.equipmentData
      }

      return storeNode
    }),
    edges: edges.value,
    project: {
      name: currentProject.value.name || '网络构建项目',
      id: currentProject.value.id
    }
  })

  const storedEquipmentCount = networkStore.nodes.filter(n => n.equipmentId).length
  console.log('✅ 同步完成！')
  console.log(`  Store中现有: ${networkStore.nodes.length} 个节点`)
  console.log(`  装备节点: ${storedEquipmentCount}`)
}

// 从Store加载数据到本地
const loadFromStore = () => {
  if (!networkStore.isEmpty) {
    console.log('从Store加载网络数据...', networkStore.nodes.length, '个节点')

    nodes.value = networkStore.nodes.map(node => ({
      id: node.id,
      type: node.type || `${node.baseType}_${node.faction}`,
      baseType: node.baseType,
      faction: node.faction,
      label: node.label || node.name || node.id,
      x: node.x,
      y: node.y,
      equipmentId: node.equipmentId,
      equipmentCode: node.equipmentCode,
      equipmentData: node.equipmentData
    }))

    edges.value = networkStore.edges

    if (networkStore.currentProject) {
      currentProject.value.name = networkStore.currentProject.name || '网络构建项目'
      currentProject.value.id = networkStore.currentProject.id
    }

    // 更新计数器
    if (nodes.value.length > 0) {
      nodeCounter.value = Math.max(...nodes.value.map(n => {
        const match = n.id.match(/\d+/)
        return match ? parseInt(match[0]) : 0
      }), 0) + 1
    }

    if (edges.value.length > 0) {
      edgeCounter.value = Math.max(...edges.value.map(e => {
        const match = e.id.match(/\d+/)
        return match ? parseInt(match[0]) : 0
      }), 0) + 1
    }

    ElMessage.success(`从Store加载了 ${nodes.value.length} 个节点`)
    console.log('加载完成')
  }
}

onMounted(() => {
  loadEquipments()

  // 优先从Store加载数据
  if (!networkStore.isEmpty) {
    loadFromStore()
    nextTick(() => handleFitView())
    return
  }
  const saved = localStorage.getItem('currentProject')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      nodes.value = data.nodes || []
      edges.value = data.edges || []
      networkMode.value = data.networkMode || 'mixed'
      currentProject.value.name = data.name || '新建作战网络'

      if (data.viewTransform) {
        Object.assign(viewTransform, data.viewTransform)
      }

      nodeCounter.value = Math.max(...nodes.value.map(n => {
        const match = n.id.match(/\d+/)
        return match ? parseInt(match[0]) : 0
      }), 0) + 1

      edgeCounter.value = Math.max(...edges.value.map(e => {
        const match = e.id.match(/\d+/)
        return match ? parseInt(match[0]) : 0
      }), 0) + 1
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }
})
const loadEquipments = () => {
  // 从localStorage加载
  const savedEquipments = localStorage.getItem('equipments')
  if (savedEquipments) {
    try {
      const data = JSON.parse(savedEquipments)
      equipments.value = Array.isArray(data) ? data : []
      console.log('已加载装备数据:', equipments.value.length, '个装备')
    } catch (error) {
      console.error('加载装备数据失败:', error)
      equipments.value = []
    }
  } else {
    equipments.value = []
  }
}
</script>

<style scoped lang="scss">
.network-canvas-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

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

    &.show-grid {
      background-color: #fafafa;
    }

    .node {
      cursor: pointer;
      transition: all 0.2s;

      &:hover .node-body {
        filter: brightness(1.1);
        transform: scale(1.1);
      }

      &.node-dragging {
        cursor: move;
        opacity: 0.8;
      }

      &.node-connecting .node-body {
        stroke: #409EFF;
        stroke-width: 4;
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

        &.edge-out-of-range {
          stroke: #ff6b6b !important;
          stroke-dasharray: 10,5 !important;
          opacity: 0.5;
        }
      }

      .edge-label {
        font-size: 11px;
        pointer-events: none;
        user-select: none;
      }
    }

    .edge-preview {
      pointer-events: none;
    }
  }

  .view-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 10;

    .el-button-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
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