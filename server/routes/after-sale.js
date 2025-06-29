const express = require("express");
const { body, query, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/after-sale/list
 * @desc 获取售后记录列表
 * @access Private
 */
router.get("/list", auth, (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const userId = req.user.id;

    // 构建查询条件
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // 获取售后记录列表
    let afterSales = dataStore
      .find("afterSales", query)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const total = afterSales.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedAfterSales = afterSales.slice(
      offset,
      offset + parseInt(pageSize)
    );

    res.json({
      success: true,
      data: {
        list: paginatedAfterSales,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/after-sale/apply
 * @desc 申请售后服务
 * @access Private
 */
router.post(
  "/apply",
  [
    auth,
    body("orderId").notEmpty().withMessage("订单ID不能为空"),
    body("type")
      .isIn(["refund", "return", "exchange"])
      .withMessage("售后类型无效"),
    body("reason").notEmpty().withMessage("售后原因不能为空"),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("问题描述不能超过500字符"),
    body("amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("退款金额必须大于等于0"),
    body("contact.name").notEmpty().withMessage("联系人姓名不能为空"),
    body("contact.phone")
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
  ],
  (req, res, next) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "输入验证失败",
          details: errors.array(),
        });
      }

      const { orderId, type, reason, description, amount, contact, images } =
        req.body;
      const userId = req.user.id;

      // 验证订单是否存在且属于当前用户
      const order = dataStore.findById("orders", orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "订单不存在",
        });
      }

      // 检查订单状态是否允许申请售后
      if (!["paid", "shipped", "delivered"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          error: "当前订单状态不允许申请售后",
        });
      }

      // 生成售后单号
      const afterSaleNumber =
        "AS" +
        Date.now() +
        Math.random().toString(36).substr(2, 4).toUpperCase();

      // 创建售后记录
      const afterSale = dataStore.create("afterSales", {
        afterSaleNumber,
        userId,
        orderId,
        orderNumber: order.orderNumber,
        type, // refund: 仅退款, return: 退货退款, exchange: 换货
        reason,
        description: description || "",
        amount: amount || order.finalAmount,
        contact,
        images: images || [],
        status: "pending", // pending: 待处理, approved: 已同意, rejected: 已拒绝, completed: 已完成
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: "售后申请提交成功",
        data: afterSale,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/after-sale/:id
 * @desc 获取售后详情
 * @access Private
 */
router.get("/:id", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找售后记录
    const afterSale = dataStore.findById("afterSales", id);
    if (!afterSale || afterSale.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "售后记录不存在",
      });
    }

    // 获取关联的订单信息
    const order = dataStore.findById("orders", afterSale.orderId);

    res.json({
      success: true,
      data: {
        ...afterSale,
        order,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/after-sale/:id/cancel
 * @desc 取消售后申请
 * @access Private
 */
router.put("/:id/cancel", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找售后记录
    const afterSale = dataStore.findById("afterSales", id);
    if (!afterSale || afterSale.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "售后记录不存在",
      });
    }

    // 检查售后状态
    if (afterSale.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "只能取消待处理的售后申请",
      });
    }

    // 更新售后状态
    const updatedAfterSale = dataStore.update("afterSales", id, {
      status: "cancelled",
      cancelTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "售后申请取消成功",
      data: updatedAfterSale,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
