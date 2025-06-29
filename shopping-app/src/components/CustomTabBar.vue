<template>
  <view class="custom-tabbar" v-if="isH5">
    <view
      class="tabbar-item"
      v-for="(item, index) in tabList"
      :key="index"
      :class="{ active: currentTab === index }"
      @click="switchTab(index)"
    >
      <view class="tabbar-icon">
        <image
          :src="currentTab === index ? item.selectedIconPath : item.iconPath"
          mode="aspectFit"
        ></image>
        <!-- 购物车徽标 -->
        <view v-if="index === 2 && cartBadgeCount > 0" class="badge">{{
          cartBadgeCount
        }}</view>
      </view>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: "CustomTabBar",
  data() {
    return {
      isH5: false,
      currentTab: 0,
      cartBadgeCount: 0,
      tabList: [
        {
          pagePath: "pages/index/index",
          iconPath: "/static/images/tabbar/home.png",
          selectedIconPath: "/static/images/tabbar/home-active.png",
          text: "首页",
        },
        {
          pagePath: "pages/category/category",
          iconPath: "/static/images/tabbar/category.png",
          selectedIconPath: "/static/images/tabbar/category-active.png",
          text: "分类",
        },
        {
          pagePath: "pages/cart/cart",
          iconPath: "/static/images/tabbar/cart.png",
          selectedIconPath: "/static/images/tabbar/cart-active.png",
          text: "购物车",
        },
        {
          pagePath: "pages/user/user",
          iconPath: "/static/images/tabbar/user.png",
          selectedIconPath: "/static/images/tabbar/user-active.png",
          text: "我的",
        },
      ],
      // 路径与tab索引的映射
      pathMap: {
        "pages/index": 0,
        "pages/index/index": 0,
        "pages/category": 1,
        "pages/category/category": 1,
        "pages/cart": 2,
        "pages/cart/cart": 2,
        "pages/user": 3,
        "pages/user/user": 3,
      },
    };
  },
  created() {
    // 检查是否为H5环境
    // #ifdef H5
    this.isH5 = true;
    // #endif
  },
  mounted() {
    // 注册全局事件监听
    this.registerEventListeners();

    // 初始化时立即设置正确的tab
    this.$nextTick(() => {
      this.updateTabFromRoute();
    });
  },
  beforeDestroy() {
    // 移除事件监听
    this.removeEventListeners();
  },
  methods: {
    // 注册所有事件监听
    registerEventListeners() {
      // 监听购物车徽标更新事件
      uni.$on("updateCartBadge", this.updateCartBadge);

      // 监听tabbar索引更新事件
      uni.$on("updateTabBar", this.setCurrentTab);

      // 监听路由变化事件
      // #ifdef H5
      window.addEventListener("hashchange", this.updateTabFromRoute);
      window.addEventListener("popstate", this.updateTabFromRoute);
      // #endif

      // 监听页面显示事件
      uni.$on("onShowPage", this.handlePageShow);
    },

    // 移除所有事件监听
    removeEventListeners() {
      uni.$off("updateCartBadge", this.updateCartBadge);
      uni.$off("updateTabBar", this.setCurrentTab);
      uni.$off("onShowPage", this.handlePageShow);

      // #ifdef H5
      window.removeEventListener("hashchange", this.updateTabFromRoute);
      window.removeEventListener("popstate", this.updateTabFromRoute);
      // #endif
    },

    // 处理页面显示事件
    handlePageShow(pagePath) {
      if (!pagePath) return;

      console.log("页面显示事件:", pagePath);

      // 直接匹配完整路径
      if (this.pathMap[pagePath] !== undefined) {
        this.setCurrentTab(this.pathMap[pagePath]);
        return;
      }

      // 部分匹配路径前缀
      for (const basePath in this.pathMap) {
        if (pagePath.startsWith(basePath)) {
          this.setCurrentTab(this.pathMap[basePath]);
          return;
        }
      }

      // 特殊处理"我的"页面
      if (pagePath.includes("pages/user/")) {
        this.setCurrentTab(3);
      }
    },

    // 更新购物车徽标数量
    updateCartBadge(count) {
      this.cartBadgeCount = count;
    },

    // 设置当前选中的tab
    setCurrentTab(index) {
      if (index >= 0 && index < this.tabList.length) {
        this.currentTab = index;
      }
    },

    // 根据当前路由更新tab状态
    updateTabFromRoute() {
      // #ifdef H5
      const hash = location.hash;
      const path = hash.split("?")[0].replace("#/", "");

      console.log("当前路由路径:", path);

      // 直接匹配完整路径
      if (this.pathMap[path] !== undefined) {
        this.setCurrentTab(this.pathMap[path]);
        return;
      }

      // 部分匹配路径前缀
      for (const basePath in this.pathMap) {
        if (path.startsWith(basePath)) {
          this.setCurrentTab(this.pathMap[basePath]);
          return;
        }
      }

      // 特殊处理"我的"页面
      if (path.includes("pages/user/")) {
        this.setCurrentTab(3);
        return;
      }

      // 如果没有匹配到，尝试使用getCurrentPages
      this.updateTabFromCurrentPages();
      // #endif
    },

    // 从getCurrentPages获取当前页面并更新tab
    updateTabFromCurrentPages() {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route || "";

        for (const basePath in this.pathMap) {
          if (route.startsWith(basePath)) {
            this.setCurrentTab(this.pathMap[basePath]);
            return;
          }
        }
      }
    },

    // 切换tab
    switchTab(index) {
      if (index === this.currentTab) {
        // 即使是当前tab，也强制更新一次状态
        this.forceUpdateTab(index);
        return;
      }

      // 立即更新状态
      this.setCurrentTab(index);

      // 记录要切换到的tab
      const targetTab = index;

      const tabItem = this.tabList[index];
      if (tabItem) {
        // 在切换前先强制更新一次状态
        this.forceUpdateTab(index);

        uni.switchTab({
          url: `/${tabItem.pagePath}`,
          success: () => {
            // 切换成功后再次确保状态正确
            setTimeout(() => {
              this.setCurrentTab(targetTab);
            }, 50);
          },
          fail: (err) => {
            console.error("Tab switch failed:", err);
          },
        });
      }
    },

    // 强制更新tab状态
    forceUpdateTab(index) {
      this.setCurrentTab(index);

      // 发送全局事件通知其他组件
      uni.$emit("tabChanged", index);

      // 发送页面显示事件
      const pagePath = this.tabList[index].pagePath;
      uni.$emit("onShowPage", pagePath);
    },
  },
};
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #ffffff;
  display: flex;
  border-top: 1rpx solid #e5e5e5;
  z-index: 1000;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
  position: relative;
}

.tabbar-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 8rpx;
}

.tabbar-icon image {
  width: 100%;
  height: 100%;
}

.tabbar-text {
  font-size: 20rpx;
  color: #7a7e83;
  line-height: 1;
}

.tabbar-item.active .tabbar-text {
  color: #d81e06;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 18rpx;
  height: 32rpx;
  min-width: 32rpx;
  border-radius: 16rpx;
  text-align: center;
  line-height: 32rpx;
  padding: 0 6rpx;
  transform: scale(0.8);
}
</style>
