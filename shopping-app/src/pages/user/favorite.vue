<template>
  <view class="container">
    <!-- 空状态 -->
    <view v-if="favoriteList.length === 0" class="empty-state">
      <image
        src="/static/images/empty-favorite.png"
        mode="aspectFit"
        class="empty-image"
      ></image>
      <text class="empty-text">暂无收藏商品</text>
      <text class="empty-desc">快去收藏你喜欢的商品吧~</text>
      <button class="go-shopping-btn" @click="goShopping">去逛逛</button>
    </view>

    <!-- 收藏列表 -->
    <view v-else class="favorite-list">
      <!-- 顶部操作栏 -->
      <view class="top-bar">
        <view class="total-count">共{{ favoriteList.length }}件商品</view>
        <view class="edit-btn" @click="toggleEditMode">
          <text>{{ isEditMode ? "完成" : "编辑" }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="product-list">
        <view
          v-for="(item, index) in favoriteList"
          :key="item.id"
          class="product-item"
          @click="!isEditMode && goToDetail(item.id)"
        >
          <!-- 选择框 -->
          <view
            v-if="isEditMode"
            class="checkbox"
            @click.stop="toggleSelect(index)"
          >
            <UnifiedIcon
              :type="item.selected ? 'icon-check-filled' : 'icon-check'"
              :size="20"
              :color="item.selected ? '#d81e06' : '#ccc'"
            />
          </view>

          <!-- 商品图片 -->
          <view class="product-image">
            <image
              :src="getProductImage(item)"
              mode="aspectFill"
              @error="(e) => handleImageError(e, item)"
              @load="(e) => handleImageLoad(e, item)"
              :lazy-load="true"
            ></image>
          </view>

          <!-- 商品信息 -->
          <view class="product-info">
            <view class="product-title">{{ item.title }}</view>
            <view class="product-desc">{{ item.description }}</view>
            <view class="product-price">
              <text class="current-price">¥{{ item.price }}</text>
              <text v-if="item.originalPrice" class="original-price"
                >¥{{ item.originalPrice }}</text
              >
            </view>
            <view class="product-meta">
              <view class="meta-left">
                <text class="favorite-time">{{
                  formatTime(item.favoriteTime)
                }}</text>
              </view>
              <view class="meta-right">
                <view class="product-tags">
                  <text v-if="item.isHot" class="tag hot">热销</text>
                  <text v-if="item.isNew" class="tag new">新品</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="product-actions">
            <view class="action-btn cart-btn" @click.stop="addToCart(item)">
              <UnifiedIcon type="icon-cart" :size="20" color="#d81e06" />
            </view>
            <view
              class="action-btn remove-btn"
              @click.stop="removeFavorite(item.id)"
            >
              <UnifiedIcon type="icon-delete" :size="20" color="#999" />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view v-if="isEditMode" class="bottom-bar">
        <view class="select-all" @click="toggleSelectAll">
          <UnifiedIcon
            :type="isAllSelected ? 'icon-check-filled' : 'icon-check'"
            :size="20"
            :color="isAllSelected ? '#d81e06' : '#ccc'"
          />
          <text>全选</text>
        </view>
        <view class="batch-actions">
          <button
            class="batch-btn"
            @click="batchAddToCart"
            :disabled="selectedCount === 0"
          >
            加入购物车({{ selectedCount }})
          </button>
          <button
            class="batch-btn delete-btn"
            @click="batchRemove"
            :disabled="selectedCount === 0"
          >
            删除({{ selectedCount }})
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { processImageUrls, processImageUrl } from "@/utils/image.js";

export default {
  data() {
    return {
      favoriteList: [],
      isEditMode: false,
      loading: false,
    };
  },

  computed: {
    /**
     * 计算选中的商品数量
     */
    selectedCount() {
      return this.favoriteList.filter((item) => item.selected).length;
    },

    /**
     * 判断是否全选
     */
    isAllSelected() {
      return (
        this.favoriteList.length > 0 &&
        this.favoriteList.every((item) => item.selected)
      );
    },
  },

  onLoad() {
    this.loadFavoriteList();
  },

  onShow() {
    // 页面显示时刷新收藏列表
    this.loadFavoriteList();
  },

  onPullDownRefresh() {
    this.loadFavoriteList().finally(() => {
      uni.stopPullDownRefresh();
    });
  },

  methods: {
    /**
     * 加载收藏列表
     */
    async loadFavoriteList() {
      try {
        this.loading = true;
        const res = await api.getFavoriteList();

        if (res.success) {
          // 处理商品数据，统一字段格式
          const processedData = (res.data || []).map((item) => {
            // 统一字段名称
            const processedItem = {
              ...item,
              // 将name字段映射为title字段
              title: item.name || item.title,
              // 将subtitle映射为description
              description: item.subtitle || item.description,
              // 处理图片：如果有images数组，取第一张作为主图
              image: item.images && item.images.length > 0 ? item.images[0] : item.image,
              // 保留原始images数组用于备用
              images: item.images || [],
              selected: false,
            };
            
            // 处理图片URL
            if (processedItem.image) {
              processedItem.image = processImageUrl({ image: processedItem.image }, 'image').image;
            }
            
            // 处理images数组中的URL
            if (processedItem.images && processedItem.images.length > 0) {
              processedItem.images = processedItem.images.map(img => 
                processImageUrl({ image: img }, 'image').image
              );
            }
            
            return processedItem;
          });
          
          this.favoriteList = processedData;
          
          console.log('收藏列表加载完成:', {
            count: this.favoriteList.length,
            sample: this.favoriteList[0] || null
          });
        } else {
          uni.showToast({
            title: res.error || "获取收藏列表失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("获取收藏列表失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 切换编辑模式
     */
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      if (!this.isEditMode) {
        // 退出编辑模式时清除所有选择
        this.favoriteList.forEach((item) => {
          item.selected = false;
        });
      }
    },

    /**
     * 切换单个商品选择状态
     */
    toggleSelect(index) {
      this.favoriteList[index].selected = !this.favoriteList[index].selected;
    },

    /**
     * 切换全选状态
     */
    toggleSelectAll() {
      const shouldSelectAll = !this.isAllSelected;
      this.favoriteList.forEach((item) => {
        item.selected = shouldSelectAll;
      });
    },

    /**
     * 跳转到商品详情
     */
    goToDetail(productId) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${productId}`,
      });
    },

    /**
     * 添加到购物车
     */
    async addToCart(item) {
      try {
        const res = await api.addToCart({
          productId: item.id,
          quantity: 1,
        });

        if (res.success) {
          uni.showToast({
            title: "已加入购物车",
            icon: "success",
          });
        } else {
          uni.showToast({
            title: res.error || "加入购物车失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("加入购物车失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      }
    },

    /**
     * 取消收藏
     */
    async removeFavorite(productId) {
      try {
        uni.showModal({
          title: "提示",
          content: "确定要取消收藏吗？",
          success: async (res) => {
            if (res.confirm) {
              const result = await api.removeFavorite(productId);

              if (result.success) {
                // 从列表中移除
                const index = this.favoriteList.findIndex(
                  (item) => item.id === productId
                );
                if (index > -1) {
                  this.favoriteList.splice(index, 1);
                }

                // 触发收藏状态变化事件，通知其他页面更新
                uni.$emit("favoriteChanged", {
                  productId: productId,
                  isFavorite: false,
                });

                uni.showToast({
                  title: "已取消收藏",
                  icon: "success",
                });
              } else {
                uni.showToast({
                  title: result.error || "取消收藏失败",
                  icon: "error",
                });
              }
            }
          },
        });
      } catch (error) {
        console.error("取消收藏失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      }
    },

    /**
     * 批量加入购物车
     */
    async batchAddToCart() {
      const selectedItems = this.favoriteList.filter((item) => item.selected);

      if (selectedItems.length === 0) {
        uni.showToast({
          title: "请选择商品",
          icon: "none",
        });
        return;
      }

      try {
        const promises = selectedItems.map((item) =>
          api.addToCart({
            productId: item.id,
            quantity: 1,
          })
        );

        await Promise.all(promises);

        uni.showToast({
          title: `已加入${selectedItems.length}件商品到购物车`,
          icon: "success",
        });

        // 清除选择状态
        this.favoriteList.forEach((item) => {
          item.selected = false;
        });
        this.isEditMode = false;
      } catch (error) {
        console.error("批量加入购物车失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "error",
        });
      }
    },

    /**
     * 批量删除收藏
     */
    async batchRemove() {
      const selectedItems = this.favoriteList.filter((item) => item.selected);

      if (selectedItems.length === 0) {
        uni.showToast({
          title: "请选择商品",
          icon: "none",
        });
        return;
      }

      uni.showModal({
        title: "提示",
        content: `确定要删除${selectedItems.length}件收藏商品吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const promises = selectedItems.map((item) =>
                api.removeFavorite(item.id)
              );
              await Promise.all(promises);

              // 从列表中移除选中的商品
              this.favoriteList = this.favoriteList.filter(
                (item) => !item.selected
              );

              // 触发收藏状态变化事件，通知其他页面更新收藏数
              selectedItems.forEach((item) => {
                uni.$emit("favoriteChanged", {
                  productId: item.id,
                  isFavorite: false,
                });
              });

              uni.showToast({
                title: `已删除${selectedItems.length}件商品`,
                icon: "success",
              });

              this.isEditMode = false;
            } catch (error) {
              console.error("批量删除失败:", error);
              uni.showToast({
                title: "删除失败",
                icon: "error",
              });
            }
          }
        },
      });
    },

    /**
     * 去购物
     */
    goShopping() {
      uni.switchTab({
        url: "/pages/index/index",
      });
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) {
        return "刚刚";
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      } else if (diff < 2592000000) {
        return `${Math.floor(diff / 86400000)}天前`;
      } else {
        return date.toLocaleDateString();
      }
    },

    /**
     * 获取商品图片URL
     */
    getProductImage(item) {
      if (!item) {
        return '/static/images/placeholder.png';
      }
      
      // 优先使用处理后的image字段
      if (item.image) {
        return item.image;
      }
      
      // 如果没有image字段，尝试使用images数组的第一张图片
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        return processImageUrl({ image: item.images[0] }, 'image').image;
      }
      
      // 都没有则返回占位图
      return '/static/images/placeholder.png';
    },

    /**
     * 处理图片加载错误
     */
    handleImageError(e, item) {
      console.warn("图片加载失败:", {
        src: e.target.src,
        item: item,
        error: e
      });
      
      // 尝试使用备用图片
      if (item && item.images && Array.isArray(item.images) && item.images.length > 1) {
        // 如果有多张图片，尝试使用下一张
        const currentSrc = e.target.src;
        const currentIndex = item.images.findIndex(img => 
          currentSrc.includes(img) || processImageUrl({ image: img }, 'image').image === currentSrc
        );
        
        if (currentIndex !== -1 && currentIndex < item.images.length - 1) {
          const nextImage = processImageUrl({ image: item.images[currentIndex + 1] }, 'image').image;
          e.target.src = nextImage;
          return;
        }
      }
      
      // 最终使用占位图
      e.target.src = '/static/images/placeholder.png';
    },

    /**
     * 处理图片加载成功
     */
    handleImageLoad(e, item) {
      console.log("图片加载成功:", {
        src: e.target.src,
        itemId: item?.id
      });
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.go-shopping-btn {
  background-color: #d81e06;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}

/* 收藏列表样式 */
.favorite-list {
  padding-bottom: 120rpx;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.total-count {
  font-size: 28rpx;
  color: #666;
}

.edit-btn {
  font-size: 28rpx;
  color: #d81e06;
  padding: 10rpx 20rpx;
  cursor: pointer;
}

.product-list {
  background-color: #fff;
}

.product-item {
  display: flex;
  align-items: flex-start;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  /* 移除固定最小高度，让高度由内容决定 */
}

.checkbox {
  margin-right: 20rpx;
  padding: 10rpx;
  margin-top: 10rpx;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  overflow: hidden;
  margin-right: 20rpx;
  flex-shrink: 0;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  /* 移除固定最小高度，让高度由内容决定 */
  margin-right: 20rpx;
}

.product-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  line-height: 1.4;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
  max-height: 84rpx;
}

.product-desc {
  font-size: 26rpx;
  color: #999;
  line-height: 1.4;
  margin-bottom: 15rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.product-price {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
  flex-wrap: wrap;
}

.current-price {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
  margin-right: 20rpx;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
  width: 100%;
}

.meta-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.meta-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.favorite-time {
  font-size: 24rpx;
  color: #ccc;
  white-space: nowrap;
}

.product-tags {
  display: flex;
  gap: 6rpx;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag.hot {
  background-color: #ff6b6b;
}

.tag.new {
  background-color: #4ecdc4;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.95);
}

.cart-btn {
  border-color: #d81e06;
  background-color: #fff;
}

.cart-btn:active {
  background-color: #d81e06;
}

.remove-btn {
  border-color: #ddd;
  background-color: #fff;
}

.remove-btn:active {
  background-color: #ff4757;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
  cursor: pointer;
  padding: 10rpx;
}

.batch-actions {
  display: flex;
  gap: 15rpx;
}

.batch-btn {
  padding: 15rpx 25rpx;
  border-radius: 50rpx;
  font-size: 26rpx;
  border: none;
  background-color: #d81e06;
  color: #fff;
  min-width: 120rpx;
  text-align: center;
  transition: all 0.3s ease;
}

.batch-btn:active {
  transform: scale(0.95);
}

.batch-btn:disabled {
  background-color: #ccc;
  color: #999;
  transform: none;
}

.delete-btn {
  background-color: #ff4757;
}

.delete-btn:disabled {
  background-color: #ccc;
}

.delete-btn:active {
  background-color: #ff3742;
}
</style>
