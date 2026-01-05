// 评估历史模型
// 位置: backend/models/EvaluationHistory_model.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database_config');

const EvaluationHistory = sequelize.define('EvaluationHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  project_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  overall_score: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  metrics: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('metrics');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('metrics', JSON.stringify(value));
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
  vulnerabilities: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('vulnerabilities');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('vulnerabilities', JSON.stringify(value));
    }
  },
  suggestions: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('suggestions');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('suggestions', JSON.stringify(value));
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'evaluation_history',
  timestamps: true,
  underscored: true
});

module.exports = EvaluationHistory;
