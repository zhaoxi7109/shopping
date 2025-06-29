<template>
  <view class="container">
    <view class="detail-card">
      <view class="question-title">{{ questionDetail.title }}</view>
      <view class="update-time">更新时间：{{ questionDetail.updateTime }}</view>
      <view class="answer-content">
        <rich-text :nodes="questionDetail.content"></rich-text>
      </view>

      <view class="related-section" v-if="relatedQuestions.length > 0">
        <view class="section-title">相关问题</view>
        <view class="related-list">
          <view
            class="related-item"
            v-for="(item, index) in relatedQuestions"
            :key="index"
            @click="navToDetail(item.id)"
          >
            <text class="dot">•</text>
            <text class="related-text">{{ item.title }}</text>
          </view>
        </view>
      </view>

      <view class="feedback-box">
        <view class="feedback-title">文档是否对您有帮助？</view>
        <view class="feedback-buttons">
          <view
            class="feedback-btn"
            :class="{ active: feedback === 'useful' }"
            @click="submitFeedback('useful')"
          >
            <UnifiedIcon
              type="icon-good"
              :size="20"
              :color="feedback === 'useful' ? '#d81e06' : '#999'"
            />
            <text>有帮助</text>
          </view>
          <view
            class="feedback-btn"
            :class="{ active: feedback === 'useless' }"
            @click="submitFeedback('useless')"
          >
            <UnifiedIcon
              type="icon-bad"
              :size="20"
              :color="feedback === 'useless' ? '#d81e06' : '#999'"
            />
            <text>没帮助</text>
          </view>
        </view>
      </view>
    </view>

    <view class="contact-section">
      <view class="contact-title">没有解决您的问题？</view>
      <button class="contact-btn" @click="navToCustomerService">
        联系客服
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      questionId: "",
      feedback: "",
      questionDetail: {
        id: "",
        title: "",
        content: "",
        updateTime: "",
        category: "",
      },
      relatedQuestions: [],
    };
  },
  onLoad(options) {
    if (options && options.id) {
      this.questionId = options.id;
      this.getQuestionDetail();
    }
  },
  methods: {
    // 获取问题详情
    async getQuestionDetail() {
      // 模拟API请求获取问题详情
      const questionData = this.getQuestionById(this.questionId);

      if (questionData) {
        this.questionDetail = questionData;
        // 设置页面标题
        uni.setNavigationBarTitle({
          title: this.questionDetail.title,
        });

        // 获取相关问题
        this.getRelatedQuestions();
      } else {
        uni.showToast({
          title: "未找到该问题",
          icon: "none",
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    },

    // 模拟从本地数据中获取问题详情
    getQuestionById(id) {
      // 模拟问题详情数据
      const questionsData = {
        1: {
          id: "1",
          title: "如何申请退款？",
          content:
            '<div><p>退款流程如下：</p><p>1. 登录账号后，进入"我的订单"页面</p><p>2. 找到需要退款的订单，点击"申请退款"按钮</p><p>3. 选择退款原因，上传相关凭证（如有）</p><p>4. 提交申请后等待商家审核</p><p>5. 审核通过后，退款金额将在1-7个工作日内原路返回</p><p><strong>注意事项：</strong></p><p>- 未发货订单：可申请全额退款</p><p>- 已发货订单：需要与商家协商退款金额</p><p>- 已收货订单：需在收货后7天内申请退款</p></div>',
          updateTime: "2023-12-15",
          category: "order",
        },
        2: {
          id: "2",
          title: "优惠券使用规则",
          content:
            '<div><p>优惠券使用规则说明：</p><p>1. <strong>使用条件：</strong>优惠券通常有最低消费金额限制，例如"满100减10"表示订单金额达到100元才能使用该优惠券</p><p>2. <strong>使用范围：</strong>有些优惠券只适用于特定商品或分类，请查看优惠券详情页的使用说明</p><p>3. <strong>有效期：</strong>每张优惠券都有固定的有效期，过期后将自动失效</p><p>4. <strong>不可叠加：</strong>同一订单通常只能使用一张优惠券</p><p>5. <strong>不可兑现：</strong>优惠券不可兑换为现金</p><p>6. <strong>特殊商品限制：</strong>部分特价商品、促销商品可能不支持使用优惠券</p></div>',
          updateTime: "2023-11-20",
          category: "coupon",
        },
        3: {
          id: "3",
          title: "如何修改收货地址？",
          content:
            '<div><p>修改收货地址的操作步骤：</p><p>1. 登录您的账户</p><p>2. 点击"个人中心"，进入"收货地址"页面</p><p>3. 在地址列表中找到需要修改的地址，点击右侧"编辑"按钮</p><p>4. 在编辑页面中修改相关信息</p><p>5. 点击"保存"按钮完成修改</p><p><strong>温馨提示：</strong></p><p>- 已生成的订单收货地址无法直接修改，如需修改请联系客服</p><p>- 最多可保存20个收货地址</p><p>- 可以设置默认收货地址，下单时将自动选择默认地址</p></div>',
          updateTime: "2023-10-05",
          category: "account",
        },
        4: {
          id: "4",
          title: "商品发货时间说明",
          content:
            "<div><p><strong>不同商品发货时间说明：</strong></p><p>1. <strong>普通商品：</strong>一般在付款成功后24小时内发货（节假日可能延长）</p><p>2. <strong>预售商品：</strong>请以商品详情页的预计发货时间为准</p><p>3. <strong>定制商品：</strong>通常需要3-7天制作时间，详情请查看商品说明</p><p>4. <strong>跨境商品：</strong>需要清关，一般在付款后5-10个工作日发货</p><p><strong>特殊情况：</strong></p><p>- 订单异常：系统可能会暂时拦截订单，导致发货延迟</p><p>- 库存不足：可能导致发货延迟，客服会及时与您联系</p><p>- 恶劣天气：可能影响物流配送效率</p><p>如订单超出正常发货时间，请联系客服查询</p></div>",
          updateTime: "2023-09-18",
          category: "order",
        },
        5: {
          id: "5",
          title: "会员等级与权益",
          content:
            "<div><p>我们的会员体系设有多个等级，不同等级享有不同权益：</p><p><strong>普通会员（默认）：</strong></p><ul><li>购物可获得积分</li><li>参与商城促销活动</li></ul><p><strong>银卡会员（累计消费1000元）：</strong></p><ul><li>所有普通会员权益</li><li>购物积分1.2倍</li><li>生日特别优惠</li></ul><p><strong>金卡会员（累计消费3000元）：</strong></p><ul><li>所有银卡会员权益</li><li>购物积分1.5倍</li><li>专属客服服务</li><li>每月专享优惠券</li></ul><p><strong>钻石会员（累计消费10000元）：</strong></p><ul><li>所有金卡会员权益</li><li>购物积分2倍</li><li>新品优先购买权</li><li>专属活动邀请</li><li>售后特权服务</li></ul><p>会员等级每月更新一次，根据过去12个月的累计消费金额计算。</p></div>",
          updateTime: "2023-11-10",
          category: "account",
        },
      };

      return questionsData[id] || null;
    },

    // 获取相关问题
    getRelatedQuestions() {
      // 模拟获取同类别的其他问题作为相关问题
      const mockQuestions = [
        { id: "1", title: "如何申请退款？", category: "order" },
        { id: "2", title: "优惠券使用规则", category: "coupon" },
        { id: "3", title: "如何修改收货地址？", category: "account" },
        { id: "4", title: "商品发货时间说明", category: "order" },
        { id: "5", title: "会员等级与权益", category: "account" },
        { id: "6", title: "如何绑定/更换手机号？", category: "account" },
        { id: "7", title: "如何查看物流信息？", category: "order" },
        { id: "8", title: "支付方式有哪些？", category: "payment" },
      ];

      // 筛选相同类别但不是当前问题的条目
      this.relatedQuestions = mockQuestions
        .filter(
          (item) =>
            item.category === this.questionDetail.category &&
            item.id !== this.questionId
        )
        .slice(0, 3); // 最多显示3个相关问题
    },

    // 提交反馈
    submitFeedback(type) {
      this.feedback = type;

      // 模拟提交反馈
      uni.showToast({
        title: "感谢您的反馈",
        icon: "success",
      });

      // 实际开发中这里应调用接口保存用户反馈
      console.log("提交反馈:", {
        questionId: this.questionId,
        feedbackType: type,
        timestamp: Date.now(),
      });
    },

    // 导航到其他问题详情
    navToDetail(id) {
      uni.redirectTo({
        url: `/pages/user/help-detail?id=${id}`,
      });
    },

    // 导航到客服页面
    navToCustomerService() {
      uni.navigateTo({
        url: "/pages/user/customer-service",
      });
    },
  },
};
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.detail-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.question-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.update-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.answer-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.7;
}

.related-section {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.related-list {
  margin-top: 16rpx;
}

.related-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.dot {
  font-size: 32rpx;
  color: #d81e06;
  margin-right: 10rpx;
  line-height: 1.2;
}

.related-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

.feedback-box {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 1px solid #f0f0f0;
}

.feedback-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  text-align: center;
}

.feedback-buttons {
  display: flex;
  justify-content: center;
}

.feedback-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 30rpx;
  padding: 20rpx 30rpx;
  border-radius: 8rpx;
}

.feedback-btn text {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.feedback-btn.active {
  background-color: rgba(216, 30, 6, 0.1);
}

.feedback-btn.active text {
  color: #d81e06;
}

.contact-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  text-align: center;
}

.contact-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.contact-btn {
  width: 80%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  margin: 0 auto;
}
</style>
