// 装备API路由
// 位置: backend/routes/equipment.js

const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');

/**
 * GET /api/equipment - 获取装备列表
 */
router.get('/', async (req, res) => {
  try {
    const { base_type, faction, is_custom, page = 1, limit = 100 } = req.query;

    const where = {};
    if (base_type) where.base_type = base_type;
    if (faction) where.faction = faction;
    if (is_custom !== undefined) where.is_custom = is_custom === 'true';

    const offset = (page - 1) * limit;

    const { count, rows } = await Equipment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: count,
        equipment: rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取装备列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取装备列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/equipment/:id - 获取装备详情
 */
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: '装备不存在'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('获取装备详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取装备详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/equipment - 创建装备
 */
router.post('/', async (req, res) => {
  try {
    const { name, base_type, faction, icon, color, performance, description, created_by } = req.body;

    // 验证必填字段
    if (!name || !base_type || !faction) {
      return res.status(400).json({
        success: false,
        message: '装备名称、类型和阵营为必填项'
      });
    }

    // 创建装备
    const equipment = await Equipment.create({
      name,
      base_type,
      faction,
      icon: icon || '📍',
      color: color || (faction === 'blue' ? '#409EFF' : '#F56C6C'),
      performance: performance || {},
      description,
      is_custom: true,
      created_by
    });

    res.status(201).json({
      success: true,
      message: '装备创建成功',
      data: equipment
    });
  } catch (error) {
    console.error('创建装备失败:', error);
    res.status(500).json({
      success: false,
      message: '创建装备失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/equipment/:id - 更新装备
 */
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: '装备不存在'
      });
    }

    const { name, base_type, faction, icon, color, performance, description } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (base_type) updates.base_type = base_type;
    if (faction) updates.faction = faction;
    if (icon) updates.icon = icon;
    if (color) updates.color = color;
    if (performance) updates.performance = performance;
    if (description) updates.description = description;

    await equipment.update(updates);

    res.json({
      success: true,
      message: '装备更新成功',
      data: equipment
    });
  } catch (error) {
    console.error('更新装备失败:', error);
    res.status(500).json({
      success: false,
      message: '更新装备失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/equipment/:id - 删除装备
 */
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: '装备不存在'
      });
    }

    // 只能删除自定义装备
    if (!equipment.is_custom) {
      return res.status(403).json({
        success: false,
        message: '系统预置装备不能删除'
      });
    }

    await equipment.destroy();

    res.json({
      success: true,
      message: '装备删除成功'
    });
  } catch (error) {
    console.error('删除装备失败:', error);
    res.status(500).json({
      success: false,
      message: '删除装备失败',
      error: error.message
    });
  }
});

module.exports = router;