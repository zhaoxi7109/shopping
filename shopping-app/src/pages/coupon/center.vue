<template>
  <view class="coupon-center">
    <!-- 轮播横幅 -->
    <view class="banner">
      <view class="banner-content">
        <view class="banner-title">优惠券大放送</view>
        <view class="banner-desc">精选优惠券，助您省钱购物</view>
      </view>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list">
      <view class="section-title">可领取优惠券</view>
      <view
        v-for="coupon in availableCoupons"
        :key="coupon.id"
        class="coupon-item"
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
            <view class="coupon-stock"
              >剩余 {{ coupon.totalCount - coupon.usedCount }} 张</view
            >
          </view>
          <button :class="getBtnClass(coupon)" @click="claimCoupon(coupon)">
            {{ getBtnText(coupon) }}
          </button>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        class="empty-state"
        v-if="availableCoupons.length === 0 && !loading"
      >
        <UnifiedIcon type="icon-coupon" :size="60" color="#ccc" />
        <text class="empty-text">暂无可领取的优惠券</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 调试信息（可展开查看领券状态） -->
    <view class="debug-panel" v-if="showDebug" @click="hideDebug">
      <view class="debug-title">调试信息（点击关闭）</view>
      <view class="debug-info">
        <view>当前用户ID: {{ currentUserId }}</view>
        <view>已领取优惠券数: {{ userClaimedCoupons.length }}</view>
        <view>已领取优惠券IDs: {{ userClaimedCoupons.join(", ") }}</view>
      </view>
    </view>
    <button class="debug-toggle" @click="toggleDebug" v-if="!showDebug">
      显示调试信息
    </button>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";
import UnifiedIcon from "@/components/UnifiedIcon.vue";

export default {
  components: {
    UnifiedIcon,
  },
  data() {
    return {
      availableCoupons: [],
      userClaimedCoupons: [], // 存储用户已领取的优惠券ID
      loading: false,
      currentUserId: null, // 存储当前用户ID
      showDebug: false, // 是否显示调试信息
    };
  },
  async onLoad() {
    // 先加载用户信息和已领取的优惠券，再加载可领取优惠券
    this.getCurrentUserId();
    await this.loadUserCoupons();
    this.loadAvailableCoupons();
  },
  onShow() {
    // 每次显示页面时重新获取用户ID和加载用户的优惠券
    this.getCurrentUserId();
    this.loadUserCoupons();
  },
  methods: {
    // 获取当前用户ID
    getCurrentUserId() {
      const userStore = useUserStore();
      if (userStore.isLoggedIn && userStore.userInfo) {
        this.currentUserId = userStore.userInfo.id;
        console.log("当前登录用户ID:", this.currentUserId);

        // 临时测试：硬编码用户ID，用于测试
        // 实际生产环境应该移除这段代码
        // 测试ID必须与userCoupons.json中的userId匹配
        this.currentUserId = "b0b80ae2-4d83-447c-88bc-62af3408a067";
        console.log("测试用户ID设置为:", this.currentUserId);
      } else {
        this.currentUserId = null;
      }
    },

    // 加载可领取的优惠券
    async loadAvailableCoupons() {
      try {
        this.loading = true;
        const response = await api.getAvailableCoupons();

        if (response.success) {
          this.availableCoupons = response.data;
          // 打印调试信息
          console.log("可领取优惠券列表:", this.availableCoupons);
          console.log("用户已领取的优惠券ID:", this.userClaimedCoupons);

          // 确保每次加载完可领取优惠券后再次检查已领取状态
          this.$forceUpdate();
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

    // 加载用户已领取的优惠券
    async loadUserCoupons() {
      try {
        if (!this.currentUserId) {
          console.log("用户未登录，无法加载优惠券数据");
          return; // 用户未登录，不加载数据
        }

        console.log("正在为用户ID加载优惠券:", this.currentUserId);
        const response = await api.getUserCoupons(this.currentUserId);

        if (response.success) {
          // 修复：couponId字段实际存储在id字段中
          // 检查返回数据的结构
          if (response.data && Array.isArray(response.data)) {
            const firstCoupon = response.data[0];
            console.log("优惠券数据样例:", firstCoupon);

            // 根据实际返回的数据结构确定正确的字段
            if (firstCoupon) {
              // 判断优惠券ID是存储在哪个字段
              if (firstCoupon.couponId !== undefined) {
                // 如果couponId字段存在，使用该字段
                this.userClaimedCoupons = response.data.map(
                  (coupon) => coupon.couponId
                );
              } else if (firstCoupon.id !== undefined) {
                // 如果id字段存在但couponId不存在，使用id字段
                this.userClaimedCoupons = response.data.map(
                  (coupon) => coupon.id
                );
              } else {
                // 兜底，确保不会出现空数组
                console.error("无法确定优惠券ID字段");
                this.userClaimedCoupons = [];
              }
            } else {
              this.userClaimedCoupons = [];
            }
          } else {
            this.userClaimedCoupons = [];
          }

          console.log("已成功加载用户优惠券:", this.userClaimedCoupons);
          console.log("用户优惠券数据:", response.data);

          // 强制刷新视图
          this.$forceUpdate();
        } else {
          console.error("加载用户优惠券失败:", response);
        }
      } catch (error) {
        console.error("加载用户优惠券失败:", error);
      }
    },

    // 判断用户是否已领取该优惠券
    isUserClaimed(couponId) {
      // 如果优惠券ID数组为空，直接返回false
      if (!this.userClaimedCoupons || !this.userClaimedCoupons.length) {
        return false;
      }

      // 将输入的ID转换为字符串进行比较
      const couponIdStr = String(couponId);

      // 检查优惠券ID是否在已领取列表中（严格比较）
      const claimed = this.userClaimedCoupons.some(
        (id) => String(id) === couponIdStr
      );

      console.log(
        `优惠券${couponId}是否已领取:`,
        claimed,
        "当前用户领取券列表:",
        this.userClaimedCoupons,
        "比较结果:",
        this.userClaimedCoupons.map(
          (id) =>
            `${String(id)} === ${couponIdStr}: ${String(id) === couponIdStr}`
        )
      );

      return claimed;
    },

    // 获取按钮文本
    getBtnText(coupon) {
      if (coupon.totalCount <= coupon.usedCount) {
        return "已抢完";
      }
      if (this.isUserClaimed(coupon.id)) {
        return "已领取";
      }
      return "立即领取";
    },

    // 领取优惠券
    async claimCoupon(coupon) {
      // 检查券是否已抢完
      if (coupon.totalCount <= coupon.usedCount) {
        uni.showToast({
          title: "优惠券已被领完",
          icon: "none",
        });
        return;
      }

      // 检查用户是否已领取
      if (this.isUserClaimed(coupon.id)) {
        uni.showToast({
          title: "您已领取过该优惠券",
          icon: "none",
        });
        return;
      }

      try {
        if (!this.currentUserId) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          setTimeout(() => {
            uni.navigateTo({
              url: "/pages/login/login",
            });
          }, 1500);
          return;
        }

        const response = await api.claimCoupon({
          userId: this.currentUserId,
          couponId: coupon.id,
        });

        if (response.success) {
          uni.showToast({
            title: "领取成功",
            icon: "success",
          });

          // 更新优惠券使用数量
          coupon.usedCount += 1;

          // 将领取的优惠券ID添加到用户已领取列表
          this.userClaimedCoupons.push(coupon.id);
          console.log(
            "领取成功，更新后的用户优惠券列表:",
            this.userClaimedCoupons
          );

          // 刷新优惠券列表和领取状态
          setTimeout(() => {
            // 延迟加载用户优惠券，确保服务器数据已更新
            this.loadUserCoupons();

            // 延迟500ms后强制刷新视图
            setTimeout(() => {
              this.$forceUpdate();
            }, 100);
          }, 200);
        } else {
          uni.showToast({
            title: response.message || "领取失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("领取优惠券失败:", error);
        let message = "领取失败";

        // 解析错误消息
        if (error.data && error.data.message) {
          message = error.data.message;

          // 特殊情况：如果是"已领取过"的错误，更新本地状态
          if (message.includes("已经领取过") || message.includes("已领取过")) {
            console.log("服务器返回已领取过该优惠券，更新本地状态");
            // 添加到已领取列表
            if (!this.userClaimedCoupons.includes(coupon.id)) {
              this.userClaimedCoupons.push(coupon.id);
              this.$forceUpdate();
            }
          }
        } else if (error.message) {
          message = error.message;
        } else {
          // 根据状态码提供友好提示
          switch (error.statusCode) {
            case 400:
              message = "请求参数错误或您已领取过该优惠券";

              // 如果是400错误，且状态为"已领取"，更新本地状态
              this.userClaimedCoupons.push(coupon.id);
              this.$forceUpdate();
              break;
            case 401:
              message = "请先登录";
              break;
            case 404:
              message = "优惠券不存在";
              break;
            case 409:
              message = "优惠券已被领完";
              break;
            default:
              message = "网络错误，请稍后重试";
          }
        }

        uni.showToast({
          title: message,
          icon: "none",
        });
      }
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

    // 获取按钮样式类
    getBtnClass(coupon) {
      // 使用数组语法确保CSS类名可以组合
      const btnClasses = ["claim-btn"];

      if (coupon.totalCount <= coupon.usedCount) {
        btnClasses.push("btn-disabled");
      } else if (this.isUserClaimed(coupon.id)) {
        btnClasses.push("btn-claimed");
      }

      return btnClasses;
    },

    // 显示/隐藏调试面板
    toggleDebug() {
      this.showDebug = !this.showDebug;
    },

    // 隐藏调试面板
    hideDebug() {
      this.showDebug = false;
    },
  },
};
</script>

<style scoped>
.coupon-center {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.banner {
  background: linear-gradient(135deg, #d81e06, #ff6b6b);
  padding: 60rpx 30rpx;
  margin-bottom: 20rpx;
}

.banner-content {
  text-align: center;
}

.banner-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
}

.banner-desc {
  font-size: 28rpx;
  color: #fff;
  opacity: 0.9;
}

.coupon-list {
  padding: 0 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin: 30rpx 0 20rpx 0;
}

.coupon-item {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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
  align-items: center;
  justify-content: space-between;
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
  margin-bottom: 8rpx;
}

.coupon-stock {
  font-size: 24rpx;
  color: #ff6b6b;
}

button.claim-btn {
  background-color: #d81e06;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  white-space: nowrap;
  border: none;
  position: relative;
  min-width: 160rpx;
  line-height: 1.2;
  margin: 0;
}

button.claim-btn::after {
  border: none;
}

button.btn-disabled {
  background-color: #cccccc !important;
  color: #999999 !important;
}

button.btn-claimed {
  background-color: #67c23a !important;
  color: #ffffff !important;
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
  margin-top: 30rpx;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}

.debug-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 20rpx;
  z-index: 100;
}

.debug-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.debug-info {
  font-size: 24rpx;
  line-height: 1.6;
}

.debug-toggle {
  position: fixed;
  bottom: 20rpx;
  right: 20rpx;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  border: none;
  z-index: 99;
}
</style>
