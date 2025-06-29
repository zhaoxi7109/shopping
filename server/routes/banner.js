const express = require("express");
const dataStore = require("../utils/dataStore");

const router = express.Router();

/**
 * @route GET /api/banners
 * @desc 获取轮播图列表
 * @access Public
 */
router.get("/", (req, res, next) => {
  try {
    const { type = "home", limit = 10 } = req.query;

    // 构建查询条件
    const query = { isActive: true };
    if (type) {
      query.type = type;
    }

    // 获取轮播图列表
    let banners = dataStore
      .find("banners", query)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)) // 按排序字段升序
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/banners/:id
 * @desc 获取轮播图详情
 * @access Public
 */
router.get("/:id", (req, res, next) => {
  try {
    const { id } = req.params;

    // 查找轮播图
    const banner = dataStore.findById("banners", id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: "轮播图不存在",
      });
    }

    // 增加点击量
    dataStore.update("banners", id, {
      clicks: (banner.clicks || 0) + 1,
    });

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
