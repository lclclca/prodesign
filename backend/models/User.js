// 用户模型
// 位置: backend/models/User.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [4, 50]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'operator',
    validate: {
      isIn: [['admin', 'analyst', 'operator', 'viewer']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'locked']]
    }
  },
  last_login: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;