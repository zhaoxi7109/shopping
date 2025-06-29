<template>
  <view class="test-container">
    <view class="header">
      <text class="title">功能测试页面</text>
    </view>

    <view class="section">
      <text class="section-title">优惠券功能测试</text>
      <view class="button-group">
        <button class="test-btn" @click="testGetUserCoupons">
          获取用户优惠券
        </button>
        <button class="test-btn" @click="testClaimCoupon">领取优惠券</button>
        <button class="test-btn" @click="goToCouponCenter">优惠券中心</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">积分功能测试</text>
      <view class="button-group">
        <button class="test-btn" @click="testGetPointsBalance">
          获取积分余额
        </button>
        <button class="test-btn" @click="testGetPointsRecords">
          获取积分记录
        </button>
        <button class="test-btn" @click="goToPoints">积分页面</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">页面跳转测试</text>
      <view class="button-group">
        <button class="test-btn" @click="goToOrder">订单页面</button>
      </view>
    </view>

    <view class="result" v-if="testResult">
      <text class="result-title">测试结果:</text>
      <text class="result-text">{{ testResult }}</text>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api.js";

export default {
  data() {
    return {
      testResult: "",
    };
  },

  methods: {
    async testGetUserCoupons() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          this.testResult = "用户未登录";
          return;
        }

        const userId = JSON.parse(userInfo).id;
        const res = await api.getUserCoupons(userId);
        this.testResult = JSON.stringify(res, null, 2);
      } catch (error) {
        this.testResult = "错误: " + error.message;
      }
    },

    async testClaimCoupon() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          this.testResult = "用户未登录";
          return;
        }

        const userId = JSON.parse(userInfo).id;
        const res = await api.claimCoupon(userId, 1); // 假设领取ID为1的优惠券
        this.testResult = JSON.stringify(res, null, 2);
      } catch (error) {
        this.testResult = "错误: " + error.message;
      }
    },

    async testGetPointsBalance() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          this.testResult = "用户未登录";
          return;
        }

        const userId = JSON.parse(userInfo).id;
        const res = await api.getPointsBalance(userId);
        this.testResult = JSON.stringify(res, null, 2);
      } catch (error) {
        this.testResult = "错误: " + error.message;
      }
    },

    async testGetPointsRecords() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          this.testResult = "用户未登录";
          return;
        }

        const userId = JSON.parse(userInfo).id;
        const res = await api.getPointsRecords(userId);
        this.testResult = JSON.stringify(res, null, 2);
      } catch (error) {
        this.testResult = "错误: " + error.message;
      }
    },

    goToCouponCenter() {
      uni.navigateTo({
        url: "/pages/coupon/center",
      });
    },

    goToPoints() {
      uni.navigateTo({
        url: "/pages/points/points",
      });
    },

    goToOrder() {
      uni.navigateTo({
        url: "/pages/order/order",
      });
    },
  },
};
</script>

<style scoped>
.test-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.test-btn {
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  text-align: center;
}

.test-btn:active {
  background-color: #0056cc;
}

.result {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 30rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.result-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
