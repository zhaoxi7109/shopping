<template>
  <view class="records-page">
    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          class="tab-item"
          v-for="(tab, index) in filterTabs"
          :key="index"
          :class="{ active: activeTab === tab.value }"
          @click="switchTab(tab.value)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>
      
      <view class="date-filter" @click="showDatePicker">
        <text>{{ dateRange }}</text>
        <UnifiedIcon type="icon-arrow-down" :size="16" color="#999" />
      </view>
    </view>

    <!-- 交易记录列表 -->
    <view class="records-list">
      <view 
        class="record-item"
        v-for="(record, index) in filteredRecords"
        :key="index"
        @click="viewDetail(record)"
      >
        <view class="record-icon">
          <UnifiedIcon 
            :type="getTransactionIcon(record.type)"
            :size="24"
            :color="getTransactionColor(record.type)"
          />
        </view>
        
        <view class="record-info">
          <view class="record-title">{{ record.title }}</view>
          <view class="record-desc">{{ record.description }}</view>
          <view class="record-time">{{ formatTime(record.createTime) }}</view>
        </view>
        
        <view class="record-amount">
          <text 
            class="amount"
            :class="{ 
              'income': record.type === 'recharge' || record.type === 'refund',
              'expense': record.type === 'payment' || record.type === 'withdraw'
            }"
          >
            {{ getAmountPrefix(record.type) }}{{ record.amount }}
          </text>
          <view class="status" :class="record.status">
            {{ getStatusText(record.status) }}
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredRecords.length === 0 && !loading">
        <UnifiedIcon type="icon-empty" :size="80" color="#ccc" />
        <text class="empty-text">暂无交易记录</text>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <text>加载中...</text>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && !loading" @click="loadMore">
        <text>加载更多</text>
      </view>
    </view>

    <!-- 日期选择器 -->
    <uni-popup ref="datePopup" type="bottom">
      <view class="date-picker-popup">
        <view class="popup-header">
          <text class="cancel-btn" @click="closeDatePicker">取消</text>
          <text class="title">选择时间范围</text>
          <text class="confirm-btn" @click="confirmDateRange">确定</text>
        </view>
        
        <view class="date-options">
          <view 
            class="date-option"
            v-for="(option, index) in dateOptions"
            :key="index"
            :class="{ active: selectedDateOption === option.value }"
            @click="selectDateOption(option.value)"
          >
            <text>{{ option.label }}</text>
          </view>
        </view>
        
        <view class="custom-date" v-if="selectedDateOption === 'custom'">
          <view class="date-input">
            <text>开始日期</text>
            <picker mode="date" :value="startDate" @change="onStartDateChange">
              <text class="date-value">{{ startDate || '请选择' }}</text>
            </picker>
          </view>
          <view class="date-input">
            <text>结束日期</text>
            <picker mode="date" :value="endDate" @change="onEndDateChange">
              <text class="date-value">{{ endDate || '请选择' }}</text>
            </picker>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { api } from '@/utils/api'
import { useUserStore } from '@/store/user'

export default {
  name: 'WalletRecords',
  data() {
    return {
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 20,
      activeTab: 'all',
      dateRange: '全部时间',
      selectedDateOption: 'all',
      startDate: '',
      endDate: '',
      records: [],
      filterTabs: [
        { label: '全部', value: 'all' },
        { label: '收入', value: 'income' },
        { label: '支出', value: 'expense' },
        { label: '充值', value: 'recharge' },
        { label: '提现', value: 'withdraw' }
      ],
      dateOptions: [
        { label: '全部时间', value: 'all' },
        { label: '今天', value: 'today' },
        { label: '最近7天', value: 'week' },
        { label: '最近30天', value: 'month' },
        { label: '自定义', value: 'custom' }
      ]
    }
  },
  computed: {
    filteredRecords() {
      let filtered = this.records
      
      // 按类型筛选
      if (this.activeTab !== 'all') {
        if (this.activeTab === 'income') {
          filtered = filtered.filter(record => 
            record.type === 'recharge' || record.type === 'refund'
          )
        } else if (this.activeTab === 'expense') {
          filtered = filtered.filter(record => 
            record.type === 'payment' || record.type === 'withdraw'
          )
        } else {
          filtered = filtered.filter(record => record.type === this.activeTab)
        }
      }
      
      return filtered
    }
  },
  onLoad() {
    this.loadRecords()
  },
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },
  onPullDownRefresh() {
    this.refreshRecords()
  },
  methods: {
    async loadRecords(refresh = false) {
      if (this.loading) return
      
      this.loading = true
      try {
        const userStore = useUserStore()
        if (!userStore.userId) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        if (refresh) {
          this.page = 1
          this.records = []
          this.hasMore = true
        }

        const params = {
          userId: userStore.userId,
          page: this.page,
          pageSize: this.pageSize,
          type: this.activeTab === 'all' ? '' : this.activeTab,
          startDate: this.startDate,
          endDate: this.endDate
        }

        const res = await api.getWalletRecords(params)
        if (res.success) {
          const newRecords = res.data.records || []
          
          if (refresh) {
            this.records = newRecords
          } else {
            this.records = [...this.records, ...newRecords]
          }
          
          this.hasMore = newRecords.length === this.pageSize
          this.page++
        } else {
          // 模拟数据
          const mockRecords = this.generateMockRecords()
          if (refresh) {
            this.records = mockRecords
          } else {
            this.records = [...this.records, ...mockRecords]
          }
          this.hasMore = this.records.length < 100
          this.page++
        }
      } catch (error) {
        console.error('获取交易记录失败:', error)
        // 使用模拟数据
        const mockRecords = this.generateMockRecords()
        if (refresh) {
          this.records = mockRecords
        } else {
          this.records = [...this.records, ...mockRecords]
        }
        this.hasMore = this.records.length < 100
        this.page++
      } finally {
        this.loading = false
        if (refresh) {
          uni.stopPullDownRefresh()
        }
      }
    },

    generateMockRecords() {
      const types = ['recharge', 'payment', 'withdraw', 'refund']
      const titles = {
        recharge: '钱包充值',
        payment: '订单支付',
        withdraw: '钱包提现',
        refund: '订单退款'
      }
      const descriptions = {
        recharge: '微信支付充值',
        payment: '购买商品支付',
        withdraw: '提现到银行卡',
        refund: '订单取消退款'
      }
      const statuses = ['success', 'pending', 'failed']
      
      const records = []
      for (let i = 0; i < this.pageSize; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const amount = (Math.random() * 1000 + 10).toFixed(2)
        const createTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        
        records.push({
          id: Date.now() + i,
          type,
          title: titles[type],
          description: descriptions[type],
          amount,
          status,
          createTime: createTime.toISOString(),
          orderNo: 'T' + Date.now() + i
        })
      }
      
      return records
    },

    refreshRecords() {
      this.loadRecords(true)
    },

    loadMore() {
      this.loadRecords()
    },

    switchTab(tab) {
      this.activeTab = tab
      this.refreshRecords()
    },

    showDatePicker() {
      this.$refs.datePopup.open()
    },

    closeDatePicker() {
      this.$refs.datePopup.close()
    },

    selectDateOption(option) {
      this.selectedDateOption = option
      
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      switch (option) {
        case 'all':
          this.dateRange = '全部时间'
          this.startDate = ''
          this.endDate = ''
          break
        case 'today':
          this.dateRange = '今天'
          this.startDate = today
          this.endDate = today
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          this.dateRange = '最近7天'
          this.startDate = weekAgo.toISOString().split('T')[0]
          this.endDate = today
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          this.dateRange = '最近30天'
          this.startDate = monthAgo.toISOString().split('T')[0]
          this.endDate = today
          break
        case 'custom':
          this.dateRange = '自定义时间'
          break
      }
    },

    onStartDateChange(e) {
      this.startDate = e.detail.value
      this.updateCustomDateRange()
    },

    onEndDateChange(e) {
      this.endDate = e.detail.value
      this.updateCustomDateRange()
    },

    updateCustomDateRange() {
      if (this.startDate && this.endDate) {
        this.dateRange = `${this.startDate} 至 ${this.endDate}`
      } else if (this.startDate) {
        this.dateRange = `${this.startDate} 开始`
      } else if (this.endDate) {
        this.dateRange = `截止 ${this.endDate}`
      } else {
        this.dateRange = '自定义时间'
      }
    },

    confirmDateRange() {
      this.closeDatePicker()
      this.refreshRecords()
    },

    viewDetail(record) {
      uni.showModal({
        title: '交易详情',
        content: `交易类型：${record.title}\n交易金额：${this.getAmountPrefix(record.type)}${record.amount}\n交易状态：${this.getStatusText(record.status)}\n交易时间：${this.formatTime(record.createTime)}\n订单号：${record.orderNo}`,
        showCancel: false
      })
    },

    getTransactionIcon(type) {
      const icons = {
        recharge: 'icon-recharge',
        payment: 'icon-payment',
        withdraw: 'icon-withdraw',
        refund: 'icon-refund'
      }
      return icons[type] || 'icon-wallet'
    },

    getTransactionColor(type) {
      const colors = {
        recharge: '#52c41a',
        payment: '#d81e06',
        withdraw: '#1890ff',
        refund: '#52c41a'
      }
      return colors[type] || '#666'
    },

    getAmountPrefix(type) {
      return (type === 'recharge' || type === 'refund') ? '+' : '-'
    },

    getStatusText(status) {
      const statusMap = {
        success: '成功',
        pending: '处理中',
        failed: '失败'
      }
      return statusMap[status] || '未知'
    },

    formatTime(timeStr) {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60 * 1000) {
        return '刚刚'
      } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      } else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5)
      }
    }
  }
}
</script>

<style scoped>
.records-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 筛选条件 */
.filter-section {
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  margin-bottom: 20rpx;
}

.tab-item {
  flex: 1;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 30rpx;
  margin-right: 20rpx;
}

.tab-item:last-child {
  margin-right: 0;
}

.tab-item.active {
  color: #fff;
  background: #d81e06;
}

.date-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #666;
}

/* 交易记录列表 */
.records-list {
  padding: 20rpx;
}

.record-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.record-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.record-info {
  flex: 1;
}

.record-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.record-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.record-time {
  font-size: 24rpx;
  color: #ccc;
}

.record-amount {
  text-align: right;
}

.amount {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.amount.income {
  color: #52c41a;
}

.amount.expense {
  color: #d81e06;
}

.status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  display: inline-block;
}

.status.success {
  color: #52c41a;
  background: #f6ffed;
}

.status.pending {
  color: #faad14;
  background: #fffbe6;
}

.status.failed {
  color: #ff4d4f;
  background: #fff2f0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #ccc;
  margin-top: 20rpx;
  display: block;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40rpx 0;
  font-size: 28rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  font-size: 28rpx;
  color: #d81e06;
}

/* 日期选择器弹窗 */
.date-picker-popup {
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-bottom: 30rpx;
}

.cancel-btn,
.confirm-btn {
  font-size: 30rpx;
  color: #d81e06;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.date-options {
  margin-bottom: 30rpx;
}

.date-option {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.date-option.active {
  border-color: #d81e06;
  color: #d81e06;
  background: #fff2f0;
}

.custom-date {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 30rpx;
}

.date-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.date-value {
  color: #333;
}
</style>