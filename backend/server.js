// 服务器入口文件
// 位置: backend/server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize, testConnection } = require('./config/database');

// 导入路由
const usersRouter = require('./routes/users');
const equipmentRouter = require('./routes/equipment');
const networksRouter = require('./routes/networks');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(bodyParser.json({ limit: '10mb' })); // 解析JSON请求体，限制10MB
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/users', usersRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/networks', networksRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 同步数据库模型（开发环境）
    // 注意：生产环境应该使用迁移工具
    await sequelize.sync({ alter: false });
    console.log('✅ 数据库模型同步完成');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API基础路径: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();