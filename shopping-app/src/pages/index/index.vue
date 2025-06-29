<template>
  <view class="container">
    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-input" @click="goToSearchPage">
        <UnifiedIcon type="icon-search" :size="16" color="#999" />
        <text class="placeholder-text">搜索商品</text>
      </view>
      <view class="user-icon" @click="goToUserCenter">
        <UnifiedIcon type="icon-user" :size="20" color="#333" />
      </view>
    </view>

    <!-- 轮播图 -->
    <swiper
      class="banner"
      indicator-dots
      autoplay
      circular
      :interval="3000"
      :duration="500"
    >
      <swiper-item v-for="(item, index) in bannerList" :key="index">
        <image
          :src="item.image"
          mode="widthFix"
          @click="navigateTo(item.url)"
        ></image>
      </swiper-item>
    </swiper>

    <!-- 分类导航 -->
    <view class="category-section">
      <view
        class="category-item"
        v-for="(item, index) in categoryList"
        :key="index"
        @click="navigateToCategory(item.id)"
      >
        <image :src="item.icon" mode="aspectFit"></image>
        <text>{{ item.name }}</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-section">
      <view class="section-title">
        <text>热门商品</text>
        <text class="more" @click="navigateToMore">查看更多</text>
      </view>
      <view class="product-list">
        <view
          class="product-item"
          v-for="(item, index) in productList"
          :key="index"
          @click="navigateToDetail(item.id)"
        >
          <image :src="item.image" mode="aspectFill"></image>
          <view class="product-info">
            <text class="product-name">{{ item.name }}</text>
            <text class="product-price">¥{{ item.price }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
  <!-- H5环境下的自定义TabBar -->
  <CustomTabBar ref="customTabBar" />
</template>

<script>
import { api } from "@/utils/api.js";
import { processImageUrls, processImageUrl } from "@/utils/image.js";
import CustomTabBar from "@/components/CustomTabBar.vue";

export default {
  components: {
    CustomTabBar,
  },
  data() {
    return {
      bannerList: [],
      categoryList: [],
      productList: [],
      loading: false,
    };
  },
  onLoad() {
    this.initData();
  },
  onShow() {
    this.updateTabBarStatus();
  },
  onPullDownRefresh() {
    this.initData();
  },
  methods: {
    updateTabBarStatus() {
      uni.$emit("updateTabBar", 0);
      uni.$emit("onShowPage", "pages/index/index");
    },
    // 初始化数据
    async initData() {
      this.loading = true;
      try {
        await Promise.all([
          this.getBannerList(),
          this.getCategoryList(),
          this.getProductList(),
        ]);
      } catch (error) {
        console.error("初始化数据失败:", error);
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },

    // 获取轮播图数据
    async getBannerList() {
      try {
        const res = await api.getBanners();
        if (res.success) {
          // 处理图片URL
          this.bannerList = processImageUrls(res.data || [], "image");
          console.log("轮播图加载成功:", this.bannerList.length + "条");
        } else {
          console.error("获取轮播图失败:", res.message || "未知错误");
        }
      } catch (error) {
        console.error("获取轮播图失败:", error);
      }
    },

    // 获取分类列表
    async getCategoryList() {
      try {
        const res = await api.getCategories();
        if (res.success) {
          // 处理图片URL
          this.categoryList = processImageUrls(res.data || [], "icon");
          console.log("分类数据加载成功:", this.categoryList.length + "条");
        } else {
          console.error("获取分类失败:", res.message || "未知错误");
        }
      } catch (error) {
        console.error("获取分类失败:", error);
      }
    },

    // 获取商品列表
    async getProductList() {
      try {
        const res = await api.getRecommendProducts({
          type: "hot",
          limit: 6,
        });
        if (res.success) {
          // 处理图片URL
          this.productList = processImageUrls(res.data || [], "image");
          console.log("商品列表加载成功:", this.productList.length + "条");
        } else {
          console.error("获取商品列表失败:", res.message || "未知错误");
        }
      } catch (error) {
        console.error("获取商品列表失败:", error);
      }
    },
    // 跳转到搜索页面
    goToSearchPage() {
      uni.navigateTo({
        url: "/pages/search/search",
      });
    },
    // 搜索商品
    searchProducts(e) {
      const keyword = e.detail.value;
      uni.navigateTo({
        url: `/pages/search/search?keyword=${keyword}`,
      });
    },
    // 导航到详情页
    navigateToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      });
    },
    // 导航到分类页
    navigateToCategory(id) {
      uni.switchTab({
        url: "/pages/category/category",
        success: () => {
          // 可以通过eventChannel向被打开页面传送数据
          uni.$emit("categorySelected", { id: id });
        },
      });
    },
    // 导航到更多商品页
    navigateToMore() {
      uni.switchTab({
        url: "/pages/category/category",
      });
    },
    // 通用导航
    navigateTo(url) {
      uni.navigateTo({
        url: url,
      });
    },
    // 跳转到用户中心
    goToUserCenter() {
      uni.switchTab({
        url: "/pages/user/user",
      });
    },
  },
};
</script>

<style>
.container {
  padding-bottom: 20rpx;
}

/* 搜索框样式 */
.search-box {
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
}

.search-input {
  display: flex;
  align-items: center;
  height: 70rpx;
  background-color: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
  flex: 1;
}

.search-input .icon-search {
  font-size: 32rpx;
  color: #999999;
  margin-right: 10rpx;
}

.search-input .placeholder-text {
  font-size: 28rpx;
  color: #999999;
}

.user-icon {
  margin-left: 20rpx;
  font-size: 40rpx;
}

/* 轮播图样式 */
.banner {
  width: 100%;
  height: 300rpx;
}

.banner image {
  width: 100%;
  height: 100%;
}

/* 分类导航样式 */
.category-section {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 0;
  background-color: #ffffff;
  margin-top: 20rpx;
}

.category-item {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.category-item image {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 10rpx;
}

.category-item text {
  font-size: 24rpx;
  color: #333;
}

/* 商品列表样式 */
.product-section {
  margin-top: 20rpx;
  background-color: #ffffff;
  padding: 20rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.section-title .more {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.product-item {
  width: 48%;
  margin-bottom: 20rpx;
  background-color: #ffffff;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.product-item image {
  width: 100%;
  height: 300rpx;
}

.product-info {
  padding: 16rpx;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.product-price {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
}
</style>
