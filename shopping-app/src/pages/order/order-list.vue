<template>
  <view class="container">
    <!-- 标签栏 -->
    <view class="tab-bar">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentTab === index }"
        @click="switchTab(index)"
      >
        <text>{{ tab.name }}</text>
        <view v-if="tab.count > 0" class="tab-badge">
          {{ tab.count > 99 ? "99+" : tab.count }}
        </view>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 空状态 -->
      <view v-if="orderList.length === 0 && !loading" class="empty-state">
        <image
          class="empty-image"
          src="/static/images/empty-order.png"
          mode="aspectFit"
        />
        <text class="empty-text">暂无订单</text>
        <text class="empty-desc">快去挑选心仪的商品吧</text>
        <button class="go-shopping-btn" @click="goShopping">去购物</button>
      </view>

      <!-- 订单项目 -->
      <view v-else class="order-items">
        <view
          v-for="order in orderList"
          :key="order.id"
          class="order-item"
          @click="goToOrderDetail(order.id)"
        >
          <!-- 订单头部 - 紧凑设计 -->
          <view class="order-header">
            <view class="order-info">
              <text class="order-number">{{ order.orderNumber }}</text>
              <text class="order-time">{{
                formatTime(order.orderTime || order.createdAt)
              }}</text>
            </view>
            <view class="order-status">
              <text
                :class="{
                  'status-pending': order.status === 'pending',
                  'status-paid': order.status === 'paid',
                  'status-shipped': order.status === 'shipped',
                  'status-delivered': order.status === 'delivered',
                  'status-completed': order.status === 'completed',
                  'status-cancelled': order.status === 'cancelled',
                  'status-refunding': order.status === 'refunding',
                  'status-refunded': order.status === 'refunded',
                }"
              >
                {{ getStatusText(order.status) }}
              </text>
              <!-- 支付倒计时 -->
              <text v-if="order.status === 'pending'" class="countdown">
                {{ getCountdown(order) }}
              </text>
            </view>
          </view>

          <!-- 商品信息和操作按钮 - 参考收藏页面布局 -->
          <view class="product-section">
            <!-- 商品图片 -->
            <view class="product-image">
              <image
                :src="getProductImage(order.items[0])"
                mode="aspectFill"
                @error="(e) => handleImageError(e, order.items[0])"
                @load="(e) => handleImageLoad(e, order.items[0])"
                :lazy-load="true"
              />
            </view>

            <!-- 商品信息 -->
            <view class="product-info">
              <view class="product-title">{{
                order.items[0].productName
              }}</view>
              <view class="product-desc" v-if="order.items.length > 1">
                等{{ order.items.length }}件商品
              </view>
              <view class="product-price">
                <text class="current-price">¥{{ order.finalAmount }}</text>
              </view>
              <view class="product-meta">
                <view class="meta-left">
                  <text class="item-count"
                    >共{{ getTotalQuantity(order.items) }}件</text
                  >
                </view>
                <view class="meta-right">
                  <view class="product-tags">
                    <text v-if="order.items.length > 1" class="tag multi"
                      >{{ order.items.length }}件</text
                    >
                  </view>
                </view>
              </view>
            </view>

            <!-- 操作按钮 - 右侧垂直布局 -->
            <view class="product-actions">
              <!-- 取消订单 -->
              <view
                v-if="order.status === 'pending'"
                class="action-btn cancel-btn"
                @click.stop="cancelOrder(order.id)"
              >
                <text>取消</text>
              </view>

              <!-- 立即支付 -->
              <view
                v-if="order.status === 'pending'"
                class="action-btn pay-btn"
                @click.stop="goToPayment(order)"
              >
                <text>支付</text>
              </view>

              <!-- 提醒发货 -->
              <view
                v-if="order.status === 'paid'"
                class="action-btn remind-btn"
                @click.stop="remindShip(order.id)"
              >
                <text>提醒</text>
              </view>

              <!-- 确认收货 -->
              <view
                v-if="order.status === 'shipped'"
                class="action-btn confirm-btn"
                @click.stop="confirmReceive(order.id)"
              >
                <text>收货</text>
              </view>

              <!-- 评价 -->
              <view
                v-if="order.status === 'delivered'"
                class="action-btn review-btn"
                @click.stop="goToReview(order.id)"
              >
                <text>评价</text>
              </view>

              <!-- 再次购买 -->
              <view
                v-if="
                  ['delivered', 'completed', 'cancelled'].includes(order.status)
                "
                class="action-btn buy-again-btn"
                @click.stop="buyAgain(order.id)"
              >
                <text>再购</text>
              </view>

              <!-- 申请售后 -->
              <view
                v-if="['paid', 'shipped', 'delivered'].includes(order.status)"
                class="action-btn after-sale-btn"
                @click.stop="applyAfterSale(order.id)"
              >
                <text>售后</text>
              </view>

              <!-- 删除订单 -->
              <view
                v-if="['cancelled', 'completed'].includes(order.status)"
                class="action-btn delete-btn"
                @click.stop="deleteOrder(order.id)"
              >
                <text>删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <text>{{ loading ? "加载中..." : "上拉加载更多" }}</text>
      </view>

      <view v-else-if="orderList.length > 0" class="no-more">
        <text>没有更多订单了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from "@/utils/api";
import { getImageUrl } from "@/utils/image.js";

export default {
  data() {
    return {
      currentTab: 0,
      tabs: [
        { name: "全部", type: "all", count: 0 },
        { name: "待付款", type: "pending", count: 0 },
        { name: "待发货", type: "paid", count: 0 },
        { name: "待收货", type: "shipped", count: 0 },
        { name: "待评价", type: "delivered", count: 0 },
      ],
      orderList: [],
      loading: false,
      refreshing: false,
      hasMore: true,
      page: 1,
      pageSize: 10,
      // 倒计时相关
      paymentTimeout: 30 * 60, // 支付超时时间（秒），默认30分钟
      countdownTimer: null, // 倒计时定时器
    };
  },

  onLoad(options) {
    // 根据传入的type参数设置当前标签
    if (options.type) {
      const type = options.type;
      let tabIndex = -1;

      // 查找对应的标签索引
      if (type === "all" || type === "0") {
        tabIndex = 0;
      } else if (type === "pending" || type === "1") {
        tabIndex = 1;
      } else if (type === "paid" || type === "2") {
        tabIndex = 2;
      } else if (type === "shipped" || type === "3") {
        tabIndex = 3;
      } else if (type === "delivered" || type === "4") {
        tabIndex = 4;
      }

      if (tabIndex > -1) {
        this.currentTab = tabIndex;
      }
    }

    this.loadOrderList();
    this.loadOrderCounts();
  },

  onShow() {
    // 页面显示时刷新订单列表
    this.refreshOrderList();
    // 启动倒计时更新
    this.startCountdownTimer();
  },

  onHide() {
    // 停止倒计时更新
    this.stopCountdownTimer();
  },

  onUnload() {
    // 停止倒计时更新
    this.stopCountdownTimer();
  },

  methods: {
    /**
     * 切换标签
     */
    switchTab(index) {
      if (this.currentTab === index) return;

      this.currentTab = index;
      this.refreshOrderList();
    },

    /**
     * 刷新订单列表
     */
    refreshOrderList() {
      this.page = 1;
      this.hasMore = true;
      this.orderList = [];
      this.loadOrderList();
    },

    /**
     * 加载订单列表
     */
    async loadOrderList() {
      if (this.loading || !this.hasMore) return;

      try {
        this.loading = true;
        const currentTabType = this.tabs[this.currentTab].type;

        // 将标签类型转换为后端需要的参数格式
        let typeParam = "";
        if (currentTabType === "all")
          typeParam = ""; // 全部订单不需要传type参数
        else if (currentTabType === "pending") typeParam = "1";
        else if (currentTabType === "paid") typeParam = "2";
        else if (currentTabType === "shipped") typeParam = "3";
        else if (currentTabType === "delivered") typeParam = "4";

        const res = await api.getOrderList({
          type: typeParam,
          page: this.page,
          pageSize: this.pageSize,
        });

        if (res.code === 200) {
          let newOrders = res.data.list || [];

          // 处理订单数据，确保状态正确
          newOrders = newOrders.map((order) => {
            // 确保订单状态正确
            if (order.status === "shipped" && order.deliveryTime) {
              // 如果已发货且有送达时间，则标记为已送达/待评价
              order.status = "delivered";
            } else if (
              order.status === "paid" &&
              order.shippingInfo &&
              order.shippingInfo.trackingNumber
            ) {
              // 如果已支付且有物流信息，则标记为已发货/待收货
              order.status = "shipped";
            }
            return order;
          });

          if (this.page === 1) {
            this.orderList = newOrders;
          } else {
            this.orderList.push(...newOrders);
          }

          this.hasMore = newOrders.length === this.pageSize;
          this.page++;
        } else {
          uni.showToast({
            title: res.message || "获取订单列表失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("获取订单列表失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    /**
     * 加载订单数量统计
     */
    async loadOrderCounts() {
      try {
        const res = await api.getOrderCounts();

        if (res.code === 200) {
          const counts = res.data;
          this.tabs.forEach((tab) => {
            if (tab.type !== "all") {
              tab.count = counts[tab.type] || 0;
            }
          });
        }
      } catch (error) {
        console.error("获取订单统计失败:", error);
      }
    },

    /**
     * 下拉刷新
     */
    onRefresh() {
      this.refreshing = true;
      this.refreshOrderList();
      this.loadOrderCounts();
    },

    /**
     * 加载更多
     */
    loadMore() {
      this.loadOrderList();
    },

    /**
     * 跳转到订单详情
     */
    goToOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pages/order/order-detail?id=${orderId}`,
      });
    },

    /**
     * 跳转到我的订单页面
     */
    goToMyOrders() {
      uni.navigateTo({
        url: "/pages/order/order-list",
      });
    },

    /**
     * 取消订单
     */
    async cancelOrder(orderId) {
      uni.showModal({
        title: "提示",
        content: "确定要取消这个订单吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.cancelOrder(orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "订单已取消",
                  icon: "success",
                });
                this.refreshOrderList();
                this.loadOrderCounts();
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
     * 跳转到支付页面
     */
    goToPayment(order) {
      uni.navigateTo({
        url: `/pages/payment/payment?orderNo=${order.orderNumber}&amount=${order.finalAmount}&orderId=${order.id}`,
      });
    },

    /**
     * 提醒发货
     */
    async remindShip(orderId) {
      try {
        const res = await api.remindShip(orderId);

        if (res.code === 200) {
          uni.showToast({
            title: "提醒成功",
            icon: "success",
          });
        } else {
          uni.showToast({
            title: res.message || "提醒失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("提醒发货失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      }
    },

    /**
     * 查看物流
     */
    viewLogistics(orderId) {
      uni.navigateTo({
        url: `/pages/order/logistics?orderId=${orderId}`,
      });
    },

    /**
     * 确认收货
     */
    async confirmReceive(orderId) {
      uni.showModal({
        title: "提示",
        content: "确认已收到货物吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.confirmReceive(orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "确认收货成功",
                  icon: "success",
                });
                this.refreshOrderList();
                this.loadOrderCounts();
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
     * 去评价
     */
    goToReview(orderId) {
      uni.navigateTo({
        url: `/pages/order/review?orderId=${orderId}`,
      });
    },

    /**
     * 申请售后
     */
    applyAfterSale(orderId) {
      uni.navigateTo({
        url: `/pages/order/after-sale?orderId=${orderId}`,
      });
    },

    /**
     * 再次购买
     */
    async buyAgain(orderId) {
      try {
        const res = await api.buyAgain(orderId);

        if (res.code === 200) {
          uni.showToast({
            title: "已加入购物车",
            icon: "success",
          });

          // 跳转到购物车
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/cart/cart",
            });
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || "操作失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("再次购买失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      }
    },

    /**
     * 删除订单
     */
    async deleteOrder(orderId) {
      uni.showModal({
        title: "提示",
        content: "确定要删除这个订单吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.deleteOrder(orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "订单已删除",
                  icon: "success",
                });
                this.refreshOrderList();
                this.loadOrderCounts();
              } else {
                uni.showToast({
                  title: result.message || "删除订单失败",
                  icon: "error",
                });
              }
            } catch (error) {
              console.error("删除订单失败:", error);
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
     * 去购物
     */
    goShopping() {
      uni.switchTab({
        url: "/pages/index/index",
      });
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
     * 获取订单状态样式类
     */
    getStatusClass(status) {
      return {
        "status-pending": status === "pending",
        "status-paid": status === "paid",
        "status-shipped": status === "shipped",
        "status-delivered": status === "delivered",
        "status-completed": status === "completed",
        "status-cancelled": status === "cancelled",
        "status-refunding": status === "refunding",
        "status-refunded": status === "refunded",
      };
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    /**
     * 计算订单商品总数量
     */
    getTotalQuantity(items) {
      return items.reduce((total, item) => total + item.quantity, 0);
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
    handleImageError(e, item) {
      console.warn("图片加载失败:", {
        src: e.target.src,
        item: item,
        error: e,
      });

      // 尝试使用备用图片
      if (
        item &&
        item.images &&
        Array.isArray(item.images) &&
        item.images.length > 1
      ) {
        // 如果有多张图片，尝试使用下一张
        const currentSrc = e.target.src;
        const currentIndex = item.images.findIndex((img) => {
          const imageUrl = getImageUrl(img);
          return currentSrc.includes(img) || currentSrc.includes(imageUrl);
        });

        if (currentIndex !== -1 && currentIndex < item.images.length - 1) {
          const nextImage = item.images[currentIndex + 1];
          e.target.src = getImageUrl(nextImage);
          return;
        }
      }

      // 最终使用占位图
      e.target.src = "https://via.placeholder.com/200x200?text=暂无图片";
    },

    /**
     * 处理图片加载成功
     */
    handleImageLoad(e, item) {
      console.log("图片加载成功:", {
        src: e.target.src,
        itemId: item?.id,
      });
    },

    /**
     * 获取支付倒计时
     */
    getCountdown(order) {
      if (!order || !order.orderTime) {
        return "";
      }

      const orderTime = new Date(order.orderTime).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - orderTime) / 1000);

      // 计算剩余时间（支付超时时间 - 已经过去的时间）
      const remainingTime = Math.max(0, this.paymentTimeout - elapsedSeconds);

      if (remainingTime <= 0) {
        return "已超时";
      }

      // 格式化剩余时间
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);

      if (hours > 0) {
        return `剩余${hours}小时${minutes}分钟`;
      } else {
        return `剩余${minutes}分钟`;
      }
    },

    /**
     * 启动倒计时定时器
     */
    startCountdownTimer() {
      // 先停止可能存在的旧定时器
      this.stopCountdownTimer();

      // 每分钟更新一次倒计时显示
      this.countdownTimer = setInterval(() => {
        // 检查是否有待支付的订单
        const hasPendingOrders = this.orderList.some(
          (order) => order.status === "pending"
        );

        if (hasPendingOrders) {
          // 强制视图更新
          this.$forceUpdate();

          // 检查是否有订单需要自动取消
          this.checkOrdersForAutoCancel();
        } else {
          // 如果没有待支付订单，停止定时器
          this.stopCountdownTimer();
        }
      }, 60000); // 每分钟更新一次
    },

    /**
     * 停止倒计时定时器
     */
    stopCountdownTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },

    /**
     * 检查是否有订单需要自动取消
     */
    async checkOrdersForAutoCancel() {
      const pendingOrders = this.orderList.filter(
        (order) => order.status === "pending"
      );

      for (const order of pendingOrders) {
        const orderTime = new Date(order.orderTime).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - orderTime) / 1000);

        // 如果已经超时
        if (elapsedSeconds >= this.paymentTimeout) {
          try {
            const result = await api.cancelOrder(order.id);

            if (result.code === 200) {
              console.log(`订单 ${order.orderNumber} 已超时自动取消`);

              // 刷新订单列表
              this.refreshOrderList();
              return; // 一次只处理一个订单，避免多次刷新
            }
          } catch (error) {
            console.error(`自动取消订单 ${order.orderNumber} 失败:`, error);
          }
        }
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

/* 标签栏样式 */
.tab-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 20rpx;
  position: relative;
  font-size: 28rpx;
  color: #666;
}

.tab-item.active {
  color: #d81e06;
  font-weight: bold;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #d81e06;
  border-radius: 2rpx;
}

.tab-badge {
  position: absolute;
  top: 15rpx;
  right: 20rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  min-width: 32rpx;
  text-align: center;
  line-height: 1;
}

/* 订单列表样式 */
.order-list {
  height: calc(100vh - 120rpx);
}

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

.order-items {
  padding: 20rpx 0;
}

.order-item {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-info {
  flex: 1;
}

.order-number {
  font-size: 24rpx;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
  font-weight: 500;
}

.order-time {
  font-size: 22rpx;
  color: #999;
}

.order-status {
  text-align: right;
  flex-shrink: 0;

  text {
    font-size: 26rpx;
    padding: 6rpx 12rpx;
    border-radius: 6rpx;
    display: inline-block;
    color: #fff;
  }

  .countdown {
    display: block;
    font-size: 22rpx;
    color: #ff3b30;
    margin-top: 8rpx;
    font-weight: bold;
  }
}

.status-pending {
  color: #ff6b35;
}

.status-paid {
  color: #4ecdc4;
}

.status-shipped {
  color: #45b7d1;
}

.status-delivered {
  color: #f39c12;
}

.status-completed {
  color: #27ae60;
}

.status-cancelled {
  color: #95a5a6;
}

.status-refunding {
  color: #e74c3c;
}

.status-refunded {
  color: #95a5a6;
}

/* 商品信息区域 - 紧凑横向布局 */
.product-section {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
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

.item-count {
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

.tag.multi {
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

/* 订单操作样式已移至product-actions */

.action-btn {
  width: 80rpx;
  height: 60rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  font-size: 24rpx;
  color: #666;
}

.action-btn:active {
  transform: scale(0.95);
}

.cancel-btn {
  border-color: #ddd;
  background-color: #fff;
  color: #999;
}

.cancel-btn:active {
  background-color: #ff4757;
  color: #fff;
}

.pay-btn {
  border-color: #d81e06;
  background-color: #fff;
  color: #d81e06;
}

.pay-btn:active {
  background-color: #d81e06;
  color: #fff;
}

.remind-btn {
  border-color: #ffa726;
  background-color: #fff;
  color: #ffa726;
}

.remind-btn:active {
  background-color: #ffa726;
  color: #fff;
}

.confirm-btn {
  border-color: #4caf50;
  background-color: #fff;
  color: #4caf50;
}

.confirm-btn:active {
  background-color: #4caf50;
  color: #fff;
}

.review-btn {
  border-color: #2196f3;
  background-color: #fff;
  color: #2196f3;
}

.review-btn:active {
  background-color: #2196f3;
  color: #fff;
}

.buy-again-btn {
  border-color: #d81e06;
  background-color: #fff;
  color: #d81e06;
}

.buy-again-btn:active {
  background-color: #d81e06;
  color: #fff;
}

.after-sale-btn {
  border-color: #ff9800;
  background-color: #fff;
  color: #ff9800;
}

.after-sale-btn:active {
  background-color: #ff9800;
  color: #fff;
}

.delete-btn {
  border-color: #f44336;
  background-color: #fff;
  color: #f44336;
}

.delete-btn:active {
  background-color: #f44336;
  color: #fff;
}

/* 加载状态 */
.load-more,
.no-more {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}
</style>
