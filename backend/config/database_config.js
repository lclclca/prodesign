// 数据库配置
// 位置: backend/config/database.js

const { Sequelize } = require('sequelize');
const path = require('path');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/killchain.db'),
  logging: false, // 生产环境设为false，开发环境可设为console.log
  define: {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    underscored: true // 使用下划线命名（created_at 而不是 createdAt）
  }
});

// 测试连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
};

module.exports = { sequelize, testConnection };