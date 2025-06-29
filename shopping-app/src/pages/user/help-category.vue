<template>
  <view class="container">
    <view class="category-header">
      <view class="category-info">
        <view
          class="category-icon"
          :style="{ backgroundColor: categoryInfo.iconBg }"
        >
          <UnifiedIcon
            :type="categoryInfo.icon"
            :size="28"
            :color="categoryInfo.iconColor"
          />
        </view>
        <view class="category-name">{{ categoryInfo.name }}</view>
      </view>
      <view class="category-count">共 {{ questionList.length }} 个问题</view>
    </view>

    <view class="question-list">
      <view
        class="question-item"
        v-for="(item, index) in questionList"
        :key="index"
        @click="navToDetail(item.id)"
      >
        <text class="question-title">{{ item.title }}</text>
        <UnifiedIcon type="icon-right" :size="16" color="#999" />
      </view>
    </view>

    <view class="empty-box" v-if="questionList.length === 0">
      <image src="/static/images/empty.png" mode="aspectFit"></image>
      <text>该分类下暂无问题</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categoryId: "",
      categoryInfo: {
        id: "",
        name: "分类问题",
        icon: "icon-help",
        iconBg: "#f0f0f0",
        iconColor: "#999",
      },
      allQuestions: [
        { id: "1", title: "如何申请退款？", category: "order" },
        { id: "2", title: "优惠券使用规则", category: "coupon" },
        { id: "3", title: "如何修改收货地址？", category: "account" },
        { id: "4", title: "商品发货时间说明", category: "order" },
        { id: "5", title: "会员等级与权益", category: "account" },
        { id: "6", title: "如何绑定/更换手机号？", category: "account" },
        { id: "7", title: "如何查看物流信息？", category: "order" },
        { id: "8", title: "支付方式有哪些？", category: "payment" },
        { id: "9", title: "如何使用积分？", category: "account" },
        { id: "10", title: "如何申请售后？", category: "afterSale" },
        { id: "11", title: "退款进度查询", category: "payment" },
        { id: "12", title: "商品质量问题如何处理？", category: "afterSale" },
        { id: "13", title: "如何评价已购商品？", category: "order" },
        { id: "14", title: "如何领取优惠券？", category: "coupon" },
        { id: "15", title: "优惠券过期了怎么办？", category: "coupon" },
        { id: "16", title: "支付失败如何处理？", category: "payment" },
        { id: "17", title: "如何更改密码？", category: "account" },
        { id: "18", title: "商品破损如何处理？", category: "afterSale" },
        {
          id: "19",
          title: "收到商品与描述不符怎么办？",
          category: "afterSale",
        },
        { id: "20", title: "如何取消订单？", category: "order" },
      ],
      questionList: [],
      categories: {
        account: {
          id: "account",
          name: "账户相关",
          icon: "icon-user",
          iconBg: "#e8f4ff",
          iconColor: "#4a90e2",
        },
        order: {
          id: "order",
          name: "订单物流",
          icon: "icon-order",
          iconBg: "#fff0f5",
          iconColor: "#ff6b81",
        },
        payment: {
          id: "payment",
          name: "支付问题",
          icon: "icon-payment",
          iconBg: "#eefbf0",
          iconColor: "#5cb85c",
        },
        afterSale: {
          id: "afterSale",
          name: "售后服务",
          icon: "icon-service",
          iconBg: "#fef9e7",
          iconColor: "#f1c40f",
        },
        coupon: {
          id: "coupon",
          name: "优惠活动",
          icon: "icon-coupon",
          iconBg: "#f9f0ff",
          iconColor: "#9b59b6",
        },
        other: {
          id: "other",
          name: "其他问题",
          icon: "icon-help",
          iconBg: "#f0f0f0",
          iconColor: "#95a5a6",
        },
      },
    };
  },
  onLoad(options) {
    if (options && options.id) {
      this.categoryId = options.id;
      this.loadCategoryInfo();
      this.filterQuestions();
    }
  },
  methods: {
    // 加载分类信息
    loadCategoryInfo() {
      const category = this.categories[this.categoryId];
      if (category) {
        this.categoryInfo = category;

        // 设置页面标题
        uni.setNavigationBarTitle({
          title: this.categoryInfo.name,
        });
      }
    },

    // 过滤该分类下的问题
    filterQuestions() {
      this.questionList = this.allQuestions.filter(
        (item) => item.category === this.categoryId
      );
    },

    // 导航到问题详情
    navToDetail(id) {
      uni.navigateTo({
        url: `/pages/user/help-detail?id=${id}`,
      });
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

.category-header {
  background-color: #fff;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.category-info {
  display: flex;
  align-items: center;
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20rpx;
}

.category-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.category-count {
  font-size: 26rpx;
  color: #999;
}

.question-list {
  background-color: #fff;
  padding: 0 30rpx;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.question-item:last-child {
  border-bottom: none;
}

.question-title {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  margin-right: 10rpx;
}

.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100rpx;
}

.empty-box image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 20rpx;
}

.empty-box text {
  font-size: 28rpx;
  color: #999;
}
</style>
