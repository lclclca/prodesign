<template>
  <div class="equipment-management-page">
    <!-- 顶部搜索和操作栏 -->
    <div class="top-toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.name"
          placeholder="搜索装备名称"
          clearable
          style="width: 200px; margin-right: 10px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchForm.type"
          placeholder="装备类型"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="handleSearch"
        >
          <el-option label="全部类型" value="" />
          <el-option label="传感器" value="sensor" />
          <el-option label="指挥中心" value="command" />
          <el-option label="打击单元" value="striker" />
          <el-option label="通信节点" value="communication" />
          <el-option label="平台载具" value="platform" />
        </el-select>

        <el-select
          v-model="searchForm.faction"
          placeholder="所属阵营"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="handleSearch"
        >
          <el-option label="全部阵营" value="" />
          <el-option label="我方" value="blue" />
          <el-option label="敌方" value="red" />
        </el-select>

        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          重置
        </el-button>
      </div>

      <div class="action-section">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增装备
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
        <el-button :icon="Download" @click="handleExport">
          导出数据
        </el-button>
        <el-button :icon="Upload" @click="handleImport">
          导入数据
        </el-button>
      </div>
    </div>

    <!-- 装备列表表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="name" label="装备名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="code" label="装备编号" width="120" align="center" />
        <el-table-column prop="type" label="装备类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="faction" label="所属阵营" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.faction === 'blue' ? 'primary' : 'danger'">
              {{ row.faction === 'blue' ? '我方' : '敌方' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="制造商" width="120" show-overflow-tooltip />
        <el-table-column label="关键参数" width="200" align="center">
          <template #default="{ row }">
            <div class="params-display">
              <el-tag v-if="row.detection_range" size="small" type="info">
                探测: {{ row.detection_range }}km
              </el-tag>
              <el-tag v-if="row.communication_range" size="small" type="success">
                通信: {{ row.communication_range }}km
              </el-tag>
              <el-tag v-if="row.strike_range" size="small" type="warning">
                打击: {{ row.strike_range }}km
              </el-tag>
              <el-tag v-if="row.attack_power" size="small" type="danger">
                火力: {{ row.attack_power }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="装备名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入装备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备编号" prop="code">
              <el-input v-model="formData.code" placeholder="请输入装备编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="装备类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择装备类型" style="width: 100%;" @change="handleTypeChange">
                <el-option label="传感器" value="sensor" />
                <el-option label="指挥中心" value="command" />
                <el-option label="打击单元" value="striker" />
                <el-option label="通信节点" value="communication" />
                <el-option label="平台载具" value="platform" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属阵营" prop="faction">
              <el-select v-model="formData.faction" placeholder="请选择所属阵营" style="width: 100%;">
                <el-option label="我方" value="blue" />
                <el-option label="敌方" value="red" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="制造商" prop="manufacturer">
              <el-input v-model="formData.manufacturer" placeholder="请输入制造商" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio value="active">启用</el-radio>
                <el-radio value="inactive">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 传感器特有参数 -->
        <template v-if="formData.type === 'sensor'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="探测范围" prop="detection_range">
                <el-input-number v-model="formData.detection_range" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="探测精度" prop="detection_accuracy">
                <el-input-number v-model="formData.detection_accuracy" :min="0" :max="100" style="width: 100%;" />
                <span style="margin-left: 5px;">%</span>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 指挥中心特有参数 -->
        <template v-if="formData.type === 'command'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="通信范围" prop="communication_range">
                <el-input-number v-model="formData.communication_range" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="指挥容量" prop="command_capacity">
                <el-input-number v-model="formData.command_capacity" :min="0" :max="100" style="width: 100%;" />
                <span style="margin-left: 5px;">单位</span>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 打击单元特有参数 -->
        <template v-if="formData.type === 'striker'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="打击范围" prop="strike_range">
                <el-input-number v-model="formData.strike_range" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="攻击火力" prop="attack_power">
                <el-input-number v-model="formData.attack_power" :min="0" :max="1000" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 通用参数 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产年份" prop="production_year">
              <el-date-picker
                v-model="formData.production_year"
                type="year"
                placeholder="选择年份"
                style="width: 100%;"
                value-format="YYYY"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服役年限" prop="service_life">
              <el-input-number v-model="formData.service_life" :min="0" :max="50" style="width: 100%;" />
              <span style="margin-left: 5px;">年</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="装备描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入装备描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="装备详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="装备ID">{{ currentRow.id }}</el-descriptions-item>
        <el-descriptions-item label="装备编号">{{ currentRow.code }}</el-descriptions-item>
        <el-descriptions-item label="装备名称">{{ currentRow.name }}</el-descriptions-item>
        <el-descriptions-item label="装备类型">
          <el-tag :type="getTypeTagType(currentRow.type)">
            {{ getTypeName(currentRow.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属阵营">
          <el-tag :type="currentRow.faction === 'blue' ? 'primary' : 'danger'">
            {{ currentRow.faction === 'blue' ? '我方' : '敌方' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="制造商">{{ currentRow.manufacturer }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRow.status === 'active' ? 'success' : 'info'">
            {{ currentRow.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="生产年份">{{ currentRow.production_year }}</el-descriptions-item>

        <!-- 动态显示特定参数 -->
        <el-descriptions-item label="探测范围" v-if="currentRow.detection_range">
          {{ currentRow.detection_range }} km
        </el-descriptions-item>
        <el-descriptions-item label="探测精度" v-if="currentRow.detection_accuracy">
          {{ currentRow.detection_accuracy }}%
        </el-descriptions-item>
        <el-descriptions-item label="通信范围" v-if="currentRow.communication_range">
          {{ currentRow.communication_range }} km
        </el-descriptions-item>
        <el-descriptions-item label="指挥容量" v-if="currentRow.command_capacity">
          {{ currentRow.command_capacity }} 单位
        </el-descriptions-item>
        <el-descriptions-item label="打击范围" v-if="currentRow.strike_range">
          {{ currentRow.strike_range }} km
        </el-descriptions-item>
        <el-descriptions-item label="攻击火力" v-if="currentRow.attack_power">
          {{ currentRow.attack_power }}
        </el-descriptions-item>
        <el-descriptions-item label="服役年限" v-if="currentRow.service_life">
          {{ currentRow.service_life }} 年
        </el-descriptions-item>

        <el-descriptions-item label="装备描述" :span="2">
          {{ currentRow.description || '暂无描述' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentRow.created_at }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">
          {{ currentRow.updated_at }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input ref="importFileInput" type="file" accept=".json" style="display: none;" @change="handleImportFile" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Download,
  Upload,
  Edit,
  View
} from '@element-plus/icons-vue'

// ==================== 常量 ====================
const STORAGE_KEY = 'equipments'

// ==================== 状态定义 ====================
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)
const importFileInput = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  faction: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 表格数据
const tableData = ref([])
const selectedIds = ref([])
const currentRow = ref(null)

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  code: '',
  type: 'sensor',
  faction: 'blue',
  manufacturer: '',
  status: 'active',
  detection_range: 0,
  detection_accuracy: 0,
  communication_range: 0,
  command_capacity: 0,
  strike_range: 0,
  attack_power: 0,
  production_year: '',
  service_life: 0,
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入装备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入装备编号', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择装备类型', trigger: 'change' }
  ],
  faction: [
    { required: true, message: '请选择所属阵营', trigger: 'change' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return formData.id ? '编辑装备' : '新增装备'
})

// ==================== 模拟数据生成 ====================
const generateMockData = () => {
  const types = ['sensor', 'command', 'striker', 'communication', 'platform']
  const factions = ['blue', 'red']
  const manufacturers = ['洛克希德·马丁', '波音公司', '诺斯罗普·格鲁曼', '雷神公司', '通用动力']
  const mockData = []

  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const faction = factions[Math.floor(Math.random() * factions.length)]

    const item = {
      id: i,
      name: `${faction === 'blue' ? '我方' : '敌方'}${getTypeName(type)}${i}`,
      code: `EQ${String(i).padStart(4, '0')}`,
      type: type,
      faction: faction,
      manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      production_year: String(2010 + Math.floor(Math.random() * 14)),
      service_life: 10 + Math.floor(Math.random() * 20),
      description: `这是一台${getTypeName(type)}装备，具有优秀的性能指标。`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString()
    }

    // 根据类型添加特定参数
    if (type === 'sensor') {
      item.detection_range = 50 + Math.floor(Math.random() * 200)
      item.detection_accuracy = 70 + Math.floor(Math.random() * 30)
    } else if (type === 'command') {
      item.communication_range = 100 + Math.floor(Math.random() * 300)
      item.command_capacity = 10 + Math.floor(Math.random() * 40)
    } else if (type === 'striker') {
      item.strike_range = 50 + Math.floor(Math.random() * 200)
      item.attack_power = 100 + Math.floor(Math.random() * 400)
    } else if (type === 'communication') {
      item.communication_range = 100 + Math.floor(Math.random() * 400)
    }

    mockData.push(item)
  }

  return mockData
}

// 存储所有数据
let allData = []

// ==================== localStorage 操作 ====================
// 保存到 localStorage
const saveToLocalStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
    console.log('✅ 装备数据已保存到本地，共', allData.length, '条')
  } catch (error) {
    console.error('❌ 保存装备数据失败:', error)
    ElMessage.error('保存装备数据失败')
  }
}

// 从 localStorage 加载
const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      allData = JSON.parse(savedData)
      console.log('✅ 从本地加载装备数据:', allData.length, '条')
      return true
    }
    return false
  } catch (error) {
    console.error('❌ 加载装备数据失败:', error)
    return false
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  // 先尝试从 localStorage 加载
  const loaded = loadFromLocalStorage()

  if (!loaded || allData.length === 0) {
    // 如果没有保存的数据或数据为空，生成模拟数据
    allData = generateMockData()
    saveToLocalStorage()
    console.log('✅ 生成模拟装备数据:', allData.length, '条')
  }

  loadData()
})

// ==================== 数据加载 ====================
const loadData = () => {
  loading.value = true

  setTimeout(() => {
    // 过滤数据
    let filteredData = [...allData]

    if (searchForm.name) {
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(searchForm.name.toLowerCase())
      )
    }

    if (searchForm.type) {
      filteredData = filteredData.filter(item => item.type === searchForm.type)
    }

    if (searchForm.faction) {
      filteredData = filteredData.filter(item => item.faction === searchForm.faction)
    }

    // 分页
    pagination.total = filteredData.length
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    tableData.value = filteredData.slice(start, end)

    loading.value = false
  }, 300)
}

// ==================== 搜索和重置 ====================
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.faction = ''
  pagination.page = 1
  loadData()
}

// ==================== 分页 ====================
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

// ==================== 表格操作 ====================
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// ==================== CRUD 操作 ====================
const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除装备 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = allData.findIndex(item => item.id === row.id)
    if (index > -1) {
      allData.splice(index, 1)

      // 保存到 localStorage
      saveToLocalStorage()

      loadData()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    allData = allData.filter(item => !selectedIds.value.includes(item.id))
    selectedIds.value = []

    // 保存到 localStorage
    saveToLocalStorage()

    loadData()
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true

  setTimeout(() => {
    if (formData.id) {
      // 编辑
      const index = allData.findIndex(item => item.id === formData.id)
      if (index > -1) {
        allData[index] = {
          ...formData,
          updated_at: new Date().toLocaleString()
        }
      }
      ElMessage.success('编辑成功')
    } else {
      // 新增
      const newItem = {
        ...formData,
        id: allData.length > 0 ? Math.max(...allData.map(item => item.id)) + 1 : 1,
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      allData.unshift(newItem)
      ElMessage.success('新增成功')
    }

    // 保存到 localStorage
    saveToLocalStorage()

    dialogVisible.value = false
    submitting.value = false
    loadData()
  }, 500)
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.code = ''
  formData.type = 'sensor'
  formData.faction = 'blue'
  formData.manufacturer = ''
  formData.status = 'active'
  formData.detection_range = 0
  formData.detection_accuracy = 0
  formData.communication_range = 0
  formData.command_capacity = 0
  formData.strike_range = 0
  formData.attack_power = 0
  formData.production_year = ''
  formData.service_life = 0
  formData.description = ''
}

const handleTypeChange = () => {
  // 类型改变时清空特定参数
  formData.detection_range = 0
  formData.detection_accuracy = 0
  formData.communication_range = 0
  formData.command_capacity = 0
  formData.strike_range = 0
  formData.attack_power = 0
}

// ==================== 导入导出 ====================
const handleExport = () => {
  const exportData = tableData.value.map(item => {
    const { created_at, updated_at, ...rest } = item
    return rest
  })

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `equipment_export_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success({
    message: `已导出 ${exportData.length} 条记录`,
    duration: 3000
  })
}

const handleImport = () => {
  importFileInput.value.click()
}

const handleImportFile = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (!Array.isArray(data)) {
        throw new Error('数据格式错误')
      }

      ElMessageBox.confirm(
        `确定要导入 ${data.length} 条记录吗？`,
        '导入确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 处理导入数据
        const importedData = data.map((item, index) => ({
          ...item,
          id: allData.length + index + 1,
          created_at: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }))

        allData = [...allData, ...importedData]

        // 保存到 localStorage
        saveToLocalStorage()

        loadData()
        ElMessage.success(`成功导入 ${data.length} 条记录`)
      }).catch(() => {})
    } catch (error) {
      ElMessage.error('导入失败：' + error.message)
    }
  }

  reader.readAsText(file)
  event.target.value = ''
}

// ==================== 辅助函数 ====================
const getTypeName = (type) => {
  const typeMap = {
    sensor: '传感器',
    command: '指挥中心',
    striker: '打击单元',
    communication: '通信节点',
    platform: '平台载具'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
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
.equipment-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f0f2f5;
}

.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .search-section {
    display: flex;
    align-items: center;
  }

  .action-section {
    display: flex;
    gap: 10px;
  }
}

.table-container {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .params-display {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>