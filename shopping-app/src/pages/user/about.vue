<template>
  <view class="container">
    <!-- 应用信息 -->
    <view class="app-info-section">
      <view class="app-logo">
        <image src="/static/logo.png" mode="aspectFit"></image>
      </view>
      <view class="app-name">购物商城</view>
      <view class="app-version">版本 v1.0.0</view>
      <view class="app-description">
        一款专业的移动购物应用，为您提供优质的购物体验
      </view>
    </view>

    <!-- 公司信息 -->
    <view class="company-section">
      <view class="section-title">公司信息</view>
      <view class="info-item">
        <text class="label">公司名称</text>
        <text class="value">购物商城有限公司</text>
      </view>
      <view class="info-item">
        <text class="label">成立时间</text>
        <text class="value">2024年</text>
      </view>
      <view class="info-item">
        <text class="label">注册地址</text>
        <text class="value">北京市朝阳区科技园区</text>
      </view>
      <view class="info-item">
        <text class="label">联系电话</text>
        <text class="value">400-123-4567</text>
      </view>
      <view class="info-item">
        <text class="label">客服邮箱</text>
        <text class="value">service@shopping.com</text>
      </view>
    </view>

    <!-- 功能特色 -->
    <view class="features-section">
      <view class="section-title">功能特色</view>
      <view class="feature-item">
        <UnifiedIcon type="icon-cart" :size="24" color="#d81e06" />
        <view class="feature-content">
          <text class="feature-title">便捷购物</text>
          <text class="feature-desc">简单易用的购物流程，快速下单</text>
        </view>
      </view>
      <view class="feature-item">
        <UnifiedIcon type="icon-pay" :size="24" color="#d81e06" />
        <view class="feature-content">
          <text class="feature-title">安全支付</text>
          <text class="feature-desc">多种支付方式，保障资金安全</text>
        </view>
      </view>
      <view class="feature-item">
        <UnifiedIcon type="icon-send" :size="24" color="#d81e06" />
        <view class="feature-content">
          <text class="feature-title">快速配送</text>
          <text class="feature-desc">专业物流团队，快速送达</text>
        </view>
      </view>
      <view class="feature-item">
        <UnifiedIcon type="icon-service" :size="24" color="#d81e06" />
        <view class="feature-content">
          <text class="feature-title">贴心服务</text>
          <text class="feature-desc">7x24小时客服，随时为您服务</text>
        </view>
      </view>
    </view>

    <!-- 法律信息 -->
    <view class="legal-section">
      <view class="section-title">法律信息</view>
      <view class="legal-item" @click="navTo('/pages/user/privacy-policy')">
        <text>隐私政策</text>
        <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
      </view>
      <view class="legal-item" @click="navTo('/pages/user/terms-service')">
        <text>服务条款</text>
        <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
      </view>
      <view class="legal-item" @click="navTo('/pages/user/user-agreement')">
        <text>用户协议</text>
        <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
      </view>
    </view>

    <!-- 联系我们 -->
    <view class="contact-section">
      <view class="section-title">联系我们</view>
      <view class="contact-item" @click="makePhoneCall">
        <UnifiedIcon type="icon-phone" :size="20" color="#d81e06" />
        <text>客服热线</text>
      </view>
      <view class="contact-item" @click="sendEmail">
        <UnifiedIcon type="icon-email" :size="20" color="#d81e06" />
        <text>邮件反馈</text>
      </view>
      <view class="contact-item" @click="openWebsite">
        <UnifiedIcon type="icon-info" :size="20" color="#d81e06" />
        <text>官方网站</text>
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="copyright-section">
      <text class="copyright-text"> © 2024 购物商城有限公司 版权所有 </text>
      <text class="copyright-text"> ICP备案号：京ICP备2024000001号 </text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      appInfo: {
        name: "购物商城",
        version: "v1.0.0",
        description: "一款专业的移动购物应用，为您提供优质的购物体验",
      },
    };
  },

  methods: {
    /**
     * 通用导航方法
     */
    navTo(url) {
      uni.navigateTo({
        url: url,
      });
    },

    /**
     * 拨打客服电话
     */
    makePhoneCall() {
      uni.makePhoneCall({
        phoneNumber: "400-123-4567",
        success: () => {
          console.log("拨打电话成功");
        },
        fail: (error) => {
          console.error("拨打电话失败:", error);
          uni.showToast({
            title: "拨打电话失败",
            icon: "error",
          });
        },
      });
    },

    /**
     * 发送邮件
     */
    sendEmail() {
      // 复制邮箱地址到剪贴板
      uni.setClipboardData({
        data: "service@shopping.com",
        success: () => {
          uni.showToast({
            title: "邮箱地址已复制",
            icon: "success",
          });
        },
        fail: (error) => {
          console.error("复制邮箱地址失败:", error);
          uni.showToast({
            title: "复制失败",
            icon: "error",
          });
        },
      });
    },

    /**
     * 打开官方网站
     */
    openWebsite() {
      // 复制网站地址到剪贴板
      uni.setClipboardData({
        data: "https://www.shopping.com",
        success: () => {
          uni.showToast({
            title: "网站地址已复制",
            icon: "success",
          });
        },
        fail: (error) => {
          console.error("复制网站地址失败:", error);
          uni.showToast({
            title: "复制失败",
            icon: "error",
          });
        },
      });
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

/* 应用信息区域 */
.app-info-section {
  background-color: #fff;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.app-logo image {
  width: 100%;
  height: 100%;
}

.app-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.app-version {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.app-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 通用区域样式 */
.company-section,
.features-section,
.legal-section,
.contact-section {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #eee;
}

/* 公司信息样式 */
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 30rpx;
  color: #333;
  width: 160rpx;
  flex-shrink: 0;
}

.info-item .value {
  font-size: 30rpx;
  color: #666;
  text-align: right;
  flex: 1;
}

/* 功能特色样式 */
.feature-item {
  display: flex;
  align-items: flex-start;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-content {
  margin-left: 20rpx;
  flex: 1;
}

.feature-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.feature-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 法律信息样式 */
.legal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.legal-item:last-child {
  border-bottom: none;
}

.legal-item text:first-child {
  font-size: 30rpx;
  color: #333;
}

/* 联系我们样式 */
.contact-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item text {
  margin-left: 20rpx;
  font-size: 30rpx;
  color: #333;
}

/* 版权信息样式 */
.copyright-section {
  padding: 40rpx;
  text-align: center;
}

.copyright-text {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.8;
}
</style>
