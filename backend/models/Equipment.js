// 装备模型（重构版 v2.0）
// 位置: backend/models/Equipment.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '装备名称'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '装备型号'
  },
  base_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['sensor', 'command', 'striker', 'support']]
    },
    comment: '装备类型'
  },
  faction: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['blue', 'red', 'neutral']]
    },
    comment: '归属方'
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '📍',
    comment: '图标'
  },
  color: {
    type: DataTypes.STRING(20),
    comment: '显示颜色'
  },
  performance: {
    type: DataTypes.TEXT,
    comment: '性能参数（JSON格式）',
    get() {
      const rawValue = this.getDataValue('performance');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('performance', JSON.stringify(value));
    }
  },
  description: {
    type: DataTypes.TEXT,
    comment: '描述'
  },
  is_custom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否自定义装备'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '创建者ID'
  },
  version: {
    type: DataTypes.STRING(10),
    defaultValue: '2.0',
    comment: '数据版本'
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  underscored: true,
  comment: '装备表'
});

// 添加实例方法：验证性能属性完整性
Equipment.prototype.validatePerformance = function() {
  const requiredFields = {
    sensor: ['detectionRange', 'detectionAccuracy', 'detectionProbability', 'antiJamming'],
    command: ['commandRange', 'processingCapacity', 'decisionDelay', 'maxNodes'],
    striker: ['strikeRange', 'damageRate', 'responseTime', 'ammunition', 'accuracy'],
    support: ['commDistance', 'bandwidth', 'relayCapacity', 'reliability']
  };
  
  const required = requiredFields[this.base_type] || [];
  const performance = this.performance || {};
  const missing = required.filter(field => !(field in performance));
  
  return {
    valid: missing.length === 0,
    missing
  };
};

module.exports = Equipment;
