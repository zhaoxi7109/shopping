<template>
  <view class="wallet-page">
    <!-- 钱包余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-title">钱包余额</text>
        <view class="eye-icon" @click="toggleBalanceVisible">
          <UnifiedIcon 
            :type="balanceVisible ? 'icon-eye' : 'icon-eye-close'" 
            :size="20" 
            color="#fff" 
          />
        </view>
      </view>
      <view class="balance-amount">
        <text class="currency">¥</text>
        <text class="amount">{{ balanceVisible ? walletInfo.balance : '****' }}</text>
      </view>
      <view class="balance-tips">
        <text>可用余额，可用于购买商品或提现</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="navTo('/pages/user/wallet-recharge')">
        <view class="action-icon recharge">
          <UnifiedIcon type="icon-add" :size="24" color="#fff" />
        </view>
        <text>充值</text>
      </view>
      <view class="action-item" @click="navTo('/pages/user/wallet-withdraw')">
        <view class="action-icon withdraw">
          <UnifiedIcon type="icon-minus" :size="24" color="#fff" />
        </view>
        <text>提现</text>
      </view>
      <view class="action-item" @click="navTo('/pages/user/wallet-records')">
        <view class="action-icon records">
          <UnifiedIcon type="icon-list" :size="24" color="#fff" />
        </view>
        <text>明细</text>
      </view>
    </view>

    <!-- 钱包功能 -->
    <view class="wallet-features">
      <view class="feature-title">钱包功能</view>
      <view class="feature-list">
        <view class="feature-item" @click="navTo('/pages/user/wallet-records')">
          <view class="feature-icon">
            <UnifiedIcon type="icon-list" :size="20" color="#d81e06" />
          </view>
          <view class="feature-content">
            <text class="feature-name">交易记录</text>
            <text class="feature-desc">查看所有收支明细</text>
          </view>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
        
        <view class="feature-item" @click="showSecurityCenter">
          <view class="feature-icon">
            <UnifiedIcon type="icon-shield" :size="20" color="#d81e06" />
          </view>
          <view class="feature-content">
            <text class="feature-name">安全中心</text>
            <text class="feature-desc">支付密码、实名认证</text>
          </view>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
        
        <view class="feature-item" @click="showHelp">
          <view class="feature-icon">
            <UnifiedIcon type="icon-help" :size="20" color="#d81e06" />
          </view>
          <view class="feature-content">
            <text class="feature-name">帮助中心</text>
            <text class="feature-desc">常见问题、联系客服</text>
          </view>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
    </view>

    <!-- 最近交易 -->
    <view class="recent-transactions" v-if="recentRecords.length > 0">
      <view class="section-header">
        <text class="section-title">最近交易</text>
        <text class="view-all" @click="navTo('/pages/user/wallet-records')">查看全部</text>
      </view>
      <view class="transaction-list">
        <view 
          class="transaction-item" 
          v-for="(record, index) in recentRecords" 
          :key="index"
        >
          <view class="transaction-icon">
            <UnifiedIcon 
              :type="getTransactionIcon(record.type)" 
              :size="20" 
              :color="getTransactionColor(record.type)" 
            />
          </view>
          <view class="transaction-content">
            <text class="transaction-title">{{ record.title }}</text>
            <text class="transaction-time">{{ formatTime(record.createTime) }}</text>
          </view>
          <view class="transaction-amount">
            <text :class="['amount', record.type === 'income' ? 'income' : 'expense']">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="recentRecords.length === 0 && !loading">
      <image src="/static/images/empty/wallet.png" class="empty-image" />
      <text class="empty-text">暂无交易记录</text>
      <text class="empty-tips">快去购买商品或充值吧~</text>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api'
import { useUserStore } from '@/store/user'

export default {
  name: 'WalletPage',
  data() {
    return {
      loading: false,
      balanceVisible: true,
      walletInfo: {
        balance: '0.00',
        frozenAmount: '0.00',
        totalIncome: '0.00',
        totalExpense: '0.00'
      },
      recentRecords: []
    }
  },
  onLoad() {
    this.initData()
  },
  onShow() {
    this.loadWalletInfo()
  },
  onPullDownRefresh() {
    this.initData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadWalletInfo(),
          this.loadRecentRecords()
        ])
      } catch (error) {
        console.error('初始化钱包数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async loadWalletInfo() {
      try {
        const userStore = useUserStore()
        if (!userStore.userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        const res = await api.getWalletInfo(userStore.userId)
        if (res.success) {
          this.walletInfo = {
            balance: res.data.balance || '0.00',
            frozenAmount: res.data.frozenAmount || '0.00',
            totalIncome: res.data.totalIncome || '0.00',
            totalExpense: res.data.totalExpense || '0.00'
          }
        }
      } catch (error) {
        console.error('获取钱包信息失败:', error)
        uni.showToast({
          title: '获取钱包信息失败',
          icon: 'none'
        })
      }
    },

    async loadRecentRecords() {
      try {
        const userStore = useUserStore()
        if (!userStore.userId) return

        const res = await api.getWalletRecords(userStore.userId, {
          page: 1,
          limit: 5
        })
        if (res.success) {
          this.recentRecords = res.data.records || []
        }
      } catch (error) {
        console.error('获取交易记录失败:', error)
      }
    },

    toggleBalanceVisible() {
      this.balanceVisible = !this.balanceVisible
    },

    navTo(url) {
      uni.navigateTo({ url })
    },

    showSecurityCenter() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    showHelp() {
      uni.navigateTo({
        url: '/pages/user/help'
      })
    },

    getTransactionIcon(type) {
      const iconMap = {
        'recharge': 'icon-add',
        'withdraw': 'icon-minus',
        'payment': 'icon-pay',
        'refund': 'icon-refund',
        'income': 'icon-add',
        'expense': 'icon-minus'
      }
      return iconMap[type] || 'icon-list'
    },

    getTransactionColor(type) {
      const colorMap = {
        'recharge': '#52c41a',
        'withdraw': '#ff4d4f',
        'payment': '#ff4d4f',
        'refund': '#52c41a',
        'income': '#52c41a',
        'expense': '#ff4d4f'
      }
      return colorMap[type] || '#666'
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      } else {
        return date.toLocaleDateString()
      }
    }
  }
}
</script>

<style scoped>
.wallet-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.balance-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.balance-title {
  font-size: 28rpx;
  opacity: 0.9;
}

.eye-icon {
  padding: 10rpx;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.currency {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.amount {
  font-size: 56rpx;
  font-weight: bold;
}

.balance-tips {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 40rpx 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.action-icon.recharge {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.action-icon.withdraw {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
}

.action-icon.records {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.action-item text {
  font-size: 26rpx;
  color: #333;
}

/* 钱包功能 */
.wallet-features {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.feature-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.feature-content {
  flex: 1;
}

.feature-name {
  font-size: 30rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
}

/* 最近交易 */
.recent-transactions {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.view-all {
  font-size: 26rpx;
  color: #d81e06;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.transaction-content {
  flex: 1;
}

.transaction-title {
  font-size: 30rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.transaction-time {
  font-size: 24rpx;
  color: #999;
}

.transaction-amount .amount {
  font-size: 30rpx;
  font-weight: bold;
}

.transaction-amount .amount.income {
  color: #52c41a;
}

.transaction-amount .amount.expense {
  color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.empty-tips {
  font-size: 26rpx;
  color: #ccc;
}
</style>