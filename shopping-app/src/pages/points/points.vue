<template>
  <view class="points-page">

    <!-- 积分余额卡片 -->
    <view class="points-card">
      <view class="card-bg">
        <view class="points-info">
          <view class="points-balance">
            <text class="balance-label">当前积分</text>
            <text class="balance-value">{{ pointsBalance }}</text>
          </view>
          <view class="points-desc">
            <text>100积分 = 1元，可用于订单抵扣</text>
          </view>
        </view>
        <view class="card-decoration">
          <UnifiedIcon type="icon-gift" :size="60" color="rgba(255,255,255,0.3)" />
        </view>
      </view>
    </view>

    <!-- 积分规则 -->
    <view class="points-rules">
      <view class="rules-title">
        <UnifiedIcon type="icon-info" :size="16" color="#666" />
        <text>积分规则</text>
      </view>
      <view class="rules-content">
        <view class="rule-item">
          <text class="rule-label">获得积分：</text>
          <text class="rule-desc">购物消费1元获得10积分</text>
        </view>
        <view class="rule-item">
          <text class="rule-label">使用积分：</text>
          <text class="rule-desc">100积分抵扣1元，最多抵扣订单金额30%</text>
        </view>
        <view class="rule-item">
          <text class="rule-label">有效期：</text>
          <text class="rule-desc">积分永久有效</text>
        </view>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <view 
        v-for="tab in filterTabs" 
        :key="tab.value"
        class="tab-item"
        :class="{ 'active': currentFilter === tab.value }"
        @click="switchFilter(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 积分记录列表 -->
    <view class="records-list">
      <view 
        v-for="record in pointsRecords" 
        :key="record.id"
        class="record-item"
      >
        <view class="record-left">
          <view class="record-icon">
            <UnifiedIcon 
              :type="record.type === 'earn' ? 'icon-add' : 'icon-minus'" 
              :size="16" 
              :color="record.type === 'earn' ? '#52c41a' : '#ff4d4f'" 
            />
          </view>
          <view class="record-info">
            <view class="record-reason">{{ record.reason }}</view>
            <view class="record-time">{{ formatDateTime(record.createdAt) }}</view>
          </view>
        </view>
        <view class="record-right">
          <text 
            class="record-amount"
            :class="{ 'earn': record.type === 'earn', 'spend': record.type === 'spend' }"
          >
            {{ record.type === 'earn' ? '+' : '' }}{{ record.amount }}
          </text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="pointsRecords.length === 0 && !loading">
        <UnifiedIcon type="icon-file-text" :size="60" color="#ccc" />
        <text class="empty-text">暂无积分记录</text>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && !loading">
      <text @click="loadMoreRecords">加载更多</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api.js';
import { useUserStore } from "@/store/user.js";

export default {
  data() {
    return {
      pointsBalance: 0,
      pointsRecords: [],
      currentFilter: 'all',
      filterTabs: [
        { label: '全部', value: 'all' },
        { label: '获得', value: 'earn' },
        { label: '使用', value: 'spend' }
      ],
      loading: false,
      page: 1,
      hasMore: true
    };
  },
  onLoad() {
    this.loadPointsBalance();
    this.loadPointsRecords();
  },
  methods: {
    // 加载积分余额
    async loadPointsBalance() {
      try {
        const userStore = useUserStore();
        const response = await api.getPointsBalance(userStore.userInfo.id);
        
        if (response.success) {
          this.pointsBalance = response.data.points;
        }
      } catch (error) {
        console.error('加载积分余额失败:', error);
      }
    },

    // 加载积分记录
    async loadPointsRecords(isLoadMore = false) {
      try {
        this.loading = true;
        const userStore = useUserStore();
        
        const params = {
          page: isLoadMore ? this.page : 1,
          limit: 20
        };
        
        if (this.currentFilter !== 'all') {
          params.type = this.currentFilter;
        }
        
        const response = await api.getPointsRecords(userStore.userInfo.id, params);
        
        if (response.success) {
          const { records, total } = response.data;
          
          if (isLoadMore) {
            this.pointsRecords = [...this.pointsRecords, ...records];
          } else {
            this.pointsRecords = records;
            this.page = 1;
          }
          
          this.hasMore = this.pointsRecords.length < total;
        }
      } catch (error) {
        console.error('加载积分记录失败:', error);
        uni.showToast({
          title: '加载积分记录失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    // 切换筛选
    switchFilter(filter) {
      if (this.currentFilter === filter) return;
      
      this.currentFilter = filter;
      this.page = 1;
      this.hasMore = true;
      this.loadPointsRecords();
    },

    // 加载更多记录
    loadMoreRecords() {
      if (this.loading || !this.hasMore) return;
      
      this.page += 1;
      this.loadPointsRecords(true);
    },

    // 格式化日期时间
    formatDateTime(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      
      // 如果是今天
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      
      // 如果是昨天
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
        return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      
      // 其他日期
      return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.points-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}



.points-card {
  margin: 30rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.card-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.points-info {
  flex: 1;
}

.points-balance {
  margin-bottom: 20rpx;
}

.balance-label {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.balance-value {
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
}

.points-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.card-decoration {
  opacity: 0.3;
}

.points-rules {
  background-color: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 12rpx;
  padding: 30rpx;
}

.rules-title {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.rules-title text {
  margin-left: 10rpx;
}

.rule-item {
  display: flex;
  margin-bottom: 16rpx;
  font-size: 26rpx;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.rule-label {
  color: #666;
  width: 160rpx;
  flex-shrink: 0;
}

.rule-desc {
  color: #333;
  flex: 1;
}

.filter-tabs {
  display: flex;
  background-color: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 12rpx;
  padding: 10rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 8rpx;
  transition: all 0.3s;
}

.tab-item.active {
  background-color: #d81e06;
  color: #fff;
}

.records-list {
  margin: 0 30rpx;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.record-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.record-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.record-info {
  flex: 1;
}

.record-reason {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-right {
  text-align: right;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 500;
}

.record-amount.earn {
  color: #52c41a;
}

.record-amount.spend {
  color: #ff4d4f;
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

.load-more {
  text-align: center;
  padding: 30rpx;
  font-size: 28rpx;
  color: #666;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>