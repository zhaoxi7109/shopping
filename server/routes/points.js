const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 数据文件路径
const usersPath = path.join(__dirname, '../data/users.json');
const pointsRecordsPath = path.join(__dirname, '../data/pointsRecords.json');

// 读取数据文件
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// 写入数据文件
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// 获取用户积分余额
router.get('/balance/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const users = readJsonFile(usersPath);
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        points: user.points || 0
      }
    });
  } catch (error) {
    console.error('获取用户积分失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户积分失败'
    });
  }
});

// 获取用户积分记录
router.get('/records/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const pointsRecords = readJsonFile(pointsRecordsPath);
    
    let userRecords = pointsRecords.filter(record => record.userId === userId);
    
    // 按类型筛选
    if (type && ['earn', 'spend'].includes(type)) {
      userRecords = userRecords.filter(record => record.type === type);
    }
    
    // 按时间倒序排列
    userRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = userRecords.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: userRecords.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取积分记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分记录失败'
    });
  }
});

// 计算积分抵扣
router.post('/calculate', (req, res) => {
  try {
    const { userId, orderAmount, usePoints = false } = req.body;
    
    if (!userId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }
    
    const users = readJsonFile(usersPath);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const userPoints = user.points || 0;
    let pointsDeduction = 0;
    
    if (usePoints && userPoints > 0) {
      // 积分抵扣规则：100积分=1元，最多抵扣订单金额的30%
      const maxDeductionAmount = orderAmount * 0.3;
      const maxDeductionPoints = Math.floor(maxDeductionAmount * 100);
      const actualDeductionPoints = Math.min(userPoints, maxDeductionPoints);
      pointsDeduction = actualDeductionPoints / 100;
    }
    
    res.json({
      success: true,
      data: {
        userPoints,
        pointsDeduction: parseFloat(pointsDeduction.toFixed(2)),
        deductionPoints: Math.floor(pointsDeduction * 100)
      }
    });
  } catch (error) {
    console.error('计算积分抵扣失败:', error);
    res.status(500).json({
      success: false,
      message: '计算积分抵扣失败'
    });
  }
});

// 使用积分（订单支付时调用）
router.post('/spend', (req, res) => {
  try {
    const { userId, points, reason, orderId } = req.body;
    
    if (!userId || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }
    
    const users = readJsonFile(usersPath);
    const pointsRecords = readJsonFile(pointsRecordsPath);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const user = users[userIndex];
    if ((user.points || 0) < points) {
      return res.status(400).json({
        success: false,
        message: '积分余额不足'
      });
    }
    
    // 扣除积分
    users[userIndex].points = (user.points || 0) - points;
    users[userIndex].updatedAt = new Date().toISOString();
    
    // 添加积分记录
    const pointsRecord = {
      id: uuidv4(),
      userId,
      type: 'spend',
      amount: -points,
      reason: reason || '订单抵扣',
      orderId: orderId || null,
      createdAt: new Date().toISOString()
    };
    
    pointsRecords.push(pointsRecord);
    
    // 保存数据
    writeJsonFile(usersPath, users);
    writeJsonFile(pointsRecordsPath, pointsRecords);
    
    res.json({
      success: true,
      message: '积分使用成功',
      data: {
        remainingPoints: users[userIndex].points,
        record: pointsRecord
      }
    });
  } catch (error) {
    console.error('使用积分失败:', error);
    res.status(500).json({
      success: false,
      message: '使用积分失败'
    });
  }
});

// 获得积分（订单完成、签到等场景）
router.post('/earn', (req, res) => {
  try {
    const { userId, points, reason, orderId } = req.body;
    
    if (!userId || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }
    
    const users = readJsonFile(usersPath);
    const pointsRecords = readJsonFile(pointsRecordsPath);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 增加积分
    users[userIndex].points = (users[userIndex].points || 0) + points;
    users[userIndex].updatedAt = new Date().toISOString();
    
    // 添加积分记录
    const pointsRecord = {
      id: uuidv4(),
      userId,
      type: 'earn',
      amount: points,
      reason: reason || '获得积分',
      orderId: orderId || null,
      createdAt: new Date().toISOString()
    };
    
    pointsRecords.push(pointsRecord);
    
    // 保存数据
    writeJsonFile(usersPath, users);
    writeJsonFile(pointsRecordsPath, pointsRecords);
    
    res.json({
      success: true,
      message: '积分获得成功',
      data: {
        totalPoints: users[userIndex].points,
        record: pointsRecord
      }
    });
  } catch (error) {
    console.error('获得积分失败:', error);
    res.status(500).json({
      success: false,
      message: '获得积分失败'
    });
  }
});

module.exports = router;