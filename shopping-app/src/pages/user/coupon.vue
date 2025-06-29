<template>
  <view class="user-coupon-page">
    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <view
        v-for="(tab, index) in filterTabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentFilter === tab.value }"
        @click="switchFilter(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list" v-if="!loading">
      <view
        v-for="coupon in filteredCoupons"
        :key="coupon.userCouponId"
        class="coupon-item"
        :class="{
          expired: coupon.status === 'expired',
          used: coupon.status === 'used',
        }"
      >
        <view class="coupon-left">
          <view class="coupon-amount">
            <text
              class="currency"
              v-if="
                coupon.type !== 'discount' &&
                coupon.discountType !== 'percentage'
              "
              >¥</text
            >
            <text class="amount-value">{{
              getCouponDisplayValue(coupon)
            }}</text>
          </view>
          <view class="coupon-condition">{{ coupon.description }}</view>
        </view>
        <view class="coupon-right">
          <view class="coupon-info">
            <view class="coupon-name">{{ coupon.name }}</view>
            <view class="coupon-time"
              >有效期至 {{ formatDate(coupon.endTime) }}</view
            >
            <view class="coupon-status" v-if="coupon.status !== 'available'">
              {{ getStatusText(coupon.status) }}
            </view>
          </view>
          <view class="coupon-actions" v-if="coupon.status === 'available'">
            <view class="use-btn" @click="useCoupon(coupon)">立即使用</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && filteredCoupons.length === 0">
      <UnifiedIcon type="icon-coupon" :size="60" color="#ccc" />
      <text class="empty-text">{{ getEmptyText() }}</text>
      <view class="empty-btn" @click="goToCouponCenter">去领券中心</view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 领券中心入口 - 始终展示 -->
    <view
      class="coupon-center-entry"
      v-if="currentFilter === 'available' && filteredCoupons.length > 0"
    >
      <button class="center-btn" @click="goToCouponCenter">
        <text class="btn-icon">+</text>
        <text>更多优惠券</text>
      </button>
    </view>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";
import UnifiedIcon from "@/components/UnifiedIcon.vue";

export default {
  name: "UserCoupon",
  components: {
    UnifiedIcon,
  },
  data() {
    return {
      loading: true,
      userCoupons: [],
      currentFilter: "available",
      filterTabs: [
        { label: "可使用", value: "available" },
        { label: "已使用", value: "used" },
        { label: "已过期", value: "expired" },
      ],
    };
  },
  computed: {
    filteredCoupons() {
      return this.userCoupons.filter((coupon) => {
        if (this.currentFilter === "available") {
          return coupon.status === "available";
        } else if (this.currentFilter === "used") {
          return coupon.status === "used";
        } else if (this.currentFilter === "expired") {
          return coupon.status === "expired";
        }
        return true;
      });
    },
  },
  onLoad() {
    this.loadUserCoupons();
  },
  onPullDownRefresh() {
    this.loadUserCoupons().then(() => {
      uni.stopPullDownRefresh();
    });
  },
  methods: {
    // 加载用户优惠券
    async loadUserCoupons() {
      try {
        this.loading = true;
        const userStore = useUserStore();
        const response = await api.getUserCoupons(userStore.userInfo.id);

        if (response.success) {
          this.userCoupons = response.data;
        } else {
          console.error("加载优惠券失败:", response.message);
          uni.showToast({
            title: "加载优惠券失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("加载优惠券出错:", error);
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    // 切换筛选
    switchFilter(filter) {
      this.currentFilter = filter;
    },

    // 使用优惠券
    useCoupon(coupon) {
      // 显示提示
      uni.showToast({
        title: "优惠券已准备使用",
        icon: "success",
        duration: 1500,
      });

      // 短暂延迟后跳转到首页
      setTimeout(() => {
        // 使用switchTab而不是navigateTo，因为首页是TabBar页面
        uni.switchTab({
          url: "/pages/index/index",
          success: () => {
            console.log("跳转到首页成功，准备使用优惠券:", coupon.name);
            // 可选：保存最近使用的优惠券到本地存储，以便在需要时使用
            uni.setStorageSync("last_used_coupon", {
              id: coupon.id || coupon.userCouponId,
              name: coupon.name,
              value: this.getCouponDisplayValue(coupon),
              type: coupon.type,
              timestamp: Date.now(),
            });
          },
        });
      }, 500);
    },

    // 去优惠券中心
    goToCouponCenter() {
      uni.navigateTo({
        url: "/pages/coupon/center",
      });
    },

    /**
     * 获取优惠券显示金额
     * @param {Object} coupon 优惠券对象
     * @returns {String} 显示金额
     */
    getCouponDisplayValue(coupon) {
      if (coupon.type === "shipping") {
        return "免邮";
      } else if (coupon.type === "amount" || coupon.discountType === "amount") {
        // 满减券显示减免金额
        return coupon.discountValue || coupon.amount || "0";
      } else if (
        coupon.type === "discount" ||
        coupon.discountType === "percentage"
      ) {
        // 折扣券显示折扣
        const discountValue = coupon.discountValue;
        if (discountValue) {
          // discountValue直接表示折扣（85表示85折）
          return `${discountValue}折`;
        }
        return "95折";
      }
      // 默认显示
      return coupon.discountValue || coupon.amount || "0";
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        used: "已使用",
        expired: "已过期",
      };
      return statusMap[status] || "";
    },

    // 获取空状态文本
    getEmptyText() {
      const textMap = {
        available: "暂无可用优惠券",
        used: "暂无已使用优惠券",
        expired: "暂无过期优惠券",
      };
      return textMap[this.currentFilter] || "暂无优惠券";
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    },
  },
};
</script>

<style scoped>
.user-coupon-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 130rpx; /* 添加底部间距，为固定按钮留出空间 */
  position: relative; /* 为固定按钮定位提供参考 */
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #d81e06;
  font-weight: 500;
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

/* 优惠券列表 */
.coupon-list {
  padding: 20rpx;
}

.coupon-item {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  position: relative;
}

.coupon-item.expired,
.coupon-item.used {
  opacity: 0.6;
}

.coupon-left {
  background: linear-gradient(135deg, #ff6b6b, #d81e06);
  color: #fff;
  padding: 30rpx;
  min-width: 200rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.coupon-left::after {
  content: "";
  position: absolute;
  right: -10rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 20rpx;
  height: 20rpx;
  background-color: #f5f5f5;
  border-radius: 50%;
  box-shadow: 0 -30rpx 0 #f5f5f5, 0 30rpx 0 #f5f5f5;
}

.coupon-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.currency {
  font-size: 24rpx;
  margin-right: 4rpx;
}

.amount-value {
  font-size: 48rpx;
  font-weight: bold;
}

.coupon-condition {
  font-size: 20rpx;
  opacity: 0.9;
  text-align: center;
}

.coupon-right {
  flex: 1;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-info {
  flex: 1;
}

.coupon-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.coupon-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 5rpx;
}

.coupon-status {
  font-size: 24rpx;
  color: #999;
}

.coupon-actions {
  margin-left: 20rpx;
}

.use-btn {
  background-color: #d81e06;
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  text-align: center;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin: 20rpx 0;
}

.empty-btn {
  background-color: #d81e06;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 40rpx;
  font-size: 28rpx;
  color: #999;
}

/* 领券中心入口按钮 */
.coupon-center-entry {
  position: fixed;
  bottom: 30rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 30rpx;
  z-index: 10;
}

.center-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b, #d81e06);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  box-shadow: 0 4rpx 12rpx rgba(216, 30, 6, 0.3);
}

.btn-icon {
  margin-right: 10rpx;
  font-weight: bold;
  font-size: 36rpx;
}
</style>
