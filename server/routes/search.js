const express = require("express");
const { query, validationResult } = require("express-validator");
const dataStore = require("../utils/dataStore");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/search
 * @desc 搜索商品
 * @access Public
 */
router.get(
  "/",
  [
    query("q")
      .notEmpty()
      .withMessage("搜索关键词不能为空")
      .isLength({ min: 1, max: 100 })
      .withMessage("搜索关键词长度必须在1-100个字符之间"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("每页数量必须在1-50之间"),
    query("sort")
      .optional()
      .isIn([
        "relevance",
        "price_asc",
        "price_desc",
        "sales_desc",
        "created_desc",
      ])
      .withMessage("排序参数无效"),
    query("category").optional().isString().withMessage("分类ID必须是字符串"),
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
        q: keyword,
        page = 1,
        limit = 10,
        sort = "relevance",
        category,
        minPrice,
        maxPrice,
      } = req.query;

      // 记录搜索历史
      if (req.user) {
        const searchHistory = {
          userId: req.user.id,
          keyword,
          searchTime: new Date().toISOString(),
        };
        dataStore.create("searchHistory", searchHistory);
      }

      // 更新热门搜索词
      const existingHotSearch = dataStore.findOne("hotSearches", { keyword });
      if (existingHotSearch) {
        dataStore.update("hotSearches", existingHotSearch.id, {
          count: existingHotSearch.count + 1,
          lastSearchTime: new Date().toISOString(),
        });
      } else {
        dataStore.create("hotSearches", {
          keyword,
          count: 1,
          lastSearchTime: new Date().toISOString(),
        });
      }

      // 获取所有商品
      let products = dataStore.findAll("products");

      // 关键词搜索
      const searchKeyword = keyword.toLowerCase();
      products = products.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(searchKeyword);
        const descMatch =
          product.description &&
          product.description.toLowerCase().includes(searchKeyword);
        const tagsMatch =
          product.tags &&
          product.tags.some((tag) => tag.toLowerCase().includes(searchKeyword));

        return nameMatch || descMatch || tagsMatch;
      });

      // 分类筛选
      if (category) {
        products = products.filter(
          (product) => product.categoryId === category
        );
      }

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
          products.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "relevance":
        default:
          // 相关性排序：优先匹配商品名称的结果
          products.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().includes(searchKeyword);
            const bNameMatch = b.name.toLowerCase().includes(searchKeyword);

            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;

            // 如果都匹配或都不匹配名称，按销量排序
            return (b.sales || 0) - (a.sales || 0);
          });
          break;
      }

      // 分页
      const total = products.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedProducts = products.slice(offset, offset + limit);

      // 为每个商品添加image字段和收藏状态
      if (req.user) {
        const userFavorites = dataStore.find("favorites", {
          userId: req.user.id,
        });
        const favoriteProductIds = userFavorites.map((fav) => fav.productId);

        paginatedProducts.forEach((product) => {
          product.image =
            product.images && product.images.length > 0
              ? product.images[0]
              : "";
          product.isFavorite = favoriteProductIds.includes(product.id);
        });
      } else {
        paginatedProducts.forEach((product) => {
          product.image =
            product.images && product.images.length > 0
              ? product.images[0]
              : "";
          product.isFavorite = false;
        });
      }

      // 获取搜索建议（相关关键词）
      const suggestions = dataStore
        .find("hotSearches")
        .filter(
          (item) =>
            item.keyword.toLowerCase().includes(searchKeyword) &&
            item.keyword.toLowerCase() !== searchKeyword
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => item.keyword);

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
          searchInfo: {
            keyword,
            total,
            suggestions,
          },
          filters: {
            category,
            sort,
            minPrice,
            maxPrice,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/search/suggestions
 * @desc 获取搜索建议
 * @access Public
 */
router.get(
  "/suggestions",
  [
    query("q")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("搜索关键词长度必须在1-50个字符之间"),
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

      const { q: keyword } = req.query;
      const limit = parseInt(req.query.limit) || 10;

      let suggestions = [];

      if (keyword) {
        // 基于关键词的搜索建议
        const searchKeyword = keyword.toLowerCase();

        // 从热门搜索中获取建议
        const hotSearchSuggestions = dataStore
          .find("hotSearches")
          .filter((item) => item.keyword.toLowerCase().includes(searchKeyword))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((item) => ({
            keyword: item.keyword,
            type: "hot",
            count: item.count,
          }));

        // 从商品名称中获取建议
        const productSuggestions = dataStore
          .findAll("products")
          .filter((product) =>
            product.name.toLowerCase().includes(searchKeyword)
          )
          .slice(0, 5)
          .map((product) => ({
            keyword: product.name,
            type: "product",
            productId: product.id,
          }));

        suggestions = [...hotSearchSuggestions, ...productSuggestions].slice(
          0,
          limit
        );
      } else {
        // 返回热门搜索词
        suggestions = dataStore
          .find("hotSearches")
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
          .map((item) => ({
            keyword: item.keyword,
            type: "hot",
            count: item.count,
          }));
      }

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/search/hot
 * @desc 获取热门搜索词
 * @access Public
 */
router.get("/hot", (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 获取热门搜索词
    const hotSearches = dataStore
      .find("hotSearches")
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => ({
        keyword: item.keyword,
        count: item.count,
      }));

    res.json({
      success: true,
      data: hotSearches,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/search/history
 * @desc 获取用户搜索历史
 * @access Private
 */
router.get(
  "/history",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("数量限制必须在1-50之间"),
  ],
  optionalAuth,
  (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "请先登录",
        });
      }

      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "输入验证失败",
          details: errors.array(),
        });
      }

      const limit = parseInt(req.query.limit) || 20;
      const userId = req.user.id;

      // 获取用户搜索历史
      const searchHistory = dataStore
        .find("searchHistory", { userId })
        .sort((a, b) => new Date(b.searchTime) - new Date(a.searchTime))
        .slice(0, limit)
        .map((item) => ({
          keyword: item.keyword,
          searchTime: item.searchTime,
        }));

      // 去重
      const uniqueHistory = [];
      const seenKeywords = new Set();

      for (const item of searchHistory) {
        if (!seenKeywords.has(item.keyword)) {
          seenKeywords.add(item.keyword);
          uniqueHistory.push(item);
        }
      }

      res.json({
        success: true,
        data: uniqueHistory,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/search/history
 * @desc 清空搜索历史
 * @access Private
 */
router.delete("/history", optionalAuth, (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "请先登录",
      });
    }

    const userId = req.user.id;

    // 删除用户所有搜索历史
    const searchHistory = dataStore.find("searchHistory", { userId });
    searchHistory.forEach((item) => {
      dataStore.delete("searchHistory", item.id);
    });

    res.json({
      success: true,
      message: "搜索历史已清空",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
