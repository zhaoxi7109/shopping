<template>
  <view class="coupon-page">
    <!-- 订单信息 -->
    <view class="order-info" v-if="orderAmount">
      <text class="order-amount">订单金额：¥{{ orderAmount }}</text>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list">
      <view class="section-title">可用优惠券</view>
      <view
        v-for="coupon in availableCoupons"
        :key="coupon.userCouponId"
        class="coupon-item"
        :class="{
          selected:
            selectedCoupon &&
            selectedCoupon.userCouponId === coupon.userCouponId,
        }"
        @click="selectCoupon(coupon)"
      >
        <view class="coupon-left">
          <view class="coupon-amount">
            <text
              class="amount-symbol"
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
          <view class="coupon-name">{{ coupon.name }}</view>
          <view class="coupon-time"
            >有效期至 {{ formatDate(coupon.endTime) }}</view
          >
          <view class="coupon-check">
            <UnifiedIcon
              :type="
                selectedCoupon &&
                selectedCoupon.userCouponId === coupon.userCouponId
                  ? 'icon-check-circle-fill'
                  : 'icon-circle'
              "
              :size="20"
              :color="
                selectedCoupon &&
                selectedCoupon.userCouponId === coupon.userCouponId
                  ? '#d81e06'
                  : '#ccc'
              "
            />
          </view>
        </view>
      </view>

      <!-- 可领取优惠券 -->
      <view class="section-title" v-if="claimableCoupons.length > 0"
        >可领取优惠券</view
      >
      <view
        v-for="coupon in claimableCoupons"
        :key="coupon.id"
        class="coupon-item claimable"
        :class="{ disabled: !coupon.canUse }"
      >
        <view class="coupon-left">
          <view class="coupon-amount">
            <text
              class="amount-symbol"
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
            <view class="coupon-stock" v-if="!coupon.canUse"
              >不满足使用条件</view
            >
          </view>
          <view class="claim-btn" @click="claimCoupon(coupon)">领取</view>
        </view>
      </view>

      <!-- 不可用优惠券 -->
      <view class="section-title" v-if="unavailableCoupons.length > 0"
        >不可用优惠券</view
      >
      <view
        v-for="coupon in unavailableCoupons"
        :key="coupon.userCouponId"
        class="coupon-item disabled"
      >
        <view class="coupon-left">
          <view class="coupon-amount">
            <text
              class="amount-symbol"
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
          <view class="coupon-name">{{ coupon.name }}</view>
          <view class="coupon-time"
            >有效期至 {{ formatDate(coupon.endTime) }}</view
          >
          <view class="coupon-reason">{{ coupon.reason }}</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        class="empty-state"
        v-if="
          availableCoupons.length === 0 &&
          unavailableCoupons.length === 0 &&
          claimableCoupons.length === 0 &&
          !loading
        "
      >
        <UnifiedIcon type="icon-coupon" :size="60" color="#ccc" />
        <text class="empty-text">暂无可用优惠券</text>
        <view class="empty-btn" @click="goToCouponCenter">去领券中心</view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer">
      <view class="btn-group">
        <view class="cancel-btn" @click="clearSelection">不使用优惠券</view>
        <view class="confirm-btn" @click="confirmSelection">确定</view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";

export default {
  data() {
    return {
      orderAmount: 0,
      availableCoupons: [],
      unavailableCoupons: [],
      claimableCoupons: [], // 可领取但未领取的优惠券
      selectedCoupon: null,
      loading: false,
    };
  },
  onLoad(options) {
    this.orderAmount = options.orderAmount || 0;
    this.loadUserCoupons();
  },
  methods: {
    // 加载用户优惠券
    async loadUserCoupons() {
      try {
        this.loading = true;
        const userStore = useUserStore();

        // 并行获取用户已有优惠券和可领取优惠券
        const [userCouponsResponse, availableCouponsResponse] =
          await Promise.all([
            api.getUserCoupons(userStore.userInfo.id, this.orderAmount),
            api.getAvailableCoupons(),
          ]);

        // 处理用户已有的优惠券
        if (userCouponsResponse.success) {
          this.availableCoupons = userCouponsResponse.data.filter(
            (coupon) => coupon.canUse
          );
          this.unavailableCoupons = userCouponsResponse.data.filter(
            (coupon) => !coupon.canUse
          );
        }

        // 处理可领取但未领取的优惠券
        if (availableCouponsResponse.success) {
          const userCouponIds =
            userCouponsResponse.data?.map((c) => c.couponId) || [];
          this.claimableCoupons = availableCouponsResponse.data
            .filter((coupon) => {
              // 过滤掉已经领取的优惠券
              return (
                !userCouponIds.includes(coupon.id) &&
                coupon.stock > coupon.usedCount && // 还有库存
                new Date(coupon.endTime) > new Date()
              ); // 未过期
            })
            .map((coupon) => ({
              ...coupon,
              isClaimable: true, // 标记为可领取
              canUse: this.checkCouponCanUse(coupon), // 检查是否可用于当前订单
            }));
        }
      } catch (error) {
        console.error("加载优惠券失败:", error);
        uni.showToast({
          title: "加载优惠券失败",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    // 检查优惠券是否可用于当前订单
    checkCouponCanUse(coupon) {
      // 检查最低消费金额
      if (coupon.minAmount && this.orderAmount < coupon.minAmount) {
        return false;
      }

      // 检查有效期
      if (new Date(coupon.endTime) <= new Date()) {
        return false;
      }

      return true;
    },

    // 领取优惠券
    async claimCoupon(coupon) {
      try {
        const userStore = useUserStore();
        if (!userStore.isLoggedIn) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          return;
        }

        const response = await api.claimCoupon({
          userId: userStore.userInfo.id,
          couponId: coupon.id,
        });

        if (response.success) {
          uni.showToast({
            title: "领取成功",
            icon: "success",
          });

          // 重新加载优惠券列表
          this.loadUserCoupons();
        } else {
          uni.showToast({
            title: response.message || "领取失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("领取优惠券失败:", error);
        let message = "领取失败";

        if (error.data && error.data.message) {
          message = error.data.message;
        } else if (error.message) {
          message = error.message;
        }

        uni.showToast({
          title: message,
          icon: "none",
        });
      }
    },

    // 选择优惠券
    selectCoupon(coupon) {
      if (
        this.selectedCoupon &&
        this.selectedCoupon.userCouponId === coupon.userCouponId
      ) {
        this.selectedCoupon = null;
      } else {
        this.selectedCoupon = coupon;
      }
    },

    // 清除选择
    clearSelection() {
      this.selectedCoupon = null;
      this.confirmSelection();
    },

    // 确认选择
    confirmSelection() {
      if (this.selectedCoupon) {
        // 将选中的优惠券信息存储到本地缓存
        uni.setStorageSync(
          "selectedCoupon",
          JSON.stringify(this.selectedCoupon)
        );
        // 触发优惠券选择事件
        uni.$emit("couponSelected", this.selectedCoupon);
      } else {
        // 清除选中的优惠券
        uni.removeStorageSync("selectedCoupon");
        uni.$emit("couponSelected", null);
      }
      // 返回上一页
      uni.navigateBack();
    },

    /**
     * 获取优惠券显示金额
     * @param {Object} coupon 优惠券对象
     * @returns {String} 显示文本
     */
    getCouponDisplayValue(coupon) {
      if (coupon.type === "shipping") {
        return "免邮";
      } else if (coupon.type === "amount" || coupon.discountType === "amount") {
        // 满减券：显示减免金额
        return coupon.discountValue || coupon.amount || "0";
      } else if (
        coupon.type === "discount" ||
        coupon.discountType === "percentage"
      ) {
        // 折扣券：显示折扣率
        const discountValue = coupon.discountValue;
        if (discountValue) {
          // discountValue直接表示折扣（85表示85折）
          return `${discountValue}折`;
        }
        return "95折";
      } else {
        return coupon.discountValue || coupon.amount || "0";
      }
    },

    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}.${String(date.getDate()).padStart(2, "0")}`;
    },

    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 去领券中心
    goToCouponCenter() {
      uni.navigateTo({
        url: "/pages/coupon/center",
      });
    },
  },
};
</script>

<style scoped>
.claimable {
  border: 1px dashed #d81e06;
}

.claim-btn {
  background-color: #d81e06;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  white-space: nowrap;
}

.claim-btn.disabled {
  background-color: #ccc;
  color: #999;
}
.coupon-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.order-info {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.order-amount {
  font-size: 28rpx;
  color: #666;
}

.coupon-list {
  padding: 0 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  margin: 30rpx 0 20rpx 0;
}

.coupon-item {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  position: relative;
}

.coupon-item.selected {
  border: 2rpx solid #d81e06;
}

.coupon-item.disabled {
  opacity: 0.5;
}

.coupon-left {
  width: 200rpx;
  background: linear-gradient(135deg, #d81e06, #ff6b6b);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx 20rpx;
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
}

.coupon-amount {
  display: flex;
  align-items: baseline;
  color: #fff;
}

.amount-symbol {
  font-size: 24rpx;
  margin-right: 4rpx;
}

.amount-value {
  font-size: 48rpx;
  font-weight: bold;
}

.coupon-condition {
  font-size: 20rpx;
  color: #fff;
  margin-top: 8rpx;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
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
}

.coupon-reason {
  font-size: 24rpx;
  color: #ff6b6b;
  margin-top: 10rpx;
}

.coupon-check {
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin: 30rpx 0;
}

.empty-btn {
  background-color: #d81e06;
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 30rpx;
  border-top: 1rpx solid #eee;
}

.btn-group {
  display: flex;
  gap: 20rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background-color: #d81e06;
  color: #fff;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
