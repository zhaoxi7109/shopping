<template>
  <view class="container">
    <view class="header">
      <text class="title">商品评价</text>
      <text class="subtitle">您的评价对其他买家很重要</text>
    </view>

    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>

    <view v-else-if="order" class="review-content">
      <!-- 商品信息 -->
      <view class="products-section">
        <view
          v-for="item in order.items"
          :key="item.productId"
          class="product-item"
        >
          <view class="product-image">
            <image
              :src="getProductImage(item)"
              mode="aspectFill"
              @error="handleImageError"
            />
          </view>
          <view class="product-info">
            <text class="product-name">{{ item.productName }}</text>
            <text class="product-spec" v-if="item.spec">{{ item.spec }}</text>
          </view>
        </view>
      </view>

      <!-- 评分 -->
      <view class="rating-section">
        <text class="section-title">商品评分</text>
        <view class="rating-stars">
          <view
            v-for="i in 5"
            :key="i"
            class="star"
            :class="{ active: i <= rating }"
            @click="setRating(i)"
          >
            <uni-icons
              :type="i <= rating ? 'star-filled' : 'star'"
              size="24"
              :color="i <= rating ? '#f7b500' : '#ddd'"
            />
          </view>
          <text class="rating-text">{{ getRatingText() }}</text>
        </view>
      </view>

      <!-- 评价内容 -->
      <view class="comment-section">
        <text class="section-title">评价内容</text>
        <textarea
          class="comment-input"
          v-model="comment"
          placeholder="请分享您对商品的使用体验，例如外观、质量、性能等方面的感受"
          maxlength="500"
        ></textarea>
        <text class="comment-count">{{ comment.length }}/500</text>
      </view>

      <!-- 上传图片 -->
      <view class="upload-section">
        <text class="section-title">上传图片（选填）</text>
        <view class="upload-list">
          <view
            v-for="(image, index) in images"
            :key="index"
            class="upload-item"
          >
            <image :src="image" mode="aspectFill" />
            <view class="delete-btn" @click="deleteImage(index)">
              <uni-icons type="close" size="18" color="#fff" />
            </view>
          </view>

          <view
            class="upload-btn"
            @click="chooseImage"
            v-if="images.length < 6"
          >
            <uni-icons type="camera" size="24" color="#999" />
            <text>添加图片</text>
          </view>
        </view>
        <text class="upload-tip">最多可上传6张图片</text>
      </view>

      <!-- 匿名评价 -->
      <view class="anonymous-section">
        <text class="anonymous-text">匿名评价</text>
        <switch
          :checked="isAnonymous"
          @change="(e) => (isAnonymous = e.detail.value)"
          color="#d81e06"
        />
      </view>
    </view>

    <view v-else class="error-state">
      <uni-icons type="info" color="#999" size="60" />
      <text class="error-text">订单不存在或已被删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button
        class="submit-btn"
        :disabled="!isValid || submitting"
        @click="submitReview"
      >
        {{ submitting ? "提交中..." : "提交评价" }}
      </button>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";
import { getImageUrl } from "@/utils/image";

export default {
  data() {
    return {
      orderId: "",
      order: null,
      loading: true,
      submitting: false,
      rating: 5,
      comment: "",
      images: [],
      isAnonymous: false,
    };
  },

  computed: {
    isValid() {
      return this.rating > 0 && this.comment.trim().length > 0;
    },
  },

  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId;
      this.loadOrderDetail();
    } else {
      this.loading = false;
    }
  },

  methods: {
    /**
     * 加载订单详情
     */
    async loadOrderDetail() {
      try {
        this.loading = true;
        const res = await api.getOrderDetail(this.orderId);

        if (res.code === 200) {
          this.order = res.data;

          // 检查订单状态
          if (this.order.status !== "delivered") {
            uni.showToast({
              title: "该订单不可评价",
              icon: "none",
            });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          }
        } else {
          uni.showToast({
            title: res.message || "获取订单失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取订单详情失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 设置评分
     */
    setRating(rating) {
      this.rating = rating;
    },

    /**
     * 获取评分文字描述
     */
    getRatingText() {
      const ratingTexts = ["很差", "较差", "一般", "不错", "很好"];
      return ratingTexts[this.rating - 1] || "";
    },

    /**
     * 选择图片
     */
    chooseImage() {
      uni.chooseImage({
        count: 6 - this.images.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          // 添加新选择的图片
          this.images = [...this.images, ...res.tempFilePaths];
        },
      });
    },

    /**
     * 删除图片
     */
    deleteImage(index) {
      this.images.splice(index, 1);
    },

    /**
     * 获取商品图片URL
     */
    getProductImage(item) {
      if (!item) {
        return "https://via.placeholder.com/200x200?text=暂无图片";
      }

      // 优先使用productImage字段
      if (item.productImage) {
        return getImageUrl(item.productImage);
      }

      // 如果没有productImage字段，尝试使用image字段
      if (item.image) {
        return getImageUrl(item.image);
      }

      // 如果没有image字段，尝试使用images数组的第一张图片
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        return getImageUrl(item.images[0]);
      }

      // 都没有则返回占位图
      return "https://via.placeholder.com/200x200?text=暂无图片";
    },

    /**
     * 处理图片加载错误
     */
    handleImageError(e) {
      e.target.src = "https://via.placeholder.com/200x200?text=暂无图片";
    },

    /**
     * 提交评价
     */
    async submitReview() {
      if (!this.isValid) {
        uni.showToast({
          title: "请填写评价内容",
          icon: "none",
        });
        return;
      }

      this.submitting = true;

      try {
        // 模拟上传图片
        let uploadedImages = [];
        if (this.images.length > 0) {
          // 实际项目中应该上传图片到服务器
          uploadedImages = this.images;
        }

        // 构建评价数据
        const reviewData = {
          rating: this.rating,
          content: this.comment,
          images: uploadedImages,
          isAnonymous: this.isAnonymous,
        };

        // 提交评价
        const res = await api.submitReview(this.orderId, reviewData);

        if (res.code === 200) {
          uni.showToast({
            title: "评价成功",
            icon: "success",
          });

          // 延迟返回
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || "评价失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("提交评价失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
      } finally {
        this.submitting = false;
      }
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
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
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 24rpx;
  color: #999;
}

.loading {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
}

.review-content {
  padding: 20rpx 30rpx;
}

.products-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.product-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 20rpx;
}

.product-image image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-spec {
  font-size: 24rpx;
  color: #999;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
  display: block;
}

.rating-section,
.comment-section,
.upload-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.rating-stars {
  display: flex;
  align-items: center;
}

.star {
  margin-right: 10rpx;
}

.star.active {
  transform: scale(1.1);
}

.rating-text {
  font-size: 26rpx;
  color: #f7b500;
  margin-left: 20rpx;
}

.comment-input {
  width: 100%;
  height: 240rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.comment-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 10rpx;
  display: block;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
}

.upload-item,
.upload-btn {
  width: 160rpx;
  height: 160rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
  overflow: hidden;
  position: relative;
}

.upload-item image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 8rpx;
}

.upload-btn {
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1rpx dashed #ddd;
}

.upload-btn text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.anonymous-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.anonymous-text {
  font-size: 28rpx;
  color: #333;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.error-text {
  font-size: 28rpx;
  color: #999;
  margin: 30rpx 0;
}

.back-btn {
  background-color: #d81e06;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 40rpx;
  border-radius: 30rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  justify-content: center;
}

.submit-btn {
  background-color: #d81e06;
  color: #fff;
  font-size: 32rpx;
  width: 90%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
}

.submit-btn[disabled] {
  background-color: #f5a8a0;
}
</style>
