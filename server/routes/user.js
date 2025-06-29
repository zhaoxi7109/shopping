const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/user/profile
 * @desc 获取用户详细信息
 * @access Private
 */
router.get("/profile", auth, (req, res, next) => {
  try {
    const user = dataStore.findById("users", req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "用户不存在",
      });
    }

    // 返回用户信息（不包含密码）
    const { password, ...userInfo } = user;

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/user/profile
 * @desc 更新用户信息
 * @access Private
 */
router.put(
  "/profile",
  [
    auth,
    body("nickname")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("昵称长度必须在1-50个字符之间"),
    body("email").optional().isEmail().withMessage("请输入有效的邮箱地址"),
    body("phone")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other", ""])
      .withMessage("性别值无效"),
    body("birthday").optional().isISO8601().withMessage("请输入有效的日期格式"),
  ],
  async (req, res, next) => {
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

      const { nickname, email, phone, gender, birthday, address } = req.body;
      const userId = req.user.id;

      // 检查邮箱是否被其他用户使用
      if (email) {
        const existingUser = dataStore.findOne("users", { email });
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            success: false,
            error: "邮箱已被其他用户使用",
          });
        }
      }

      // 获取当前用户信息
      const currentUser = dataStore.findById("users", userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          error: "用户不存在",
        });
      }

      // 准备更新数据
      const updateData = {};
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;

      // 更新profile信息
      const updatedProfile = {
        ...currentUser.profile,
        ...(nickname && { nickname }),
        ...(gender !== undefined && { gender }),
        ...(birthday && { birthday }),
        ...(address !== undefined && { address }),
      };
      updateData.profile = updatedProfile;

      // 更新用户信息
      const updatedUser = dataStore.update("users", userId, updateData);

      // 返回更新后的用户信息（不包含密码）
      const { password, ...userInfo } = updatedUser;

      res.json({
        success: true,
        message: "用户信息更新成功",
        data: userInfo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/user/password
 * @desc 修改密码
 * @access Private
 */
router.put(
  "/password",
  [
    auth,
    body("currentPassword").notEmpty().withMessage("当前密码不能为空"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("新密码长度至少6个字符")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("新密码必须包含大小写字母和数字"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("确认密码与新密码不匹配");
      }
      return true;
    }),
  ],
  async (req, res, next) => {
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

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // 获取用户信息
      const user = dataStore.findById("users", userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "用户不存在",
        });
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "当前密码错误",
        });
      }

      // 加密新密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      dataStore.update("users", userId, {
        password: hashedNewPassword,
      });

      res.json({
        success: true,
        message: "密码修改成功",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/user/avatar
 * @desc 更新用户头像
 * @access Private
 */
router.put(
  "/avatar",
  [
    auth,
    body("avatar")
      .notEmpty()
      .withMessage("头像URL不能为空")
      .isURL()
      .withMessage("请提供有效的头像URL"),
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

      const { avatar } = req.body;
      const userId = req.user.id;

      // 更新头像
      const updatedUser = dataStore.update("users", userId, { avatar });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: "用户不存在",
        });
      }

      // 返回更新后的用户信息（不包含密码）
      const { password, ...userInfo } = updatedUser;

      res.json({
        success: true,
        message: "头像更新成功",
        data: userInfo,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/user/favorites
 * @desc 获取用户收藏列表
 * @access Private
 */
router.get("/favorites", auth, (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 获取用户收藏
    const favorites = dataStore.find("favorites", { userId: req.user.id });

    // 获取收藏的商品详情并添加收藏时间
    const productIds = favorites.map((fav) => fav.productId);
    const products = dataStore
      .findAll("products")
      .filter((product) => productIds.includes(product.id))
      .map((product) => {
        const favorite = favorites.find((fav) => fav.productId === product.id);
        return {
          ...product,
          favoriteTime: favorite.createdAt || new Date().toISOString(),
          // 添加一些示例标签
          isHot: product.sales > 500,
          isNew:
            new Date(product.createdAt) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };
      })
      // 按收藏时间倒序排列
      .sort((a, b) => new Date(b.favoriteTime) - new Date(a.favoriteTime));

    // 分页
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    res.json({
      success: true,
      code: 200,
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/user/favorites/:productId
 * @desc 添加商品到收藏
 * @access Private
 */
router.post("/favorites/:productId", auth, (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // 检查商品是否存在
    const product = dataStore.findById("products", productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "商品不存在",
      });
    }

    // 检查是否已收藏
    const existingFavorite = dataStore.findOne("favorites", {
      userId,
      productId,
    });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: "商品已在收藏列表中",
      });
    }

    // 添加收藏
    const favorite = dataStore.create("favorites", {
      userId,
      productId,
    });

    res.status(201).json({
      success: true,
      message: "收藏成功",
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/user/favorites/:productId
 * @desc 取消收藏商品
 * @access Private
 */
router.delete("/favorites/:productId", auth, (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // 查找收藏记录
    const favorite = dataStore.findOne("favorites", { userId, productId });
    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: "收藏记录不存在",
      });
    }

    // 删除收藏
    const deleted = dataStore.delete("favorites", favorite.id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: "取消收藏失败",
      });
    }

    res.json({
      success: true,
      message: "取消收藏成功",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/user/addresses
 * @desc 获取用户收货地址列表
 * @access Private
 */
router.get("/addresses", auth, (req, res, next) => {
  try {
    const userId = req.user.id;

    // 获取用户所有地址
    const addresses = dataStore.find("addresses", { userId });

    // 按创建时间倒序排列
    const sortedAddresses = addresses.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      code: 200,
      data: sortedAddresses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/user/addresses
 * @desc 添加收货地址
 * @access Private
 */
router.post(
  "/addresses",
  [
    auth,
    body("name").notEmpty().withMessage("收货人姓名不能为空"),
    body("mobile")
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("province").notEmpty().withMessage("省份不能为空"),
    body("city").notEmpty().withMessage("城市不能为空"),
    body("district").notEmpty().withMessage("区县不能为空"),
    body("detail").notEmpty().withMessage("详细地址不能为空"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("默认地址标识必须为布尔值"),
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

      const { name, mobile, province, city, district, detail, tag, isDefault } =
        req.body;
      const userId = req.user.id;

      // 如果设置为默认地址，先取消其他默认地址
      if (isDefault) {
        const existingAddresses = dataStore.find("addresses", { userId });
        existingAddresses.forEach((addr) => {
          if (addr.isDefault) {
            dataStore.update("addresses", addr.id, { isDefault: false });
          }
        });
      }

      // 创建新地址
      const newAddress = dataStore.create("addresses", {
        userId,
        name,
        mobile,
        province,
        city,
        district,
        detail,
        tag: tag || "",
        isDefault: isDefault || false,
      });

      res.status(201).json({
        success: true,
        code: 201,
        message: "地址添加成功",
        data: newAddress,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/user/addresses/:id
 * @desc 更新收货地址
 * @access Private
 */
router.put(
  "/addresses/:id",
  [
    auth,
    body("name").optional().notEmpty().withMessage("收货人姓名不能为空"),
    body("mobile")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("province").optional().notEmpty().withMessage("省份不能为空"),
    body("city").optional().notEmpty().withMessage("城市不能为空"),
    body("district").optional().notEmpty().withMessage("区县不能为空"),
    body("detail").optional().notEmpty().withMessage("详细地址不能为空"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("默认地址标识必须为布尔值"),
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
      const userId = req.user.id;
      const updateData = req.body;

      // 检查地址是否存在且属于当前用户
      const existingAddress = dataStore.findOne("addresses", { id, userId });
      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "地址不存在或无权限访问",
        });
      }

      // 如果设置为默认地址，先取消其他默认地址
      if (updateData.isDefault) {
        const existingAddresses = dataStore.find("addresses", { userId });
        existingAddresses.forEach((addr) => {
          if (addr.id !== id && addr.isDefault) {
            dataStore.update("addresses", addr.id, { isDefault: false });
          }
        });
      }

      // 更新地址
      const updatedAddress = dataStore.update("addresses", id, updateData);

      res.json({
        success: true,
        code: 200,
        message: "地址更新成功",
        data: updatedAddress,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/user/addresses/:id
 * @desc 删除收货地址
 * @access Private
 */
router.delete("/addresses/:id", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查地址是否存在且属于当前用户
    const existingAddress = dataStore.findOne("addresses", { id, userId });
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: "地址不存在或无权限访问",
      });
    }

    // 删除地址
    const deleted = dataStore.delete("addresses", id);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: "删除地址失败",
      });
    }

    res.json({
      success: true,
      code: 200,
      message: "地址删除成功",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/user/addresses/:id/default
 * @desc 设置默认地址
 * @access Private
 */
router.put("/addresses/:id/default", auth, (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查地址是否存在且属于当前用户
    const existingAddress = dataStore.findOne("addresses", { id, userId });
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: "地址不存在或无权限访问",
      });
    }

    // 取消其他默认地址
    const existingAddresses = dataStore.find("addresses", { userId });
    existingAddresses.forEach((addr) => {
      if (addr.isDefault) {
        dataStore.update("addresses", addr.id, { isDefault: false });
      }
    });

    // 设置当前地址为默认
    const updatedAddress = dataStore.update("addresses", id, {
      isDefault: true,
    });

    res.json({
      success: true,
      code: 200,
      message: "默认地址设置成功",
      data: updatedAddress,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
