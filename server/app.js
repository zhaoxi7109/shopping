const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// 导入路由
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const bannerRoutes = require("./routes/banner");
const searchRoutes = require("./routes/search");
const afterSaleRoutes = require("./routes/after-sale");
const couponRoutes = require("./routes/coupon");
const pointsRoutes = require("./routes/points");
const chatRoutes = require("./routes/chat");

// 导入中间件
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS配置
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 请求日志
app.use(morgan("combined"));

// 请求体解析
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 静态文件服务
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("static"));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    error: "请求过于频繁，请稍后再试",
  },
  standardHeaders: true, // 返回限流信息在 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
});

// 为购物车API设置更宽松的限流
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 50, // 限制每个IP 1分钟内最多50个购物车请求
  message: {
    error: "购物车操作过于频繁，请稍后再试",
  },
});

app.use("/api/", limiter);
app.use("/api/cart", cartLimiter);

// API路由
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order", orderRoutes); // 前端兼容路由
app.use("/api/banners", bannerRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/after-sale", afterSaleRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/chat", chatRoutes);

// 健康检查端点
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 根路径
app.get("/", (req, res) => {
  res.json({
    message: "Shopping App API Server",
    version: "1.0.0",
    status: "running",
  });
});

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

module.exports = app;
