<template>
  <el-dialog
    v-model="visible"
    title="选择装备"
    width="800px"
    :close-on-click-modal="false"
  >
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索装备名称或编号"
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
        <el-option label="指挥中心" value="command" />
        <el-option label="打击单元" value="striker" />
      </el-select>

      <el-select
        v-model="filterFaction"
        placeholder="所属阵营"
        clearable
        style="width: 120px;"
      >
        <el-option label="全部阵营" value="" />
        <el-option label="我方" value="blue" />
        <el-option label="敌方" value="red" />
      </el-select>
    </div>

    <!-- 装备列表 -->
    <el-table
      :data="filteredEquipments"
      height="400"
      highlight-current-row
      @current-change="handleCurrentChange"
      style="margin-top: 15px;"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="装备名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="code" label="编号" width="100" align="center" />
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)" size="small">
            {{ getTypeName(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="faction" label="阵营" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.faction === 'blue' ? 'primary' : 'danger'" size="small">
            {{ row.faction === 'blue' ? '我方' : '敌方' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="manufacturer" label="制造商" width="120" show-overflow-tooltip />
      <el-table-column label="关键参数" width="150">
        <template #default="{ row }">
          <div class="params">
            <el-tag v-if="row.detection_range" size="small" type="info">
              探测:{{ row.detection_range }}km
            </el-tag>
            <el-tag v-if="row.communication_range" size="small" type="success">
              通信:{{ row.communication_range }}km
            </el-tag>
            <el-tag v-if="row.strike_range" size="small" type="warning">
              打击:{{ row.strike_range }}km
            </el-tag>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 已选装备提示 -->
    <div v-if="selectedEquipment" class="selected-info">
      <el-alert
        :title="`已选择: ${selectedEquipment.name} (${selectedEquipment.code})`"
        type="success"
        :closable="false"
      />
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="!selectedEquipment">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

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
    default: 'mixed'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 搜索和筛选
const searchText = ref('')
const filterType = ref('')
const filterFaction = ref('')
const selectedEquipment = ref(null)

// 根据网络模式自动设置阵营筛选
watch(() => props.networkMode, (mode) => {
  if (mode === 'friendly') {
    filterFaction.value = 'blue'
  } else if (mode === 'enemy') {
    filterFaction.value = 'red'
  } else {
    filterFaction.value = ''
  }
}, { immediate: true })

// 重置对话框时清空选择
watch(visible, (val) => {
  if (val) {
    selectedEquipment.value = null
    searchText.value = ''
    filterType.value = ''
    // networkMode变化时会自动设置filterFaction
  }
})

// 过滤后的装备列表
const filteredEquipments = computed(() => {
  let result = props.equipments.filter(eq => eq.status === 'active')

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(eq =>
      eq.name.toLowerCase().includes(search) ||
      eq.code.toLowerCase().includes(search)
    )
  }

  if (filterType.value) {
    result = result.filter(eq => eq.type === filterType.value)
  }

  if (filterFaction.value) {
    result = result.filter(eq => eq.faction === filterFaction.value)
  }

  return result
})

// 选择装备
const handleCurrentChange = (row) => {
  selectedEquipment.value = row
}

// 确认选择
const handleConfirm = () => {
  if (selectedEquipment.value) {
    emit('confirm', selectedEquipment.value)
    visible.value = false
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
}

// 辅助函数
const getTypeName = (type) => {
  const typeMap = {
    sensor: '传感器',
    command: '指挥中心',
    striker: '打击单元',
    communication: '通信',
    platform: '平台'
  }
  return typeMap[type] || type
}

const getTypeTag = (type) => {
  const tagMap = {
    sensor: 'primary',
    command: 'success',
    striker: 'danger',
    communication: 'warning',
    platform: 'info'
  }
  return tagMap[type] || ''
}
</script>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
}

.params {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.selected-info {
  margin-top: 15px;
}
</style>