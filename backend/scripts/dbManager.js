/**
 * 数据库管理工具
 * 位置: backend/scripts/dbManager.js
 *
 * 提供数据库的清理、重置、备份等功能
 * 确保开发和测试过程中数据库的稳定性
 */

const { sequelize } = require('../config/database');
const Project = require('../models/Project_model');
const EvaluationHistory = require('../models/EvaluationHistory_model');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../database/killchain.db');
const BACKUP_DIR = path.join(__dirname, '../../db_backups');

/**
 * 创建备份目录
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✓ 备份目录已创建: ${BACKUP_DIR}`);
  }
}

/**
 * 备份数据库
 */
async function backupDatabase() {
  try {
    ensureBackupDir();

    if (!fs.existsSync(DB_PATH)) {
      console.log('⚠ 数据库文件不存在，无需备份');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `database_${timestamp}.sqlite`);

    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✓ 数据库已备份到: ${backupPath}`);

    return backupPath;
  } catch (error) {
    console.error('✗ 备份失败:', error.message);
    return null;
  }
}

/**
 * 恢复数据库（从最新备份）
 */
async function restoreDatabase(backupFile = null) {
  try {
    ensureBackupDir();

    let sourceFile = backupFile;

    // 如果没有指定备份文件，使用最新的备份
    if (!sourceFile) {
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.sqlite'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.log('✗ 没有找到备份文件');
        return false;
      }

      sourceFile = path.join(BACKUP_DIR, backups[0]);
    }

    if (!fs.existsSync(sourceFile)) {
      console.log(`✗ 备份文件不存在: ${sourceFile}`);
      return false;
    }

    // 先备份当前数据库
    if (fs.existsSync(DB_PATH)) {
      await backupDatabase();
    }

    // 恢复
    fs.copyFileSync(sourceFile, DB_PATH);
    console.log(`✓ 数据库已从备份恢复: ${sourceFile}`);

    return true;
  } catch (error) {
    console.error('✗ 恢复失败:', error.message);
    return false;
  }
}

/**
 * 清空所有表数据（保留表结构）
 */
async function clearAllTables() {
  try {
    console.log('开始清空所有表...');

    await sequelize.authenticate();

    // 删除所有数据
    await EvaluationHistory.destroy({ where: {}, truncate: true });
    console.log('✓ 清空评估历史表');

    await Project.destroy({ where: {}, truncate: true });
    console.log('✓ 清空项目表');

    console.log('✓ 所有表已清空');
    return true;
  } catch (error) {
    console.error('✗ 清空表失败:', error.message);
    return false;
  }
}

/**
 * 完全重置数据库（删除并重建所有表）
 */
async function resetDatabase() {
  try {
    console.log('开始重置数据库...');

    // 先备份
    await backupDatabase();

    await sequelize.authenticate();

    // 删除所有表
    await sequelize.drop();
    console.log('✓ 已删除所有表');

    // 重新创建表
    await sequelize.sync({ force: true });
    console.log('✓ 已重建所有表');

    console.log('✓ 数据库重置完成');
    return true;
  } catch (error) {
    console.error('✗ 重置失败:', error.message);
    return false;
  }
}

/**
 * 初始化数据库（如果不存在）
 */
async function initDatabase() {
  try {
    console.log('初始化数据库...');

    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 同步模型（不删除现有数据）
    await sequelize.sync();
    console.log('✓ 数据表同步完成');

    return true;
  } catch (error) {
    console.error('✗ 初始化失败:', error.message);
    return false;
  }
}

/**
 * 创建测试数据
 */
async function createTestData() {
  try {
    console.log('创建测试数据...');

    // 创建示例项目
    const testProject = await Project.create({
      name: '测试网络项目',
      description: '用于测试的示例网络',
      status: 'active',
      nodes: [
        { id: 'n1', name: '节点1', type: 'sensor', faction: 'blue', x: 100, y: 100 },
        { id: 'n2', name: '节点2', type: 'command', faction: 'blue', x: 200, y: 200 }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', type: 'communication' }
      ],
      node_count: 2,
      edge_count: 1,
      network_mode: 'both',
      created_by: 1
    });

    console.log(`✓ 创建测试项目: ${testProject.name} (ID: ${testProject.id})`);

    // 创建示例评估记录
    const testEvaluation = await EvaluationHistory.create({
      project_id: testProject.id,
      project_name: testProject.name,
      overall_score: 85.5,
      metrics: {
        connectivity: 0.9,
        robustness: 0.8,
        efficiency: 0.85
      },
      node_count: 2,
      edge_count: 1,
      vulnerabilities: ['单点故障风险'],
      suggestions: ['增加冗余节点'],
      created_by: 1
    });

    console.log(`✓ 创建测试评估记录 (ID: ${testEvaluation.id})`);

    return true;
  } catch (error) {
    console.error('✗ 创建测试数据失败:', error.message);
    return false;
  }
}

/**
 * 显示数据库统计信息
 */
async function showStats() {
  try {
    await sequelize.authenticate();

    const projectCount = await Project.count();
    const evaluationCount = await EvaluationHistory.count();

    console.log('\n=== 数据库统计 ===');
    console.log(`项目数量: ${projectCount}`);
    console.log(`评估记录数量: ${evaluationCount}`);

    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      console.log(`数据库文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    // 显示备份信息
    ensureBackupDir();
    const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sqlite'));
    console.log(`备份文件数量: ${backups.length}`);
    console.log('==================\n');

    return true;
  } catch (error) {
    console.error('✗ 获取统计信息失败:', error.message);
    return false;
  }
}

/**
 * 清理旧备份（保留最近N个）
 */
async function cleanOldBackups(keepCount = 5) {
  try {
    ensureBackupDir();

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sqlite'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    if (backups.length <= keepCount) {
      console.log(`✓ 备份文件数量: ${backups.length}，无需清理`);
      return true;
    }

    const toDelete = backups.slice(keepCount);

    for (const backup of toDelete) {
      fs.unlinkSync(backup.path);
      console.log(`✓ 删除旧备份: ${backup.name}`);
    }

    console.log(`✓ 清理完成，保留了最近 ${keepCount} 个备份`);
    return true;
  } catch (error) {
    console.error('✗ 清理备份失败:', error.message);
    return false;
  }
}

// 命令行接口
async function main() {
  const command = process.argv[2];

  console.log('\n数据库管理工具\n');

  try {
    switch (command) {
      case 'init':
        await initDatabase();
        break;

      case 'clear':
        await clearAllTables();
        break;

      case 'reset':
        await resetDatabase();
        break;

      case 'backup':
        await backupDatabase();
        break;

      case 'restore':
        await restoreDatabase(process.argv[3]);
        break;

      case 'test-data':
        await createTestData();
        break;

      case 'stats':
        await showStats();
        break;

      case 'clean-backups':
        const keepCount = parseInt(process.argv[3]) || 5;
        await cleanOldBackups(keepCount);
        break;

      default:
        console.log('使用方法:');
        console.log('  node dbManager.js init         - 初始化数据库');
        console.log('  node dbManager.js clear        - 清空所有表数据');
        console.log('  node dbManager.js reset        - 完全重置数据库');
        console.log('  node dbManager.js backup       - 备份数据库');
        console.log('  node dbManager.js restore [文件] - 恢复数据库');
        console.log('  node dbManager.js test-data    - 创建测试数据');
        console.log('  node dbManager.js stats        - 显示数据库统计');
        console.log('  node dbManager.js clean-backups [保留数量] - 清理旧备份');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

// 导出函数供其他模块使用
module.exports = {
  backupDatabase,
  restoreDatabase,
  clearAllTables,
  resetDatabase,
  initDatabase,
  createTestData,
  showStats,
  cleanOldBackups
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
