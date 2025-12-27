<template>
  <div class="equipment-management-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon sensor">📡</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.sensor }}</div>
            <div class="stat-label">传感器</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon command">🎯</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.command }}</div>
            <div class="stat-label">决策类</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon striker">🚀</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.striker }}</div>
            <div class="stat-label">影响器</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon support">📶</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.support }}</div>
            <div class="stat-label">支援保障</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="top-toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.name"
          placeholder="搜索装备名称或型号"
          clearable
          style="width: 220px; margin-right: 10px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchForm.baseType"
          placeholder="装备类型"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="handleSearch"
        >
          <el-option label="全部类型" value="" />
          <el-option label="传感器" value="sensor" />
          <el-option label="决策类" value="command" />
          <el-option label="影响器" value="striker" />
          <el-option label="支援保障" value="support" />
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
          :disabled="selectedEquipment.length === 0"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedEquipment.length }})
        </el-button>
      </div>
    </div>

    <!-- 装备列表表格 -->
    <div class="table-container">
      <el-table
        :data="filteredEquipment"
        v-loading="loading"
        stripe
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="70" align="center" />
        
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <span style="font-size: 24px;">{{ row.icon }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="装备名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="model" label="装备型号" width="140" show-overflow-tooltip />
        
        <el-table-column prop="baseType" label="装备类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.baseType)">
              {{ getTypeName(row.baseType) }}
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
        
        <el-table-column label="关键性能参数" min-width="280" align="center">
          <template #default="{ row }">
            <div class="params-display">
              <!-- 传感器参数 -->
              <template v-if="row.baseType === 'sensor' && row.performance">
                <el-tag size="small" type="primary">
                  探测: {{ row.performance.detectionRange }}km
                </el-tag>
                <el-tag size="small" type="success">
                  概率: {{ (row.performance.detectionProbability * 100).toFixed(0) }}%
                </el-tag>
                <el-tag size="small" type="info">
                  抗干扰: {{ (row.performance.antiJamming * 100).toFixed(0) }}%
                </el-tag>
              </template>
              
              <!-- 决策类参数 -->
              <template v-if="row.baseType === 'command' && row.performance">
                <el-tag size="small" type="success">
                  范围: {{ row.performance.commandRange }}km
                </el-tag>
                <el-tag size="small" type="warning">
                  处理: {{ row.performance.processingCapacity }}条/秒
                </el-tag>
                <el-tag size="small" type="info">
                  时延: {{ row.performance.decisionDelay }}秒
                </el-tag>
              </template>
              
              <!-- 影响器参数 -->
              <template v-if="row.baseType === 'striker' && row.performance">
                <el-tag size="small" type="danger">
                  打击: {{ row.performance.strikeRange }}km
                </el-tag>
                <el-tag size="small" type="warning">
                  毁伤: {{ (row.performance.damageRate * 100).toFixed(0) }}%
                </el-tag>
                <el-tag size="small" type="info">
                  弹药: {{ row.performance.ammunition }}
                </el-tag>
              </template>
              
              <!-- 支援保障参数 -->
              <template v-if="row.baseType === 'support' && row.performance">
                <el-tag size="small" type="success">
                  通信: {{ row.performance.commDistance }}km
                </el-tag>
                <el-tag size="small" type="primary">
                  带宽: {{ row.performance.bandwidth }}Mbps
                </el-tag>
                <el-tag size="small" type="info">
                  可靠性: {{ (row.performance.reliability * 100).toFixed(0) }}%
                </el-tag>
              </template>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isCustom ? 'warning' : 'success'" size="small">
              {{ row.isCustom ? '自定义' : '预置' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleView(row)">
              查看
            </el-button>
            <el-button 
              v-if="row.isCustom"
              type="primary" 
              link 
              :icon="Edit" 
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button 
              v-if="row.isCustom"
              type="danger" 
              link 
              :icon="Delete" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-tag v-if="!row.isCustom" size="small" type="info">系统预置</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-divider content-position="left">基础信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="装备名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入装备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备型号" prop="model">
              <el-input v-model="formData.model" placeholder="请输入装备型号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="装备类型" prop="baseType">
              <el-select v-model="formData.baseType" placeholder="请选择装备类型" style="width: 100%;" @change="handleTypeChange">
                <el-option label="传感器" value="sensor" />
                <el-option label="决策类" value="command" />
                <el-option label="影响器" value="striker" />
                <el-option label="支援保障" value="support" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属阵营" prop="faction">
              <el-select v-model="formData.faction" placeholder="请选择所属阵营" style="width: 100%;">
                <el-option label="我方" value="blue" />
                <el-option label="敌方" value="red" />
                <el-option label="中立" value="neutral" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="formData.icon" placeholder="输入emoji图标" maxlength="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色" prop="color">
              <el-color-picker v-model="formData.color" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">性能参数</el-divider>

        <!-- 传感器特有参数 -->
        <template v-if="formData.baseType === 'sensor'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="探测范围" prop="performance.detectionRange">
                <el-input-number v-model="formData.performance.detectionRange" :min="0" :max="2000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="探测精度" prop="performance.detectionAccuracy">
                <el-input-number v-model="formData.performance.detectionAccuracy" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">m</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="探测概率" prop="performance.detectionProbability">
                <el-slider v-model="formData.performance.detectionProbability" :min="0" :max="1" :step="0.01" :format-tooltip="val => (val * 100).toFixed(0) + '%'" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="抗干扰能力" prop="performance.antiJamming">
                <el-slider v-model="formData.performance.antiJamming" :min="0" :max="1" :step="0.01" :format-tooltip="val => (val * 100).toFixed(0) + '%'" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分辨率" prop="performance.resolution">
                <el-input-number v-model="formData.performance.resolution" :min="0.1" :max="100" :step="0.1" style="width: 100%;" />
                <span style="margin-left: 5px;">m</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="工作频段" prop="performance.frequency">
                <el-select v-model="formData.performance.frequency" style="width: 100%;">
                  <el-option label="L-band" value="L-band" />
                  <el-option label="S-band" value="S-band" />
                  <el-option label="C-band" value="C-band" />
                  <el-option label="X-band" value="X-band" />
                  <el-option label="Optical" value="optical" />
                  <el-option label="Infrared" value="infrared" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 决策类特有参数 -->
        <template v-if="formData.baseType === 'command'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="指挥范围" prop="performance.commandRange">
                <el-input-number v-model="formData.performance.commandRange" :min="0" :max="2000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="处理能力" prop="performance.processingCapacity">
                <el-input-number v-model="formData.performance.processingCapacity" :min="0" :max="10000" style="width: 100%;" />
                <span style="margin-left: 5px;">条/秒</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="决策时延" prop="performance.decisionDelay">
                <el-input-number v-model="formData.performance.decisionDelay" :min="0" :max="60" style="width: 100%;" />
                <span style="margin-left: 5px;">秒</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可指挥节点" prop="performance.maxNodes">
                <el-input-number v-model="formData.performance.maxNodes" :min="0" :max="200" style="width: 100%;" />
                <span style="margin-left: 5px;">个</span>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 影响器特有参数 -->
        <template v-if="formData.baseType === 'striker'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="打击范围" prop="performance.strikeRange">
                <el-input-number v-model="formData.performance.strikeRange" :min="0" :max="2000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="毁伤概率" prop="performance.damageRate">
                <el-slider v-model="formData.performance.damageRate" :min="0" :max="1" :step="0.01" :format-tooltip="val => (val * 100).toFixed(0) + '%'" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="反应时间" prop="performance.responseTime">
                <el-input-number v-model="formData.performance.responseTime" :min="0" :max="600" style="width: 100%;" />
                <span style="margin-left: 5px;">秒</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="弹药量" prop="performance.ammunition">
                <el-input-number v-model="formData.performance.ammunition" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">发</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="打击精度CEP" prop="performance.accuracy">
                <el-input-number v-model="formData.performance.accuracy" :min="0" :max="500" style="width: 100%;" />
                <span style="margin-left: 5px;">m</span>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 支援保障特有参数 -->
        <template v-if="formData.baseType === 'support'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="通信距离" prop="performance.commDistance">
                <el-input-number v-model="formData.performance.commDistance" :min="0" :max="2000" style="width: 100%;" />
                <span style="margin-left: 5px;">km</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="通信带宽" prop="performance.bandwidth">
                <el-input-number v-model="formData.performance.bandwidth" :min="0" :max="1000" style="width: 100%;" />
                <span style="margin-left: 5px;">Mbps</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="中继能力" prop="performance.relayCapacity">
                <el-input-number v-model="formData.performance.relayCapacity" :min="0" :max="50" style="width: 100%;" />
                <span style="margin-left: 5px;">链路</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="通信可靠性" prop="performance.reliability">
                <el-slider v-model="formData.performance.reliability" :min="0" :max="1" :step="0.01" :format-tooltip="val => (val * 100).toFixed(0) + '%'" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

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
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentEquipment">
        <el-descriptions-item label="装备名称" :span="2">
          <span style="font-size: 18px; font-weight: bold;">{{ currentEquipment.name }}</span>
        </el-descriptions-item>
        
        <el-descriptions-item label="装备型号">{{ currentEquipment.model }}</el-descriptions-item>
        <el-descriptions-item label="装备ID">{{ currentEquipment.id }}</el-descriptions-item>
        
        <el-descriptions-item label="装备类型">
          <el-tag :type="getTypeTagType(currentEquipment.baseType)">
            {{ getTypeName(currentEquipment.baseType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属阵营">
          <el-tag :type="currentEquipment.faction === 'blue' ? 'primary' : 'danger'">
            {{ getFactionName(currentEquipment.faction) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="图标">
          <span style="font-size: 32px;">{{ currentEquipment.icon }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="颜色">
          <el-color-picker v-model="currentEquipment.color" disabled />
        </el-descriptions-item>
        
        <el-descriptions-item label="数据来源" :span="2">
          <el-tag :type="currentEquipment.isCustom ? 'warning' : 'success'">
            {{ currentEquipment.isCustom ? '自定义装备' : '系统预置装备' }}
          </el-tag>
        </el-descriptions-item>

        <!-- 性能参数 -->
        <el-descriptions-item label="性能参数" :span="2">
          <div class="performance-detail">
            <!-- 传感器参数 -->
            <template v-if="currentEquipment.baseType === 'sensor' && currentEquipment.performance">
              <div class="param-item">
                <span class="param-label">探测范围:</span>
                <span class="param-value">{{ currentEquipment.performance.detectionRange }} km</span>
              </div>
              <div class="param-item">
                <span class="param-label">探测精度:</span>
                <span class="param-value">{{ currentEquipment.performance.detectionAccuracy }} m</span>
              </div>
              <div class="param-item">
                <span class="param-label">探测概率:</span>
                <span class="param-value">{{ (currentEquipment.performance.detectionProbability * 100).toFixed(0) }}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">分辨率:</span>
                <span class="param-value">{{ currentEquipment.performance.resolution }} m</span>
              </div>
              <div class="param-item">
                <span class="param-label">工作频段:</span>
                <span class="param-value">{{ currentEquipment.performance.frequency }}</span>
              </div>
              <div class="param-item">
                <span class="param-label">抗干扰能力:</span>
                <span class="param-value">{{ (currentEquipment.performance.antiJamming * 100).toFixed(0) }}%</span>
              </div>
            </template>
            
            <!-- 决策类参数 -->
            <template v-if="currentEquipment.baseType === 'command' && currentEquipment.performance">
              <div class="param-item">
                <span class="param-label">指挥范围:</span>
                <span class="param-value">{{ currentEquipment.performance.commandRange }} km</span>
              </div>
              <div class="param-item">
                <span class="param-label">信息处理能力:</span>
                <span class="param-value">{{ currentEquipment.performance.processingCapacity }} 条/秒</span>
              </div>
              <div class="param-item">
                <span class="param-label">决策时延:</span>
                <span class="param-value">{{ currentEquipment.performance.decisionDelay }} 秒</span>
              </div>
              <div class="param-item">
                <span class="param-label">可指挥节点数:</span>
                <span class="param-value">{{ currentEquipment.performance.maxNodes }} 个</span>
              </div>
            </template>
            
            <!-- 影响器参数 -->
            <template v-if="currentEquipment.baseType === 'striker' && currentEquipment.performance">
              <div class="param-item">
                <span class="param-label">打击范围:</span>
                <span class="param-value">{{ currentEquipment.performance.strikeRange }} km</span>
              </div>
              <div class="param-item">
                <span class="param-label">毁伤概率:</span>
                <span class="param-value">{{ (currentEquipment.performance.damageRate * 100).toFixed(0) }}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">反应时间:</span>
                <span class="param-value">{{ currentEquipment.performance.responseTime }} 秒</span>
              </div>
              <div class="param-item">
                <span class="param-label">弹药量:</span>
                <span class="param-value">{{ currentEquipment.performance.ammunition }} 发</span>
              </div>
              <div class="param-item">
                <span class="param-label">打击精度 CEP:</span>
                <span class="param-value">{{ currentEquipment.performance.accuracy }} m</span>
              </div>
            </template>
            
            <!-- 支援保障参数 -->
            <template v-if="currentEquipment.baseType === 'support' && currentEquipment.performance">
              <div class="param-item">
                <span class="param-label">通信距离:</span>
                <span class="param-value">{{ currentEquipment.performance.commDistance }} km</span>
              </div>
              <div class="param-item">
                <span class="param-label">通信带宽:</span>
                <span class="param-value">{{ currentEquipment.performance.bandwidth }} Mbps</span>
              </div>
              <div class="param-item">
                <span class="param-label">中继能力:</span>
                <span class="param-value">{{ currentEquipment.performance.relayCapacity }} 条链路</span>
              </div>
              <div class="param-item">
                <span class="param-label">通信可靠性:</span>
                <span class="param-value">{{ (currentEquipment.performance.reliability * 100).toFixed(0) }}%</span>
              </div>
            </template>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="装备描述" :span="2">
          {{ currentEquipment.description || '暂无描述' }}
        </el-descriptions-item>
        
        <el-descriptions-item label="创建时间" :span="2" v-if="currentEquipment.createdAt">
          {{ currentEquipment.createdAt }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/store/modules/equipment'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Edit,
  View
} from '@element-plus/icons-vue'

// ==================== Store ====================
const equipmentStore = useEquipmentStore()

// ==================== 状态定义 ====================
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  baseType: '',
  faction: ''
})

// 选中的装备
const selectedEquipment = ref([])
const currentEquipment = ref(null)

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  model: '',
  baseType: 'sensor',
  faction: 'blue',
  icon: '📍',
  color: '#409EFF',
  performance: {},
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入装备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入装备型号', trigger: 'blur' }
  ],
  baseType: [
    { required: true, message: '请选择装备类型', trigger: 'change' }
  ],
  faction: [
    { required: true, message: '请选择所属阵营', trigger: 'change' }
  ]
}

// ==================== 计算属性 ====================
const dialogTitle = computed(() => {
  return formData.id ? '编辑装备' : '新增装备'
})

// 统计信息
const stats = computed(() => {
  const all = equipmentStore.allEquipment
  return {
    sensor: all.filter(e => e.baseType === 'sensor').length,
    command: all.filter(e => e.baseType === 'command').length,
    striker: all.filter(e => e.baseType === 'striker').length,
    support: all.filter(e => e.baseType === 'support').length
  }
})

// 过滤后的装备列表
const filteredEquipment = computed(() => {
  let result = equipmentStore.allEquipment

  if (searchForm.name) {
    result = result.filter(e => 
      e.name.toLowerCase().includes(searchForm.name.toLowerCase()) ||
      e.model?.toLowerCase().includes(searchForm.name.toLowerCase())
    )
  }

  if (searchForm.baseType) {
    result = result.filter(e => e.baseType === searchForm.baseType)
  }

  if (searchForm.faction) {
    result = result.filter(e => e.faction === searchForm.faction)
  }

  return result
})

// ==================== 生命周期 ====================
onMounted(() => {
  // 从localStorage恢复自定义装备
  equipmentStore.restoreFromStorage()
  console.log('✅ 装备管理页面已加载，装备总数:', equipmentStore.allEquipment.length)
})

// ==================== 搜索和重置 ====================
const handleSearch = () => {
  // 计算属性会自动更新
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.baseType = ''
  searchForm.faction = ''
}

// ==================== 表格操作 ====================
const handleSelectionChange = (selection) => {
  selectedEquipment.value = selection
}

// ==================== CRUD 操作 ====================
const handleAdd = () => {
  resetForm()
  initPerformance('sensor')
  dialogVisible.value = true
}

const handleEdit = (row) => {
  if (!row.isCustom) {
    ElMessage.warning('系统预置装备不可编辑')
    return
  }
  
  Object.assign(formData, {
    ...row,
    performance: { ...row.performance }
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  currentEquipment.value = row
  detailVisible.value = true
}

const handleDelete = (row) => {
  if (!row.isCustom) {
    ElMessage.warning('系统预置装备不可删除')
    return
  }

  ElMessageBox.confirm(
    `确定要删除装备 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    equipmentStore.deleteCustomEquipment(row.id)
  }).catch(() => {})
}

const handleBatchDelete = () => {
  const customEquipment = selectedEquipment.value.filter(e => e.isCustom)
  
  if (customEquipment.length === 0) {
    ElMessage.warning('只能删除自定义装备')
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${customEquipment.length} 个自定义装备吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    customEquipment.forEach(equipment => {
      equipmentStore.deleteCustomEquipment(equipment.id)
    })
    selectedEquipment.value = []
  }).catch(() => {})
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true

  // 验证性能参数
  const validation = equipmentStore.validatePerformance(formData.baseType, formData.performance)
  if (!validation.valid) {
    ElMessage.warning(`缺少必填性能参数: ${validation.missing.join(', ')}`)
    submitting.value = false
    return
  }

  setTimeout(() => {
    if (formData.id) {
      // 编辑
      equipmentStore.updateCustomEquipment(formData.id, {
        name: formData.name,
        model: formData.model,
        baseType: formData.baseType,
        faction: formData.faction,
        icon: formData.icon,
        color: formData.color,
        performance: formData.performance,
        description: formData.description
      })
    } else {
      // 新增
      equipmentStore.addCustomEquipment({
        name: formData.name,
        model: formData.model,
        baseType: formData.baseType,
        faction: formData.faction,
        icon: formData.icon,
        color: formData.color,
        performance: formData.performance,
        description: formData.description
      })
    }

    dialogVisible.value = false
    submitting.value = false
  }, 300)
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.model = ''
  formData.baseType = 'sensor'
  formData.faction = 'blue'
  formData.icon = '📍'
  formData.color = '#409EFF'
  formData.performance = {}
  formData.description = ''
}

const handleTypeChange = (type) => {
  initPerformance(type)
}

const initPerformance = (type) => {
  switch(type) {
    case 'sensor':
      formData.performance = {
        detectionRange: 200,
        detectionAccuracy: 10,
        detectionProbability: 0.8,
        resolution: 1.0,
        frequency: 'X-band',
        antiJamming: 0.7
      }
      formData.icon = '📡'
      formData.color = '#409EFF'
      break
    case 'command':
      formData.performance = {
        commandRange: 300,
        processingCapacity: 500,
        decisionDelay: 3,
        maxNodes: 30
      }
      formData.icon = '🎯'
      formData.color = '#67C23A'
      break
    case 'striker':
      formData.performance = {
        strikeRange: 150,
        damageRate: 0.75,
        responseTime: 10,
        ammunition: 10,
        accuracy: 15
      }
      formData.icon = '🚀'
      formData.color = '#F56C6C'
      break
    case 'support':
      formData.performance = {
        commDistance: 250,
        bandwidth: 80,
        relayCapacity: 8,
        reliability: 0.9
      }
      formData.icon = '📶'
      formData.color = '#E6A23C'
      break
  }
}

// ==================== 辅助函数 ====================
const getTypeName = (type) => {
  const typeMap = {
    sensor: '传感器',
    command: '决策类',
    striker: '影响器',
    support: '支援保障'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const tagMap = {
    sensor: 'primary',
    command: 'success',
    striker: 'danger',
    support: 'warning'
  }
  return tagMap[type] || ''
}

const getFactionName = (faction) => {
  const factionMap = {
    blue: '我方',
    red: '敌方',
    neutral: '中立'
  }
  return factionMap[faction] || faction
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;

  .stat-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 15px;

      .stat-icon {
        font-size: 48px;
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;

        &.sensor { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.command { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.striker { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        &.support { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #303133;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }
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

.performance-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;

  .param-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fff;
    border-radius: 4px;

    .param-label {
      color: #606266;
      font-weight: 500;
    }

    .param-value {
      color: #303133;
      font-weight: bold;
    }
  }
}
</style>