const express = require("express");
const dataStore = require("../utils/dataStore");

const router = express.Router();

/**
 * @route GET /api/categories
 * @desc 获取所有商品分类
 * @access Public
 */
router.get("/", (req, res, next) => {
  try {
    // 获取所有分类
    const categories = dataStore.findAll("categories");

    // 为每个分类添加商品数量统计
    const categoriesWithCount = categories.map((category) => {
      const productCount = dataStore.find("products", {
        categoryId: category.id,
      }).length;
      return {
        ...category,
        productCount,
      };
    });

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/categories/:id
 * @desc 获取分类详情
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await dataStore.findById("categories", id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "分类不存在",
      });
    }

    // 获取该分类下的商品
    const products = await dataStore.find("products", {
      categoryId: id,
      isActive: true,
    });

    // 获取子分类
    const subCategories = dataStore
      .find("categories", {
        parentId: id,
        isActive: true,
      })
      .map((subCategory) => ({
        id: subCategory.id,
        name: subCategory.name,
        icon: subCategory.icon,
      }));

    // 获取热门商品（按销量排序，取前8个）
    const hotProducts = products
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0],
        sales: product.sales,
        rating: product.rating,
      }));

    const categoryWithDetails = {
      ...category,
      productCount: products.length,
      subCategories,
      hotProducts,
    };

    res.json({
      success: true,
      data: categoryWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "获取分类详情失败",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/categories/tree/list
 * @desc 获取分类树形结构
 * @access Public
 */
router.get("/tree/list", (req, res, next) => {
  try {
    // 获取所有分类
    const categories = dataStore.findAll("categories");

    // 构建树形结构
    const buildTree = (parentId = null) => {
      return categories
        .filter((category) => category.parentId === parentId)
        .map((category) => {
          const productCount = dataStore.find("products", {
            categoryId: category.id,
          }).length;
          const children = buildTree(category.id);

          return {
            ...category,
            productCount,
            children: children.length > 0 ? children : undefined,
          };
        });
    };

    const tree = buildTree();

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/categories/hot/list
 * @desc 获取热门分类
 * @access Public
 */
router.get("/hot/list", (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    // 获取所有分类并计算商品数量
    const categories = dataStore
      .findAll("categories")
      .map((category) => {
        const productCount = dataStore.find("products", {
          categoryId: category.id,
        }).length;
        return {
          ...category,
          productCount,
        };
      })
      // 按商品数量排序，取前N个
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, limit);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
