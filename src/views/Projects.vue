<template>
  <div class="projects-page">
    <div class="page-header">
      <h2>项目管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreateProject">
        新建项目
      </el-button>
    </div>

    <div class="container">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索项目名称"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
          <el-option label="全部" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
          <el-option label="已归档" value="archived" />
        </el-select>
      </div>

      <!-- 项目列表 -->
      <el-row :gutter="20">
        <el-col
          v-for="project in filteredProjects"
          :key="project.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="project-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="project-name">{{ project.name }}</span>
                <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, project)">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open" :icon="View">打开</el-dropdown-item>
                      <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="export" :icon="Download">导出</el-dropdown-item>
                      <el-dropdown-item command="delete" :icon="Delete" divided>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="project-content" @click="handleOpenProject(project)">
              <div class="project-stats">
                <div class="stat-item">
                  <el-icon><Connection /></el-icon>
                  <span>{{ project.nodeCount }} 节点</span>
                </div>
                <div class="stat-item">
                  <el-icon><Share /></el-icon>
                  <span>{{ project.edgeCount }} 连接</span>
                </div>
              </div>

              <div class="project-meta">
                <el-tag :type="getStatusType(project.status)" size="small">
                  {{ getStatusText(project.status) }}
                </el-tag>
                <span class="update-time">
                  {{ formatTime(project.updatedAt) }}
                </span>
              </div>

              <div v-if="project.description" class="project-desc">
                {{ project.description }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="filteredProjects.length === 0" description="暂无项目">
        <el-button type="primary" @click="handleCreateProject">
          创建第一个项目
        </el-button>
      </el-empty>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建项目' : '编辑项目'"
      width="500px"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        label-width="80px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>

        <el-form-item label="项目状态" prop="status">
          <el-select v-model="projectForm.status" style="width: 100%">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  MoreFilled,
  View,
  Edit,
  Download,
  Delete,
  Connection,
  Share
} from '@element-plus/icons-vue'

const router = useRouter()

// Mock项目数据
const projects = ref([
  {
    id: '1',
    name: '演示项目1',
    description: '这是一个演示项目',
    status: 'active',
    nodeCount: 8,
    edgeCount: 12,
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-01-20T15:30:00'
  },
  {
    id: '2',
    name: '演示项目2',
    description: '另一个演示项目',
    status: 'completed',
    nodeCount: 6,
    edgeCount: 9,
    createdAt: '2024-01-10T09:00:00',
    updatedAt: '2024-01-18T14:20:00'
  }
])

const searchQuery = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const dialogMode = ref('create')
const projectFormRef = ref(null)

const projectForm = reactive({
  name: '',
  description: '',
  status: 'active'
})

const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ]
}

// 过滤后的项目列表
const filteredProjects = computed(() => {
  let result = projects.value

  // 按名称搜索
  if (searchQuery.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 按状态筛选
  if (statusFilter.value) {
    result = result.filter(p => p.status === statusFilter.value)
  }

  return result
})

// 处理命令
const handleCommand = (command, project) => {
  switch (command) {
    case 'open':
      handleOpenProject(project)
      break
    case 'edit':
      handleEditProject(project)
      break
    case 'export':
      handleExportProject(project)
      break
    case 'delete':
      handleDeleteProject(project)
      break
  }
}

// 打开项目
const handleOpenProject = (project) => {
  // 将项目数据保存到localStorage
  localStorage.setItem('currentProject', JSON.stringify(project))
  router.push('/network-canvas')
  ElMessage.success(`已打开项目：${project.name}`)
}

// 创建项目
const handleCreateProject = () => {
  dialogMode.value = 'create'
  projectForm.name = ''
  projectForm.description = ''
  projectForm.status = 'active'
  dialogVisible.value = true
}

// 编辑项目
const handleEditProject = (project) => {
  dialogMode.value = 'edit'
  projectForm.id = project.id
  projectForm.name = project.name
  projectForm.description = project.description
  projectForm.status = project.status
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = () => {
  projectFormRef.value.validate((valid) => {
    if (!valid) return

    if (dialogMode.value === 'create') {
      // 创建新项目
      const newProject = {
        id: Date.now().toString(),
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status,
        nodeCount: 0,
        edgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      projects.value.push(newProject)
      ElMessage.success('项目创建成功')
    } else {
      // 更新项目
      const index = projects.value.findIndex(p => p.id === projectForm.id)
      if (index > -1) {
        projects.value[index] = {
          ...projects.value[index],
          name: projectForm.name,
          description: projectForm.description,
          status: projectForm.status,
          updatedAt: new Date().toISOString()
        }
        ElMessage.success('项目更新成功')
      }
    }

    dialogVisible.value = false
  })
}

// 导出项目
const handleExportProject = (project) => {
  const data = JSON.stringify(project, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('项目导出成功')
}

// 删除项目
const handleDeleteProject = (project) => {
  ElMessageBox.confirm(
    `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index > -1) {
      projects.value.splice(index, 1)
      ElMessage.success('项目已删除')
    }
  }).catch(() => {})
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑在 computed 中处理
}

// 辅助函数
const getStatusType = (status) => {
  const types = {
    active: 'success',
    completed: 'info',
    archived: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档'
  }
  return texts[status] || status
}

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

onMounted(() => {
  // 从localStorage加载项目列表
  const savedProjects = localStorage.getItem('projects')
  if (savedProjects) {
    try {
      projects.value = JSON.parse(savedProjects)
    } catch (error) {
      console.error('Load projects error:', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.projects-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  }
}

.container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  .el-input {
    flex: 1;
    max-width: 300px;
  }

  .el-select {
    width: 150px;
  }
}

.project-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .project-name {
      font-weight: 500;
      font-size: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .el-icon {
      cursor: pointer;
      font-size: 18px;

      &:hover {
        color: #409eff;
      }
    }
  }

  .project-content {
    .project-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
        color: #606266;

        .el-icon {
          font-size: 16px;
        }
      }
    }

    .project-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .update-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .project-desc {
      font-size: 13px;
      color: #909399;
      line-height: 1.6;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;

    .el-input,
    .el-select {
      max-width: 100%;
      width: 100%;
    }
  }
}
</style>
