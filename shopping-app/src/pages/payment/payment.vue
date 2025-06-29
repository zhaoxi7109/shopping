<template>
  <view class="payment-container">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-left" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-right"></view>
    </view>

    <!-- 订单超时提示 -->
    <view class="expired-notice" v-if="isOrderExpired">
      <view class="notice-icon">
        <text class="iconfont icon-warning"></text>
      </view>
      <view class="notice-text">订单已超时，无法支付</view>
    </view>

    <!-- 订单信息 -->
    <view class="order-info">
      <view class="order-number">
        <text class="label">订单号：</text>
        <text class="value">{{ orderNo }}</text>
      </view>
      <view class="order-amount">
        <text class="label">支付金额：</text>
        <text class="amount">¥{{ amount }}</text>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-methods" :class="{ disabled: isOrderExpired }">
      <view class="section-title">选择支付方式</view>
      <view class="method-list">
        <view
          class="method-item"
          :class="{
            active: selectedMethod === method.value,
            disabled: isOrderExpired,
          }"
          v-for="method in paymentMethods"
          :key="method.value"
          @click="selectPaymentMethod(method.value)"
        >
          <view class="method-left">
            <image
              class="method-icon"
              :src="method.icon"
              mode="aspectFit"
            ></image>
            <text class="method-name">{{ method.name }}</text>
          </view>
          <view class="method-right">
            <text
              class="iconfont icon-check"
              v-if="selectedMethod === method.value"
            ></text>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付按钮 -->
    <view class="payment-footer">
      <view class="amount-info">
        <text class="total-label">实付金额：</text>
        <text class="total-amount">¥{{ amount }}</text>
      </view>
      <view class="pay-btn-container">
        <button
          class="pay-btn"
          @click="confirmPayment"
          :disabled="!selectedMethod || paying || isOrderExpired"
        >
          {{
            isOrderExpired ? "订单已超时" : paying ? "支付中..." : "确认支付"
          }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api.js";

export default {
  data() {
    return {
      orderNo: "",
      orderId: "",
      amount: "0.00",
      selectedMethod: "alipay",
      paying: false,
      paymentMethods: [
        {
          value: "alipay",
          name: "支付宝",
          icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwOUZFOCIvPgo8cGF0aCBkPSJNMjAgMTBDMTQuNDc3MiAxMCAxMCAxNC40NzcyIDEwIDIwQzEwIDI1LjUyMjggMTQuNDc3MiAzMCAyMCAzMEMyNS41MjI4IDMwIDMwIDI1LjUyMjggMzAgMjBDMzAgMTQuNDc3MiAyNS41MjI4IDEwIDIwIDEwWk0yMiAyNEgxOFYyMkgyMlYyNFpNMjIgMjBIMThWMThIMjJWMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
        },
        {
          value: "wechat",
          name: "微信支付",
          icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzA5QkI0QyIvPgo8cGF0aCBkPSJNMjAgMTBDMTQuNDc3MiAxMCAxMCAxNC40NzcyIDEwIDIwQzEwIDI1LjUyMjggMTQuNDc3MiAzMCAyMCAzMEMyNS41MjI4IDMwIDMwIDI1LjUyMjggMzAgMjBDMzAgMTQuNDc3MiAyNS41MjI4IDEwIDIwIDEwWk0xNiAxOEMxNi41NTIzIDE4IDE3IDE3LjU1MjMgMTcgMTdDMTcgMTYuNDQ3NyAxNi41NTIzIDE2IDE2IDE2QzE1LjQ0NzcgMTYgMTUgMTYuNDQ3NyAxNSAxN0MxNSAxNy41NTIzIDE1LjQ0NzcgMTggMTYgMThaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
        },
        {
          value: "balance",
          name: "余额支付",
          icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0ZGOTUwMCIvPgo8cGF0aCBkPSJNMjAgMTBDMTQuNDc3MiAxMCAxMCAxNC40NzcyIDEwIDIwQzEwIDI1LjUyMjggMTQuNDc3MiAzMCAyMCAzMEMyNS41MjI4IDMwIDMwIDI1LjUyMjggMzAgMjBDMzAgMTQuNDc3MiAyNS41MjI4IDEwIDIwIDEwWk0yMCAxNkMyMS4xMDQ2IDE2IDIyIDE2Ljg5NTQgMjIgMThDMjIgMTkuMTA0NiAyMS4xMDQ2IDIwIDIwIDIwQzE4Ljg5NTQgMjAgMTggMTkuMTA0NiAxOCAxOEMxOCAxNi44OTU0IDE4Ljg5NTQgMTYgMjAgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
        },
      ],
      orderDetail: null,
      isOrderExpired: false,
      paymentTimeout: 30 * 60, // 支付超时时间（秒），默认30分钟
    };
  },

  /**
   * 页面加载时获取订单信息
   */
  onLoad(options) {
    if (options.orderNo) {
      this.orderNo = options.orderNo;
    }
    if (options.orderId) {
      this.orderId = options.orderId;
      this.checkOrderStatus();
    }
    if (options.amount) {
      this.amount = this.formatAmount(options.amount);
    }
  },

  methods: {
    /**
     * 格式化金额，确保两位小数
     */
    formatAmount(amount) {
      if (!amount) return "0.00";
      return parseFloat(amount).toFixed(2);
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },

    /**
     * 选择支付方式
     */
    selectPaymentMethod(method) {
      if (this.isOrderExpired) {
        uni.showToast({
          title: "订单已超时，无法支付",
          icon: "none",
        });
        return;
      }
      this.selectedMethod = method;
    },

    /**
     * 检查订单状态
     */
    async checkOrderStatus() {
      try {
        uni.showLoading({
          title: "加载中...",
        });

        const res = await api.getOrderDetail(this.orderId);

        if (res.code === 200 && res.data) {
          this.orderDetail = res.data;

          // 检查订单是否已超时
          if (this.orderDetail.status !== "pending") {
            this.isOrderExpired = true;

            if (this.orderDetail.status === "cancelled") {
              uni.showModal({
                title: "订单已取消",
                content: "该订单已超时自动取消，无法继续支付",
                showCancel: false,
                success: () => {
                  uni.redirectTo({
                    url: "/pages/order/order-list?type=cancelled",
                  });
                },
              });
            } else {
              uni.showToast({
                title: `订单状态为${this.getStatusText(
                  this.orderDetail.status
                )}，无法支付`,
                icon: "none",
              });
            }
            return;
          }

          // 检查订单是否超时
          if (this.orderDetail.orderTime) {
            const orderTime = new Date(this.orderDetail.orderTime).getTime();
            const currentTime = new Date().getTime();
            const elapsedSeconds = Math.floor((currentTime - orderTime) / 1000);

            if (elapsedSeconds >= this.paymentTimeout) {
              this.isOrderExpired = true;

              // 自动取消订单
              await this.autoCancelExpiredOrder();
            }
          }
        } else {
          uni.showToast({
            title: "获取订单信息失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("检查订单状态失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        uni.hideLoading();
      }
    },

    /**
     * 自动取消超时订单
     */
    async autoCancelExpiredOrder() {
      try {
        const result = await api.cancelOrder(this.orderId);

        if (result.code === 200) {
          uni.showModal({
            title: "订单已超时",
            content: "该订单已超过支付时间，系统已自动取消",
            showCancel: false,
            success: () => {
              uni.redirectTo({
                url: "/pages/order/order-list?type=cancelled",
              });
            },
          });
        }
      } catch (error) {
        console.error("自动取消订单失败:", error);
        uni.showToast({
          title: "订单已超时，无法支付",
          icon: "none",
        });
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
     * 确认支付
     */
    async confirmPayment() {
      if (this.isOrderExpired) {
        uni.showToast({
          title: "订单已超时，无法支付",
          icon: "none",
        });
        return;
      }

      if (!this.selectedMethod) {
        uni.showToast({
          title: "请选择支付方式",
          icon: "none",
        });
        return;
      }

      if (!this.orderId) {
        uni.showToast({
          title: "订单ID不能为空",
          icon: "error",
        });
        return;
      }

      if (this.paying) {
        return;
      }

      this.paying = true;
      uni.showLoading({
        title: "支付中...",
      });

      try {
        // 再次检查订单状态，确保订单未超时
        await this.checkOrderStatus();

        if (this.isOrderExpired) {
          throw new Error("订单已超时，无法支付");
        }

        // 调用真实的支付API
        const res = await api.payOrder(this.orderId, this.selectedMethod);

        if (res.code === 200 || res.success) {
          uni.hideLoading();
          uni.showToast({
            title: "支付成功",
            icon: "success",
            duration: 2000,
          });

          // 延迟跳转到订单列表
          setTimeout(() => {
            uni.redirectTo({
              url: "/pages/order/order-list?type=paid",
            });
          }, 2000);
        } else {
          throw new Error(res.message || "支付失败");
        }
      } catch (error) {
        console.error("支付失败:", error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || "支付失败，请重试",
          icon: "error",
        });
      } finally {
        this.paying = false;
      }
    },
  },
};
</script>

<style scoped>
.payment-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.nav-left,
.nav-right {
  width: 60rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

/* 订单超时提示 */
.expired-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  background-color: #fff2f0;
  border-left: 8rpx solid #ff3b30;
  margin-bottom: 20rpx;
}

.notice-icon {
  margin-right: 10rpx;
  color: #ff3b30;
  font-size: 32rpx;
}

.notice-text {
  color: #ff3b30;
  font-size: 28rpx;
}

.order-info {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.order-number,
.order-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.order-number:last-child,
.order-amount:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 28rpx;
  color: #666;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.amount {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
}

.payment-methods {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.payment-methods.disabled {
  opacity: 0.6;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}

.method-list {
}

.method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.method-item:last-child {
  border-bottom: none;
}

.method-item.active {
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 30rpx 20rpx;
  margin: 10rpx 0;
}

.method-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.method-left {
  display: flex;
  align-items: center;
}

.method-icon {
  width: 50rpx;
  height: 50rpx;
  margin-right: 20rpx;
  border-radius: 8rpx;
}

.method-name {
  font-size: 30rpx;
  color: #333;
}

.method-right {
}

.icon-check {
  font-size: 40rpx;
  color: #d81e06;
}

.payment-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount-info {
  display: flex;
  align-items: center;
}

.total-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.total-amount {
  font-size: 36rpx;
  color: #d81e06;
  font-weight: bold;
}

.pay-btn-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.pay-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #d81e06 100%);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  padding: 18rpx 50rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(216, 30, 6, 0.3);
  transition: all 0.3s ease;
  height: 80rpx;
  line-height: 80rpx;
  min-width: 200rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-btn:disabled {
  background: #ccc;
  color: #999;
  box-shadow: none;
}
</style>
