<template>
  <view class="container">
    <view class="header">
      <text class="title">商品评价</text>
    </view>

    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>

    <view v-else class="reviews-content">
      <!-- 评分统计 -->
      <view class="rating-summary">
        <view class="average-rating">
          <text class="rating-number">{{ statistics.averageRating }}</text>
          <view class="rating-stars">
            <uni-rate
              :value="parseFloat(statistics.averageRating)"
              :size="18"
              :readonly="true"
              :allow-half="true"
            />
          </view>
        </view>
        <view class="rating-distribution">
          <view
            v-for="i in 5"
            :key="i"
            class="rating-bar"
            @click="filterByRating(i)"
          >
            <text class="rating-level">{{ i }}星</text>
            <view class="progress-bar">
              <view
                class="progress-fill"
                :style="{
                  width:
                    statistics.totalReviews > 0
                      ? (statistics.ratingDistribution[i] /
                          statistics.totalReviews) *
                          100 +
                        '%'
                      : '0%',
                }"
              ></view>
            </view>
            <text class="rating-count">{{
              statistics.ratingDistribution[i] || 0
            }}</text>
          </view>
        </view>
      </view>

      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view class="filter-tabs">
          <view
            v-for="(tab, index) in filterTabs"
            :key="index"
            class="filter-tab"
            :class="{ active: currentFilter === tab.value }"
            @click="setFilter(tab.value)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
        <view class="sort-dropdown">
          <picker
            :value="sortIndex"
            :range="sortOptions"
            range-key="label"
            @change="handleSortChange"
          >
            <view class="sort-picker">
              <text>{{ sortOptions[sortIndex].label }}</text>
              <uni-icons type="down" size="14" color="#666" />
            </view>
          </picker>
        </view>
      </view>

      <!-- 评价列表 -->
      <view v-if="reviews.length > 0" class="review-list">
        <view
          v-for="(review, index) in reviews"
          :key="review.id"
          class="review-item"
        >
          <!-- 用户信息 -->
          <view class="user-info">
            <image
              class="avatar"
              :src="
                review.isAnonymous
                  ? '/static/images/avatar/default.png'
                  : '/static/images/avatar/user.png'
              "
              mode="aspectFill"
            />
            <text class="username">{{
              review.isAnonymous ? "匿名用户" : "用户***" + index
            }}</text>
          </view>

          <!-- 评分和时间 -->
          <view class="review-rating">
            <uni-rate
              :value="review.rating"
              :size="16"
              :readonly="true"
              :allow-half="false"
            />
            <text class="review-time">{{ formatTime(review.createdAt) }}</text>
          </view>

          <!-- 评价内容 -->
          <view class="review-content">
            <text>{{ review.content }}</text>
          </view>

          <!-- 评价图片 -->
          <view
            v-if="review.images && review.images.length > 0"
            class="review-images"
          >
            <view
              v-for="(image, imgIndex) in review.images"
              :key="imgIndex"
              class="review-image"
              @click="previewImage(review.images, imgIndex)"
            >
              <image :src="image" mode="aspectFill" />
            </view>
          </view>

          <!-- 商品信息 -->
          <view class="product-info">
            <image
              class="product-image"
              :src="getProductImage(review)"
              mode="aspectFill"
            />
            <text class="product-name">{{ review.productName }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <uni-icons type="info" color="#999" size="60" />
        <text class="empty-text">暂无评价</text>
      </view>

      <!-- 加载更多 -->
      <uni-load-more
        v-if="reviews.length > 0"
        :status="loadMoreStatus"
        @clickLoadMore="loadMore"
      />
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";
import { getImageUrl } from "@/utils/image";

export default {
  data() {
    return {
      productId: "",
      loading: true,
      reviews: [],
      page: 1,
      limit: 10,
      hasMore: true,
      loadMoreStatus: "more",
      statistics: {
        averageRating: "0.0",
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      },
      currentFilter: "all", // all, hasPic, good, medium, bad
      filterTabs: [
        { label: "全部", value: "all" },
        { label: "有图", value: "hasPic" },
        { label: "好评", value: "good" },
        { label: "中评", value: "medium" },
        { label: "差评", value: "bad" },
      ],
      sortOptions: [
        { label: "最新", value: "latest" },
        { label: "评分从高到低", value: "highest" },
        { label: "评分从低到高", value: "lowest" },
      ],
      sortIndex: 0,
      allReviews: [], // 缓存所有评价，用于前端筛选
    };
  },

  onLoad(options) {
    if (options.productId) {
      this.productId = options.productId;
    }
    this.loadReviews();
  },

  methods: {
    /**
     * 加载评价列表
     */
    async loadReviews(refresh = true) {
      try {
        if (refresh) {
          this.loading = true;
          this.page = 1;
          this.reviews = [];
        } else {
          this.loadMoreStatus = "loading";
        }

        const params = {
          productId: this.productId,
          page: this.page,
          limit: this.limit,
          sort: this.sortOptions[this.sortIndex].value,
        };

        const res = await api.getReviews(params);

        if (res.code === 200) {
          const newReviews = res.data.list || [];

          if (refresh) {
            this.reviews = newReviews;
            this.allReviews = [...newReviews];
            this.statistics = res.data.statistics || this.statistics;
          } else {
            this.reviews = [...this.reviews, ...newReviews];
            this.allReviews = [...this.allReviews, ...newReviews];
          }

          this.hasMore = res.data.hasMore;
          this.loadMoreStatus = this.hasMore ? "more" : "noMore";
          this.page++;

          // 应用当前筛选条件
          if (this.currentFilter !== "all") {
            this.applyFilter(this.currentFilter);
          }
        } else {
          uni.showToast({
            title: res.message || "获取评价失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取评价列表失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
      } finally {
        this.loading = false;
        if (!refresh) {
          this.loadMoreStatus = this.hasMore ? "more" : "noMore";
        }
      }
    },

    /**
     * 加载更多
     */
    loadMore() {
      if (this.hasMore && this.loadMoreStatus !== "loading") {
        this.loadReviews(false);
      }
    },

    /**
     * 设置筛选条件
     */
    setFilter(filter) {
      if (this.currentFilter === filter) return;
      this.currentFilter = filter;
      this.applyFilter(filter);
    },

    /**
     * 应用筛选条件
     */
    applyFilter(filter) {
      // 重置为所有评价
      this.reviews = [...this.allReviews];

      // 应用筛选
      if (filter === "hasPic") {
        this.reviews = this.reviews.filter(
          (review) => review.images && review.images.length > 0
        );
      } else if (filter === "good") {
        this.reviews = this.reviews.filter((review) => review.rating >= 4);
      } else if (filter === "medium") {
        this.reviews = this.reviews.filter((review) => review.rating === 3);
      } else if (filter === "bad") {
        this.reviews = this.reviews.filter((review) => review.rating <= 2);
      } else if (filter >= 1 && filter <= 5) {
        // 按星级筛选
        this.reviews = this.reviews.filter(
          (review) => review.rating === filter
        );
      }
    },

    /**
     * 按评分筛选
     */
    filterByRating(rating) {
      this.currentFilter = rating;
      this.applyFilter(rating);
    },

    /**
     * 处理排序变更
     */
    handleSortChange(e) {
      const index = e.detail.value;
      if (this.sortIndex === index) return;
      this.sortIndex = index;
      this.loadReviews();
    },

    /**
     * 预览图片
     */
    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: images[index],
      });
    },

    /**
     * 获取商品图片URL
     */
    getProductImage(review) {
      if (!review) {
        return "https://via.placeholder.com/200x200?text=暂无图片";
      }

      // 优先使用productImage字段
      if (review.productImage) {
        return getImageUrl(review.productImage);
      }

      // 都没有则返回占位图
      return "https://via.placeholder.com/200x200?text=暂无图片";
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      if (!timestamp) return "";

      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return "今天";
      } else if (diffDays === 1) {
        return "昨天";
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)}周前`;
      } else if (diffDays < 365) {
        return `${Math.floor(diffDays / 30)}个月前`;
      } else {
        return `${Math.floor(diffDays / 365)}年前`;
      }
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  background-color: #fff;
  padding: 30rpx;
  text-align: center;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.loading {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
}

.reviews-content {
  padding-bottom: 30rpx;
}

.rating-summary {
  background-color: #fff;
  padding: 30rpx;
  display: flex;
  margin-bottom: 20rpx;
}

.average-rating {
  flex: 0 0 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  border-right: 1rpx solid #eee;
  padding-right: 30rpx;
}

.rating-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #f7b500;
  margin-bottom: 10rpx;
}

.rating-distribution {
  flex: 1;
}

.rating-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.rating-bar:last-child {
  margin-bottom: 0;
}

.rating-level {
  font-size: 24rpx;
  color: #666;
  width: 60rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  margin: 0 20rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #f7b500;
  border-radius: 8rpx;
}

.rating-count {
  font-size: 24rpx;
  color: #999;
  width: 60rpx;
  text-align: right;
}

.filter-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 10rpx 20rpx;
  margin-right: 20rpx;
  margin-bottom: 10rpx;
  border-radius: 30rpx;
  background-color: #f5f5f5;
}

.filter-tab.active {
  background-color: #f7b500;
  color: #fff;
}

.sort-dropdown {
  flex-shrink: 0;
}

.sort-picker {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #666;
}

.sort-picker text {
  margin-right: 6rpx;
}

.review-list {
  padding: 0 20rpx;
}

.review-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.username {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.review-rating {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.review-time {
  font-size: 24rpx;
  color: #999;
  margin-left: 20rpx;
}

.review-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.review-image {
  width: 160rpx;
  height: 160rpx;
  margin-right: 10rpx;
  margin-bottom: 10rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.review-image image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 8rpx;
}

.product-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.product-name {
  font-size: 24rpx;
  color: #666;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 30rpx;
}
</style>
