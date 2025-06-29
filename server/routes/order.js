const express = require("express");
const { body, query, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route POST /api/orders
 * @desc 创建订单
 * @access Private
 */
router.post(
  "/",
  [
    auth,
    body("items").isArray({ min: 1 }).withMessage("订单项目不能为空"),
    body("items.*.productId").notEmpty().withMessage("商品ID不能为空"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("数量必须是大于0的整数"),
    body("items.*.price").isFloat({ min: 0 }).withMessage("价格必须大于等于0"),
    body("shippingAddress").isObject().withMessage("收货地址信息不能为空"),
    body("shippingAddress.name").notEmpty().withMessage("收货人姓名不能为空"),
    body("shippingAddress.phone")
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("shippingAddress.address").notEmpty().withMessage("详细地址不能为空"),
    body("paymentMethod")
      .isIn(["alipay", "wechat", "cod"])
      .withMessage("支付方式无效"),
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

      const { items, shippingAddress, paymentMethod, remark } = req.body;
      const userId = req.user.id;

      // 验证商品信息并计算总价
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = dataStore.findById("products", item.productId);
        if (!product) {
          return res.status(400).json({
            success: false,
            error: `商品 ${item.productId} 不存在`,
          });
        }

        // 检查库存
        if (product.stock && item.quantity > product.stock) {
          return res.status(400).json({
            success: false,
            error: `商品 ${product.name} 库存不足`,
          });
        }

        // 验证价格（防止前端篡改）
        if (parseFloat(item.price) !== parseFloat(product.price)) {
          return res.status(400).json({
            success: false,
            error: `商品 ${product.name} 价格已变更，请刷新后重试`,
          });
        }

        const subtotal = parseFloat(product.price) * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images ? product.images[0] : product.image,
          price: product.price,
          quantity: item.quantity,
          spec: item.spec || "默认规格",
          subtotal: subtotal.toFixed(2),
        });
      }

      // 计算运费（简单逻辑：满99免运费，否则10元）
      const shippingFee = totalAmount >= 99 ? 0 : 10;
      const finalAmount = totalAmount + shippingFee;

      // 生成订单号
      const orderNumber =
        "ORD" +
        Date.now() +
        Math.random().toString(36).substr(2, 4).toUpperCase();

      // 创建订单
      const order = dataStore.create("orders", {
        orderNumber,
        userId,
        items: orderItems,
        totalAmount: totalAmount.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        finalAmount: finalAmount.toFixed(2),
        shippingAddress,
        paymentMethod,
        remark: remark || "",
        status: "pending", // pending, paid, shipped, delivered, cancelled
        paymentStatus: "unpaid", // unpaid, paid, refunded
        orderTime: new Date().toISOString(),
      });

      // 减少库存
      for (const item of items) {
        const product = dataStore.findById("products", item.productId);
        if (product.stock) {
          dataStore.update("products", item.productId, {
            stock: product.stock - item.quantity,
            sales: (product.sales || 0) + item.quantity,
          });
        }
      }

      // 清空购物车中的相关项目
      const cartItems = dataStore.find("cart", { userId });
      const productIds = items.map((item) => item.productId);
      cartItems.forEach((cartItem) => {
        if (productIds.includes(cartItem.productId)) {
          dataStore.delete("cart", cartItem.id);
        }
      });

      res.status(201).json({
        success: true,
        message: "订单创建成功",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/orders
 * @desc 获取用户订单列表
 * @access Private
 */
router.get(
  "/",
  [
    auth,
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每页数量必须在1-50之间"),
    query("status")
      .optional()
      .isIn(["pending", "paid", "shipped", "delivered", "cancelled"])
      .withMessage("订单状态无效"),
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

      const { page = 1, limit = 10, status } = req.query;
      const userId = req.user.id;

      // 构建查询条件
      const query = { userId };
      if (status) {
        query.status = status;
      }

      // 获取订单列表
      let orders = dataStore
        .find("orders", query)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 分页
      const total = orders.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedOrders = orders.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          orders: paginatedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/order/list
 * @desc 获取订单列表（前端兼容接口）
 * @access Private
 */
router.get("/list", auth, (req, res, next) => {
  try {
    const { type = "", page = 1, pageSize = 10 } = req.query;
    const userId = req.user.id;

    // 构建查询条件
    const query = { userId };

    // 根据type参数设置状态过滤
    const statusMap = {
      1: "pending", // 待付款
      2: "paid", // 待发货
      3: "shipped", // 待收货
      4: "delivered", // 待评价
    };

    if (type && statusMap[type]) {
      query.status = statusMap[type];
    }

    // 获取订单列表
    let orders = dataStore
      .find("orders", query)
      .sort(
        (a, b) =>
          new Date(b.orderTime || b.createdAt) -
          new Date(a.orderTime || a.createdAt)
      );

    // 分页
    const total = orders.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedOrders = orders.slice(offset, offset + parseInt(pageSize));

    res.json({
      success: true,
      data: {
        list: paginatedOrders,
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
 * @route GET /api/order/counts
 * @desc 获取订单数量统计（前端兼容接口）
 * @access Private
 */
router.get("/counts", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户所有订单
    const orders = dataStore.find("orders", { userId });

    // 统计各状态订单数量
    const counts = {
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
    };

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/orders/:id
 * @desc 获取订单详情
 * @access Private
 */
router.get("/:id", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/orders/:id/cancel
 * @desc 取消订单
 * @access Private
 */
router.put("/:id/cancel", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    // 检查订单状态
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "只能取消待支付的订单",
      });
    }

    // 更新订单状态
    const updatedOrder = dataStore.update("orders", id, {
      status: "cancelled",
      cancelTime: new Date().toISOString(),
    });

    // 恢复库存
    order.items.forEach((item) => {
      const product = dataStore.findById("products", item.productId);
      if (product) {
        dataStore.update("products", item.productId, {
          stock: (product.stock || 0) + item.quantity,
          sales: Math.max((product.sales || 0) - item.quantity, 0),
        });
      }
    });

    res.json({
      success: true,
      message: "订单取消成功",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/orders/:id/confirm
 * @desc 确认收货
 * @access Private
 */
router.put("/:id/confirm", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    // 检查订单状态
    if (order.status !== "shipped") {
      return res.status(400).json({
        success: false,
        error: "只能确认已发货的订单",
      });
    }

    // 更新订单状态
    const updatedOrder = dataStore.update("orders", id, {
      status: "delivered",
      deliveryTime: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "确认收货成功",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/orders/:id/complete
 * @desc 完成评价，订单完成
 * @access Private
 */
router.put("/:id/complete", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    // 检查订单状态
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        error: "只能评价已收货的订单",
      });
    }

    // 更新订单状态
    const updatedOrder = dataStore.update("orders", id, {
      status: "completed",
      completeTime: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "评价完成，订单已完成",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/orders/:id/pay
 * @desc 模拟支付订单
 * @access Private
 */
router.post(
  "/:id/pay",
  [
    auth,
    body("paymentMethod")
      .isIn(["alipay", "wechat", "cod"])
      .withMessage("支付方式无效"),
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

      const { id } = req.params;
      const { paymentMethod } = req.body;
      const userId = req.user.id;

      // 查找订单
      const order = dataStore.findById("orders", id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "订单不存在",
        });
      }

      // 检查订单状态
      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "订单状态不允许支付",
        });
      }

      // 模拟支付成功
      const updatedOrder = dataStore.update("orders", id, {
        status: "paid",
        paymentStatus: "paid",
        paymentMethod,
        paymentTime: new Date().toISOString(),
        transactionId:
          "TXN" +
          Date.now() +
          Math.random().toString(36).substr(2, 6).toUpperCase(),
      });

      res.json({
        success: true,
        message: "支付成功",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/orders/:id/review
 * @desc 提交订单评价
 * @access Private
 */
router.post(
  "/:id/review",
  [
    auth,
    body("rating").isInt({ min: 1, max: 5 }).withMessage("评分必须在1-5之间"),
    body("content").notEmpty().withMessage("评价内容不能为空"),
    body("images").optional().isArray().withMessage("图片必须是数组"),
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("匿名标志必须是布尔值"),
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

      const { id } = req.params;
      const { rating, content, images = [], isAnonymous = false } = req.body;
      const userId = req.user.id;

      // 查找订单
      const order = dataStore.findById("orders", id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "订单不存在",
        });
      }

      // 检查订单状态
      if (order.status !== "delivered") {
        return res.status(400).json({
          success: false,
          error: "只能评价已收货的订单",
        });
      }

      // 创建评价
      const review = dataStore.create("reviews", {
        orderId: id,
        userId: isAnonymous ? null : userId,
        productId: order.items[0].productId,
        productName: order.items[0].productName,
        productImage: order.items[0].productImage,
        rating,
        content,
        images,
        isAnonymous,
        createdAt: new Date().toISOString(),
      });

      // 更新订单状态
      const updatedOrder = dataStore.update("orders", id, {
        status: "completed",
        completeTime: new Date().toISOString(),
        reviewId: review.id,
      });

      // 更新商品评分
      const product = dataStore.findById("products", order.items[0].productId);
      if (product) {
        // 获取该商品的所有评价
        const productReviews = dataStore.find("reviews", {
          productId: product.id,
        });

        // 计算平均评分
        const totalRating = productReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating = (totalRating / productReviews.length).toFixed(1);

        // 更新商品评分
        dataStore.update("products", product.id, {
          rating: averageRating,
          reviewCount: productReviews.length,
        });
      }

      res.json({
        success: true,
        message: "评价提交成功",
        data: {
          review,
          order: updatedOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/orders/statistics/summary
 * @desc 获取订单统计信息
 * @access Private
 */
router.get("/statistics/summary", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户所有订单
    const orders = dataStore.find("orders", { userId });

    // 统计各状态订单数量
    const statistics = {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      totalAmount: orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + parseFloat(order.finalAmount), 0)
        .toFixed(2),
    };

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/orders/:id
 * @desc 删除订单
 * @access Private
 */
router.delete("/:id", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    // 检查订单状态
    if (!["cancelled", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "只能删除已取消或已完成的订单",
      });
    }

    // 删除订单
    dataStore.delete("orders", id);

    res.json({
      success: true,
      message: "订单删除成功",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/orders/reviews
 * @desc 获取评价列表
 * @access Public
 */
router.get("/reviews", async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 10, sort = "latest" } = req.query;

    // 构建查询条件
    const query = {};
    if (productId) {
      query.productId = productId;
    }

    // 获取评价列表
    let reviews = dataStore.find("reviews", query);

    // 排序
    if (sort === "latest") {
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "highest") {
      reviews.sort((a, b) => b.rating - a.rating);
    } else if (sort === "lowest") {
      reviews.sort((a, b) => a.rating - b.rating);
    }

    // 分页
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedReviews = reviews.slice(offset, offset + parseInt(limit));

    // 统计评分分布
    const ratingDistribution = {
      5: reviews.filter((review) => review.rating === 5).length,
      4: reviews.filter((review) => review.rating === 4).length,
      3: reviews.filter((review) => review.rating === 3).length,
      2: reviews.filter((review) => review.rating === 2).length,
      1: reviews.filter((review) => review.rating === 1).length,
    };

    // 计算平均评分
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

    res.json({
      success: true,
      data: {
        list: paginatedReviews,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasMore: page < totalPages,
        statistics: {
          averageRating,
          totalReviews: reviews.length,
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/orders/:id/logistics
 * @desc 获取订单物流信息
 * @access Private
 */
router.get("/:id/logistics", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找订单
    const order = dataStore.findById("orders", id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "订单不存在",
      });
    }

    // 检查订单状态
    if (!["shipped", "delivered", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "订单尚未发货，暂无物流信息",
      });
    }

    // 返回物流信息
    res.json({
      success: true,
      data: {
        order,
        logistics: {
          status: order.status === "shipped" ? "in_transit" : "delivered",
          trackingNumber: order.shippingInfo?.trackingNumber,
          carrier: order.shippingInfo?.carrier,
          shippingTime: order.shippingTime,
          deliveryTime: order.deliveryTime,
          // 模拟物流轨迹数据
          tracking: [
            {
              time: order.deliveryTime || new Date().toISOString(),
              status: "已签收",
              location: `${order.shippingAddress.province}${order.shippingAddress.city}`,
            },
            {
              time: new Date(
                new Date(order.shippingTime).getTime() + 24 * 60 * 60 * 1000
              ).toISOString(),
              status: "运输中",
              location: `${order.shippingAddress.province}${order.shippingAddress.city}`,
            },
            {
              time: order.shippingTime,
              status: "已发货",
              location: "商品已从仓库发出",
            },
            {
              time: new Date(
                new Date(order.shippingTime).getTime() - 2 * 60 * 60 * 1000
              ).toISOString(),
              status: "已揽收",
              location: `${order.shippingInfo?.carrier || "快递公司"}已揽收`,
            },
            {
              time: order.orderTime,
              status: "已下单",
              location: "商品已下单",
            },
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
