const express = require("express");
const { query, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/products
 * @desc 获取商品列表
 * @access Public
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每页数量必须在1-50之间"),
    query("category").optional().isString().withMessage("分类ID必须是字符串"),
    query("sort")
      .optional()
      .isIn(["price_asc", "price_desc", "sales_desc", "created_desc"])
      .withMessage("排序参数无效"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("最低价格必须大于等于0"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("最高价格必须大于等于0"),
  ],
  optionalAuth,
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

      const {
        page = 1,
        limit = 10,
        category,
        sort = "created_desc",
        minPrice,
        maxPrice,
        keyword,
      } = req.query;

      // 构建查询条件
      let query = {};

      if (category) {
        query.categoryId = category;
      }

      // 获取所有商品
      let products = dataStore.find("products", query);

      // 价格筛选
      if (minPrice !== undefined || maxPrice !== undefined) {
        products = products.filter((product) => {
          const price = parseFloat(product.price);
          if (minPrice !== undefined && price < parseFloat(minPrice))
            return false;
          if (maxPrice !== undefined && price > parseFloat(maxPrice))
            return false;
          return true;
        });
      }

      // 关键词搜索
      if (keyword) {
        const searchKeyword = keyword.toLowerCase();
        products = products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchKeyword) ||
            product.description.toLowerCase().includes(searchKeyword)
        );
      }

      // 排序
      switch (sort) {
        case "price_asc":
          products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case "price_desc":
          products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case "sales_desc":
          products.sort((a, b) => (b.sales || 0) - (a.sales || 0));
          break;
        case "created_desc":
        default:
          products.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
      }

      // 分页
      const total = products.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedProducts = products.slice(offset, offset + limit);

      // 如果用户已登录，添加收藏状态
      if (req.user) {
        const userFavorites = dataStore.find("favorites", {
          userId: req.user.id,
        });
        const favoriteProductIds = userFavorites.map((fav) => fav.productId);

        paginatedProducts.forEach((product) => {
          product.isFavorite = favoriteProductIds.includes(product.id);
        });
      }

      res.json({
        success: true,
        data: {
          products: paginatedProducts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          filters: {
            category,
            sort,
            minPrice,
            maxPrice,
            keyword,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/products/:id
 * @desc 获取商品详情
 * @access Public
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await dataStore.findById("products", id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "商品不存在",
      });
    }

    // 如果用户已登录，检查是否已收藏
    if (req.user) {
      const favorites = await dataStore.find("favorites", {
        userId: req.user.id,
        productId: id,
      });
      product.isFavorited = favorites.length > 0;
    } else {
      product.isFavorited = false;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "获取商品详情失败",
      error: error.message,
    });
  }
});

// 获取推荐商品
router.get("/recommend/list", optionalAuth, async (req, res) => {
  try {
    const { limit = 10, type = "hot" } = req.query;

    let products = [];

    if (type === "hot") {
      // 热门商品：按销量排序
      products = await dataStore.find("products", { isActive: true });
      products.sort((a, b) => b.sales - a.sales);
    } else if (type === "new") {
      // 新品推荐：按创建时间排序
      products = await dataStore.find("products", { isActive: true });
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (type === "featured") {
      // 精选商品：获取标记为精选的商品
      products = await dataStore.find("products", {
        isActive: true,
        isFeatured: true,
      });
      products.sort((a, b) => b.rating - a.rating);
    }

    // 限制返回数量
    products = products.slice(0, parseInt(limit));

    // 如果用户已登录，添加收藏状态
    if (req.user) {
      const userFavorites = await dataStore.find("favorites", {
        userId: req.user.id,
      });
      const favoriteProductIds = userFavorites.map((fav) => fav.productId);

      products = products.map((product) => ({
        ...product,
        image:
          product.images && product.images.length > 0 ? product.images[0] : "",
        isFavorited: favoriteProductIds.includes(product.id),
      }));
    } else {
      products = products.map((product) => ({
        ...product,
        image:
          product.images && product.images.length > 0 ? product.images[0] : "",
        isFavorited: false,
      }));
    }

    res.json({
      success: true,
      data: products,
      total: products.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "获取推荐商品失败",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/products/category/:categoryId
 * @desc 根据分类获取商品
 * @access Public
 */
router.get(
  "/category/:categoryId",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每页数量必须在1-50之间"),
  ],
  optionalAuth,
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

      const { categoryId } = req.params;
      const { page = 1, limit = 10, sort = "created_desc" } = req.query;

      // 检查分类是否存在
      const category = dataStore.findById("categories", categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: "分类不存在",
        });
      }

      // 获取分类下的商品
      let products = dataStore.find("products", { categoryId });

      // 排序
      switch (sort) {
        case "price_asc":
          products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case "price_desc":
          products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case "sales_desc":
          products.sort((a, b) => (b.sales || 0) - (a.sales || 0));
          break;
        case "created_desc":
        default:
          products.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
      }

      // 分页
      const total = products.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedProducts = products.slice(offset, offset + limit);

      // 如果用户已登录，添加收藏状态
      if (req.user) {
        const userFavorites = dataStore.find("favorites", {
          userId: req.user.id,
        });
        const favoriteProductIds = userFavorites.map((fav) => fav.productId);

        paginatedProducts.forEach((product) => {
          product.isFavorite = favoriteProductIds.includes(product.id);
        });
      }

      res.json({
        success: true,
        data: {
          category,
          products: paginatedProducts,
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
 * @route GET /api/products/hot/list
 * @desc 获取热门商品
 * @access Public
 */
router.get(
  "/hot/list",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("数量限制必须在1-20之间"),
  ],
  optionalAuth,
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

      const { limit = 10 } = req.query;

      // 获取热门商品（按销量排序）
      let products = dataStore
        .findAll("products")
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, limit);

      // 如果用户已登录，添加收藏状态
      if (req.user) {
        const userFavorites = dataStore.find("favorites", {
          userId: req.user.id,
        });
        const favoriteProductIds = userFavorites.map((fav) => fav.productId);

        products.forEach((product) => {
          product.isFavorite = favoriteProductIds.includes(product.id);
        });
      }

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/products/recommend/list
 * @desc 获取推荐商品
 * @access Public
 */
router.get(
  "/recommend/list",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("数量限制必须在1-20之间"),
  ],
  optionalAuth,
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

      const { limit = 10 } = req.query;

      // 获取推荐商品（随机推荐）
      let products = dataStore.findAll("products");

      // 简单的随机推荐算法
      products = products.sort(() => Math.random() - 0.5).slice(0, limit);

      // 如果用户已登录，添加收藏状态
      if (req.user) {
        const userFavorites = dataStore.find("favorites", {
          userId: req.user.id,
        });
        const favoriteProductIds = userFavorites.map((fav) => fav.productId);

        products.forEach((product) => {
          product.isFavorite = favoriteProductIds.includes(product.id);
        });
      }

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/products/:id/favorite
 * @desc 切换商品收藏状态
 * @access Private
 */
router.post("/:id/favorite", auth, (req, res, next) => {
  try {
    const { id: productId } = req.params;
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
      // 已收藏，取消收藏
      const deleted = dataStore.delete("favorites", existingFavorite.id);
      if (!deleted) {
        return res.status(500).json({
          success: false,
          error: "取消收藏失败",
        });
      }

      res.json({
        success: true,
        message: "取消收藏成功",
        data: {
          isFavorite: false,
        },
      });
    } else {
      // 未收藏，添加收藏
      const favorite = dataStore.create("favorites", {
        userId,
        productId,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "收藏成功",
        data: {
          isFavorite: true,
          favorite,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
