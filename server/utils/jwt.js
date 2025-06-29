const jwt = require("jsonwebtoken");

/**
 * JWT工具函数
 * 用于生成和验证JWT token
 */

/**
 * 生成访问token
 * @param {Object} payload - 用户信息
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      sub: payload.id,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "shopping-app",
      audience: "shopping-app-users",
    }
  );
};

/**
 * 生成刷新token
 * @param {Object} payload - 用户信息
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      sub: payload.id,
      type: "refresh",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
      issuer: "shopping-app",
      audience: "shopping-app-users",
    }
  );
};

/**
 * 验证token
 * @param {String} token - JWT token
 * @returns {Object} 解码后的payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "shopping-app",
      audience: "shopping-app-users",
    });
  } catch (error) {
    throw error;
  }
};

/**
 * 解码token（不验证签名）
 * @param {String} token - JWT token
 * @returns {Object} 解码后的payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * 检查token是否即将过期
 * @param {String} token - JWT token
 * @param {Number} threshold - 过期阈值（秒），默认1小时
 * @returns {Boolean} 是否即将过期
 */
const isTokenExpiringSoon = (token, threshold = 3600) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    return timeUntilExpiry <= threshold;
  } catch (error) {
    return true;
  }
};

/**
 * 生成token对
 * @param {Object} user - 用户信息
 * @returns {Object} 包含访问token和刷新token的对象
 */
const generateTokenPair = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpiringSoon,
  generateTokenPair,
};
