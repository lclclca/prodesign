// 项目模型
// 位置: backend/models/Project_model.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database_config');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'completed', 'archived']]
    }
  },
  nodes: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('nodes');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('nodes', JSON.stringify(value));
    }
  },
  edges: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('edges');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('edges', JSON.stringify(value));
    }
  },
  node_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  edge_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  network_mode: {
    type: DataTypes.STRING(20),
    defaultValue: 'both'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true
});

module.exports = Project;
