// 网络API路由
// 位置: backend/routes/networks.js

const express = require('express');
const router = express.Router();
const Network = require('../models/Network');

/**
 * GET /api/networks - 获取网络列表
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, created_by } = req.query;

    const where = {};
    if (created_by) where.created_by = created_by;

    const offset = (page - 1) * limit;

    const { count, rows } = await Network.findAndCountAll({
      where,
      attributes: { exclude: ['data'] }, // 列表不返回完整网络数据
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: count,
        networks: rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取网络列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取网络列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/networks/:id - 获取网络详情
 */
router.get('/:id', async (req, res) => {
  try {
    const network = await Network.findByPk(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: '网络不存在'
      });
    }

    res.json({
      success: true,
      data: network
    });
  } catch (error) {
    console.error('获取网络详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取网络详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/networks - 创建网络
 */
router.post('/', async (req, res) => {
  try {
    const { name, version, data, metadata, description, created_by } = req.body;

    // 验证必填字段
    if (!name || !data) {
      return res.status(400).json({
        success: false,
        message: '网络名称和数据为必填项'
      });
    }

    // 验证数据格式
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return res.status(400).json({
        success: false,
        message: '网络数据格式错误：缺少nodes数组'
      });
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      return res.status(400).json({
        success: false,
        message: '网络数据格式错误：缺少edges数组'
      });
    }

    // 创建网络
    const network = await Network.create({
      name,
      version: version || '1.0',
      data,
      metadata: metadata || {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length
      },
      description,
      created_by
    });

    res.status(201).json({
      success: true,
      message: '网络创建成功',
      data: network
    });
  } catch (error) {
    console.error('创建网络失败:', error);
    res.status(500).json({
      success: false,
      message: '创建网络失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/networks/:id - 更新网络
 */
router.put('/:id', async (req, res) => {
  try {
    const network = await Network.findByPk(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: '网络不存在'
      });
    }

    const { name, version, data, metadata, description } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (version) updates.version = version;
    if (data) {
      // 验证数据格式
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return res.status(400).json({
          success: false,
          message: '网络数据格式错误：缺少nodes数组'
        });
      }
      if (!data.edges || !Array.isArray(data.edges)) {
        return res.status(400).json({
          success: false,
          message: '网络数据格式错误：缺少edges数组'
        });
      }
      updates.data = data;

      // 自动更新metadata
      updates.metadata = {
        ...(metadata || {}),
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length
      };
    }
    if (description) updates.description = description;

    await network.update(updates);

    res.json({
      success: true,
      message: '网络更新成功',
      data: network
    });
  } catch (error) {
    console.error('更新网络失败:', error);
    res.status(500).json({
      success: false,
      message: '更新网络失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/networks/:id - 删除网络
 */
router.delete('/:id', async (req, res) => {
  try {
    const network = await Network.findByPk(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: '网络不存在'
      });
    }

    await network.destroy();

    res.json({
      success: true,
      message: '网络删除成功'
    });
  } catch (error) {
    console.error('删除网络失败:', error);
    res.status(500).json({
      success: false,
      message: '删除网络失败',
      error: error.message
    });
  }
});

module.exports = router;