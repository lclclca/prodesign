/**
 * 评估历史 API 路由
 * 位置: backend/routes/evaluations.js
 *
 * 提供评估历史的 CRUD 操作，替代前端的 localStorage 存储
 */

const express = require('express');
const router = express.Router();
const EvaluationHistory = require('../models/EvaluationHistory_model');
const Project = require('../models/Project_model');

/**
 * 获取所有评估历史
 * GET /api/evaluations
 * Query params: project_id, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { project_id, limit, offset } = req.query;

    const where = {};
    if (project_id) {
      where.project_id = project_id;
    }

    const options = {
      where,
      order: [['created_at', 'DESC']]
    };

    if (limit) {
      options.limit = parseInt(limit);
    }

    if (offset) {
      options.offset = parseInt(offset);
    }

    const evaluations = await EvaluationHistory.findAll(options);
    const total = await EvaluationHistory.count({ where });

    res.json({
      success: true,
      data: evaluations,
      total,
      message: '获取评估历史成功'
    });
  } catch (error) {
    console.error('获取评估历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评估历史失败',
      error: error.message
    });
  }
});

/**
 * 获取单个评估详情
 * GET /api/evaluations/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await EvaluationHistory.findByPk(id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '评估记录不存在'
      });
    }

    res.json({
      success: true,
      data: evaluation,
      message: '获取评估详情成功'
    });
  } catch (error) {
    console.error('获取评估详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评估详情失败',
      error: error.message
    });
  }
});

/**
 * 创建评估记录
 * POST /api/evaluations
 * Body: {
 *   project_id,
 *   project_name,
 *   overall_score,
 *   metrics,
 *   node_count,
 *   edge_count,
 *   vulnerabilities,
 *   suggestions,
 *   created_by
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      project_id,
      project_name,
      overall_score,
      metrics,
      node_count,
      edge_count,
      vulnerabilities,
      suggestions,
      created_by
    } = req.body;

    // 验证必填字段
    if (!project_name || overall_score === undefined) {
      return res.status(400).json({
        success: false,
        message: '项目名称和总分不能为空'
      });
    }

    // 如果提供了 project_id，验证项目是否存在
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '关联的项目不存在'
        });
      }
    }

    const evaluation = await EvaluationHistory.create({
      project_id: project_id || null,
      project_name,
      overall_score,
      metrics: metrics || {},
      node_count: node_count || 0,
      edge_count: edge_count || 0,
      vulnerabilities: vulnerabilities || [],
      suggestions: suggestions || [],
      created_by: created_by || null
    });

    res.status(201).json({
      success: true,
      data: evaluation,
      message: '评估记录创建成功'
    });
  } catch (error) {
    console.error('创建评估记录失败:', error);
    res.status(500).json({
      success: false,
      message: '创建评估记录失败',
      error: error.message
    });
  }
});

/**
 * 更新评估记录
 * PUT /api/evaluations/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_name,
      overall_score,
      metrics,
      vulnerabilities,
      suggestions
    } = req.body;

    const evaluation = await EvaluationHistory.findByPk(id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '评估记录不存在'
      });
    }

    // 准备更新数据
    const updateData = {};

    if (project_name !== undefined) updateData.project_name = project_name;
    if (overall_score !== undefined) updateData.overall_score = overall_score;
    if (metrics !== undefined) updateData.metrics = metrics;
    if (vulnerabilities !== undefined) updateData.vulnerabilities = vulnerabilities;
    if (suggestions !== undefined) updateData.suggestions = suggestions;

    await evaluation.update(updateData);

    res.json({
      success: true,
      data: evaluation,
      message: '评估记录更新成功'
    });
  } catch (error) {
    console.error('更新评估记录失败:', error);
    res.status(500).json({
      success: false,
      message: '更新评估记录失败',
      error: error.message
    });
  }
});

/**
 * 删除评估记录
 * DELETE /api/evaluations/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await EvaluationHistory.findByPk(id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '评估记录不存在'
      });
    }

    await evaluation.destroy();

    res.json({
      success: true,
      message: '评估记录删除成功'
    });
  } catch (error) {
    console.error('删除评估记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评估记录失败',
      error: error.message
    });
  }
});

/**
 * 获取项目的所有评估历史
 * GET /api/evaluations/project/:projectId
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const evaluations = await EvaluationHistory.findAll({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: evaluations,
      total: evaluations.length,
      project: {
        id: project.id,
        name: project.name
      },
      message: '获取项目评估历史成功'
    });
  } catch (error) {
    console.error('获取项目评估历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目评估历史失败',
      error: error.message
    });
  }
});

/**
 * 获取评估统计信息
 * GET /api/evaluations/stats/overview
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await EvaluationHistory.count();

    // 获取平均分
    const allEvaluations = await EvaluationHistory.findAll({
      attributes: ['overall_score']
    });

    const averageScore = total > 0
      ? allEvaluations.reduce((sum, e) => sum + e.overall_score, 0) / total
      : 0;

    // 获取最近的评估
    const recentEvaluations = await EvaluationHistory.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'project_name', 'overall_score', 'created_at']
    });

    res.json({
      success: true,
      data: {
        total,
        averageScore: parseFloat(averageScore.toFixed(2)),
        recentEvaluations
      },
      message: '获取评估统计成功'
    });
  } catch (error) {
    console.error('获取评估统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评估统计失败',
      error: error.message
    });
  }
});

/**
 * 批量删除评估记录
 * POST /api/evaluations/batch-delete
 * Body: { ids: [1, 2, 3] }
 */
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的评估ID列表'
      });
    }

    const deleted = await EvaluationHistory.destroy({
      where: {
        id: ids
      }
    });

    res.json({
      success: true,
      data: { deletedCount: deleted },
      message: `成功删除 ${deleted} 条评估记录`
    });
  } catch (error) {
    console.error('批量删除评估记录失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除评估记录失败',
      error: error.message
    });
  }
});

module.exports = router;
