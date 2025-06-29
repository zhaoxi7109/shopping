<template>
  <view class="container">
    <view class="search-section">
      <view class="search-box">
        <UnifiedIcon type="icon-search" :size="16" color="#999" />
        <input
          class="search-input"
          placeholder="搜索问题"
          confirm-type="search"
          v-model="searchKeyword"
          @confirm="searchQuestions"
        />
        <view class="clear-icon" v-if="searchKeyword" @click="clearSearch">
          <UnifiedIcon type="icon-close-circle" :size="16" color="#999" />
        </view>
      </view>
    </view>

    <!-- 热门问题 -->
    <view class="hot-questions" v-if="!isSearchResult">
      <view class="section-title">热门问题</view>
      <view class="hot-list">
        <view
          class="hot-item"
          v-for="(item, index) in hotQuestions"
          :key="index"
          @click="navToDetail(item)"
        >
          <text class="hot-rank" :class="index < 3 ? 'top-rank' : ''">{{
            index + 1
          }}</text>
          <text class="hot-text">{{ item.title }}</text>
        </view>
      </view>
    </view>

    <!-- 问题分类 -->
    <view class="question-categories" v-if="!isSearchResult">
      <view class="section-title">问题分类</view>
      <view class="category-list">
        <view
          class="category-item"
          v-for="(item, index) in categories"
          :key="index"
          @click="navToCategory(item.id)"
        >
          <view class="category-icon" :style="{ backgroundColor: item.iconBg }">
            <UnifiedIcon :type="item.icon" :size="24" :color="item.iconColor" />
          </view>
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="isSearchResult">
      <view class="result-header">
        <view class="back-btn" @click="isSearchResult = false">
          <UnifiedIcon type="icon-left" :size="16" color="#999" />
          <text>返回</text>
        </view>
        <view class="result-count"
          >找到 {{ searchResults.length }} 个相关问题</view
        >
      </view>

      <view class="result-list">
        <view
          class="result-item"
          v-for="(item, index) in searchResults"
          :key="index"
          @click="navToDetail(item)"
        >
          <text class="result-title">{{ item.title }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>

        <view class="no-result" v-if="searchResults.length === 0">
          <image src="/static/images/empty.png" mode="aspectFit"></image>
          <text>没有找到相关问题</text>
        </view>
      </view>
    </view>

    <!-- 所有问题列表 -->
    <view class="all-questions" v-if="!isSearchResult">
      <view class="section-title">全部问题</view>
      <view class="question-list">
        <view
          class="question-item"
          v-for="(item, index) in questionList"
          :key="index"
          @click="navToDetail(item)"
        >
          <text class="question-title">{{ item.title }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      searchKeyword: "",
      isSearchResult: false,
      searchResults: [],
      hotQuestions: [
        { id: "1", title: "如何申请退款？", category: "order" },
        { id: "2", title: "优惠券使用规则", category: "coupon" },
        { id: "3", title: "如何修改收货地址？", category: "account" },
        { id: "4", title: "商品发货时间说明", category: "order" },
        { id: "5", title: "会员等级与权益", category: "account" },
      ],
      categories: [
        {
          id: "account",
          name: "账户相关",
          icon: "icon-user",
          iconBg: "#e8f4ff",
          iconColor: "#4a90e2",
        },
        {
          id: "order",
          name: "订单物流",
          icon: "icon-order",
          iconBg: "#fff0f5",
          iconColor: "#ff6b81",
        },
        {
          id: "payment",
          name: "支付问题",
          icon: "icon-payment",
          iconBg: "#eefbf0",
          iconColor: "#5cb85c",
        },
        {
          id: "afterSale",
          name: "售后服务",
          icon: "icon-service",
          iconBg: "#fef9e7",
          iconColor: "#f1c40f",
        },
        {
          id: "coupon",
          name: "优惠活动",
          icon: "icon-coupon",
          iconBg: "#f9f0ff",
          iconColor: "#9b59b6",
        },
        {
          id: "other",
          name: "其他问题",
          icon: "icon-help",
          iconBg: "#f0f0f0",
          iconColor: "#95a5a6",
        },
      ],
      questionList: [
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
      ],
    };
  },
  methods: {
    // 搜索问题
    searchQuestions() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({
          title: "请输入搜索关键词",
          icon: "none",
        });
        return;
      }

      // 模拟搜索
      const keyword = this.searchKeyword.toLowerCase();
      this.searchResults = this.questionList.filter((item) =>
        item.title.toLowerCase().includes(keyword)
      );

      this.isSearchResult = true;
    },

    // 清空搜索
    clearSearch() {
      this.searchKeyword = "";
      this.isSearchResult = false;
    },

    // 导航到问题详情
    navToDetail(item) {
      uni.navigateTo({
        url: `/pages/user/help-detail?id=${item.id}`,
      });
    },

    // 导航到分类问题列表
    navToCategory(categoryId) {
      uni.navigateTo({
        url: `/pages/user/help-category?id=${categoryId}`,
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

.search-section {
  padding: 20rpx 30rpx;
  background-color: #fff;
}

.search-box {
  height: 72rpx;
  background-color: #f5f5f5;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  position: relative;
}

.search-input {
  flex: 1;
  height: 100%;
  margin-left: 16rpx;
  font-size: 28rpx;
}

.clear-icon {
  padding: 10rpx;
}

/* 热门问题样式 */
.hot-questions {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.hot-list {
  margin-top: 10rpx;
}

.hot-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.hot-rank {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  font-size: 24rpx;
  background-color: #f0f0f0;
  color: #999;
  border-radius: 6rpx;
  margin-right: 20rpx;
}

.hot-rank.top-rank {
  background-color: #d81e06;
  color: #fff;
}

.hot-text {
  font-size: 28rpx;
  color: #333;
}

/* 问题分类样式 */
.question-categories {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.category-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.category-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16rpx;
}

.category-name {
  font-size: 26rpx;
  color: #333;
}

/* 搜索结果样式 */
.search-results {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.back-btn {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #999;
}

.back-btn text {
  margin-left: 8rpx;
}

.result-count {
  font-size: 28rpx;
  color: #666;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.result-title {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  margin-right: 10rpx;
}

.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.no-result image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.no-result text {
  font-size: 28rpx;
  color: #999;
}

/* 所有问题列表样式 */
.all-questions {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.question-list {
  margin-top: 10rpx;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.question-title {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  margin-right: 10rpx;
}
</style>
