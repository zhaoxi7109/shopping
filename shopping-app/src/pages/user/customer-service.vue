<template>
  <view class="container">
    <view class="header-section">
      <view class="header-bg"></view>
      <view class="header-content">
        <view class="header-icon">
          <UnifiedIcon type="icon-kefu" :size="60" color="#fff" />
        </view>
        <view class="header-text">
          <text class="title">欢迎咨询客服</text>
          <text class="subtitle">我们将竭诚为您服务</text>
        </view>
      </view>
    </view>

    <view class="service-options">
      <view class="option-item" @click="onlineService">
        <view class="option-icon">
          <UnifiedIcon type="icon-chat" :size="32" color="#d81e06" />
        </view>
        <view class="option-content">
          <text class="option-title">在线客服</text>
          <text class="option-desc">9:00-21:00 为您提供即时在线服务</text>
        </view>
        <view class="option-arrow">
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>

      <view class="option-item" @click="makePhoneCall">
        <view class="option-icon">
          <UnifiedIcon type="icon-phone" :size="32" color="#d81e06" />
        </view>
        <view class="option-content">
          <text class="option-title">电话客服</text>
          <text class="option-desc">400-123-4567（9:00-18:00）</text>
        </view>
        <view class="option-arrow">
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>

      <view class="option-item" @click="navTo('/pages/chat/chat-list')">
        <view class="option-icon">
          <UnifiedIcon type="icon-message" :size="32" color="#d81e06" />
        </view>
        <view class="option-content">
          <text class="option-title">聊天记录</text>
          <text class="option-desc">查看历史聊天记录</text>
        </view>
        <view class="option-arrow">
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>

      <view class="option-item" @click="navTo('/pages/user/feedback')">
        <view class="option-icon">
          <UnifiedIcon type="icon-feedback" :size="32" color="#d81e06" />
        </view>
        <view class="option-content">
          <text class="option-title">意见反馈</text>
          <text class="option-desc">您的建议是我们进步的动力</text>
        </view>
        <view class="option-arrow">
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
    </view>

    <view class="faq-section">
      <view class="section-title">
        <text>常见问题</text>
      </view>

      <view class="faq-list">
        <view
          class="faq-item"
          v-for="(item, index) in faqList"
          :key="index"
          @click="toggleFaq(index)"
        >
          <view class="faq-question">
            <text>{{ item.question }}</text>
            <view class="faq-arrow" :class="{ active: item.isOpen }">
              <UnifiedIcon
                :type="item.isOpen ? 'icon-up' : 'icon-down'"
                :size="16"
                color="#999"
              />
            </view>
          </view>
          <view class="faq-answer" v-if="item.isOpen">
            {{ item.answer }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      faqList: [
        {
          question: "如何修改收货地址？",
          answer:
            '进入"我的"-"收货地址"，点击地址右侧编辑按钮即可修改收货地址信息。',
          isOpen: false,
        },
        {
          question: "如何申请退款？",
          answer:
            '进入"我的"-"我的订单"，找到需要退款的订单，点击"申请退款"按钮，按照提示填写退款信息即可。',
          isOpen: false,
        },
        {
          question: "优惠券使用规则是什么？",
          answer:
            "优惠券有特定的使用范围和有效期，在商品结算时可以选择满足条件的优惠券使用。部分特价商品和促销活动可能不支持优惠券叠加使用。",
          isOpen: false,
        },
        {
          question: "商品何时发货？",
          answer:
            "正常情况下，我们会在您付款后24小时内发货。特殊情况如节假日、预售商品等可能会延长发货时间，具体以商品详情页说明为准。",
          isOpen: false,
        },
        {
          question: "如何查看物流信息？",
          answer:
            '进入"我的"-"我的订单"，找到已发货的订单，点击"查看物流"即可查看物流详细信息。',
          isOpen: false,
        },
      ],
    };
  },
  methods: {
    // 打开在线客服
    onlineService() {
      // 根据平台不同调用不同的客服接口
      // #ifdef MP-WEIXIN
      uni.openCustomerServiceChat({
        extInfo: { url: "https://work.weixin.qq.com/kfid/kfc123456789" },
        corpId: "wxxxxxxxxxxxxxxx",
        success(res) {
          console.log("接入成功", res);
        },
        fail(err) {
          console.error("接入失败", err);
          uni.showToast({
            title: "客服接入失败，请稍后再试",
            icon: "none",
          });
        },
      });
      // #endif

      // #ifndef MP-WEIXIN
      uni.showToast({
        title: "正在接入在线客服...",
        icon: "none",
      });

      // 模拟在线客服接入
      setTimeout(() => {
        uni.navigateTo({
          url: "/pages/chat/chat?type=service&targetId=service001",
        });
      }, 1500);
      // #endif
    },

    // 拨打客服电话
    makePhoneCall() {
      uni.makePhoneCall({
        phoneNumber: "4001234567",
        success(res) {
          console.log("拨打电话成功", res);
        },
        fail(err) {
          console.error("拨打电话失败", err);
          uni.showToast({
            title: "拨打电话失败，请手动拨打400-123-4567",
            icon: "none",
          });
        },
      });
    },

    // 页面导航
    navTo(url) {
      uni.navigateTo({ url });
    },

    // 展开/收起常见问题
    toggleFaq(index) {
      this.faqList[index].isOpen = !this.faqList[index].isOpen;
    },
  },
};
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 30rpx;
}

.header-section {
  position: relative;
  height: 300rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #d81e06, #ff6b81);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.header-text {
  text-align: center;
  color: #fff;
}

.header-text .title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.header-text .subtitle {
  display: block;
  font-size: 28rpx;
  opacity: 0.9;
}

.service-options {
  background-color: #ffffff;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 10rpx 0;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.option-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.option-item:last-child {
  border-bottom: none;
}

.option-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(216, 30, 6, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-content {
  flex: 1;
  margin-left: 20rpx;
}

.option-title {
  display: block;
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.option-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.option-arrow {
  padding: 0 10rpx;
}

.faq-section {
  background-color: #ffffff;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: "";
  width: 8rpx;
  height: 32rpx;
  background-color: #d81e06;
  margin-right: 16rpx;
  border-radius: 4rpx;
}

.faq-list {
  margin-top: 10rpx;
}

.faq-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.faq-arrow {
  transition: all 0.3s;
}

.faq-arrow.active {
  transform: rotate(180deg);
}

.faq-answer {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  padding: 0 10rpx;
}
</style>
