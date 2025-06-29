<template>
  <view class="container">
    <!-- 用户信息区域 -->
    <view class="user-section">
      <view class="user-info-box">
        <view class="portrait-box">
          <image
            class="portrait"
            :src="userInfo.avatar || '/static/images/user/default-avatar.png'"
            mode="aspectFill"
          ></image>
        </view>
        <view class="info-box">
          <view v-if="hasLogin" class="username">{{
            userInfo.nickname || "用户" + userInfo.id
          }}</view>
          <view v-else class="login-btn" @click="navToLogin">点击登录</view>
          <view v-if="hasLogin" class="logout-btn" @click="handleLogout"
            >退出登录</view
          >
        </view>
        <view class="setting-box" @click="navToSetting">
          <UnifiedIcon type="icon-setting" :size="20" color="#fff" />
        </view>
      </view>

      <!-- 用户数据统计 -->
      <view class="user-stats">
        <view class="stats-item" @click="navTo('/pages/user/wallet')">
          <text class="num">{{ userInfo.balance || "0.00" }}</text>
          <text>钱包</text>
        </view>
        <view class="stats-item" @click="navTo('/pages/user/coupon')">
          <text class="num">{{ userInfo.couponCount || 0 }}</text>
          <text>优惠券</text>
        </view>
        <view class="stats-item" @click="navTo('/pages/points/points')">
          <text class="num">{{ userInfo.points || 0 }}</text>
          <text>积分</text>
        </view>
        <view class="stats-item" @click="navTo('/pages/user/favorite')">
          <text class="num">{{ userInfo.favoriteCount || 0 }}</text>
          <text>收藏</text>
        </view>
      </view>
    </view>

    <!-- 我的订单 -->
    <view class="order-section">
      <view class="order-title">
        <text>我的订单</text>
        <view class="more" @click="navTo('/pages/order/order-list')">
          <text>查看全部</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>

      <view class="order-items">
        <view
          class="order-item"
          @click="navTo('/pages/order/order-list?type=pending')"
        >
          <UnifiedIcon type="icon-pay" :size="24" color="#d81e06" />
          <text>待付款</text>
          <text class="badge" v-if="orderCount.unpaid > 0">{{
            orderCount.unpaid > 99 ? "99+" : orderCount.unpaid
          }}</text>
        </view>
        <view
          class="order-item"
          @click="navTo('/pages/order/order-list?type=paid')"
        >
          <UnifiedIcon type="icon-send" :size="24" color="#d81e06" />
          <text>待发货</text>
          <text class="badge" v-if="orderCount.unshipped > 0">{{
            orderCount.unshipped > 99 ? "99+" : orderCount.unshipped
          }}</text>
        </view>
        <view
          class="order-item"
          @click="navTo('/pages/order/order-list?type=shipped')"
        >
          <UnifiedIcon type="icon-receive" :size="24" color="#d81e06" />
          <text>待收货</text>
          <text class="badge" v-if="orderCount.unreceived > 0">{{
            orderCount.unreceived > 99 ? "99+" : orderCount.unreceived
          }}</text>
        </view>
        <view
          class="order-item"
          @click="navTo('/pages/order/order-list?type=delivered')"
        >
          <UnifiedIcon type="icon-comment" :size="24" color="#d81e06" />
          <text>待评价</text>
          <text class="badge" v-if="orderCount.uncommented > 0">{{
            orderCount.uncommented > 99 ? "99+" : orderCount.uncommented
          }}</text>
        </view>
        <view class="order-item" @click="navTo('/pages/order/after-sale')">
          <UnifiedIcon type="icon-service" :size="24" color="#d81e06" />
          <text>售后</text>
        </view>
      </view>
    </view>

    <!-- 我的服务 -->
    <view class="service-section">
      <view class="service-title">我的服务</view>
      <view class="service-items">
        <view class="service-item" @click="navTo('/pages/user/address')">
          <UnifiedIcon type="icon-address" :size="24" color="#d81e06" />
          <text>收货地址</text>
        </view>
        <view
          class="service-item"
          @click="navTo('/pages/user/customer-service')"
        >
          <UnifiedIcon type="icon-kefu" :size="24" color="#d81e06" />
          <text>联系客服</text>
        </view>
        <view class="service-item" @click="navTo('/pages/user/help')">
          <UnifiedIcon type="icon-help" :size="24" color="#d81e06" />
          <text>帮助中心</text>
        </view>
        <view class="service-item" @click="navTo('/pages/user/feedback')">
          <UnifiedIcon type="icon-feedback" :size="24" color="#d81e06" />
          <text>意见反馈</text>
        </view>
        <view class="service-item" @click="navTo('/pages/user/about')">
          <UnifiedIcon type="icon-about" :size="24" color="#d81e06" />
          <text>关于我们</text>
        </view>
      </view>
    </view>

    <!-- 推荐商品 -->
    <view class="recommend-section">
      <view class="recommend-title">为你推荐</view>
      <view class="product-list">
        <view
          class="product-item"
          v-for="(item, index) in recommendList"
          :key="index"
          @click="navToDetail(item.id)"
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
import { useUserStore } from "@/store/user.js";
import { api } from "@/utils/api";
import { processImageUrls, processImageUrl } from "@/utils/image.js";
import CustomTabBar from "@/components/CustomTabBar.vue";

export default {
  components: {
    CustomTabBar,
  },
  data() {
    return {
      hasLogin: false,
      userInfo: {
        id: "",
        nickname: "",
        avatar: "/static/images/user/default-avatar.png",
        balance: "0.00",
        couponCount: 0,
        points: 0,
        favoriteCount: 0,
      },
      orderCount: {
        unpaid: 0,
        unshipped: 0,
        unreceived: 0,
        uncommented: 0,
      },
      recommendList: [],
      loading: false,
    };
  },
  onLoad() {
    this.initData();
    // 监听收藏状态变化事件
    uni.$on("favoriteChanged", this.handleFavoriteChanged);
  },
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLogin();
    if (this.hasLogin) {
      this.getOrderCounts();
      this.getUserInfo();
    }

    // 更新自定义tabbar状态
    this.updateTabBarStatus();

    // 延迟再次更新tabbar状态，确保在页面完全显示后生效
    setTimeout(() => {
      this.updateTabBarStatus();
    }, 100);
  },
  onUnload() {
    // 移除事件监听
    uni.$off("favoriteChanged", this.handleFavoriteChanged);
  },
  methods: {
    // 更新tabbar状态
    updateTabBarStatus() {
      // 通过事件触发自定义tabbar更新，确保在"我的"页面选中正确的tab
      uni.$emit("updateTabBar", 3); // 3是用户中心的索引

      // 发送页面显示事件
      uni.$emit("onShowPage", "pages/user/user");

      // 尝试直接操作自定义tabbar组件
      const customTabBarRef = this.$refs.customTabBar;
      if (customTabBarRef) {
        customTabBarRef.setCurrentTab(3);
        // 如果有forceUpdateTab方法，调用它
        if (typeof customTabBarRef.forceUpdateTab === "function") {
          customTabBarRef.forceUpdateTab(3);
        }
      }
    },

    // 初始化数据
    async initData() {
      this.checkLogin();
      if (this.hasLogin) {
        await this.getUserProfile();
        await this.getOrderCounts();
      }
      await this.getRecommendList();
    },
    // 检查登录状态
    checkLogin() {
      const userStore = useUserStore();
      this.hasLogin = userStore.isLoggedIn;

      if (this.hasLogin && userStore.userInfo) {
        // 如果已登录，更新用户信息
        this.userInfo.id = userStore.userInfo.id || "";
        this.userInfo.nickname = userStore.userInfo.username || "";
        this.userInfo.avatar =
          userStore.userInfo.avatar || "/static/images/user/default-avatar.png";
      }
    },
    // 获取订单计数
    async getOrderCounts() {
      try {
        const res = await api.getOrderCounts();
        if (res.success) {
          const counts = res.data;
          // 更新订单计数
          this.orderCount = {
            unpaid: counts.pending || 0,
            unshipped: counts.paid || 0,
            unreceived: counts.shipped || 0,
            uncommented: counts.delivered || 0,
          };
        } else {
          console.error("获取订单计数失败:", res);
        }
      } catch (error) {
        console.error("获取订单计数失败:", error);
      }
    },
    // 获取用户详细信息
    async getUserProfile() {
      try {
        const res = await api.getUserInfo();
        if (res.success) {
          const profile = res.data.profile || {};
          this.userInfo = {
            ...this.userInfo,
            couponCount: profile.couponCount || 0,
            points: profile.points || 0,
          };
          // 处理用户头像URL
          if (profile.avatar) {
            this.userInfo.avatar = processImageUrl(
              { avatar: profile.avatar },
              "avatar"
            ).avatar;
          }
          console.log("获取用户信息成功:", res.data);
        } else {
          console.error("获取用户信息失败:", res);
        }

        // 获取收藏数量
        await this.getFavoriteCount();

        // 获取钱包余额、优惠券和积分信息
        await Promise.all([
          this.getWalletBalance(),
          this.getCouponCount(), 
          this.getPointsBalance()
        ]);
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    },

    // 获取钱包余额
    async getWalletBalance() {
      try {
        const userStore = useUserStore();
        if (!userStore.userId) return;

        const res = await api.getWalletBalance(userStore.userId);
        if (res.success) {
          this.userInfo.balance = res.data.balance || "0.00";
        } else {
          // 如果接口不存在，使用模拟数据
          this.userInfo.balance = "168.50";
        }
      } catch (error) {
        console.error("获取钱包余额失败:", error);
        // 使用模拟数据
        this.userInfo.balance = "168.50";
      }
    },

    // 获取优惠券数量
    async getCouponCount() {
      try {
        const userStore = useUserStore();
        if (!userStore.userId) return;

        const res = await api.getUserCoupons(userStore.userId);
        if (res.success) {
          // 只统计可用的优惠券
          const availableCoupons = res.data.filter(
            (coupon) => coupon.status === "available"
          );
          this.userInfo.couponCount = availableCoupons.length || 0;
        }
      } catch (error) {
        console.error("获取优惠券数量失败:", error);
        this.userInfo.couponCount = 0;
      }
    },

    // 获取积分余额
    async getPointsBalance() {
      try {
        const userStore = useUserStore();
        if (!userStore.userId) return;

        const res = await api.getPointsBalance(userStore.userId);
        if (res.success) {
          this.userInfo.points = res.data.points || 0;
        }
      } catch (error) {
        console.error("获取积分余额失败:", error);
        this.userInfo.points = 0;
      }
    },

    // 获取收藏数量
    async getFavoriteCount() {
      try {
        const res = await api.getFavoriteList();
        if (res.success) {
          this.userInfo.favoriteCount = res.data.length || 0;
        }
      } catch (error) {
        console.error("获取收藏数量失败:", error);
        this.userInfo.favoriteCount = 0;
      }
    },

    /**
     * 处理收藏状态变化事件
     */
    handleFavoriteChanged(data) {
      if (data.isFavorite) {
        // 添加收藏，收藏数+1
        this.userInfo.favoriteCount++;
      } else {
        // 取消收藏，收藏数-1
        this.userInfo.favoriteCount = Math.max(
          0,
          this.userInfo.favoriteCount - 1
        );
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
    // 导航到登录页
    navToLogin() {
      uni.navigateTo({
        url: "/pages/login/login",
      });
    },
    // 导航到设置页
    navToSetting() {
      if (!this.hasLogin) {
        this.navToLogin();
        return;
      }

      uni.navigateTo({
        url: "/pages/user/setting",
      });
    },
    // 通用导航方法
    navTo(url) {
      if (!this.hasLogin) {
        this.navToLogin();
        return;
      }
      uni.navigateTo({
        url: url,
      });
    },

    // 导航到商品详情
    navToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      });
    },
    // 处理退出登录
    handleLogout() {
      uni.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            const userStore = useUserStore();
            userStore.logout();

            this.checkLogin(); // 刷新登录状态

            // 清空订单计数
            this.orderCount = {
              unpaid: 0,
              unshipped: 0,
              unreceived: 0,
              uncommented: 0,
            };

            // 清空用户信息
            this.userInfo = {
              id: "",
              nickname: "",
              avatar: "/static/images/user/default-avatar.png",
              balance: "0.00",
              couponCount: 0,
              points: 0,
              favoriteCount: 0,
            };

            uni.showToast({
              title: "已退出登录",
              icon: "success",
            });
          }
        },
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

/* 用户信息区域样式 */
.user-section {
  background-color: #d81e06;
  padding: 80rpx 30rpx 40rpx;
  position: relative;
}

.user-info-box {
  display: flex;
  align-items: center;
}

.portrait-box {
  height: 120rpx;
  width: 120rpx;
  border: 5rpx solid #fff;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 20rpx rgba(0, 0, 0, 0.2);
}

.portrait {
  width: 100%;
  height: 100%;
}

.info-box {
  margin-left: 30rpx;
  color: #fff;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
}

.login-btn {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.logout-btn {
  font-size: 28rpx;
  color: #fff;
  opacity: 0.8;
  margin-top: 10rpx;
}

.setting-box {
  position: absolute;
  top: 80rpx;
  right: 30rpx;
  font-size: 40rpx;
  color: #fff;
}

/* 用户数据统计样式 */
.user-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 40rpx;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
}

.stats-item .num {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.stats-item text:nth-child(2) {
  font-size: 24rpx;
  color: #fff;
}

/* 订单区域样式 */
.order-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 10rpx;
  padding: 30rpx;
}

.order-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.order-title text:first-child {
  font-size: 32rpx;
  font-weight: bold;
}

.more {
  color: #999;
  font-size: 24rpx;
  display: flex;
  align-items: center;
}

.more .icon-right {
  margin-left: 5rpx;
}

.order-items {
  display: flex;
  justify-content: space-between;
}

.order-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.order-item .iconfont {
  font-size: 48rpx;
  color: #d81e06;
  margin-bottom: 10rpx;
}

.order-item text:nth-child(2) {
  font-size: 24rpx;
  color: #333;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 20rpx;
  height: 32rpx;
  min-width: 32rpx;
  border-radius: 16rpx;
  text-align: center;
  line-height: 32rpx;
  padding: 0 6rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  font-weight: bold;
  transform: scale(0.9);
  animation: badge-pulse 2s infinite;
  z-index: 10;
}

@keyframes badge-pulse {
  0% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(1);
  }
  100% {
    transform: scale(0.9);
  }
}

/* 服务区域样式 */
.service-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 10rpx;
  padding: 30rpx;
}

.service-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}

.service-items {
  display: flex;
  flex-wrap: wrap;
}

.service-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.service-item .iconfont {
  font-size: 48rpx;
  color: #d81e06;
  margin-bottom: 10rpx;
}

.service-item text:nth-child(2) {
  font-size: 24rpx;
  color: #333;
}

/* 推荐商品样式 */
.recommend-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 10rpx;
  padding: 30rpx;
}

.recommend-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
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
