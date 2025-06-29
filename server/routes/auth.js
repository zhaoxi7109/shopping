const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { generateTokenPair, verifyToken } = require("../utils/jwt");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .withMessage("用户名长度必须在3-20个字符之间")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("用户名只能包含字母、数字和下划线"),
    body("email").isEmail().withMessage("请输入有效的邮箱地址"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("密码长度至少6个字符")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("密码必须包含大小写字母和数字"),
    body("phone")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
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

      const { username, email, password, phone } = req.body;

      // 检查用户是否已存在
      const existingUser = dataStore.findOne("users", {
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "用户名或邮箱已存在",
        });
      }

      // 加密密码
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 创建用户
      const newUser = dataStore.create("users", {
        username,
        email,
        password: hashedPassword,
        phone: phone || "",
        avatar: "/static/images/default-avatar.png",
        roles: ["user"],
        isActive: true,
        profile: {
          nickname: username,
          gender: "",
          birthday: "",
          address: "",
        },
      });

      // 生成token
      const tokens = generateTokenPair({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        roles: newUser.roles,
      });

      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = newUser;

      res.status(201).json({
        success: true,
        message: "注册成功",
        data: {
          user: userInfo,
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("用户名或邮箱不能为空"),
    body("password").notEmpty().withMessage("密码不能为空"),
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

      const { username, password } = req.body;

      // 查找用户（支持用户名或邮箱登录）
      const users = dataStore.findAll("users");
      const user = users.find(
        (u) => u.username === username || u.email === username
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "用户名或密码错误",
        });
      }

      // 检查用户状态
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: "账户已被禁用，请联系管理员",
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "用户名或密码错误",
        });
      }

      // 更新最后登录时间
      dataStore.update("users", user.id, {
        lastLoginAt: new Date().toISOString(),
      });

      // 生成token
      const tokens = generateTokenPair({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      });

      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = user;

      res.json({
        success: true,
        message: "登录成功",
        data: {
          user: userInfo,
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc 刷新访问token
 * @access Public
 */
router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("刷新token不能为空")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "输入验证失败",
          details: errors.array(),
        });
      }

      const { refreshToken } = req.body;

      // 验证刷新token
      const decoded = verifyToken(refreshToken);

      if (decoded.type !== "refresh") {
        return res.status(401).json({
          success: false,
          error: "无效的刷新token",
        });
      }

      // 查找用户
      const user = dataStore.findById("users", decoded.sub);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "用户不存在或已被禁用",
        });
      }

      // 生成新的token对
      const tokens = generateTokenPair({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      });

      res.json({
        success: true,
        message: "Token刷新成功",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post("/logout", auth, (req, res) => {
  // 在实际应用中，这里可以将token加入黑名单
  // 目前只是返回成功响应
  res.json({
    success: true,
    message: "登出成功",
  });
});

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get("/me", auth, (req, res, next) => {
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

module.exports = router;
