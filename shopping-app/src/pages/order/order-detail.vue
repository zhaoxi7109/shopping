<template>
  <view class="container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>

    <!-- 订单详情内容 -->
    <view v-else-if="orderDetail" class="order-detail">
      <!-- 订单状态 -->
      <view class="status-section">
        <view class="status-icon">
          <uni-icons
            :type="getStatusIcon(orderDetail.status)"
            :color="getStatusColor(orderDetail.status)"
            size="40"
          />
        </view>
        <view class="status-info">
          <text class="status-text">{{
            getStatusText(orderDetail.status)
          }}</text>
          <text class="status-desc">{{
            getStatusDesc(orderDetail.status)
          }}</text>
          <!-- 支付倒计时 -->
          <view
            v-if="orderDetail.status === 'pending'"
            class="countdown-wrapper"
          >
            <text class="countdown-label">支付倒计时：</text>
            <text
              class="countdown-time"
              :class="{ 'countdown-warning': remainingTime <= 300 }"
              >{{ formatCountdown }}</text
            >
          </view>
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="address-section">
        <view class="section-header">
          <uni-icons type="location" color="#666" size="16" />
          <text class="section-title">收货地址</text>
        </view>
        <view class="address-content">
          <view class="address-info">
            <text class="name">{{ orderDetail.shippingAddress.name }}</text>
            <text class="phone">{{ orderDetail.shippingAddress.phone }}</text>
          </view>
          <text class="address-detail">{{
            getFullAddress(orderDetail.shippingAddress)
          }}</text>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="products-section">
        <view class="section-header">
          <uni-icons type="shop" color="#666" size="16" />
          <text class="section-title">商品信息</text>
        </view>
        <view class="products-list">
          <view
            v-for="item in orderDetail.items"
            :key="item.productId"
            class="product-item"
            @click="goToProductDetail(item.productId)"
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
              <view class="product-price-qty">
                <text class="price">¥{{ item.price }}</text>
                <text class="quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info-section">
        <view class="section-header">
          <uni-icons type="list" color="#666" size="16" />
          <text class="section-title">订单信息</text>
        </view>
        <view class="order-info-list">
          <view class="info-item">
            <text class="label">订单编号</text>
            <text class="value">{{ orderDetail.orderNumber }}</text>
          </view>
          <view class="info-item">
            <text class="label">下单时间</text>
            <text class="value">{{
              formatTime(orderDetail.orderTime || orderDetail.createdAt)
            }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.paymentTime">
            <text class="label">支付时间</text>
            <text class="value">{{ formatTime(orderDetail.paymentTime) }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.deliveryTime">
            <text class="label">收货时间</text>
            <text class="value">{{
              formatTime(orderDetail.deliveryTime)
            }}</text>
          </view>
          <view class="info-item">
            <text class="label">支付方式</text>
            <text class="value">{{
              getPaymentMethodText(orderDetail.paymentMethod)
            }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.remark">
            <text class="label">订单备注</text>
            <text class="value">{{ orderDetail.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="cost-section">
        <view class="section-header">
          <uni-icons type="wallet" color="#666" size="16" />
          <text class="section-title">费用明细</text>
        </view>
        <view class="cost-list">
          <view class="cost-item">
            <text class="label">商品总价</text>
            <text class="value">¥{{ orderDetail.totalAmount }}</text>
          </view>
          <view class="cost-item">
            <text class="label">运费</text>
            <text class="value">¥{{ orderDetail.shippingFee || "0.00" }}</text>
          </view>
          <view class="cost-item total">
            <text class="label">实付金额</text>
            <text class="value">¥{{ orderDetail.finalAmount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-state">
      <uni-icons type="info" color="#999" size="60" />
      <text class="error-text">订单不存在或已被删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="orderDetail" class="bottom-actions">
      <block v-if="orderDetail.status === 'pending'">
        <button class="btn btn-cancel" @click="cancelOrder">取消订单</button>
        <button class="btn btn-primary" @click="payOrder">立即支付</button>
      </block>
      <block v-else-if="orderDetail.status === 'paid'">
        <button class="btn btn-secondary" @click="remindShipping">
          提醒发货
        </button>
      </block>
      <block v-else-if="orderDetail.status === 'shipped'">
        <button class="btn btn-secondary" @click="viewLogistics">
          查看物流
        </button>
        <button class="btn btn-primary" @click="confirmReceive">
          确认收货
        </button>
      </block>
      <block v-else-if="orderDetail.status === 'delivered'">
        <button class="btn btn-secondary" @click="viewLogistics">
          查看物流
        </button>
        <button class="btn btn-primary" @click="goToReview">评价商品</button>
      </block>
      <block v-else-if="orderDetail.status === 'completed'">
        <button class="btn btn-secondary" @click="viewLogistics">
          查看物流
        </button>
        <button class="btn btn-secondary" @click="viewReview">查看评价</button>
        <button class="btn btn-primary" @click="buyAgain">再次购买</button>
      </block>
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
      orderDetail: null,
      loading: true,
      // 倒计时相关
      remainingTime: 0, // 剩余时间（秒）
      countdownTimer: null, // 倒计时定时器
      paymentTimeout: 30 * 60, // 支付超时时间（秒），默认30分钟
    };
  },

  computed: {
    /**
     * 格式化倒计时显示
     */
    formatCountdown() {
      if (this.remainingTime <= 0) {
        return "00:00:00";
      }

      const hours = Math.floor(this.remainingTime / 3600);
      const minutes = Math.floor((this.remainingTime % 3600) / 60);
      const seconds = this.remainingTime % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    },
  },

  /**
   * 页面加载时获取订单详情
   */
  onLoad(options) {
    if (options.id) {
      this.orderId = options.id;
      this.loadOrderDetail();
    } else {
      this.loading = false;
      uni.showToast({
        title: "订单ID不能为空",
        icon: "error",
      });
    }
  },

  /**
   * 页面显示时启动倒计时（如果是待支付订单）
   */
  onShow() {
    if (this.orderDetail && this.orderDetail.status === "pending") {
      this.startCountdown();
    }
  },

  /**
   * 页面隐藏时停止倒计时
   */
  onHide() {
    this.stopCountdown();
  },

  /**
   * 页面卸载时停止倒计时
   */
  onUnload() {
    this.stopCountdown();
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
          this.orderDetail = res.data;

          // 如果是待支付订单，计算剩余支付时间
          if (this.orderDetail.status === "pending") {
            this.calculateRemainingTime();
            this.startCountdown();
          }
        } else {
          uni.showToast({
            title: res.message || "获取订单详情失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("获取订单详情失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 计算剩余支付时间
     */
    calculateRemainingTime() {
      if (!this.orderDetail || !this.orderDetail.orderTime) {
        this.remainingTime = 0;
        return;
      }

      const orderTime = new Date(this.orderDetail.orderTime).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - orderTime) / 1000);

      // 计算剩余时间（支付超时时间 - 已经过去的时间）
      this.remainingTime = Math.max(0, this.paymentTimeout - elapsedSeconds);

      // 如果已超时但订单仍为待支付状态，自动取消
      if (this.remainingTime <= 0 && this.orderDetail.status === "pending") {
        this.autoCancel();
      }
    },

    /**
     * 获取订单状态文本
     */
    getStatusText(status) {
      const statusMap = {
        pending: "待付款",
        paid: "待发货",
        shipped: "待收货",
        delivered: "待评价",
        completed: "已完成",
        cancelled: "已取消",
        refunding: "退款中",
        refunded: "已退款",
      };
      return statusMap[status] || "未知状态";
    },

    /**
     * 获取订单状态描述
     */
    getStatusDesc(status) {
      const descMap = {
        pending: "请尽快完成支付",
        paid: "商家正在准备发货",
        shipped: "商品正在配送中",
        delivered: "商品已送达，请确认收货",
        completed: "订单已完成",
        cancelled: "订单已取消",
        refunding: "退款申请处理中",
        refunded: "退款已完成",
      };
      return descMap[status] || "";
    },

    /**
     * 获取订单状态图标
     */
    getStatusIcon(status) {
      const iconMap = {
        pending: "wallet",
        paid: "shop",
        shipped: "car",
        delivered: "checkmarkempty",
        completed: "checkmarkempty",
        cancelled: "closeempty",
        refunding: "undo",
        refunded: "undo",
      };
      return iconMap[status] || "help";
    },

    /**
     * 获取订单状态颜色
     */
    getStatusColor(status) {
      const colorMap = {
        pending: "#ff9500",
        paid: "#007aff",
        shipped: "#007aff",
        delivered: "#4cd964",
        completed: "#4cd964",
        cancelled: "#8e8e93",
        refunding: "#ff3b30",
        refunded: "#ff3b30",
      };
      return colorMap[status] || "#8e8e93";
    },

    /**
     * 获取完整地址
     */
    getFullAddress(address) {
      if (!address) return "";
      return `${address.province || ""}${address.city || ""}${
        address.district || ""
      }${address.detail || ""}`;
    },

    /**
     * 获取商品图片
     */
    getProductImage(item) {
      if (item.productImage) {
        return getImageUrl(item.productImage);
      }
      return "/static/images/placeholder.png";
    },

    /**
     * 处理图片加载错误
     */
    handleImageError(e) {
      e.target.src = "/static/images/placeholder.png";
    },

    /**
     * 获取支付方式文本
     */
    getPaymentMethodText(method) {
      const methodMap = {
        alipay: "支付宝",
        wechat: "微信支付",
        cod: "货到付款",
      };
      return methodMap[method] || "未知支付方式";
    },

    /**
     * 格式化时间
     */
    formatTime(timeStr) {
      if (!timeStr) return "";
      const date = new Date(timeStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")} ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    },

    /**
     * 跳转到商品详情
     */
    goToProductDetail(productId) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${productId}`,
      });
    },

    /**
     * 取消订单
     */
    async cancelOrder() {
      uni.showModal({
        title: "提示",
        content: "确定要取消这个订单吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.cancelOrder(this.orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "订单已取消",
                  icon: "success",
                });
                this.loadOrderDetail();
              } else {
                uni.showToast({
                  title: result.message || "取消订单失败",
                  icon: "error",
                });
              }
            } catch (error) {
              console.error("取消订单失败:", error);
              uni.showToast({
                title: "网络错误",
                icon: "error",
              });
            }
          }
        },
      });
    },

    /**
     * 查看物流
     */
    viewLogistics() {
      uni.navigateTo({
        url: `/pages/order/logistics?orderId=${this.orderId}`,
      });
    },

    /**
     * 查看评价
     */
    viewReview() {
      uni.navigateTo({
        url: `/pages/order/review?orderId=${this.orderId}`,
      });
    },

    /**
     * 提醒发货
     */
    remindShipping() {
      uni.showToast({
        title: "已提醒商家发货",
        icon: "success",
      });
    },

    /**
     * 立即支付
     */
    payOrder() {
      if (this.remainingTime <= 0) {
        uni.showToast({
          title: "订单已超时，无法支付",
          icon: "none",
        });
        return;
      }

      uni.navigateTo({
        url: `/pages/payment/payment?orderId=${this.orderId}&orderNo=${this.orderDetail.orderNumber}&amount=${this.orderDetail.finalAmount}`,
      });
    },

    /**
     * 确认收货
     */
    async confirmReceive() {
      uni.showModal({
        title: "提示",
        content: "确认已收到商品吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.confirmOrder(this.orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "确认收货成功",
                  icon: "success",
                });
                this.loadOrderDetail();
              } else {
                uni.showToast({
                  title: result.message || "确认收货失败",
                  icon: "error",
                });
              }
            } catch (error) {
              console.error("确认收货失败:", error);
              uni.showToast({
                title: "网络错误",
                icon: "error",
              });
            }
          }
        },
      });
    },

    /**
     * 再次购买
     */
    buyAgain() {
      // 将商品添加到购物车
      uni.showToast({
        title: "已添加到购物车",
        icon: "success",
      });
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },

    /**
     * 启动倒计时
     */
    startCountdown() {
      // 清除可能存在的旧定时器
      this.stopCountdown();

      // 如果已经超时，直接取消订单
      if (this.remainingTime <= 0) {
        this.autoCancel();
        return;
      }

      this.countdownTimer = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          this.stopCountdown();
          this.autoCancel();
        }
      }, 1000);
    },

    /**
     * 停止倒计时
     */
    stopCountdown() {
      clearInterval(this.countdownTimer);
    },

    /**
     * 自动取消订单
     */
    async autoCancel() {
      try {
        // 先停止倒计时
        this.stopCountdown();

        // 如果订单已不是待支付状态，不执行取消操作
        if (!this.orderDetail || this.orderDetail.status !== "pending") {
          return;
        }

        const result = await api.cancelOrder(this.orderId);

        if (result.code === 200) {
          uni.showToast({
            title: "订单已超时自动取消",
            icon: "none",
            duration: 2000,
          });

          // 重新加载订单详情
          this.loadOrderDetail();
        }
      } catch (error) {
        console.error("自动取消订单失败:", error);
      }
    },

    /**
     * 跳转到评价页面
     */
    goToReview() {
      uni.navigateTo({
        url: `/pages/order/review?orderId=${this.orderId}`,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;

  .error-text {
    margin: 40rpx 0;
    font-size: 28rpx;
    color: #999;
  }

  .back-btn {
    background-color: #007aff;
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
  }
}

.status-section {
  background-color: white;
  padding: 40rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;

  .status-icon {
    margin-right: 30rpx;
  }

  .status-info {
    flex: 1;

    .status-text {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }

    .status-desc {
      font-size: 26rpx;
      color: #666;
    }

    .countdown-wrapper {
      margin-top: 10rpx;
      display: flex;
      align-items: center;

      .countdown-label {
        font-size: 26rpx;
        color: #666;
      }

      .countdown-time {
        font-size: 26rpx;
        color: #333;
        margin-left: 10rpx;

        &.countdown-warning {
          color: #ff3b30;
        }
      }
    }
  }
}

.address-section,
.products-section,
.order-info-section,
.cost-section {
  background-color: white;
  margin-bottom: 20rpx;

  .section-header {
    display: flex;
    align-items: center;
    padding: 30rpx 40rpx 20rpx;
    border-bottom: 1px solid #f0f0f0;

    .section-title {
      margin-left: 15rpx;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.address-content {
  padding: 30rpx 40rpx;

  .address-info {
    display: flex;
    align-items: center;
    margin-bottom: 15rpx;

    .name {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-right: 30rpx;
    }

    .phone {
      font-size: 28rpx;
      color: #666;
    }
  }

  .address-detail {
    font-size: 28rpx;
    color: #666;
    line-height: 1.5;
  }
}

.products-list {
  .product-item {
    display: flex;
    padding: 30rpx 40rpx;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .product-image {
      width: 120rpx;
      height: 120rpx;
      margin-right: 30rpx;
      border-radius: 8rpx;
      overflow: hidden;

      image {
        width: 100%;
        height: 100%;
      }
    }

    .product-info {
      flex: 1;

      .product-name {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
        line-height: 1.4;
      }

      .product-spec {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-bottom: 15rpx;
      }

      .product-price-qty {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price {
          font-size: 28rpx;
          color: #ff3b30;
          font-weight: bold;
        }

        .quantity {
          font-size: 26rpx;
          color: #666;
        }
      }
    }
  }
}

.order-info-list,
.cost-list {
  .info-item,
  .cost-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 40rpx;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 28rpx;
      color: #666;
    }

    .value {
      font-size: 28rpx;
      color: #333;
    }

    &.total {
      .label,
      .value {
        font-weight: bold;
        color: #ff3b30;
      }
    }
  }
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20rpx 40rpx;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 20rpx;
  z-index: 100;

  .btn {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &.btn-cancel {
      background-color: #f0f0f0;
      color: #666;
    }

    &.btn-primary {
      background-color: #ff3b30;
      color: white;
    }

    &.btn-secondary {
      background-color: #007aff;
      color: white;
    }
  }
}
</style>
