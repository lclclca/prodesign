<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>系统概览</h2>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="stat-icon">
            <el-icon :size="40"><Box /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.equipmentCount }}</div>
            <div class="stat-label">装备总数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="stat-icon">
            <el-icon :size="40"><Map /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.scenarioCount }}</div>
            <div class="stat-label">想定数量</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="stat-icon">
            <el-icon :size="40"><Share /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.projectCount }}</div>
            <div class="stat-label">作战网络</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="stat-icon">
            <el-icon :size="40"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.assessmentCount }}</div>
            <div class="stat-label">评估任务</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>最近评估趋势</h3>
          </div>
          <div ref="trendChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>装备类型分布</h3>
          </div>
          <div ref="pieChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 最近活动 -->
    <div class="card recent-activity">
      <div class="card-header">
        <h3>最近活动</h3>
      </div>
      <el-table :data="recentActivities" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="target" label="对象" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'info'">
              {{ scope.row.status === 'success' ? '成功' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { formatDateTime } from '@/utils/format'

const trendChartRef = ref(null)
const pieChartRef = ref(null)

// 从 localStorage 获取实际数据
const equipments = ref([])
const projects = ref([])
const evaluationHistory = ref([])

// 加载数据
const loadData = () => {
  // 加载装备数据
  try {
    const savedEquipments = localStorage.getItem('equipments')
    if (savedEquipments) {
      equipments.value = JSON.parse(savedEquipments)
    }
  } catch (error) {
    console.error('加载装备数据失败:', error)
  }

  // 加载项目数据
  try {
    const savedProjects = localStorage.getItem('projects')
    if (savedProjects) {
      projects.value = JSON.parse(savedProjects)
    }
  } catch (error) {
    console.error('加载项目数据失败:', error)
  }

  // 加载评估历史（如果存在）
  try {
    const savedEvaluations = localStorage.getItem('evaluationHistory')
    if (savedEvaluations) {
      evaluationHistory.value = JSON.parse(savedEvaluations)
    }
  } catch (error) {
    console.error('加载评估历史失败:', error)
  }
}

// 计算统计数据
const stats = computed(() => {
  return {
    equipmentCount: equipments.value.length || 0,
    scenarioCount: 0, // 暂时没有想定数据源
    projectCount: projects.value.length || 0,
    assessmentCount: evaluationHistory.value.length || 0
  }
})

// 计算装备类型分布
const equipmentTypeDistribution = computed(() => {
  const typeMap = {
    sensor: '传感器',
    command: '指挥中心',
    striker: '打击单元',
    communication: '通信节点',
    platform: '平台载具'
  }

  const distribution = {}

  equipments.value.forEach(equipment => {
    const typeName = typeMap[equipment.type] || equipment.type
    distribution[typeName] = (distribution[typeName] || 0) + 1
  })

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }))
})

// 生成最近活动（从实际数据生成）
const recentActivities = computed(() => {
  const activities = []

  // 从评估历史生成活动
  evaluationHistory.value.slice(0, 3).forEach(evaluation => {
    activities.push({
      time: formatDateTime(new Date(evaluation.timestamp)),
      user: '系统用户',
      action: '运行评估',
      target: evaluation.projectName || '网络评估',
      status: 'success'
    })
  })

  // 从项目列表生成活动（最近修改的）
  const sortedProjects = [...projects.value]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3)

  sortedProjects.forEach(project => {
    activities.push({
      time: formatDateTime(new Date(project.updatedAt || project.createdAt)),
      user: '系统用户',
      action: project.updatedAt ? '编辑项目' : '创建项目',
      target: project.name,
      status: 'success'
    })
  })

  // 如果没有实际活动，返回占位数据
  if (activities.length === 0) {
    return [
      {
        time: formatDateTime(new Date()),
        user: '系统',
        action: '系统启动',
        target: '暂无活动记录',
        status: 'success'
      }
    ]
  }

  // 按时间排序，取最新的5条
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5)
})

onMounted(() => {
  loadData()
  initTrendChart()
  initPieChart()
})

const initTrendChart = () => {
  const chart = echarts.init(trendChartRef.value)

  // 根据评估历史生成趋势数据
  const generateTrendData = () => {
    if (evaluationHistory.value.length === 0) {
      // 没有数据时返回占位数据
      return {
        dates: ['暂无数据'],
        scores: [0]
      }
    }

    // 按月份分组统计
    const monthlyData = {}

    evaluationHistory.value.forEach(evaluation => {
      const date = new Date(evaluation.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          totalScore: 0
        }
      }

      monthlyData[monthKey].count++
      monthlyData[monthKey].totalScore += evaluation.overall_score || 0
    })

    // 转换为图表数据（最近6个月）
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6)
    const dates = sortedMonths.map(key => {
      const [year, month] = key.split('-')
      return `${month}月`
    })

    const counts = sortedMonths.map(key => monthlyData[key].count)
    const avgScores = sortedMonths.map(key =>
      Math.round(monthlyData[key].totalScore / monthlyData[key].count)
    )

    return { dates, counts, avgScores }
  }

  const { dates, counts, avgScores } = generateTrendData()

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['评估次数', '平均得分']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '评估次数',
        type: 'line',
        data: counts || [0],
        smooth: true
      },
      {
        name: '平均得分',
        type: 'line',
        data: avgScores || [0],
        smooth: true
      }
    ]
  }
  chart.setOption(option)

  window.addEventListener('resize', () => {
    chart.resize()
  })
}

const initPieChart = () => {
  const chart = echarts.init(pieChartRef.value)

  // 使用实际的装备类型分布数据
  const pieData = equipmentTypeDistribution.value.length > 0
    ? equipmentTypeDistribution.value
    : [{ value: 0, name: '暂无数据' }]

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '装备类型',
        type: 'pie',
        radius: '50%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c}'
        }
      }
    ]
  }
  chart.setOption(option)

  window.addEventListener('resize', () => {
    chart.resize()
  })
}
</script>

<style scoped lang="scss">
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
    
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      
      .stat-icon {
        opacity: 0.8;
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
      }
    }
  }
  
  .chart-section {
    margin-bottom: 20px;
  }
  
  .card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    
    .card-header {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e6e6e6;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }
  
  .recent-activity {
    margin-top: 20px;
  }
}
</style>
