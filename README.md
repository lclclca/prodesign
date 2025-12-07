# 杀伤链体系效能评估系统 - 前端项目

## 项目说明

这是一个基于 Vue 3 + Element Plus 的前端项目，用于杀伤链体系效能评估系统。

## 技术栈

- **框架**: Vue 3.3+ (Composition API)
- **构建工具**: Vite 5.0+
- **UI组件库**: Element Plus 2.4+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP客户端**: Axios 1.6+
- **图表库**: ECharts 5.4+
- **网络可视化**: Cytoscape.js 3.26+
- **样式**: SCSS

## 项目结构

```
src/
├── api/                    # API接口
│   ├── request.js         # Axios封装
│   ├── auth.js           # 认证API
│   ├── equipment.js      # 装备API
│   ├── scenario.js       # 想定API
│   └── network.js        # 网络和评估API
├── assets/                # 静态资源
│   └── styles/           # 样式文件
├── components/            # 组件
│   ├── Layout/           # 布局组件
│   ├── NetworkCanvas/    # 网络画布
│   ├── Charts/           # 图表组件
│   └── Common/           # 通用组件
├── views/                 # 页面
│   ├── Login.vue         # 登录页
│   ├── Dashboard.vue     # 仪表盘
│   ├── Equipment/        # 装备管理
│   ├── Scenario/         # 想定管理
│   ├── Network/          # 作战网络
│   ├── Mission/          # 任务管理
│   ├── Assessment/       # 评估分析
│   ├── Simulation/       # 推演仿真
│   ├── Report/           # 报告管理
│   └── System/           # 系统管理
├── router/                # 路由配置
├── store/                 # 状态管理
│   └── modules/
│       ├── user.js       # 用户状态
│       └── app.js        # 应用状态
├── utils/                 # 工具函数
│   ├── auth.js           # 认证工具
│   └── format.js         # 格式化工具
├── App.vue                # 根组件
└── main.js                # 入口文件
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

访问 http://localhost:3000

### 生产环境构建

```bash
npm run build
```

构建产物在 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 主要功能模块

### 1. 用户认证
- 登录/登出
- Token管理
- 权限控制

### 2. 装备管理
- 装备列表展示
- 添加/编辑/删除装备
- 装备类型筛选
- 装备模板管理

### 3. 想定管理
- 创建作战想定
- 配置战场环境
- 部署装备实例
- 想定模板

### 4. 作战网络建模
- 可视化网络编辑器
- 节点拖拽操作
- 关系连线
- 视图切换

### 5. 任务管理
- 创建作战任务
- 杀伤链搜索
- 路径展示

### 6. 评估分析
- 创建评估任务
- 网络结构分析
- 效能评估
- 结果可视化

### 7. 推演仿真
- 动态推演控制
- 事件注入
- 实时状态更新
- 推演回放

### 8. 报告管理
- 报告生成
- 报告模板
- 导出功能

## 核心组件说明

### Layout (布局组件)
- `Layout/index.vue` - 主布局容器
- `Layout/Sidebar.vue` - 侧边栏导航
- `Layout/Header.vue` - 顶部导航栏

### NetworkCanvas (网络画布组件)
基于 Cytoscape.js 实现的可视化网络编辑器

主要功能：
- 节点添加/删除/编辑
- 边连接/删除
- 缩放/平移
- 布局算法
- 视图切换

### Charts (图表组件)
基于 ECharts 实现的各类图表

包括：
- 折线图 - 趋势分析
- 柱状图 - 对比分析
- 饼图 - 比例分析
- 雷达图 - 多维评估
- 网络图 - 关系展示

## API接口

所有API请求通过 `src/api/request.js` 中封装的 axios 实例发送。

### 基础配置
- Base URL: `/api` (开发环境代理到 http://localhost:8000)
- 超时时间: 30秒
- 请求拦截: 自动添加 Authorization Token
- 响应拦截: 统一错误处理

### 接口示例

```javascript
// 获取装备列表
import { getEquipmentList } from '@/api/equipment'

const loadData = async () => {
  try {
    const data = await getEquipmentList({
      page: 1,
      page_size: 10,
      type: 'sensor'
    })
    console.log(data)
  } catch (error) {
    console.error(error)
  }
}
```

## 状态管理

使用 Pinia 进行状态管理。

### User Store (用户状态)

```javascript
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 登录
await userStore.login({ username, password })

// 获取用户信息
await userStore.getUserInfo()

// 登出
await userStore.logout()

// 检查权限
const hasPermission = userStore.hasPermission('equipment:create')
```

### App Store (应用状态)

```javascript
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

// 切换侧边栏
appStore.toggleSidebar()

// 设置主题
appStore.setTheme('dark')
```

## 路由配置

路由配置在 `src/router/index.js`

### 路由守卫
- 登录验证
- Token有效性检查
- 页面标题设置

### 动态路由示例

```javascript
// 跳转到网络编辑器
router.push({ 
  name: 'NetworkEditor', 
  params: { id: projectId } 
})

// 跳转到评估结果
router.push({ 
  name: 'AssessmentResult', 
  params: { id: taskId } 
})
```

## 工具函数

### 日期格式化

```javascript
import { formatDateTime, formatDate } from '@/utils/format'

formatDateTime(new Date()) // '2025-11-05 15:30:00'
formatDate(new Date())     // '2025-11-05'
```

### 数据格式化

```javascript
import { 
  formatEquipmentType, 
  formatFaction,
  formatPercent 
} from '@/utils/format'

formatEquipmentType('sensor')  // '传感器'
formatFaction('red')           // '红方'
formatPercent(0.85)           // '85.00%'
```

## 开发规范

### 命名规范
- 组件名: PascalCase (如: `NetworkCanvas.vue`)
- 文件名: kebab-case (如: `user-profile.js`)
- 常量: UPPER_SNAKE_CASE (如: `MAX_COUNT`)

### 代码风格
- 使用 ESLint 检查代码质量
- 使用 Prettier 格式化代码
- 组件使用 Composition API

### Git提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

## 环境变量

### 开发环境 (.env.development)
```env
VITE_APP_BASE_API=/api
VITE_APP_WS_URL=ws://localhost:8000/ws
```

### 生产环境 (.env.production)
```env
VITE_APP_BASE_API=https://your-domain.com/api
VITE_APP_WS_URL=wss://your-domain.com/ws
```

## 常见问题

### 1. 接口请求跨域
开发环境已配置代理，生产环境需要后端配置CORS。

### 2. 图表不显示
确保容器有明确的高度，并在mounted后初始化。

### 3. 路由跳转失败
检查路由是否正确定义，参数是否传递正确。

### 4. Token过期
自动跳转到登录页，需要重新登录。

## 后续开发

项目已经搭建好基础框架，后续开发需要：

1. **完善各个页面组件**
   - 想定管理的创建/编辑页面
   - 网络编辑器的详细实现
   - 任务管理和杀伤链展示
   - 评估结果可视化
   - 推演控制界面

2. **实现NetworkCanvas组件**
   - 基于Cytoscape.js的网络图
   - 节点样式配置
   - 布局算法集成
   - 交互功能完善

3. **图表组件封装**
   - 基于ECharts封装可复用组件
   - 雷达图、热力图等
   - 数据联动

4. **WebSocket集成**
   - 推演实时更新
   - 评估进度推送
   - 系统通知

5. **对接后端API**
   - 替换模拟数据
   - 完善错误处理
   - 优化加载状态

## 联系方式

如有问题，请查阅文档或联系开发团队。

---

**版本**: 1.0.0  
**最后更新**: 2025-11-05
