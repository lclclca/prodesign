<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>系统概览</h2>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="8">
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

      <el-col :span="8">
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

      <el-col :span="8">
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
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { formatDateTime } from '@/utils/format'

const trendChartRef = ref(null)
const pieChartRef = ref(null)

const stats = ref({
  equipmentCount: 126,
  scenarioCount: 45,
  assessmentCount: 89
})

const recentActivities = ref([
  {
    time: formatDateTime(new Date()),
    user: '张三',
    action: '创建想定',
    target: '防空作战想定 v1.0',
    status: 'success'
  },
  {
    time: formatDateTime(new Date(Date.now() - 3600000)),
    user: '李四',
    action: '运行评估',
    target: '项目-001 综合效能评估',
    status: 'success'
  },
  {
    time: formatDateTime(new Date(Date.now() - 7200000)),
    user: '王五',
    action: '编辑网络',
    target: '作战网络-A',
    status: 'success'
  }
])

onMounted(() => {
  initTrendChart()
  initPieChart()
})

const initTrendChart = () => {
  const chart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['评估任务', '完成任务']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '评估任务',
        type: 'line',
        data: [12, 15, 10, 18, 20, 16],
        smooth: true
      },
      {
        name: '完成任务',
        type: 'line',
        data: [10, 14, 9, 16, 18, 15],
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
  const option = {
    tooltip: {
      trigger: 'item'
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
        data: [
          { value: 35, name: '传感器' },
          { value: 28, name: '决策' },
          { value: 42, name: '影响器' },
          { value: 21, name: '支援保障' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
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
