<template>
  <view class="container">
    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="empty-cart">
      <image src="/static/images/empty-cart.png" mode="aspectFit"></image>
      <text>请先登录查看购物车</text>
      <button type="primary" class="go-shopping-btn" @click="goToLogin">
        去登录
      </button>
    </view>

    <!-- 已登录但购物车为空 -->
    <view v-else-if="cartList.length === 0" class="empty-cart">
      <image src="/static/images/empty-cart.png" mode="aspectFit"></image>
      <text>购物车还是空的</text>
      <button type="primary" class="go-shopping-btn" @click="goShopping">
        去逛逛
      </button>
    </view>

    <!-- 购物车列表 -->
    <view v-if="isLoggedIn && cartList.length > 0" class="cart-list">
      <view class="cart-item" v-for="(item, index) in cartList" :key="index">
        <view class="checkbox-wrapper" @click.stop="toggleSelect(index)">
          <checkbox :checked="item.selected" color="#d81e06" />
        </view>
        <view class="item-image" @click="goToDetail(item.productId)">
          <image :src="item.image" mode="aspectFill"></image>
        </view>
        <view class="item-info" @click="goToDetail(item.productId)">
          <view class="item-name">{{ item.name }}</view>
          <view class="item-spec">{{ item.spec }}</view>
          <view class="item-price-wrapper">
            <text class="item-price">¥{{ item.price }}</text>
            <view class="quantity-wrapper" @click.stop>
              <view class="quantity-btn" @click="decreaseQuantity(index)"
                >-</view
              >
              <input
                type="number"
                class="quantity-input"
                v-model="item.quantity"
              />
              <view class="quantity-btn" @click="increaseQuantity(index)"
                >+</view
              >
            </view>
          </view>
        </view>
        <view class="delete-btn" @click.stop="removeFromCart(index)">
          <UnifiedIcon type="icon-delete" :size="16" color="#999" />
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view v-if="isLoggedIn && cartList.length > 0" class="cart-footer">
      <view class="select-all">
        <checkbox
          :checked="isAllSelected"
          color="#d81e06"
          @click="toggleSelectAll"
        />
        <text @click="toggleSelectAll">全选({{ cartList.length }})</text>
      </view>
      <view class="total-info">
        <view>
          <text>合计：</text>
          <text class="total-price">¥{{ totalPrice }}</text>
        </view>
        <text class="total-desc">不含运费</text>
      </view>
      <view class="action-buttons">
        <view
          class="delete-selected-btn"
          @click="deleteSelected"
          v-if="selectedCount > 0"
        >
          删除({{ selectedCount }})
        </view>
        <view class="checkout-btn" @click="checkout">
          结算({{ selectedCount }})
        </view>
      </view>
    </view>

    <!-- 猜你喜欢 -->
    <view class="recommend-section">
      <view class="section-title">猜你喜欢</view>
      <view class="product-list">
        <view
          class="product-item"
          v-for="(item, index) in recommendList"
          :key="index"
          @click="goToDetail(item.id)"
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
import { api } from "@/utils/api";
import { useUserStore } from "@/store/user";
import { useCartStore } from "@/store/cart";
import { processImageUrls } from "@/utils/image.js";
import CustomTabBar from "@/components/CustomTabBar.vue";

export default {
  components: {
    CustomTabBar,
  },
  data() {
    return {
      cartList: [],
      recommendList: [],
      loading: false,
    };
  },
  onLoad() {
    this.initData();
  },
  onShow() {
    // 检查登录状态和token有效性
    const userStore = useUserStore();
    if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
      this.getCartList();
    }

    // 更新自定义tabbar状态
    this.updateTabBarStatus();
  },
  computed: {
    // 登录状态
    isLoggedIn() {
      const userStore = useUserStore();
      return userStore.isLoggedIn;
    },
    // 是否全选
    isAllSelected() {
      if (this.cartList.length === 0) return false;
      return this.cartList.every((item) => item.selected);
    },
    // 已选商品数量
    selectedCount() {
      return this.cartList.filter((item) => item.selected).length;
    },
    // 总价
    totalPrice() {
      let total = 0;
      this.cartList.forEach((item) => {
        if (item.selected) {
          total += item.price * item.quantity;
        }
      });
      return total.toFixed(2);
    },
  },
  methods: {
    // 更新tabbar状态
    updateTabBarStatus() {
      // 通过事件触发自定义tabbar更新
      uni.$emit("updateTabBar", 2); // 2是购物车的索引
      uni.$emit("onShowPage", "pages/cart/cart");
    },

    // 初始化数据
    async initData() {
      // 检查登录状态和token有效性
      const userStore = useUserStore();
      if (!userStore.isLoggedIn || !userStore.checkTokenExpiration()) {
        // 未登录或token过期时只获取推荐商品
        await this.getRecommendList();
        return;
      }

      await this.getCartList();
      await this.getRecommendList();
    },
    // 获取购物车列表
    async getCartList() {
      try {
        this.loading = true;
        const res = await api.getCart();
        if (res.success) {
          // 处理购物车商品图片URL
          this.cartList = processImageUrls(res.data.items || [], "image");
          console.log("获取购物车成功:", res.data);
          console.log("购物车商品数量:", this.cartList.length);
          console.log("全选状态:", this.isAllSelected);
        } else {
          console.error("获取购物车失败:", res);
        }
      } catch (error) {
        console.error("获取购物车失败:", error);
      } finally {
        this.loading = false;
      }
    },
    // 获取推荐商品
    async getRecommendList() {
      try {
        const res = await api.getRecommendProducts({ limit: 4 });
        if (res.success) {
          // 处理推荐商品图片URL
          this.recommendList = processImageUrls(res.data || [], "image");
          console.log("获取推荐商品成功:", res.data);
        } else {
          console.error("获取推荐商品失败:", res);
        }
      } catch (error) {
        console.error("获取推荐商品失败:", error);
      }
    },
    // 去购物
    goShopping() {
      uni.switchTab({
        url: "/pages/index/index",
      });
    },
    // 去登录
    goToLogin() {
      uni.navigateTo({
        url: "/pages/user/login",
      });
    },
    /**
     * 切换单个商品选中状态
     * 点击单个商品的选择框时，更新该商品的选中状态
     * @param {number} index 商品在列表中的索引
     */
    async toggleSelect(index) {
      const item = this.cartList[index];
      const originalSelected = item.selected;
      const newSelected = !item.selected;
      const cartStore = useCartStore();

      try {
        // 先更新本地状态，提供即时反馈
        this.cartList[index].selected = newSelected;

        // 调用store方法同步到服务器
        await cartStore.updateSelected(item.id, newSelected);
      } catch (error) {
        console.error("更新选中状态失败:", error);
        // 如果操作失败，恢复原状态
        this.cartList[index].selected = originalSelected;
        uni.showToast({
          title: "操作失败，请重试",
          icon: "none",
        });
      }
    },

    /**
     * 切换全选状态
     * 点击全选按钮时，同步更新所有商品的选中状态
     */
    async toggleSelectAll() {
      const newSelectAll = !this.isAllSelected;
      const cartStore = useCartStore();

      // 保存原始状态，用于失败时恢复
      const originalStates = this.cartList.map((item) => ({
        id: item.id,
        selected: item.selected,
      }));

      try {
        // 先更新本地状态，提供即时反馈
        this.cartList.forEach((item) => {
          item.selected = newSelectAll;
        });

        // 调用store方法同步到服务器
        await cartStore.selectAll(newSelectAll);

        uni.showToast({
          title: newSelectAll ? "已全选" : "已取消全选",
          icon: "success",
        });
      } catch (error) {
        console.error("切换全选状态失败:", error);
        // 如果操作失败，恢复原状态
        originalStates.forEach((originalState) => {
          const item = this.cartList.find(
            (item) => item.id === originalState.id
          );
          if (item) {
            item.selected = originalState.selected;
          }
        });
        uni.showToast({
          title: "操作失败，请重试",
          icon: "none",
        });
      }
    },
    // 增加商品数量
    async increaseQuantity(index) {
      const item = this.cartList[index];
      const newQuantity = item.quantity + 1;
      const cartStore = useCartStore();

      try {
        await cartStore.updateQuantity(item.id, newQuantity);
        this.cartList[index].quantity = newQuantity;
      } catch (error) {
        console.error("更新商品数量失败:", error);
        uni.showToast({
          title: "更新失败，请重试",
          icon: "none",
        });
      }
    },

    // 减少商品数量
    async decreaseQuantity(index) {
      const item = this.cartList[index];
      const cartStore = useCartStore();

      if (item.quantity > 1) {
        const newQuantity = item.quantity - 1;

        try {
          await cartStore.updateQuantity(item.id, newQuantity);
          this.cartList[index].quantity = newQuantity;
        } catch (error) {
          console.error("更新商品数量失败:", error);
          uni.showToast({
            title: "更新失败，请重试",
            icon: "none",
          });
        }
      } else {
        // 如果数量为1，再减少就删除商品
        uni.showModal({
          title: "提示",
          content: "确定要删除该商品吗？",
          success: (res) => {
            if (res.confirm) {
              this.removeFromCart(index);
            }
          },
        });
      }
    },
    // 从购物车移除
    async removeFromCart(index) {
      const item = this.cartList[index];
      const cartStore = useCartStore();

      uni.showModal({
        title: "提示",
        content: "确定要删除该商品吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await cartStore.removeFromCart(item.id);
              this.cartList.splice(index, 1);

              uni.showToast({
                title: "删除成功",
                icon: "success",
              });

              console.log("删除商品成功");
            } catch (error) {
              console.error("删除商品失败:", error);
              uni.showToast({
                title: "删除失败，请重试",
                icon: "none",
              });
            }
          }
        },
      });
    },
    /**
     * 批量删除选中的商品
     */
    async deleteSelected() {
      if (this.selectedCount === 0) {
        uni.showToast({
          title: "请选择要删除的商品",
          icon: "none",
        });
        return;
      }

      uni.showModal({
        title: "提示",
        content: `确定要删除选中的${this.selectedCount}件商品吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const cartStore = useCartStore();

              // 调用API删除选中的商品
              await api.removeSelectedCartItems();

              // 重新获取购物车列表
              await this.getCartList();

              uni.showToast({
                title: "删除成功",
                icon: "success",
              });
            } catch (error) {
              console.error("批量删除失败:", error);
              uni.showToast({
                title: "删除失败，请重试",
                icon: "none",
              });
            }
          }
        },
      });
    },

    /**
     * 结算选中的商品
     */
    checkout() {
      if (this.selectedCount === 0) {
        uni.showToast({
          title: "请选择要结算的商品",
          icon: "none",
        });
        return;
      }

      // 获取选中的商品
      const selectedItems = this.cartList.filter((item) => item.selected);

      // 将选中商品信息存储到本地，以便在订单页面使用
      uni.setStorageSync("checkoutItems", JSON.stringify(selectedItems));

      // 跳转到订单确认页面
      uni.navigateTo({
        url: "/pages/order/order",
      });
    },
    // 跳转到商品详情
    goToDetail(id) {
      if (!id) {
        uni.showToast({
          title: "商品信息不完整",
          icon: "none",
        });
        return;
      }
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
  min-height: 100vh;
}

/* H5环境下的容器样式 */
/* #ifdef H5 */
.container {
  padding-bottom: 200rpx; /* H5环境下为底部结算栏和tabbar留出空间，减小间距 */
}
/* #endif */

/* 非H5环境下的容器样式 */
/* #ifndef H5 */
.container {
  padding-bottom: 100rpx; /* 非H5环境下只为底部结算栏留出空间，减小间距 */
}
/* #endif */

/* 空购物车样式 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-cart image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-cart text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  background-color: #d81e06;
}

/* 购物车列表样式 */
.cart-list {
  background-color: #fff;
  margin-bottom: 20rpx;
}

.cart-item {
  display: flex;
  padding: 30rpx 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
  padding: 10rpx;
  cursor: pointer;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  margin-right: 20rpx;
}

.item-image image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-name {
  font-size: 28rpx;
  color: #333;
  line-height: 40rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-spec {
  font-size: 24rpx;
  color: #999;
  margin: 10rpx 0;
}

.item-price-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
}

.quantity-wrapper {
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

.delete-btn {
  position: absolute;
  right: 20rpx;
  top: 20rpx;
  font-size: 40rpx;
  color: #999;
}

/* 底部结算栏样式 */
.cart-footer {
  position: fixed;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12rpx 16rpx; /* 减小内边距 */
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.15);
  min-height: 80rpx; /* 减小最小高度 */
  transition: all 0.3s ease;
}

/* H5环境下的底部结算栏样式 */
/* #ifdef H5 */
.cart-footer {
  bottom: 100rpx; /* H5环境下为tabbar留出空间 */
  z-index: 999; /* 低于tabbar的z-index */
}
/* #endif */

/* 非H5环境下的底部结算栏样式 */
/* #ifndef H5 */
.cart-footer {
  bottom: 0; /* 非H5环境下直接贴底 */
  z-index: 1000;
}
/* #endif */

.select-all {
  display: flex;
  align-items: center;
  gap: 6rpx; /* 减小间距 */
  padding: 6rpx 8rpx; /* 减小内边距 */
  cursor: pointer;
  border-radius: 6rpx;
  transition: background-color 0.2s;
}

.select-all:active {
  background-color: #f5f5f5;
}

.select-all text {
  font-size: 24rpx; /* 减小字号 */
  margin-left: 6rpx; /* 减小间距 */
  color: #333;
}

/* checkbox样式优化 */
.checkbox-wrapper checkbox,
.select-all checkbox {
  transform: scale(1); /* 减小缩放比例 */
  margin-right: 6rpx; /* 减小右边距 */
}

.total-info {
  flex: 1;
  text-align: center;
  padding: 0 8rpx; /* 添加左右内边距 */
}

.total-price {
  color: #d81e06;
  font-size: 30rpx; /* 减小字号 */
  font-weight: bold;
}

.total-desc {
  font-size: 20rpx; /* 减小字号 */
  color: #999;
  margin-top: 2rpx; /* 添加上边距 */
}

.action-buttons {
  display: flex;
  gap: 12rpx; /* 减小按钮间距 */
  align-items: center;
}

.delete-selected-btn {
  background: #ff6b6b;
  color: #fff;
  padding: 12rpx 20rpx; /* 减小内边距 */
  border-radius: 40rpx; /* 减小圆角 */
  font-size: 22rpx; /* 减小字号 */
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap; /* 防止文字换行 */
}

.delete-selected-btn:active {
  background: #ff5252;
  transform: scale(0.95);
}

.checkout-btn {
  background: #d81e06;
  color: #fff;
  padding: 12rpx 24rpx; /* 减小内边距 */
  border-radius: 40rpx; /* 减小圆角 */
  font-size: 24rpx; /* 减小字号 */
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap; /* 防止文字换行 */
}

.checkout-btn:active {
  background: #c41e3a;
  transform: scale(0.95);
}

/* 推荐商品样式 */
.recommend-section {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #fff;
}

.section-title {
  font-size: 32rpx;
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
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.product-item image {
  width: 100%;
  height: 240rpx;
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
