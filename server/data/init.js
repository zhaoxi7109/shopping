const dataStore = require("../utils/dataStore");
const bcrypt = require("bcryptjs");

// 初始化数据
async function initData() {
  try {
    console.log("开始初始化数据...");

    // 清空现有数据
    const collections = [
      "users",
      "products",
      "categories",
      "banners",
      "hotSearches",
      "favorites",
      "orders",
      "cart",
      "addresses",
    ];
    collections.forEach((collection) => {
      try {
        const items = dataStore.findAll(collection);
        items.forEach((item) => {
          dataStore.delete(collection, item.id);
        });
      } catch (error) {
        // 集合不存在，忽略错误
      }
    });

    // 初始化用户数据
    const hashedPassword = await bcrypt.hash("123456", 10);
    const users = [
      {
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        nickname: "管理员",
        avatar: "https://via.placeholder.com/100x100?text=Admin",
        phone: "13800138000",
        gender: "male",
        birthday: "1990-01-01",
        address: "北京市朝阳区",
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        username: "user1",
        email: "user1@example.com",
        password: hashedPassword,
        nickname: "普通用户",
        avatar: "https://via.placeholder.com/100x100?text=User1",
        phone: "13800138001",
        gender: "female",
        birthday: "1995-05-15",
        address: "上海市浦东新区",
        role: "user",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    users.forEach((user) => {
      dataStore.create("users", user);
    });
    console.log("用户数据初始化完成");

    // 初始化分类数据
    const categories = [
      {
        name: "手机数码",
        icon: "/static/images/category/phone.png",
        banner: "/static/images/category/banner_phone.jpg",
        sort: 1,
        isActive: true,
        parentId: null,
        createdAt: new Date().toISOString(),
      },
      {
        name: "服装鞋包",
        icon: "/static/images/category/clothing.png",
        banner: "/static/images/category/banner_clothing.jpg",
        sort: 2,
        isActive: true,
        parentId: null,
        createdAt: new Date().toISOString(),
      },
      {
        name: "食品生鲜",
        icon: "/static/images/category/food.png",
        banner: "/static/images/category/banner_food.jpg",
        sort: 3,
        isActive: true,
        parentId: null,
        createdAt: new Date().toISOString(),
      },
      {
        name: "家居家装",
        icon: "/static/images/category/home.png",
        banner: "/static/images/category/banner_home.jpg",
        sort: 4,
        isActive: true,
        parentId: null,
        createdAt: new Date().toISOString(),
      },
      {
        name: "美妆个护",
        icon: "/static/images/category/beauty.png",
        banner: "/static/images/category/banner_beauty.jpg",
        sort: 5,
        isActive: true,
        parentId: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const createdCategories = [];
    categories.forEach((category) => {
      const created = dataStore.create("categories", category);
      createdCategories.push(created);
    });
    console.log("分类数据初始化完成");

    // 初始化商品数据
    const products = [
      {
        name: "2023新款智能手机 全网通5G",
        subtitle: "6.7英寸全面屏 8GB+256GB 超长续航",
        description:
          "这是一款性能强劲的智能手机，采用最新的处理器，运行速度快，功耗低",
        price: "1999.00",
        originalPrice: "2599.00",
        images: [
          "/static/images/products/phone1.jpg",
          "/static/images/products/phone2.jpg",
          "/static/images/products/phone3.jpg",
        ],
        categoryId: createdCategories[0].id,
        stock: 500,
        sales: 1000,
        rating: 4.8,
        reviewCount: 856,
        goodRate: 98,
        promotion: "满2000减200, 购买赠送保护壳+钢化膜",
        service: "正品保证 · 7天无理由退货 · 24小时发货",
        tags: ["智能手机", "5G", "全面屏", "长续航"],
        specifications: [
          { name: "颜色", options: ["黑色", "白色", "蓝色"] },
          { name: "版本", options: ["8GB+128GB", "8GB+256GB", "12GB+256GB"] },
        ],
        details: {
          images: [
            "/static/images/detail/detail1.jpg",
            "/static/images/detail/detail2.jpg",
            "/static/images/detail/detail3.jpg",
          ],
          description:
            '<p style="font-size: 28rpx; color: #333; line-height: 1.8;">这是一款性能强劲的智能手机，采用最新的处理器，运行速度快，功耗低。6.7英寸全面屏，显示效果细腻，色彩鲜艳。内置5000mAh大容量电池，支持快充技术，充电更快更安全。</p>',
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "超薄笔记本电脑",
        subtitle: "轻薄便携 高性能办公",
        description: "14英寸超薄笔记本，搭载最新处理器，轻薄便携，适合商务办公",
        price: "4999.00",
        originalPrice: "5999.00",
        images: [
          "/static/images/products/laptop1.jpg",
          "/static/images/products/laptop2.jpg",
        ],
        categoryId: createdCategories[0].id,
        stock: 80,
        sales: 890,
        rating: 4.6,
        reviewCount: 432,
        goodRate: 95,
        promotion: "购买送鼠标+电脑包",
        service: "正品保证 · 7天无理由退货 · 全国联保",
        tags: ["笔记本", "轻薄", "办公", "高性能"],
        specifications: [
          { name: "颜色", options: ["银色", "深空灰"] },
          { name: "配置", options: ["i5+8G+512G", "i7+16G+1T"] },
        ],
        details: {
          images: ["/static/images/detail/laptop_detail1.jpg"],
          description:
            "<p>超薄设计，仅重1.3kg，14英寸高清屏幕，续航可达10小时。</p>",
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "智能手表",
        subtitle: "健康监测 运动追踪",
        description: "多功能智能手表，支持心率监测、运动追踪、消息提醒",
        price: "899.00",
        originalPrice: "1299.00",
        images: [
          "/static/images/products/watch1.jpg",
          "/static/images/products/watch2.jpg",
        ],
        categoryId: createdCategories[0].id,
        stock: 200,
        sales: 2100,
        rating: 4.5,
        reviewCount: 1200,
        goodRate: 92,
        promotion: "买一送一运动表带",
        service: "正品保证 · 一年质保 · 全国联保",
        tags: ["智能手表", "运动", "健康", "时尚"],
        specifications: [
          { name: "颜色", options: ["黑色", "白色", "粉色", "蓝色"] },
          { name: "尺寸", options: ["40mm", "44mm"] },
        ],
        details: {
          images: ["/static/images/detail/watch_detail1.jpg"],
          description: "<p>支持50+运动模式，7天长续航，IP68防水等级。</p>",
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "无线蓝牙耳机",
        subtitle: "降噪通话 音质清晰",
        description: "真无线蓝牙耳机，主动降噪，长续航，适合运动和通话",
        price: "299.00",
        originalPrice: "399.00",
        images: [
          "/static/images/products/headphone1.jpg",
          "/static/images/products/headphone2.jpg",
        ],
        categoryId: createdCategories[0].id,
        stock: 150,
        sales: 680,
        rating: 4.7,
        reviewCount: 345,
        goodRate: 96,
        promotion: "买耳机送充电宝",
        service: "正品保证 · 一年质保 · 免费换新",
        tags: ["蓝牙耳机", "降噪", "运动", "音乐"],
        specifications: [
          { name: "颜色", options: ["白色", "黑色", "粉色"] },
          { name: "版本", options: ["标准版", "降噪版"] },
        ],
        details: {
          images: ["/static/images/detail/headphone_detail1.jpg"],
          description: "<p>主动降噪技术，30小时续航，IPX4防水等级。</p>",
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "高清平板电脑",
        subtitle: "大屏娱乐 学习办公",
        description: "10.9英寸高清平板，适合娱乐、学习和轻办公",
        price: "2599.00",
        originalPrice: "2999.00",
        images: [
          "/static/images/products/tablet1.jpg",
          "/static/images/products/tablet2.jpg",
        ],
        categoryId: createdCategories[0].id,
        stock: 120,
        sales: 1500,
        rating: 4.9,
        reviewCount: 980,
        goodRate: 97,
        promotion: "购买送键盘+保护套",
        service: "正品保证 · 一年质保 · 全国联保",
        tags: ["平板电脑", "大屏", "娱乐", "学习"],
        specifications: [
          { name: "颜色", options: ["银色", "深空灰", "玫瑰金"] },
          { name: "容量", options: ["64GB", "256GB", "512GB"] },
        ],
        details: {
          images: ["/static/images/detail/tablet_detail1.jpg"],
          description:
            "<p>10.9英寸Liquid视网膜显示屏，A14仿生芯片，支持Apple Pencil。</p>",
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "时尚休闲T恤",
        subtitle: "纯棉舒适 多色可选",
        description: "100%纯棉材质，舒适透气，经典版型，多色可选",
        price: "89.00",
        originalPrice: "129.00",
        images: [
          "/static/images/products/tshirt1.jpg",
          "/static/images/products/tshirt2.jpg",
        ],
        categoryId: createdCategories[1].id,
        stock: 300,
        sales: 2100,
        rating: 4.5,
        reviewCount: 1200,
        goodRate: 92,
        promotion: "买2件8折",
        service: "正品保证 · 7天无理由退换",
        tags: ["T恤", "休闲", "纯棉", "时尚"],
        specifications: [
          { name: "颜色", options: ["白色", "黑色", "灰色", "蓝色", "红色"] },
          { name: "尺码", options: ["S", "M", "L", "XL", "XXL"] },
        ],
        details: {
          images: ["/static/images/detail/tshirt_detail1.jpg"],
          description:
            "<p>采用优质纯棉面料，柔软舒适，透气性好，经典圆领设计。</p>",
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "运动休闲鞋",
        subtitle: "轻便透气 运动时尚",
        description: "轻便透气运动鞋，适合日常穿着和轻度运动",
        price: "299.00",
        originalPrice: "399.00",
        images: [
          "/static/images/products/shoes1.jpg",
          "/static/images/products/shoes2.jpg",
        ],
        categoryId: createdCategories[1].id,
        stock: 200,
        sales: 850,
        rating: 4.6,
        reviewCount: 520,
        goodRate: 94,
        promotion: "新品上市特价",
        service: "正品保证 · 7天无理由退换",
        tags: ["运动鞋", "休闲", "透气", "轻便"],
        specifications: [
          { name: "颜色", options: ["白色", "黑色", "蓝色", "灰色"] },
          {
            name: "尺码",
            options: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
          },
        ],
        details: {
          images: ["/static/images/detail/shoes_detail1.jpg"],
          description:
            "<p>采用透气网面设计，轻量化鞋底，提供舒适的穿着体验。</p>",
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "有机蔬菜礼盒",
        subtitle: "新鲜有机 绿色健康",
        description: "新鲜有机蔬菜，绿色健康，当日采摘配送",
        price: "128.00",
        originalPrice: "158.00",
        images: [
          "/static/images/products/vegetables1.jpg",
          "/static/images/products/vegetables2.jpg",
        ],
        categoryId: createdCategories[2].id,
        stock: 80,
        sales: 450,
        rating: 4.6,
        reviewCount: 230,
        goodRate: 95,
        promotion: "首次购买9折",
        service: "新鲜保证 · 当日配送",
        tags: ["有机", "蔬菜", "新鲜", "健康"],
        specifications: [
          {
            name: "规格",
            options: ["小份(3-4人)", "中份(5-6人)", "大份(7-8人)"],
          },
        ],
        details: {
          images: ["/static/images/detail/vegetables_detail1.jpg"],
          description:
            "<p>精选有机蔬菜，无农药残留，营养丰富，当日采摘新鲜配送。</p>",
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "进口牛奶礼盒装",
        subtitle: "营养丰富 礼盒包装",
        description: "新鲜进口牛奶，营养丰富，精美礼盒包装",
        price: "168.00",
        originalPrice: "198.00",
        images: [
          "/static/images/products/milk1.jpg",
          "/static/images/products/milk2.jpg",
        ],
        categoryId: createdCategories[2].id,
        stock: 300,
        sales: 850,
        rating: 4.8,
        reviewCount: 420,
        goodRate: 96,
        promotion: "买2箱送1箱",
        service: "新鲜保证 · 冷链配送",
        tags: ["牛奶", "进口", "营养", "礼盒"],
        specifications: [
          { name: "规格", options: ["250ml*12盒", "250ml*24盒"] },
        ],
        details: {
          images: ["/static/images/detail/milk_detail1.jpg"],
          description:
            "<p>来自新西兰优质牧场，富含蛋白质和钙质，适合全家饮用。</p>",
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "智能扫地机器人",
        subtitle: "智能清扫 自动充电",
        description: "全自动清扫，智能规划路径，支持APP远程控制",
        price: "1299.00",
        originalPrice: "1599.00",
        images: [
          "/static/images/products/robot1.jpg",
          "/static/images/products/robot2.jpg",
        ],
        categoryId: createdCategories[3].id,
        stock: 50,
        sales: 680,
        rating: 4.7,
        reviewCount: 345,
        goodRate: 93,
        promotion: "限时特价",
        service: "正品保证 · 一年质保 · 免费安装",
        tags: ["扫地机器人", "智能家居", "清洁", "自动"],
        specifications: [
          { name: "颜色", options: ["白色", "黑色"] },
          { name: "容量", options: ["600ml尘盒"] },
        ],
        details: {
          images: ["/static/images/detail/robot_detail1.jpg"],
          description:
            "<p>激光导航，智能规划清扫路径，2700Pa大吸力，支持拖扫一体。</p>",
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "兰蔻小黑瓶精华",
        subtitle: "修护精华 提亮肤色",
        description: "修护精华，改善肌肤状态，提亮肤色，抗衰老",
        price: "680.00",
        originalPrice: "780.00",
        images: [
          "/static/images/products/lancome1.jpg",
          "/static/images/products/lancome2.jpg",
        ],
        categoryId: createdCategories[4].id,
        stock: 120,
        sales: 1500,
        rating: 4.9,
        reviewCount: 980,
        goodRate: 98,
        promotion: "买正装送小样",
        service: "正品保证 · 专柜同款",
        tags: ["兰蔻", "精华", "护肤", "美妆"],
        specifications: [{ name: "规格", options: ["30ml", "50ml", "100ml"] }],
        details: {
          images: ["/static/images/detail/lancome_detail1.jpg"],
          description:
            "<p>含有二裂酵母发酵产物溶胞物，深层修护肌肤，提升肌肤光泽。</p>",
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    products.forEach((product) => {
      dataStore.create("products", product);
    });
    console.log("商品数据初始化完成");

    // 创建轮播图
    const banners = [
      {
        title: "新品上市",
        image: "/static/images/banner/banner1.jpg",
        link: "/pages/product/list?category=new",
        type: "home",
        sort: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        title: "限时特惠",
        image: "/static/images/banner/banner2.jpg",
        link: "/pages/product/list?category=sale",
        type: "home",
        sort: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        title: "品牌专区",
        image: "/static/images/banner/banner3.jpg",
        link: "/pages/product/list?category=brand",
        type: "home",
        sort: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        title: "春季新品",
        image: "/static/images/banner/banner4.jpg",
        link: "/pages/product/list?category=spring",
        type: "home",
        sort: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    banners.forEach((banner) => {
      dataStore.create("banners", banner);
    });
    console.log("轮播图数据初始化完成");

    // 初始化热门搜索词
    const hotSearches = [
      {
        keyword: "iPhone",
        count: 1500,
        lastSearchTime: new Date().toISOString(),
      },
      {
        keyword: "小米",
        count: 1200,
        lastSearchTime: new Date().toISOString(),
      },
      { keyword: "T恤", count: 800, lastSearchTime: new Date().toISOString() },
      {
        keyword: "扫地机器人",
        count: 600,
        lastSearchTime: new Date().toISOString(),
      },
      { keyword: "兰蔻", count: 900, lastSearchTime: new Date().toISOString() },
      { keyword: "牛奶", count: 400, lastSearchTime: new Date().toISOString() },
      {
        keyword: "手机",
        count: 2000,
        lastSearchTime: new Date().toISOString(),
      },
      { keyword: "护肤", count: 700, lastSearchTime: new Date().toISOString() },
    ];

    hotSearches.forEach((search) => {
      dataStore.create("hotSearches", search);
    });
    console.log("热门搜索词初始化完成");

    console.log("数据初始化完成！");
    console.log("测试账号：");
    console.log("管理员 - 用户名: admin, 密码: 123456");
    console.log("普通用户 - 用户名: user1, 密码: 123456");
  } catch (error) {
    console.error("数据初始化失败:", error);
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initData();
}

module.exports = { initData };
