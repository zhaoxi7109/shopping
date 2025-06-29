# Shopping App 后端服务

基于 Node.js + Express 构建的购物应用后端服务，为前端 UniApp 提供完整的 API 支持。

## 功能特性

- 🔐 用户认证与授权（JWT）
- 👤 用户管理（注册、登录、个人信息）
- 🛍️ 商品管理（列表、详情、分类、搜索）
- 🛒 购物车功能
- 📦 订单管理
- ❤️ 收藏功能
- 🎠 轮播图管理
- 🔍 搜索功能（关键词、热门搜索、搜索历史）
- 📱 分类管理
- 🔒 安全防护（限流、CORS、Helmet）

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **express-validator** - 输入验证
- **cors** - 跨域处理
- **helmet** - 安全防护
- **morgan** - 请求日志
- **multer** - 文件上传
- **express-rate-limit** - 请求限流

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 环境配置

项目已包含 `.env` 配置文件，包含以下配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传配置
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880

# API 配置
API_PREFIX=/api
API_VERSION=v1

# CORS 配置
CORS_ORIGIN=*

# 加密配置
BCRYPT_ROUNDS=10

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 初始化数据

```bash
# 初始化测试数据
node data/init.js
```

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

### 认证相关 `/auth`

| 方法 | 路径             | 描述             | 认证 |
| ---- | ---------------- | ---------------- | ---- |
| POST | `/auth/register` | 用户注册         | ❌   |
| POST | `/auth/login`    | 用户登录         | ❌   |
| POST | `/auth/refresh`  | 刷新 Token       | ❌   |
| POST | `/auth/logout`   | 用户登出         | ✅   |
| GET  | `/auth/me`       | 获取当前用户信息 | ✅   |

### 用户管理 `/user`

| 方法   | 路径                         | 描述         | 认证 |
| ------ | ---------------------------- | ------------ | ---- |
| GET    | `/user/profile`              | 获取用户详情 | ✅   |
| PUT    | `/user/profile`              | 更新用户信息 | ✅   |
| PUT    | `/user/password`             | 修改密码     | ✅   |
| PUT    | `/user/avatar`               | 更新头像     | ✅   |
| GET    | `/user/favorites`            | 获取收藏列表 | ✅   |
| POST   | `/user/favorites/:productId` | 添加收藏     | ✅   |
| DELETE | `/user/favorites/:productId` | 取消收藏     | ✅   |

### 商品管理 `/products`

| 方法 | 路径                             | 描述              | 认证 |
| ---- | -------------------------------- | ----------------- | ---- |
| GET  | `/products`                      | 获取商品列表      | 🔶   |
| GET  | `/products/:id`                  | 获取商品详情      | 🔶   |
| GET  | `/products/category/:categoryId` | 按分类获取商品    | 🔶   |
| GET  | `/products/hot/list`             | 获取热门商品      | 🔶   |
| GET  | `/products/recommend/list`       | 获取推荐商品      | 🔶   |
| POST | `/products/:id/favorite`         | 收藏/取消收藏商品 | ✅   |

### 分类管理 `/categories`

| 方法 | 路径                    | 描述         | 认证 |
| ---- | ----------------------- | ------------ | ---- |
| GET  | `/categories`           | 获取所有分类 | ❌   |
| GET  | `/categories/:id`       | 获取分类详情 | ❌   |
| GET  | `/categories/tree/list` | 获取分类树   | ❌   |
| GET  | `/categories/hot/list`  | 获取热门分类 | ❌   |

### 购物车 `/cart`

| 方法   | 路径                   | 描述          | 认证 |
| ------ | ---------------------- | ------------- | ---- |
| GET    | `/cart`                | 获取购物车    | ✅   |
| POST   | `/cart`                | 添加到购物车  | ✅   |
| PUT    | `/cart/:id`            | 更新购物车项  | ✅   |
| DELETE | `/cart/:id`            | 删除购物车项  | ✅   |
| PUT    | `/cart/select/all`     | 全选/取消全选 | ✅   |
| DELETE | `/cart/selected/items` | 删除选中项    | ✅   |
| DELETE | `/cart/clear`          | 清空购物车    | ✅   |

### 订单管理 `/orders`

| 方法 | 路径                         | 描述         | 认证 |
| ---- | ---------------------------- | ------------ | ---- |
| POST | `/orders`                    | 创建订单     | ✅   |
| GET  | `/orders`                    | 获取订单列表 | ✅   |
| GET  | `/orders/:id`                | 获取订单详情 | ✅   |
| PUT  | `/orders/:id/cancel`         | 取消订单     | ✅   |
| PUT  | `/orders/:id/confirm`        | 确认收货     | ✅   |
| POST | `/orders/:id/pay`            | 支付订单     | ✅   |
| GET  | `/orders/statistics/summary` | 订单统计     | ✅   |

### 轮播图 `/banners`

| 方法 | 路径           | 描述           | 认证 |
| ---- | -------------- | -------------- | ---- |
| GET  | `/banners`     | 获取轮播图列表 | ❌   |
| GET  | `/banners/:id` | 获取轮播图详情 | ❌   |

### 搜索功能 `/search`

| 方法   | 路径                  | 描述           | 认证 |
| ------ | --------------------- | -------------- | ---- |
| GET    | `/search`             | 搜索商品       | 🔶   |
| GET    | `/search/suggestions` | 获取搜索建议   | ❌   |
| GET    | `/search/hot`         | 获取热门搜索词 | ❌   |
| GET    | `/search/history`     | 获取搜索历史   | ✅   |
| DELETE | `/search/history`     | 清空搜索历史   | ✅   |

**图例说明：**

- ✅ 需要认证
- ❌ 无需认证
- 🔶 可选认证（登录后有额外功能）

## 数据存储

项目使用文件系统模拟数据库，数据存储在 `data/` 目录下：

```
data/
├── users.json          # 用户数据
├── products.json       # 商品数据
├── categories.json     # 分类数据
├── cart.json          # 购物车数据
├── orders.json        # 订单数据
├── favorites.json     # 收藏数据
├── banners.json       # 轮播图数据
├── hotSearches.json   # 热门搜索词
└── searchHistory.json # 搜索历史
```

## 测试账号

初始化数据后，可使用以下测试账号：

**管理员账号：**

- 用户名：`admin`
- 密码：`123456`

**普通用户：**

- 用户名：`user1`
- 密码：`123456`

## 错误处理

所有 API 响应都遵循统一格式：

**成功响应：**

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误信息",
  "details": []
}
```

## 安全特性

- JWT Token 认证
- 密码 bcrypt 加密
- 请求限流保护
- CORS 跨域配置
- Helmet 安全头设置
- 输入验证和过滤

## 开发说明

### 目录结构

```
server/
├── app.js              # 应用入口
├── package.json        # 依赖配置
├── .env               # 环境变量
├── README.md          # 项目说明
├── data/              # 数据目录
│   └── init.js        # 初始化数据脚本
├── middleware/        # 中间件
│   ├── auth.js        # 认证中间件
│   ├── errorHandler.js # 错误处理
│   └── notFound.js    # 404处理
├── routes/            # 路由
│   ├── auth.js        # 认证路由
│   ├── user.js        # 用户路由
│   ├── product.js     # 商品路由
│   ├── category.js    # 分类路由
│   ├── cart.js        # 购物车路由
│   ├── order.js       # 订单路由
│   ├── banner.js      # 轮播图路由
│   └── search.js      # 搜索路由
└── utils/             # 工具函数
    ├── dataStore.js   # 数据存储工具
    └── jwt.js         # JWT工具
```

### 添加新功能

1. 在 `routes/` 目录下创建新的路由文件
2. 在 `app.js` 中注册新路由
3. 如需要，在 `middleware/` 中添加相应中间件
4. 更新 `data/init.js` 添加初始数据

## 部署说明

### 生产环境配置

1. 修改 `.env` 文件中的敏感配置
2. 设置 `NODE_ENV=production`
3. 使用 PM2 或其他进程管理器
4. 配置反向代理（Nginx）
5. 启用 HTTPS

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。
