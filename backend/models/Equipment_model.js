// 装备模型
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
    allowNull: false
  },
  base_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['sensor', 'command', 'striker', 'support']]
    }
  },
  faction: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['blue', 'red', 'neutral']]
    }
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '📍'
  },
  color: {
    type: DataTypes.STRING(20)
  },
  performance: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('performance');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('performance', JSON.stringify(value));
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  is_custom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  underscored: true
});

module.exports = Equipment;