/**
 * 一键初始化脚本
 * 自动创建数据表并添加测试数据
 */

const { sequelize } = require('../config/database');
const Project = require('../models/Project_model');
const EvaluationHistory = require('../models/EvaluationHistory_model');

async function setup() {
  try {
    console.log('\n🚀 开始初始化数据库...\n');

    // 1. 测试连接
    console.log('📌 步骤1: 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 2. 同步模型（创建表）
    console.log('📌 步骤2: 创建数据表...');
    await sequelize.sync({ force: false });
    console.log('✅ 数据表创建成功\n');

    // 3. 检查是否已有数据
    const projectCount = await Project.count();
    const evaluationCount = await EvaluationHistory.count();

    console.log('📊 当前数据统计:');
    console.log(`   项目数量: ${projectCount}`);
    console.log(`   评估记录数量: ${evaluationCount}\n`);

    if (projectCount > 0) {
      console.log('⚠️  数据库已有数据，跳过创建测试数据');
      console.log('💡 如需重新创建，请先运行: node scripts/dbManager.js clear\n');
    } else {
      // 4. 创建测试数据
      console.log('📌 步骤3: 创建测试数据...');

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

      console.log(`✅ 创建测试项目: ${testProject.name} (ID: ${testProject.id})`);

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

      console.log(`✅ 创建测试评估记录 (ID: ${testEvaluation.id})\n`);
    }

    // 5. 显示最终统计
    const finalProjectCount = await Project.count();
    const finalEvaluationCount = await EvaluationHistory.count();

    console.log('═══════════════════════════════════════');
    console.log('🎉 初始化完成！');
    console.log('═══════════════════════════════════════');
    console.log(`📊 项目数量: ${finalProjectCount}`);
    console.log(`📊 评估记录数量: ${finalEvaluationCount}`);
    console.log('\n✨ 现在可以启动服务器了:');
    console.log('   node server.js\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.error('\n详细错误:', error);
    process.exit(1);
  }
}

setup();
