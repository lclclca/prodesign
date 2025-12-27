// 网络模型
// 位置: backend/models/Network.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Network = sequelize.define('Network', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0'
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('data');
      return rawValue ? JSON.parse(rawValue) : { nodes: [], edges: [] };
    },
    set(value) {
      this.setDataValue('data', JSON.stringify(value));
    }
  },
  metadata: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('metadata');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value));
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'networks',
  timestamps: true,
  underscored: true
});

module.exports = Network;