<script>
import { useUserStore } from "@/store/user";
import { useCartStore } from "@/store/cart";

export default {
  onLaunch: function () {
    console.log("App Launch");
    // 检查用户登录状态
    this.checkLoginStatus();
    // 初始化购物车数据
    this.initCartData();
    // 设置全局路由监听
    this.setupRouteListener();
  },
  onShow: function () {
    console.log("App Show");
    // 当App显示时，触发当前页面的路由检查
    this.checkCurrentRoute();
  },
  onHide: function () {
    console.log("App Hide");
  },
  methods: {
    // 检查用户登录状态
    checkLoginStatus() {
      const userStore = useUserStore();
      if (userStore.isLoggedIn) {
        // 检查token是否过期
        const isValid = userStore.checkTokenExpiration();
        if (isValid) {
          console.log("用户已登录:", userStore.username);
        } else {
          console.log("登录已过期");
        }
      } else {
        console.log("用户未登录");
      }
    },
    // 初始化购物车数据
    async initCartData() {
      const cartStore = useCartStore();
      const userStore = useUserStore();

      // 如果用户已登录，从服务器加载购物车数据
      if (userStore.isLoggedIn) {
        await cartStore.loadFromServer();
      }

      console.log("购物车商品数量:", cartStore.totalCount);

      // 设置购物车tabbar徽标
      this.updateCartBadge(cartStore.cartCount);

      // 监听购物车数量变化
      this.watchCartCount();
    },

    // 更新购物车tabbar徽标
    updateCartBadge(count) {
      // 检查是否在支持TabBar的环境中
      // #ifdef APP-PLUS || MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
      if (count > 0) {
        uni.setTabBarBadge({
          index: 2, // 购物车tab的索引
          text: count.toString(),
        });
      } else {
        uni.removeTabBarBadge({
          index: 2,
        });
      }
      // #endif

      // H5环境下使用自定义徽标显示
      // #ifdef H5
      this.updateH5CartBadge(count);
      // #endif
    },

    // H5环境下更新购物车徽标
    updateH5CartBadge(count) {
      // 在H5环境下，可以通过DOM操作或者事件通知来更新徽标
      // 这里使用uni.$emit发送全局事件
      uni.$emit("updateCartBadge", count);
    },

    // 监听购物车数量变化
    watchCartCount() {
      const cartStore = useCartStore();

      // 使用定时器定期检查购物车数量变化
      setInterval(() => {
        this.updateCartBadge(cartStore.cartCount);
      }, 1000);
    },

    // 检查当前路由并更新tabbar状态
    checkCurrentRoute() {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route || "";

        // 发送页面显示事件
        uni.$emit("onShowPage", route);
      }
    },

    // 设置全局路由监听
    setupRouteListener() {
      // 页面显示时触发tabbar更新
      uni.onTabItemTap((item) => {
        console.log("点击了tabbar项:", item);
        // 当点击tabbar项时，发送更新事件
        uni.$emit("updateTabBar", item.index);

        // 特殊处理"我的"页面
        if (item.index === 3) {
          setTimeout(() => {
            uni.$emit("updateTabBar", 3);
            uni.$emit("onShowPage", "pages/user/user");
          }, 50);
        }
      });

      // #ifdef H5
      // 初始化时检查一次当前路由
      setTimeout(() => {
        this.checkCurrentRoute();

        // 特殊处理：如果当前是"我的"页面，额外发送一次更新事件
        const pages = getCurrentPages();
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          const route = currentPage.route || "";
          if (route.includes("pages/user/")) {
            uni.$emit("updateTabBar", 3);
            uni.$emit("onShowPage", "pages/user/user");
          }
        }
      }, 0);
      // #endif

      // 监听路由变化
      uni.addInterceptor("navigateTo", {
        success: (e) => {
          setTimeout(() => {
            this.checkCurrentRoute();
          }, 100);
        },
      });

      uni.addInterceptor("switchTab", {
        success: (e) => {
          setTimeout(() => {
            this.checkCurrentRoute();
          }, 100);
        },
      });
    },
  },
};
</script>

<style>
/* 每个页面公共css */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica,
    Segoe UI, Arial, Roboto, "PingFang SC", "miui", "Hiragino Sans GB",
    "Microsoft Yahei", sans-serif;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

/* 通用样式 */
.container {
  width: 100%;
  min-height: 100vh;
}

/* 文本溢出省略号 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 价格样式 */
.price {
  color: #d81e06;
  font-weight: bold;
}

/* 按钮样式 */
.btn {
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  text-align: center;
  border-radius: 40rpx;
}

.btn-primary {
  background-color: #d81e06;
  color: #fff;
}

.btn-secondary {
  background-color: #ff9500;
  color: #fff;
}

.btn-outline {
  background-color: #fff;
  color: #d81e06;
  border: 1rpx solid #d81e06;
}

/* 徽标样式 */
.badge {
  position: absolute;
  background-color: #d81e06;
  color: #fff;
  font-size: 20rpx;
  height: 32rpx;
  min-width: 32rpx;
  border-radius: 16rpx;
  text-align: center;
  line-height: 32rpx;
  padding: 0 6rpx;
}

/* 卡片样式 */
.card {
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 分割线样式 */
.divider {
  height: 1rpx;
  background-color: #f5f5f5;
  margin: 20rpx 0;
}

/* 标题样式 */
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

/* 空状态样式 */
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-box image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-box text {
  font-size: 28rpx;
  color: #999;
}

/* 图标字体样式已在 iconfont.css 中定义 */
</style>
