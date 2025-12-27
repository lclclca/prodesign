<template>
  <el-dialog
    v-model="visible"
    title="选择装备"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-input
        v-model="searchText"
        placeholder="搜索装备名称或型号"
        clearable
        style="width: 300px; margin-right: 10px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="filterType"
        placeholder="装备类型"
        clearable
        style="width: 150px; margin-right: 10px;"
      >
        <el-option label="全部类型" value="" />
        <el-option label="传感器" value="sensor" />
        <el-option label="指挥" value="command" />
        <el-option label="打击" value="striker" />
        <el-option label="支援" value="support" />
      </el-select>

      <el-select
        v-model="filterFaction"
        placeholder="阵营"
        clearable
        style="width: 120px;"
      >
        <el-option label="全部阵营" value="" />
        <el-option label="我方" value="blue" />
        <el-option label="敌方" value="red" />
      </el-select>
    </div>

    <!-- 装备列表 -->
    <div class="equipment-list">
      <el-empty
        v-if="filteredEquipments.length === 0"
        description="没有可用的装备"
      />
      
      <div
        v-for="equipment in filteredEquipments"
        :key="equipment.id"
        class="equipment-item"
        :class="{ selected: selectedEquipment?.id === equipment.id }"
        @click="selectEquipment(equipment)"
      >
        <!-- 装备图标 -->
        <div class="equipment-icon" :style="{ backgroundColor: equipment.color || getTypeColor(equipment.baseType) }">
          {{ equipment.icon || getTypeIcon(equipment.baseType) }}
        </div>

        <!-- 装备信息 -->
        <div class="equipment-info">
          <div class="equipment-header">
            <span class="equipment-name">{{ equipment.name }}</span>
            <el-tag
              :type="equipment.faction === 'blue' ? 'primary' : 'danger'"
              size="small"
            >
              {{ equipment.faction === 'blue' ? '我方' : '敌方' }}
            </el-tag>
            <el-tag
              :type="getTypeTagType(equipment.baseType)"
              size="small"
            >
              {{ getTypeName(equipment.baseType) }}
            </el-tag>
          </div>
          
          <div class="equipment-model">
            型号: {{ equipment.model || '未知' }}
          </div>
          
          <div class="equipment-performance">
            {{ getPerformanceText(equipment) }}
          </div>
        </div>

        <!-- 选中标记 -->
        <div v-if="selectedEquipment?.id === equipment.id" class="selected-mark">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <span class="equipment-count">
          共 {{ filteredEquipments.length }} 个装备
        </span>
        <div>
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            :disabled="!selectedEquipment"
            @click="handleConfirm"
          >
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Check } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  equipments: {
    type: Array,
    default: () => []
  },
  networkMode: {
    type: String,
    default: 'friendly' // friendly | enemy | mixed
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm'])

// 内部状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const searchText = ref('')
const filterType = ref('')
const filterFaction = ref('')
const selectedEquipment = ref(null)

// 根据网络模式过滤装备
const filteredEquipments = computed(() => {
  let result = props.equipments || []

  // 根据网络模式过滤阵营
  if (props.networkMode === 'friendly') {
    result = result.filter(eq => eq.faction === 'blue')
  } else if (props.networkMode === 'enemy') {
    result = result.filter(eq => eq.faction === 'red')
  }
  // mixed 模式显示所有

  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(eq => 
      eq.name?.toLowerCase().includes(search) ||
      eq.model?.toLowerCase().includes(search)
    )
  }

  // 类型过滤
  if (filterType.value) {
    result = result.filter(eq => eq.baseType === filterType.value)
  }

  // 阵营过滤
  if (filterFaction.value) {
    result = result.filter(eq => eq.faction === filterFaction.value)
  }

  return result
})

// 选择装备
const selectEquipment = (equipment) => {
  selectedEquipment.value = equipment
}

// 确认选择
const handleConfirm = () => {
  if (selectedEquipment.value) {
    emit('confirm', selectedEquipment.value)
    handleClose()
  }
}

// 关闭对话框
const handleClose = () => {
  selectedEquipment.value = null
  searchText.value = ''
  filterType.value = ''
  filterFaction.value = ''
  visible.value = false
}

// 监听对话框打开，重置状态
watch(visible, (newVal) => {
  if (newVal) {
    selectedEquipment.value = null
  }
})

// 辅助函数
const getTypeColor = (baseType) => {
  const colors = {
    sensor: '#409EFF',
    command: '#67C23A',
    striker: '#F56C6C',
    support: '#E6A23C'
  }
  return colors[baseType] || '#909399'
}

const getTypeIcon = (baseType) => {
  const icons = {
    sensor: '📡',
    command: '🎯',
    striker: '🚀',
    support: '📶'
  }
  return icons[baseType] || '❓'
}

const getTypeName = (baseType) => {
  const names = {
    sensor: '传感器',
    command: '指挥',
    striker: '打击',
    support: '支援'
  }
  return names[baseType] || '未知'
}

const getTypeTagType = (baseType) => {
  const types = {
    sensor: 'primary',
    command: 'success',
    striker: 'danger',
    support: 'warning'
  }
  return types[baseType] || 'info'
}

const getPerformanceText = (equipment) => {
  const perf = equipment.performance || {}
  
  switch (equipment.baseType) {
    case 'sensor':
      return `探测: ${perf.detectionRange || 0}km | 精度: ${perf.detectionAccuracy || 0}m | 概率: ${((perf.detectionProbability || 0) * 100).toFixed(0)}%`
    case 'command':
      return `指挥: ${perf.commandRange || 0}km | 处理: ${perf.processingCapacity || 0}/s | 时延: ${perf.decisionDelay || 0}s`
    case 'striker':
      return `射程: ${perf.strikeRange || 0}km | 毁伤: ${((perf.damageRate || 0) * 100).toFixed(0)}% | 弹药: ${perf.ammunition || 0}`
    case 'support':
      return `通信: ${perf.commDistance || 0}km | 带宽: ${perf.bandwidth || 0}Mbps | 可靠性: ${((perf.reliability || 0) * 100).toFixed(0)}%`
    default:
      return '无性能参数'
  }
}
</script>

<style scoped lang="scss">
.filter-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.equipment-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px 0;
}

.equipment-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #409EFF;
    background-color: #f5f7fa;
  }

  &.selected {
    border-color: #409EFF;
    background-color: #ecf5ff;
  }

  .equipment-icon {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-right: 15px;
    flex-shrink: 0;
  }

  .equipment-info {
    flex: 1;

    .equipment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;

      .equipment-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .equipment-model {
      font-size: 13px;
      color: #606266;
      margin-bottom: 5px;
    }

    .equipment-performance {
      font-size: 12px;
      color: #909399;
    }
  }

  .selected-mark {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    background-color: #409EFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .equipment-count {
    font-size: 14px;
    color: #606266;
  }
}

// 滚动条样式
.equipment-list::-webkit-scrollbar {
  width: 6px;
}

.equipment-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.equipment-list::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}
</style>