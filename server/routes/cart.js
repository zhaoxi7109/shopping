const express = require("express");
const { body, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/cart
 * @desc 获取购物车列表
 * @access Private
 */
router.get("/", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户购物车项目
    const cartItems = dataStore.find("cart", { userId });

    // 获取商品详情并计算总价
    const cartWithDetails = cartItems
      .map((item) => {
        const product = dataStore.findById("products", item.productId);
        if (!product) {
          // 如果商品不存在，从购物车中移除
          dataStore.delete("cart", item.id);
          return null;
        }

        return {
          id: item.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images ? product.images[0] : product.image,
          spec: item.spec || "默认规格",
          quantity: item.quantity,
          selected: item.selected !== false, // 默认选中
          stock: product.stock || 999,
          subtotal: (parseFloat(product.price) * item.quantity).toFixed(2),
        };
      })
      .filter((item) => item !== null);

    // 计算统计信息
    const selectedItems = cartWithDetails.filter((item) => item.selected);
    const totalCount = cartWithDetails.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const selectedCount = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );

    res.json({
      success: true,
      data: {
        items: cartWithDetails,
        summary: {
          totalCount,
          selectedCount,
          totalAmount: totalAmount.toFixed(2),
          itemCount: cartWithDetails.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/cart
 * @desc 添加商品到购物车
 * @access Private
 */
router.post(
  "/",
  [
    auth,
    body("productId").notEmpty().withMessage("商品ID不能为空"),
    body("quantity").isInt({ min: 1 }).withMessage("数量必须是大于0的整数"),
    body("spec").optional().isString().withMessage("规格必须是字符串"),
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

      const { productId, quantity, spec } = req.body;
      const userId = req.user.id;

      // 检查商品是否存在
      const product = dataStore.findById("products", productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "商品不存在",
        });
      }

      // 检查库存
      if (product.stock && quantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: "库存不足",
        });
      }

      // 检查是否已存在相同商品和规格
      const existingItem = dataStore.findOne("cart", {
        userId,
        productId,
        spec: spec || "默认规格",
      });

      if (existingItem) {
        // 更新数量
        const newQuantity = existingItem.quantity + quantity;

        // 再次检查库存
        if (product.stock && newQuantity > product.stock) {
          return res.status(400).json({
            success: false,
            error: "库存不足",
          });
        }

        const updatedItem = dataStore.update("cart", existingItem.id, {
          quantity: newQuantity,
        });

        res.json({
          success: true,
          message: "购物车更新成功",
          data: updatedItem,
        });
      } else {
        // 添加新项目
        const newItem = dataStore.create("cart", {
          userId,
          productId,
          quantity,
          spec: spec || "默认规格",
          selected: true,
        });

        res.status(201).json({
          success: true,
          message: "添加到购物车成功",
          data: newItem,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/cart/:id
 * @desc 更新购物车项目
 * @access Private
 */
router.put(
  "/:id",
  [
    auth,
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("数量必须是大于0的整数"),
    body("selected").optional().isBoolean().withMessage("选中状态必须是布尔值"),
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
      const { quantity, selected } = req.body;
      const userId = req.user.id;

      // 查找购物车项目
      const cartItem = dataStore.findById("cart", id);
      if (!cartItem || cartItem.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "购物车项目不存在",
        });
      }

      // 如果更新数量，检查库存
      if (quantity !== undefined) {
        const product = dataStore.findById("products", cartItem.productId);
        if (product && product.stock && quantity > product.stock) {
          return res.status(400).json({
            success: false,
            error: "库存不足",
          });
        }
      }

      // 准备更新数据
      const updateData = {};
      if (quantity !== undefined) updateData.quantity = quantity;
      if (selected !== undefined) updateData.selected = selected;

      // 更新购物车项目
      const updatedItem = dataStore.update("cart", id, updateData);

      res.json({
        success: true,
        message: "购物车更新成功",
        data: updatedItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/cart/:id
 * @desc 删除购物车项目
 * @access Private
 */
router.delete("/:id", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查找购物车项目
    const cartItem = dataStore.findById("cart", id);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "购物车项目不存在",
      });
    }

    // 删除项目
    const deleted = dataStore.delete("cart", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: "删除失败",
      });
    }

    res.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/cart/select/all
 * @desc 全选/取消全选购物车项目
 * @access Private
 */
router.put(
  "/select/all",
  [auth, body("selected").isBoolean().withMessage("选中状态必须是布尔值")],
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

      const { selected } = req.body;
      const userId = req.user.id;

      // 获取用户所有购物车项目
      const cartItems = dataStore.find("cart", { userId });

      // 批量更新选中状态
      cartItems.forEach((item) => {
        dataStore.update("cart", item.id, { selected });
      });

      res.json({
        success: true,
        message: selected ? "全选成功" : "取消全选成功",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/cart/selected/items
 * @desc 删除选中的购物车项目
 * @access Private
 */
router.delete("/selected/items", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户选中的购物车项目
    const selectedItems = dataStore.find("cart", { userId, selected: true });

    if (selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "没有选中的项目",
      });
    }

    // 批量删除选中项目
    selectedItems.forEach((item) => {
      dataStore.delete("cart", item.id);
    });

    res.json({
      success: true,
      message: `成功删除${selectedItems.length}个项目`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/cart/clear
 * @desc 清空购物车
 * @access Private
 */
router.delete("/clear", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户所有购物车项目
    const cartItems = dataStore.find("cart", { userId });

    // 批量删除所有项目
    cartItems.forEach((item) => {
      dataStore.delete("cart", item.id);
    });

    res.json({
      success: true,
      message: "购物车已清空",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
