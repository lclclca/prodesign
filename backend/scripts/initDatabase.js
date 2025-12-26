// 数据库初始化脚本
// 位置: backend/scripts/initDatabase.js

const { sequelize } = require('../config/database');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Network = require('../models/Network');
const CryptoJS = require('crypto-js');

// 预置装备数据
const PRESET_EQUIPMENT = [
  // 传感器类
  {
    name: '相控阵雷达',
    base_type: 'sensor',
    faction: 'blue',
    icon: '📡',
    color: '#409EFF',
    performance: {
      detectionRange: 300,
      detectionAccuracy: 10,
      detectionProbability: 0.85,
      resolution: 1,
      frequency: 'X-band',
      antiJamming: 0.7
    },
    is_custom: false
  },
  {
    name: '侦察卫星',
    base_type: 'sensor',
    faction: 'blue',
    icon: '🛰️',
    color: '#409EFF',
    performance: {
      detectionRange: 1000,
      detectionAccuracy: 5,
      detectionProbability: 0.9,
      resolution: 0.5,
      frequency: 'optical',
      antiJamming: 0.9
    },
    is_custom: false
  },
  {
    name: '预警机',
    base_type: 'sensor',
    faction: 'blue',
    icon: '✈️',
    color: '#409EFF',
    performance: {
      detectionRange: 400,
      detectionAccuracy: 20,
      detectionProbability: 0.8,
      resolution: 2,
      frequency: 'S-band',
      antiJamming: 0.6
    },
    is_custom: false
  },

  // 指挥类
  {
    name: '战区指挥中心',
    base_type: 'command',
    faction: 'blue',
    icon: '🎯',
    color: '#67C23A',
    performance: {
      commandRange: 500,
      processingCapacity: 1000,
      decisionDelay: 5,
      maxNodes: 50
    },
    is_custom: false
  },
  {
    name: '战役指挥所',
    base_type: 'command',
    faction: 'blue',
    icon: '🏢',
    color: '#67C23A',
    performance: {
      commandRange: 300,
      processingCapacity: 500,
      decisionDelay: 3,
      maxNodes: 30
    },
    is_custom: false
  },

  // 打击类
  {
    name: '导弹发射车',
    base_type: 'striker',
    faction: 'blue',
    icon: '🚀',
    color: '#F56C6C',
    performance: {
      strikeRange: 200,
      damageRate: 0.8,
      responseTime: 10,
      ammunition: 6,
      accuracy: 10
    },
    is_custom: false
  },
  {
    name: '战斗机',
    base_type: 'striker',
    faction: 'blue',
    icon: '✈️',
    color: '#F56C6C',
    performance: {
      strikeRange: 500,
      damageRate: 0.7,
      responseTime: 30,
      ammunition: 8,
      accuracy: 15
    },
    is_custom: false
  },

  // 敌方装备
  {
    name: '敌方雷达',
    base_type: 'sensor',
    faction: 'red',
    icon: '📡',
    color: '#F56C6C',
    performance: {
      detectionRange: 250,
      detectionAccuracy: 15,
      detectionProbability: 0.75,
      resolution: 2,
      frequency: 'S-band',
      antiJamming: 0.6
    },
    is_custom: false
  },
  {
    name: '敌方指挥所',
    base_type: 'command',
    faction: 'red',
    icon: '🎯',
    color: '#F56C6C',
    performance: {
      commandRange: 200,
      processingCapacity: 300,
      decisionDelay: 5,
      maxNodes: 20
    },
    is_custom: false
  }
];

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    // 1. 同步数据库模型（删除现有表并重新创建）
    console.log('同步数据库模型...');
    await sequelize.sync({ force: true });
    console.log('✅ 数据库模型同步完成');

    // 2. 创建默认用户
    console.log('创建默认用户...');
    const users = await User.bulkCreate([
      {
        username: 'admin',
        password: CryptoJS.SHA256('admin123').toString(),
        name: '系统管理员',
        email: 'admin@killchain.com',
        phone: '13800138000',
        role: 'admin',
        status: 'active'
      },
      {
        username: 'analyst',
        password: CryptoJS.SHA256('analyst123').toString(),
        name: '评估分析员',
        email: 'analyst@killchain.com',
        phone: '13800138001',
        role: 'analyst',
        status: 'active'
      },
      {
        username: 'operator',
        password: CryptoJS.SHA256('operator123').toString(),
        name: '普通用户',
        email: 'operator@killchain.com',
        phone: '13800138002',
        role: 'operator',
        status: 'active'
      }
    ]);
    console.log(`✅ 创建了 ${users.length} 个默认用户`);

    // 3. 创建预置装备
    console.log('创建预置装备...');
    const equipment = await Equipment.bulkCreate(PRESET_EQUIPMENT);
    console.log(`✅ 创建了 ${equipment.length} 个预置装备`);

    // 4. 创建示例网络（可选）
    console.log('创建示例网络...');
    const sampleNetwork = await Network.create({
      name: '示例防空网络',
      version: '1.0',
      data: {
        nodes: [
          {
            id: 'node_1',
            name: '预警机',
            type: 'sensor_blue',
            baseType: 'sensor',
            faction: 'blue',
            x: 200,
            y: 200,
            hp: 100
          },
          {
            id: 'node_2',
            name: '战役指挥所',
            type: 'command_blue',
            baseType: 'command',
            faction: 'blue',
            x: 300,
            y: 200,
            hp: 100
          },
          {
            id: 'node_3',
            name: '导弹发射车',
            type: 'striker_blue',
            baseType: 'striker',
            faction: 'blue',
            x: 400,
            y: 200,
            hp: 100
          },
          {
            id: 'node_4',
            name: '敌方雷达',
            type: 'sensor_red',
            baseType: 'sensor',
            faction: 'red',
            x: 600,
            y: 200,
            hp: 100
          }
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'node_1',
            target: 'node_2',
            type: 'detection'
          },
          {
            id: 'edge_2',
            source: 'node_2',
            target: 'node_3',
            type: 'communication'
          },
          {
            id: 'edge_3',
            source: 'node_3',
            target: 'node_4',
            type: 'strike'
          }
        ]
      },
      metadata: {
        nodeCount: 4,
        edgeCount: 3
      },
      description: '一个简单的防空作战网络示例',
      created_by: users[0].id
    });
    console.log('✅ 创建了示例网络');

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n默认账号：');
    console.log('- admin / admin123 (管理员)');
    console.log('- analyst / analyst123 (分析员)');
    console.log('- operator / operator123 (操作员)');

    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

initDatabase();