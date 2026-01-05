/**
 * 项目 API 路由
 * 位置: backend/routes/projects.js
 *
 * 提供项目的 CRUD 操作，替代前端的 localStorage 存储
 */

const express = require('express');
const router = express.Router();
const Project = require('../models/Project_model');

/**
 * 获取所有项目列表
 * GET /api/projects
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const options = {
      where,
      order: [['updated_at', 'DESC']],
      attributes: [
        'id',
        'name',
        'description',
        'status',
        'node_count',
        'edge_count',
        'network_mode',
        'created_at',
        'updated_at'
      ]
    };

    if (limit) {
      options.limit = parseInt(limit);
    }

    if (offset) {
      options.offset = parseInt(offset);
    }

    const projects = await Project.findAll(options);
    const total = await Project.count({ where });

    res.json({
      success: true,
      data: projects,
      total,
      message: '获取项目列表成功'
    });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
});

/**
 * 获取单个项目详情（包含完整节点和边数据）
 * GET /api/projects/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    res.json({
      success: true,
      data: project,
      message: '获取项目详情成功'
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message
    });
  }
});

/**
 * 创建新项目
 * POST /api/projects
 * Body: { name, description, nodes, edges, network_mode }
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges, network_mode, created_by } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '项目名称不能为空'
      });
    }

    // 计算节点和边数量
    const node_count = nodes ? nodes.length : 0;
    const edge_count = edges ? edges.length : 0;

    const project = await Project.create({
      name,
      description: description || '',
      status: 'active',
      nodes: nodes || [],
      edges: edges || [],
      node_count,
      edge_count,
      network_mode: network_mode || 'both',
      created_by: created_by || null
    });

    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功'
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({
      success: false,
      message: '创建项目失败',
      error: error.message
    });
  }
});

/**
 * 更新项目
 * PUT /api/projects/:id
 * Body: { name, description, nodes, edges, status, network_mode }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges, status, network_mode } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 准备更新数据
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (network_mode !== undefined) updateData.network_mode = network_mode;

    if (nodes !== undefined) {
      updateData.nodes = nodes;
      updateData.node_count = nodes.length;
    }

    if (edges !== undefined) {
      updateData.edges = edges;
      updateData.edge_count = edges.length;
    }

    await project.update(updateData);

    res.json({
      success: true,
      data: project,
      message: '项目更新成功'
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项目失败',
      error: error.message
    });
  }
});

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: '项目删除成功'
    });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
});

/**
 * 更新项目状态
 * PATCH /api/projects/:id/status
 * Body: { status: 'active' | 'completed' | 'archived' }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    await project.update({ status });

    res.json({
      success: true,
      data: project,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
});

/**
 * 添加节点到项目
 * POST /api/projects/:id/nodes
 * Body: { node: { id, name, type, ... } }
 */
router.post('/:id/nodes', async (req, res) => {
  try {
    const { id } = req.params;
    const { node } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 获取当前节点列表
    const nodes = project.nodes || [];

    // 检查节点ID是否已存在
    if (nodes.find(n => n.id === node.id)) {
      return res.status(400).json({
        success: false,
        message: '节点ID已存在'
      });
    }

    // 添加新节点
    nodes.push(node);

    await project.update({
      nodes,
      node_count: nodes.length
    });

    res.json({
      success: true,
      data: { node, project },
      message: '节点添加成功'
    });
  } catch (error) {
    console.error('添加节点失败:', error);
    res.status(500).json({
      success: false,
      message: '添加节点失败',
      error: error.message
    });
  }
});

/**
 * 更新项目中的节点
 * PUT /api/projects/:id/nodes/:nodeId
 * Body: { updates: { ... } }
 */
router.put('/:id/nodes/:nodeId', async (req, res) => {
  try {
    const { id, nodeId } = req.params;
    const { updates } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const nodes = project.nodes || [];
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);

    if (nodeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }

    // 更新节点
    nodes[nodeIndex] = { ...nodes[nodeIndex], ...updates };

    await project.update({ nodes });

    res.json({
      success: true,
      data: { node: nodes[nodeIndex], project },
      message: '节点更新成功'
    });
  } catch (error) {
    console.error('更新节点失败:', error);
    res.status(500).json({
      success: false,
      message: '更新节点失败',
      error: error.message
    });
  }
});

/**
 * 删除项目中的节点
 * DELETE /api/projects/:id/nodes/:nodeId
 */
router.delete('/:id/nodes/:nodeId', async (req, res) => {
  try {
    const { id, nodeId } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    let nodes = project.nodes || [];
    const edges = project.edges || [];

    // 删除节点
    nodes = nodes.filter(n => n.id !== nodeId);

    // 删除相关的边
    const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    await project.update({
      nodes,
      edges: updatedEdges,
      node_count: nodes.length,
      edge_count: updatedEdges.length
    });

    res.json({
      success: true,
      message: '节点删除成功'
    });
  } catch (error) {
    console.error('删除节点失败:', error);
    res.status(500).json({
      success: false,
      message: '删除节点失败',
      error: error.message
    });
  }
});

/**
 * 添加边到项目
 * POST /api/projects/:id/edges
 * Body: { edge: { id, source, target, ... } }
 */
router.post('/:id/edges', async (req, res) => {
  try {
    const { id } = req.params;
    const { edge } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const edges = project.edges || [];

    // 检查边ID是否已存在
    if (edges.find(e => e.id === edge.id)) {
      return res.status(400).json({
        success: false,
        message: '边ID已存在'
      });
    }

    // 添加新边
    edges.push(edge);

    await project.update({
      edges,
      edge_count: edges.length
    });

    res.json({
      success: true,
      data: { edge, project },
      message: '边添加成功'
    });
  } catch (error) {
    console.error('添加边失败:', error);
    res.status(500).json({
      success: false,
      message: '添加边失败',
      error: error.message
    });
  }
});

/**
 * 删除项目中的边
 * DELETE /api/projects/:id/edges/:edgeId
 */
router.delete('/:id/edges/:edgeId', async (req, res) => {
  try {
    const { id, edgeId } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    let edges = project.edges || [];

    // 删除边
    edges = edges.filter(e => e.id !== edgeId);

    await project.update({
      edges,
      edge_count: edges.length
    });

    res.json({
      success: true,
      message: '边删除成功'
    });
  } catch (error) {
    console.error('删除边失败:', error);
    res.status(500).json({
      success: false,
      message: '删除边失败',
      error: error.message
    });
  }
});

module.exports = router;
