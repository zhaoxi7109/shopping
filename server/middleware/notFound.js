/**
 * 404 Not Found 中间件
 * 处理未匹配到的路由请求
 */
const notFound = (req, res, next) => {
  const error = new Error(`路径 ${req.originalUrl} 未找到`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
