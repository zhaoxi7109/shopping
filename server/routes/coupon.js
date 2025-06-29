const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 数据文件路径
const couponsPath = path.join(__dirname, '../data/coupons.json');
const userCouponsPath = path.join(__dirname, '../data/userCoupons.json');
const usersPath = path.join(__dirname, '../data/users.json');

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

// 获取用户所有优惠券列表
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { orderAmount } = req.query; // 订单金额，用于筛选可用优惠券
    
    const coupons = readJsonFile(couponsPath);
    const userCoupons = readJsonFile(userCouponsPath);
    
    // 获取用户的所有优惠券
    const userAllCoupons = userCoupons
      .filter(uc => uc.userId === userId)
      .map(uc => {
        const coupon = coupons.find(c => c.id === uc.couponId);
        if (!coupon) return null;
        
        const now = new Date();
        const endTime = new Date(coupon.endTime);
        let status = uc.status;
        let canUse = false;
        let reason = '';
        
        // 检查优惠券状态
        if (uc.status === 'used') {
          status = 'used';
        } else if (now > endTime || coupon.status !== 'active') {
          status = 'expired';
        } else if (uc.status === 'available') {
          status = 'available';
          // 如果提供了订单金额，检查是否满足使用条件
          if (orderAmount) {
            if (parseFloat(orderAmount) < coupon.minAmount) {
              canUse = false;
              reason = `订单金额需满${coupon.minAmount}元`;
            } else {
              canUse = true;
            }
          } else {
            canUse = true;
          }
        }
        
        return {
          ...coupon,
          userCouponId: uc.id,
          status: status,
          canUse: canUse,
          reason: reason,
          obtainedAt: uc.obtainedAt,
          usedAt: uc.usedAt,
          orderId: uc.orderId
        };
      })
      .filter(Boolean);
    
    res.json({
      success: true,
      data: userAllCoupons
    });
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户优惠券失败'
    });
  }
});

// 获取所有可领取的优惠券
router.get('/available', (req, res) => {
  try {
    const coupons = readJsonFile(couponsPath);
    const now = new Date();
    
    const availableCoupons = coupons.filter(coupon => {
      return coupon.status === 'active' && 
             new Date(coupon.endTime) > now &&
             coupon.usedCount < coupon.totalCount;
    });
    
    res.json({
      success: true,
      data: availableCoupons
    });
  } catch (error) {
    console.error('获取可领取优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '获取可领取优惠券失败'
    });
  }
});

// 领取优惠券
router.post('/claim', (req, res) => {
  try {
    const { userId, couponId } = req.body;
    
    if (!userId || !couponId) {
      return res.status(400).json({
        success: false,
        message: '用户ID和优惠券ID不能为空'
      });
    }
    
    const coupons = readJsonFile(couponsPath);
    const userCoupons = readJsonFile(userCouponsPath);
    
    // 检查优惠券是否存在且可领取
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在'
      });
    }
    
    if (coupon.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '优惠券已失效'
      });
    }
    
    if (new Date() > new Date(coupon.endTime)) {
      return res.status(400).json({
        success: false,
        message: '优惠券已过期'
      });
    }
    
    if (coupon.usedCount >= coupon.totalCount) {
      return res.status(400).json({
        success: false,
        message: '优惠券已被领完'
      });
    }
    
    // 检查用户是否已经领取过该优惠券
    const existingUserCoupon = userCoupons.find(uc => 
      uc.userId === userId && uc.couponId === couponId
    );
    
    if (existingUserCoupon) {
      return res.status(400).json({
        success: false,
        message: '您已经领取过该优惠券'
      });
    }
    
    // 创建用户优惠券记录
    const newUserCoupon = {
      id: uuidv4(),
      userId,
      couponId,
      status: 'available',
      obtainedAt: new Date().toISOString(),
      usedAt: null,
      orderId: null
    };
    
    userCoupons.push(newUserCoupon);
    
    // 更新优惠券使用数量
    coupon.usedCount += 1;
    
    // 保存数据
    writeJsonFile(userCouponsPath, userCoupons);
    writeJsonFile(couponsPath, coupons);
    
    res.json({
      success: true,
      message: '优惠券领取成功',
      data: newUserCoupon
    });
  } catch (error) {
    console.error('领取优惠券失败:', error);
    res.status(500).json({
      success: false,
      message: '领取优惠券失败'
    });
  }
});

/**
 * 计算优惠券折扣
 * @route POST /api/coupons/calculate
 * @desc 计算优惠券在订单中的折扣金额
 * @param {string} userCouponId - 用户优惠券ID
 * @param {number} orderAmount - 订单总金额
 * @param {number} shippingFee - 运费（可选，默认0）
 * @param {number} otherDiscounts - 其他减免金额（满减、积分抵扣等，可选，默认0）
 */
router.post('/calculate', (req, res) => {
  try {
    const { userCouponId, orderAmount, shippingFee = 0, otherDiscounts = 0 } = req.body;
    
    if (!userCouponId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }
    
    const coupons = readJsonFile(couponsPath);
    const userCoupons = readJsonFile(userCouponsPath);
    
    const userCoupon = userCoupons.find(uc => uc.id === userCouponId);
    if (!userCoupon || userCoupon.status !== 'available') {
      return res.status(404).json({
        success: false,
        message: '优惠券不可用'
      });
    }
    
    const coupon = coupons.find(c => c.id === userCoupon.couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: '优惠券不存在'
      });
    }
    
    // 检查订单金额是否满足使用条件
    if (orderAmount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `订单金额需满${coupon.minAmount}元`
      });
    }
    
    let discount = 0;
    let discountShipping = 0;
    
    if (coupon.type === 'shipping') {
      // 免运费券
      discountShipping = Math.min(shippingFee, coupon.maxDiscount);
    } else {
      // 商品折扣券
      if (coupon.discountType === 'amount') {
        // 满减券：直接减免固定金额
        discount = coupon.discountValue;
      } else if (coupon.discountType === 'percentage') {
        // 折扣券：按照优化后的计算方式
        // 计算公式：(总金额 - 其他减免) * (折扣值/100)
        // 例如：(800 - 10 - 10) * (95/100) = 770 * 0.95 = 731.5
        // 折扣金额 = 原金额 - 折扣后金额 = 770 - 731.5 = 38.5
        const baseAmount = Math.max(orderAmount - otherDiscounts, 0);
        const discountedAmount = baseAmount * (coupon.discountValue / 100);
        discount = Math.min(
          baseAmount - discountedAmount,
          coupon.maxDiscount
        );
      }
    }
    
    res.json({
      success: true,
      data: {
        discount: parseFloat(discount.toFixed(2)),
        discountShipping: parseFloat(discountShipping.toFixed(2)),
        coupon,
        calculationDetails: {
          orderAmount,
          otherDiscounts,
          baseAmount: orderAmount - otherDiscounts,
          discountRate: coupon.discountType === 'percentage' ? coupon.discountValue : null
        }
      }
    });
  } catch (error) {
    console.error('计算优惠券折扣失败:', error);
    res.status(500).json({
      success: false,
      message: '计算优惠券折扣失败'
    });
  }
});

/**
 * 计算订单最终支付金额（综合计算）
 * @route POST /api/coupons/calculate-final-amount
 * @desc 计算包含所有优惠的最终支付金额
 * @param {number} orderAmount - 订单总金额
 * @param {number} shippingFee - 运费（可选，默认0）
 * @param {number} fullReductionDiscount - 满减优惠金额（可选，默认0）
 * @param {number} pointsDiscount - 积分抵扣金额（可选，默认0）
 * @param {string} userCouponId - 用户优惠券ID（可选）
 */
router.post('/calculate-final-amount', (req, res) => {
  try {
    const { 
      orderAmount, 
      shippingFee = 0, 
      fullReductionDiscount = 0, 
      pointsDiscount = 0, 
      userCouponId 
    } = req.body;
    
    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: '订单金额必须大于0'
      });
    }
    
    let couponDiscount = 0;
    let couponShippingDiscount = 0;
    let couponInfo = null;
    
    // 如果有折扣券，计算折扣券优惠
    if (userCouponId) {
      const coupons = readJsonFile(couponsPath);
      const userCoupons = readJsonFile(userCouponsPath);
      
      const userCoupon = userCoupons.find(uc => uc.id === userCouponId);
      if (userCoupon && userCoupon.status === 'available') {
        const coupon = coupons.find(c => c.id === userCoupon.couponId);
        if (coupon && orderAmount >= coupon.minAmount) {
          couponInfo = coupon;
          
          if (coupon.type === 'shipping') {
            // 免运费券
            couponShippingDiscount = Math.min(shippingFee, coupon.maxDiscount);
          } else if (coupon.discountType === 'amount') {
            // 满减券
            couponDiscount = coupon.discountValue;
          } else if (coupon.discountType === 'percentage') {
            // 折扣券：按照新的计算方式
            // 计算公式：支付金额 = (总金额 - 满减 - 积分抵扣) * 折扣率
            const otherDiscounts = fullReductionDiscount + pointsDiscount;
            const baseAmount = Math.max(orderAmount - otherDiscounts, 0);
            const discountedAmount = baseAmount * (coupon.discountValue / 100);
            couponDiscount = Math.min(
              baseAmount - discountedAmount,
              coupon.maxDiscount
            );
          }
        }
      }
    }
    
    // 计算最终支付金额
    // 公式：支付金额 = 总金额 + 运费 - 满减 - 积分抵扣 - 折扣券优惠 - 运费优惠
    const finalAmount = Math.max(
      orderAmount + shippingFee - fullReductionDiscount - pointsDiscount - couponDiscount - couponShippingDiscount,
      0
    );
    
    // 计算详细信息
    const calculationDetails = {
      orderAmount: parseFloat(orderAmount.toFixed(2)),
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      fullReductionDiscount: parseFloat(fullReductionDiscount.toFixed(2)),
      pointsDiscount: parseFloat(pointsDiscount.toFixed(2)),
      couponDiscount: parseFloat(couponDiscount.toFixed(2)),
      couponShippingDiscount: parseFloat(couponShippingDiscount.toFixed(2)),
      totalDiscount: parseFloat((fullReductionDiscount + pointsDiscount + couponDiscount + couponShippingDiscount).toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    };
    
    // 如果是折扣券，添加计算示例
    if (couponInfo && couponInfo.discountType === 'percentage') {
      calculationDetails.discountCalculationExample = {
        description: `折扣券计算示例（${couponInfo.discountValue}折）`,
        step1: `总金额：${orderAmount}元`,
        step2: `减去满减：${orderAmount} - ${fullReductionDiscount} = ${orderAmount - fullReductionDiscount}元`,
        step3: `减去积分抵扣：${orderAmount - fullReductionDiscount} - ${pointsDiscount} = ${orderAmount - fullReductionDiscount - pointsDiscount}元`,
        step4: `应用折扣：${orderAmount - fullReductionDiscount - pointsDiscount} × ${couponInfo.discountValue / 100} = ${((orderAmount - fullReductionDiscount - pointsDiscount) * (couponInfo.discountValue / 100)).toFixed(2)}元`,
        step5: `最终支付金额：${((orderAmount - fullReductionDiscount - pointsDiscount) * (couponInfo.discountValue / 100) + shippingFee - couponShippingDiscount).toFixed(2)}元`
      };
    }
    
    res.json({
      success: true,
      data: {
        ...calculationDetails,
        couponInfo,
        calculationFormula: '支付金额 = (总金额 - 满减 - 积分抵扣) × 折扣率 + 运费 - 运费优惠'
      }
    });
  } catch (error) {
    console.error('计算最终支付金额失败:', error);
    res.status(500).json({
      success: false,
      message: '计算最终支付金额失败'
    });
  }
});

module.exports = router;