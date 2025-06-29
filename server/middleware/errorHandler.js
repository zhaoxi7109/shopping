/**
 * 全局错误处理中间件
 * 统一处理应用中的所有错误
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error("Error:", err);

  // Mongoose 验证错误
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} 已存在`;
    error = {
      message,
      statusCode: 400,
    };
  }

  // Mongoose 无效ObjectId错误
  if (err.name === "CastError") {
    const message = "资源未找到";
    error = {
      message,
      statusCode: 404,
    };
  }

  // JWT错误
  if (err.name === "JsonWebTokenError") {
    const message = "无效的token";
    error = {
      message,
      statusCode: 401,
    };
  }

  // JWT过期错误
  if (err.name === "TokenExpiredError") {
    const message = "Token已过期";
    error = {
      message,
      statusCode: 401,
    };
  }

  // 文件上传错误
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "文件大小超出限制";
    error = {
      message,
      statusCode: 400,
    };
  }

  // 返回错误响应
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "服务器内部错误",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
