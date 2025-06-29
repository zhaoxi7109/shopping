<template>
  <view class="container">
    <!-- 商品轮播图 -->
    <swiper
      class="product-swiper"
      indicator-dots
      autoplay
      circular
      :interval="3000"
      :duration="500"
    >
      <swiper-item v-for="(item, index) in product.images" :key="index">
        <image :src="item" mode="aspectFill"></image>
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="price-box">
        <text class="price">¥{{ product.price }}</text>
        <text class="original-price">¥{{ product.originalPrice }}</text>
      </view>
      <view class="title">{{ product.name }}</view>
      <view class="sub-title">{{ product.subtitle }}</view>

      <view class="sales-box">
        <text>销量 {{ product.sales }}</text>
        <text>好评率 {{ product.goodRate }}%</text>
      </view>
    </view>

    <!-- 优惠信息 -->
    <view class="promotion-box">
      <view class="promotion-item">
        <text class="label">优惠</text>
        <text class="content">{{ product.promotion }}</text>
      </view>
      <view class="promotion-item">
        <text class="label">服务</text>
        <text class="content">{{ product.service }}</text>
      </view>
    </view>

    <!-- 商品规格选择 -->
    <view class="spec-box" @click="openSpecPopup">
      <text class="label">规格</text>
      <view class="content">
        <text>{{ selectedSpec || "请选择规格数量" }}</text>
        <UnifiedIcon type="icon-right" :size="18" color="#999" />
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-box">
      <view class="detail-title">商品详情</view>
      <rich-text :nodes="product.detail"></rich-text>
      <block v-for="(item, index) in product.detailImages" :key="index">
        <image :src="item" mode="widthFix" class="detail-image"></image>
      </block>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="action-icon" @click="navToHome">
        <UnifiedIcon type="icon-home" :size="20" color="#666" />
        <text>首页</text>
      </view>
      <view class="action-icon" @click="toggleFavorite">
        <UnifiedIcon
          :type="isFavorite ? 'icon-favorite-fill' : 'icon-favorite'"
          :size="20"
          :color="isFavorite ? '#d81e06' : '#666'"
        />
        <text>收藏</text>
      </view>
      <view class="action-icon" @click="navToCart">
        <UnifiedIcon type="icon-cart" :size="20" color="#666" />
        <text>购物车</text>
        <text class="badge" v-if="cartCount > 0">{{ cartCount }}</text>
      </view>
      <view class="action-button add-cart" @click="addToCart">加入购物车</view>
      <view class="action-button buy-now" @click="buyNow">立即购买</view>
    </view>

    <!-- 规格选择弹窗 -->
    <view class="spec-popup" v-if="showSpecPopup">
      <view class="popup-mask" @click="closeSpecPopup"></view>
      <view class="popup-content">
        <view class="popup-header">
          <image :src="product.images[0]" mode="aspectFill"></image>
          <view class="popup-product-info">
            <text class="popup-price">¥{{ product.price }}</text>
            <text class="popup-stock">库存 {{ product.stock }} 件</text>
            <text class="popup-selected"
              >已选：{{ selectedSpec || "请选择规格" }}</text
            >
          </view>
          <text class="close-icon" @click="closeSpecPopup">×</text>
        </view>

        <view class="spec-container">
          <view
            class="spec-group"
            v-for="(group, groupIndex) in product.specs"
            :key="groupIndex"
          >
            <view class="spec-title">{{ group.name }}</view>
            <view class="spec-items">
              <text
                class="spec-item"
                v-for="(item, itemIndex) in group.items"
                :key="itemIndex"
                :class="{ active: selectedSpecs[group.name] === item }"
                @click="selectSpec(group.name, item)"
              >
                {{ item }}
              </text>
            </view>
          </view>

          <view class="quantity-box">
            <text class="quantity-title">数量</text>
            <view class="quantity-selector">
              <text class="quantity-btn" @click="decreaseQuantity">-</text>
              <input type="number" class="quantity-input" v-model="quantity" />
              <text class="quantity-btn" @click="increaseQuantity">+</text>
            </view>
          </view>
        </view>

        <view class="popup-buttons">
          <view class="popup-btn add-cart-btn" @click="confirmAddToCart"
            >加入购物车</view
          >
          <view class="popup-btn buy-now-btn" @click="confirmBuyNow"
            >立即购买</view
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { processImageUrls, processImageUrl } from "@/utils/image.js";
import { useCartStore } from "@/store/cart.js";
import { useUserStore } from "@/store/user.js";

export default {
  data() {
    return {
      productId: null,
      product: {},
      loading: false,
      selectedSpecs: {},
      selectedSpec: "",
      quantity: 1,
      isFavorite: false,
      cartCount: 2,
      showSpecPopup: false,
    };
  },
  onLoad(options) {
    if (options.id) {
      this.productId = options.id;
      this.loadProductDetail();
    }
    // 初始化购物车数量
    this.initCartCount();
  },
  onShow() {
    // 每次显示页面时更新购物车数量
    this.updateCartCount();
  },
  methods: {
    // 加载商品详情
    async loadProductDetail() {
      if (!this.productId) return;

      this.loading = true;
      try {
        const res = await api.getProductDetail(this.productId);
        this.product = res.data || {};

        // 处理商品图片URL
        if (this.product.images && Array.isArray(this.product.images)) {
          this.product.images = this.product.images.map((image) => {
            if (image && !image.startsWith("http")) {
              return `http://localhost:3000${image}`;
            }
            return image;
          });
        }

        // 处理商品详情图片URL
        if (
          this.product.detailImages &&
          Array.isArray(this.product.detailImages)
        ) {
          this.product.detailImages = this.product.detailImages.map((image) => {
            if (image && !image.startsWith("http")) {
              return `http://localhost:3000${image}`;
            }
            return image;
          });
        }

        // 检查用户是否已收藏该商品
        this.checkFavoriteStatus();
      } catch (error) {
        console.error("获取商品详情失败:", error);
        uni.showToast({
          title: "商品不存在或已下架",
          icon: "none",
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } finally {
        this.loading = false;
      }
    },

    // 检查收藏状态
    async checkFavoriteStatus() {
      try {
        // 从商品详情API返回的数据中获取收藏状态
        if (this.product && this.product.isFavorited !== undefined) {
          this.isFavorite = this.product.isFavorited;
        }
      } catch (error) {
        console.error("检查收藏状态失败:", error);
        // 如果API调用失败，使用本地存储作为备选方案
        const favorites = uni.getStorageSync("favorites") || [];
        this.isFavorite = favorites.includes(this.productId);
      }
    },

    // 打开规格选择弹窗
    openSpecPopup() {
      this.showSpecPopup = true;
    },

    // 关闭规格选择弹窗
    closeSpecPopup() {
      this.showSpecPopup = false;
    },

    // 选择规格
    selectSpec(name, value) {
      this.$set(this.selectedSpecs, name, value);
      this.updateSelectedSpecText();
    },

    // 更新已选规格文本
    updateSelectedSpecText() {
      let text = "";
      for (const key in this.selectedSpecs) {
        text += `${key}:${this.selectedSpecs[key]} `;
      }
      this.selectedSpec = text.trim();
    },

    // 增加数量
    increaseQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++;
      } else {
        uni.showToast({
          title: "已达最大库存",
          icon: "none",
        });
      }
    },

    // 减少数量
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },

    // 检查是否已选择规格
    checkSpecSelected() {
      // 安全检查：确保product和specs存在
      if (
        !this.product ||
        !this.product.specs ||
        !Array.isArray(this.product.specs)
      ) {
        return true; // 如果没有规格要求，直接返回true
      }

      const specCount = this.product.specs.length;
      const selectedCount = Object.keys(this.selectedSpecs).length;

      if (selectedCount < specCount) {
        uni.showToast({
          title: "请选择商品规格",
          icon: "none",
        });
        return false;
      }
      return true;
    },

    // 添加到购物车
    addToCart() {
      this.openSpecPopup();
    },

    // 确认添加到购物车
    async confirmAddToCart() {
      if (!this.checkSpecSelected()) return;

      const cartStore = useCartStore();

      try {
        const result = await cartStore.addToCart(
          this.product,
          this.quantity,
          this.selectedSpec || "默认规格"
        );

        // 检查结果是否成功
        if (
          result &&
          (result.success ||
            result.statusCode === 201 ||
            result.statusCode === 200)
        ) {
          uni.showToast({
            title: "已加入购物车",
            icon: "success",
          });

          this.closeSpecPopup();

          // 更新购物车数量显示
          this.cartCount = cartStore.cartCount;
        } else {
          throw new Error("添加到购物车失败");
        }
      } catch (error) {
        console.error("加入购物车失败:", error);
        uni.showToast({
          title: "加入购物车失败，请重试",
          icon: "none",
        });
      }
    },

    // 立即购买
    buyNow() {
      // 检查登录状态
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: "请先登录",
          icon: "none",
        });
        setTimeout(() => {
          uni.navigateTo({
            url: "/pages/auth/login",
          });
        }, 1500);
        return;
      }
      
      this.openSpecPopup();
    },

    // 确认立即购买
    confirmBuyNow() {
      if (!this.checkSpecSelected()) return;

      // 再次检查登录状态
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: "请先登录",
          icon: "none",
        });
        setTimeout(() => {
          uni.navigateTo({
            url: "/pages/auth/login",
          });
        }, 1500);
        return;
      }

      // 将选中商品信息存储到本地，以便在订单页面使用
      const orderItem = {
        id: this.product.id,
        name: this.product.name,
        image: this.product.images[0],
        price: this.product.price,
        specs: this.selectedSpec,
        quantity: this.quantity,
      };

      uni.setStorageSync("buyNowItem", JSON.stringify(orderItem));

      // 跳转到订单确认页面
      uni.navigateTo({
        url: "/pages/order/order?from=buyNow",
      });

      this.closeSpecPopup();
    },

    // 切换收藏状态
    async toggleFavorite() {
      try {
        const userStore = useUserStore();
        if (!userStore.isLoggedIn) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          setTimeout(() => {
            uni.navigateTo({
              url: "/pages/auth/login",
            });
          }, 1500);
          return;
        }

        // 调用API切换收藏状态
        const res = await api.toggleFavorite(this.productId);

        if (res.success) {
          this.isFavorite = res.data.isFavorite;
          uni.showToast({
            title: res.message,
            icon: "success",
          });

          // 触发收藏状态变化事件，通知其他页面更新
          uni.$emit("favoriteChanged", {
            productId: this.productId,
            isFavorite: res.data.isFavorite,
          });
        } else {
          uni.showToast({
            title: res.error || "操作失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("切换收藏状态失败:", error);
        uni.showToast({
          title: "网络错误，请重试",
          icon: "error",
        });
      }
    },

    // 导航到首页
    navToHome() {
      uni.switchTab({
        url: "/pages/index/index",
      });
    },

    // 导航到购物车
    navToCart() {
      uni.switchTab({
        url: "/pages/cart/cart",
      });
    },

    // 初始化购物车数量
    initCartCount() {
      const cartStore = useCartStore();
      this.cartCount = cartStore.cartCount;
    },

    // 更新购物车数量显示
    updateCartCount() {
      const cartStore = useCartStore();
      this.cartCount = cartStore.cartCount;
    },
  },
};
</script>

<style>
.container {
  padding-bottom: 100rpx;
  background-color: #f5f5f5;
}

/* 商品轮播图样式 */
.product-swiper {
  width: 100%;
  height: 750rpx;
}

.product-swiper image {
  width: 100%;
  height: 100%;
}

/* 商品信息样式 */
.product-info {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.price-box {
  margin-bottom: 20rpx;
}

.price {
  font-size: 40rpx;
  color: #d81e06;
  font-weight: bold;
  margin-right: 20rpx;
}

.original-price {
  font-size: 28rpx;
  color: #999;
  text-decoration: line-through;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.sub-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.sales-box {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

/* 优惠信息样式 */
.promotion-box {
  background-color: #fff;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.promotion-item {
  display: flex;
  margin-bottom: 20rpx;
}

.promotion-item:last-child {
  margin-bottom: 0;
}

.promotion-item .label {
  width: 80rpx;
  font-size: 24rpx;
  color: #999;
}

.promotion-item .content {
  flex: 1;
  font-size: 24rpx;
  color: #333;
}

/* 规格选择样式 */
.spec-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.spec-box .label {
  font-size: 28rpx;
  color: #999;
}

.spec-box .content {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.spec-box .content .icon-right {
  margin-left: 10rpx;
  color: #999;
}

/* 商品详情样式 */
.detail-box {
  background-color: #fff;
  padding: 30rpx;
}

.detail-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  text-align: center;
}

.detail-image {
  width: 100%;
  margin-bottom: 20rpx;
}

/* 底部操作栏样式 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.action-icon {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.action-icon .iconfont {
  font-size: 40rpx;
  color: #666;
}

.action-icon text:nth-child(2) {
  font-size: 20rpx;
  color: #666;
  margin-top: 5rpx;
}

.action-icon .icon-favorite-fill {
  color: #d81e06;
}

.action-icon .badge {
  position: absolute;
  top: -10rpx;
  right: 10rpx;
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

.action-button {
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  color: #fff;
  font-size: 28rpx;
  margin-right: 10rpx;
  border-radius: 40rpx;
}

.add-cart {
  background-color: #ff9500;
}

.buy-now {
  background-color: #d81e06;
}

/* 规格选择弹窗样式 */
.spec-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding-bottom: 40rpx;
}

.popup-header {
  display: flex;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
}

.popup-header image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 10rpx;
}

.popup-product-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.popup-price {
  font-size: 36rpx;
  color: #d81e06;
  font-weight: bold;
}

.popup-stock {
  font-size: 24rpx;
  color: #999;
}

.popup-selected {
  font-size: 24rpx;
  color: #333;
}

.close-icon {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 40rpx;
  color: #999;
}

.spec-container {
  padding: 30rpx;
}

.spec-group {
  margin-bottom: 30rpx;
}

.spec-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.spec-items {
  display: flex;
  flex-wrap: wrap;
}

.spec-item {
  padding: 10rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #333;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.spec-item.active {
  background-color: #fff0ee;
  color: #d81e06;
  border: 1rpx solid #d81e06;
}

.quantity-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-title {
  font-size: 28rpx;
  color: #333;
}

.quantity-selector {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  border: 1rpx solid #ddd;
  font-size: 28rpx;
}

.quantity-input {
  width: 80rpx;
  height: 60rpx;
  text-align: center;
  border-top: 1rpx solid #ddd;
  border-bottom: 1rpx solid #ddd;
  font-size: 28rpx;
}

.popup-buttons {
  display: flex;
  padding: 0 30rpx;
  margin-top: 30rpx;
}

.popup-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  margin: 0 10rpx;
}

.add-cart-btn {
  background-color: #ff9500;
}

.buy-now-btn {
  background-color: #d81e06;
}
</style>
