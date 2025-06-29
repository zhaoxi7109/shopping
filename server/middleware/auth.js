const jwt = require("jsonwebtoken");

/**
 * JWT认证中间件
 * 验证用户身份并提取用户信息
 */
const auth = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "访问被拒绝，未提供token",
      });
    }

    // 检查token格式 (Bearer <token>)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "访问被拒绝，token格式无效",
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
    };

    next();
  } catch (error) {
    console.error("JWT验证错误:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token已过期，请重新登录",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "无效的token",
      });
    }

    res.status(401).json({
      success: false,
      error: "Token验证失败",
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    }
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    console.warn("可选认证失败:", error.message);
  }

  next();
};

/**
 * 管理员权限验证中间件
 */
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "请先登录",
    });
  }

  if (!req.user.roles.includes("admin")) {
    return res.status(403).json({
      success: false,
      error: "权限不足，需要管理员权限",
    });
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
};
