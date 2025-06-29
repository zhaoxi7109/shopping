<template>
  <view class="container">
    <view class="category-container">
      <!-- 左侧分类菜单 -->
      <scroll-view class="category-menu" scroll-y>
        <view
          class="menu-item"
          v-for="(item, index) in categoryList"
          :key="index"
          :class="{ active: currentCategory === index }"
          @click="changeCategory(index)"
        >
          {{ item.name }}
        </view>
      </scroll-view>

      <!-- 右侧子分类和商品 -->
      <scroll-view class="category-content" scroll-y>
        <view
          class="content-banner"
          v-if="categoryList.length > 0 && categoryList[currentCategory]"
        >
          <image
            :src="categoryList[currentCategory].banner"
            mode="widthFix"
          ></image>
        </view>

        <view class="sub-category-list">
          <view class="sub-category-title">全部分类</view>
          <view class="sub-category-items">
            <view
              class="sub-category-item"
              v-for="(item, index) in (categoryList.length > 0 &&
                categoryList[currentCategory] &&
                categoryList[currentCategory].subCategories) ||
              []"
              :key="index"
              @click="navigateToSubCategory(item.id)"
            >
              <image :src="item.icon" mode="aspectFit"></image>
              <text>{{ item.name }}</text>
            </view>
          </view>
        </view>

        <view class="hot-products">
          <view class="hot-title">热门商品</view>
          <view class="product-list">
            <view
              class="product-item"
              v-for="(item, index) in (categoryList.length > 0 &&
                categoryList[currentCategory] &&
                categoryList[currentCategory].hotProducts) ||
              []"
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
      </scroll-view>
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
      currentCategory: 0,
      categoryList: [],
      loading: false,
    };
  },
  onLoad() {
    this.getCategoryList();
  },
  onShow() {
    // 监听分类选择事件
    uni.$on("categorySelected", this.handleCategorySelected);

    // 更新自定义tabbar状态
    this.updateTabBarStatus();
  },
  onHide() {
    uni.$off("categorySelected", this.handleCategorySelected);
  },
  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off("categorySelected");
  },
  methods: {
    // 更新tabbar状态
    updateTabBarStatus() {
      // 通过事件触发自定义tabbar更新
      uni.$emit("updateTabBar", 1); // 1是分类页的索引
      uni.$emit("onShowPage", "pages/category/category");
    },

    // 获取分类列表
    async getCategoryList() {
      this.loading = true;
      try {
        const res = await api.getCategories();
        if (res.success) {
          // 处理分类图片URL
          this.categoryList = processImageUrls(res.data || [], "icon");
          // 处理banner图片URL
          this.categoryList = this.categoryList.map((item) => {
            if (item.banner) {
              item.banner = processImageUrl(item, "banner").banner;
            }
            // 处理子分类图片URL
            if (item.subCategories && Array.isArray(item.subCategories)) {
              item.subCategories = processImageUrls(item.subCategories, "icon");
            }
            return item;
          });
          console.log("获取分类列表成功:", this.categoryList.length);
          // 获取第一个分类的详情
          if (this.categoryList.length > 0) {
            await this.getCategoryDetail(this.categoryList[0].id);
          }
        } else {
          console.error("获取分类列表失败:", res.message);
        }
      } catch (error) {
        console.error("获取分类列表失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 获取分类详情
    async getCategoryDetail(categoryId) {
      try {
        const res = await api.getCategoryDetail(categoryId);
        if (res.success) {
          const categoryIndex = this.categoryList.findIndex(
            (item) => item.id === categoryId
          );
          if (categoryIndex !== -1 && res.data) {
            // 处理热门商品图片URL
            const hotProducts = processImageUrls(
              res.data.hotProducts || [],
              "image"
            );
            // 更新分类的热门商品
            this.$set(
              this.categoryList[categoryIndex],
              "hotProducts",
              hotProducts
            );
            console.log("获取分类详情成功:", categoryId);
          }
        } else {
          console.error("获取分类详情失败:", res.message);
        }
      } catch (error) {
        console.error("获取分类详情失败:", error);
      }
    },

    // 处理分类选择事件
    handleCategorySelected(data) {
      const index = this.categoryList.findIndex((item) => item.id === data.id);
      if (index !== -1) {
        this.changeCategory(index);
      }
    },

    // 切换分类
    async changeCategory(index) {
      this.currentCategory = index;
      const category = this.categoryList[index];
      if (category && !category.hotProducts) {
        await this.getCategoryDetail(category.id);
      }
    },

    // 导航到子分类
    navigateToSubCategory(id) {
      uni.navigateTo({
        url: `/pages/product-list/product-list?categoryId=${id}`,
      });
    },

    // 导航到商品详情
    navigateToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      });
    },
  },
};
</script>

<style>
.container {
  background-color: #f5f5f5;
}

.category-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧菜单样式 */
.category-menu {
  width: 180rpx;
  background-color: #f7f7f7;
}

.menu-item {
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
  position: relative;
  text-align: center;
}

.menu-item.active {
  color: #d81e06;
  background-color: #ffffff;
  font-weight: bold;
}

.menu-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 30rpx;
  height: 40rpx;
  width: 6rpx;
  background-color: #d81e06;
}

/* 右侧内容样式 */
.category-content {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
  background-color: #ffffff;
}

.content-banner {
  width: 100%;
  height: 200rpx;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.content-banner image {
  width: 100%;
}

/* 子分类样式 */
.sub-category-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.sub-category-items {
  display: flex;
  flex-wrap: wrap;
}

.sub-category-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.sub-category-item image {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 10rpx;
}

.sub-category-item text {
  font-size: 24rpx;
  color: #333;
}

/* 热门商品样式 */
.hot-products {
  margin-top: 30rpx;
}

.hot-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
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
  height: 200rpx;
}

.product-info {
  padding: 10rpx;
}

.product-name {
  font-size: 24rpx;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.product-price {
  font-size: 28rpx;
  color: #d81e06;
  font-weight: bold;
}
</style>
