// 用户API路由
// 位置: backend/routes/users.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CryptoJS = require('crypto-js');

/**
 * GET /api/users - 获取用户列表
 */
router.get('/', async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] }, // 不返回密码
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: count,
        users: rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id - 获取用户详情
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users - 创建用户
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, phone, role } = req.body;

    // 验证必填字段
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和姓名为必填项'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const encryptedPassword = CryptoJS.SHA256(password).toString();

    // 创建用户
    const user = await User.create({
      username,
      password: encryptedPassword,
      name,
      email,
      phone,
      role: role || 'operator'
    });

    // 返回用户信息（不包含密码）
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userData
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id - 更新用户
 */
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const { name, email, phone, role, status, password } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;
    if (status) updates.status = status;

    // 如果要修改密码，需要加密
    if (password) {
      updates.password = CryptoJS.SHA256(password).toString();
    }

    await user.update(updates);

    // 返回更新后的用户信息（不包含密码）
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '用户更新成功',
      data: userData
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/:id - 删除用户
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users/login - 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误'
      });
    }

    // 验证密码
    const encryptedPassword = CryptoJS.SHA256(password).toString();
    if (encryptedPassword !== user.password) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误'
      });
    }

    // 检查账号状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    // 更新最后登录时间
    await user.update({ last_login: new Date() });

    // 返回用户信息（不包含密码）
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '登录成功',
      data: userData
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

module.exports = router;