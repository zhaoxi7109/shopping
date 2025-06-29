<template>
  <view class="withdraw-page">
    <!-- 可提现余额 -->
    <view class="balance-info">
      <text class="balance-label">可提现余额</text>
      <text class="balance-amount">¥{{ availableBalance }}</text>
      <text class="balance-tips">冻结金额：¥{{ frozenAmount }}</text>
    </view>

    <!-- 提现金额 -->
    <view class="amount-section">
      <view class="section-title">提现金额</view>
      <view class="amount-input">
        <text class="currency">¥</text>
        <input 
          class="amount-field"
          type="digit"
          placeholder="请输入提现金额"
          v-model="withdrawAmount"
          @input="onAmountInput"
        />
        <text class="all-btn" @click="withdrawAll">全部</text>
      </view>
      
      <!-- 快捷金额 -->
      <view class="quick-amounts">
        <view 
          class="amount-item"
          v-for="(amount, index) in quickAmounts"
          :key="index"
          :class="{ active: selectedQuickAmount === amount, disabled: amount > parseFloat(availableBalance) }"
          @click="selectQuickAmount(amount)"
        >
          <text>{{ amount }}</text>
        </view>
      </view>
    </view>

    <!-- 提现到账户 -->
    <view class="account-section">
      <view class="section-title">提现到账户</view>
      <view class="account-list">
        <view 
          class="account-item"
          v-for="(account, index) in bankAccounts"
          :key="index"
          :class="{ active: selectedAccount === account.id }"
          @click="selectAccount(account.id)"
        >
          <view class="account-icon">
            <UnifiedIcon type="icon-bank" :size="24" color="#d81e06" />
          </view>
          <view class="account-info">
            <text class="bank-name">{{ account.bankName }}</text>
            <text class="card-number">{{ formatCardNumber(account.cardNumber) }}</text>
          </view>
          <view class="account-radio">
            <view class="radio" :class="{ checked: selectedAccount === account.id }">
              <view class="radio-inner" v-if="selectedAccount === account.id"></view>
            </view>
          </view>
        </view>
        
        <!-- 添加银行卡 -->
        <view class="add-account" @click="addBankCard">
          <view class="add-icon">
            <UnifiedIcon type="icon-add" :size="24" color="#d81e06" />
          </view>
          <text>添加银行卡</text>
        </view>
      </view>
    </view>

    <!-- 提现费用 -->
    <view class="fee-section">
      <view class="fee-item">
        <text class="fee-label">提现金额</text>
        <text class="fee-value">¥{{ withdrawAmount || '0.00' }}</text>
      </view>
      <view class="fee-item">
        <text class="fee-label">手续费</text>
        <text class="fee-value">¥{{ withdrawFee }}</text>
      </view>
      <view class="fee-item total">
        <text class="fee-label">实际到账</text>
        <text class="fee-value">¥{{ actualAmount }}</text>
      </view>
    </view>

    <!-- 提现说明 -->
    <view class="withdraw-tips">
      <view class="tips-title">提现说明</view>
      <view class="tips-content">
        <text>1. 提现金额将在1-3个工作日内到账</text>
        <text>2. 最低提现金额为10元，每日最多提现5次</text>
        <text>3. 提现手续费：{{ feeRate }}，最低{{ minFee }}元</text>
        <text>4. 工作日16:00前提交，当日处理</text>
        <text>5. 如有疑问请联系客服：400-123-4567</text>
      </view>
    </view>

    <!-- 提现按钮 -->
    <view class="withdraw-button">
      <button 
        class="btn-withdraw"
        :disabled="!canWithdraw"
        :loading="loading"
        @click="handleWithdraw"
      >
        {{ loading ? '处理中...' : `确认提现 ¥${withdrawAmount || '0.00'}` }}
      </button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api'
import { useUserStore } from '@/store/user'

export default {
  name: 'WalletWithdraw',
  data() {
    return {
      loading: false,
      availableBalance: '0.00',
      frozenAmount: '0.00',
      withdrawAmount: '',
      selectedQuickAmount: null,
      selectedAccount: null,
      feeRate: '0.1%',
      minFee: '2',
      quickAmounts: [50, 100, 200, 500, 1000],
      bankAccounts: [
        {
          id: 1,
          bankName: '中国工商银行',
          cardNumber: '6222021234567890123',
          isDefault: true
        },
        {
          id: 2,
          bankName: '中国建设银行',
          cardNumber: '6227001234567890123',
          isDefault: false
        }
      ]
    }
  },
  computed: {
    withdrawFee() {
      if (!this.withdrawAmount) return '0.00'
      const amount = parseFloat(this.withdrawAmount)
      const fee = Math.max(amount * 0.001, 2) // 0.1%手续费，最低2元
      return fee.toFixed(2)
    },
    
    actualAmount() {
      if (!this.withdrawAmount) return '0.00'
      const amount = parseFloat(this.withdrawAmount)
      const fee = parseFloat(this.withdrawFee)
      return (amount - fee).toFixed(2)
    },
    
    canWithdraw() {
      const amount = parseFloat(this.withdrawAmount)
      return amount >= 10 && 
             amount <= parseFloat(this.availableBalance) && 
             this.selectedAccount
    }
  },
  onLoad() {
    this.loadWalletInfo()
    this.loadBankAccounts()
  },
  methods: {
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
          this.availableBalance = res.data.balance || '0.00'
          this.frozenAmount = res.data.frozenAmount || '0.00'
        }
      } catch (error) {
        console.error('获取钱包信息失败:', error)
      }
    },

    async loadBankAccounts() {
      try {
        const userStore = useUserStore()
        if (!userStore.userId) return

        const res = await api.getBankAccounts(userStore.userId)
        if (res.success && res.data.length > 0) {
          this.bankAccounts = res.data
          // 默认选择第一个账户
          const defaultAccount = this.bankAccounts.find(account => account.isDefault)
          this.selectedAccount = defaultAccount ? defaultAccount.id : this.bankAccounts[0].id
        }
      } catch (error) {
        console.error('获取银行卡列表失败:', error)
      }
    },

    onAmountInput(e) {
      let value = e.detail.value
      // 限制小数点后两位
      if (value.includes('.')) {
        const parts = value.split('.')
        if (parts[1] && parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2)
        }
      }
      this.withdrawAmount = value
      this.selectedQuickAmount = null
    },

    selectQuickAmount(amount) {
      if (amount > parseFloat(this.availableBalance)) {
        uni.showToast({
          title: '余额不足',
          icon: 'none'
        })
        return
      }
      this.withdrawAmount = amount.toString()
      this.selectedQuickAmount = amount
    },

    withdrawAll() {
      this.withdrawAmount = this.availableBalance
      this.selectedQuickAmount = null
    },

    selectAccount(accountId) {
      this.selectedAccount = accountId
    },

    formatCardNumber(cardNumber) {
      if (!cardNumber) return ''
      // 显示前4位和后4位，中间用*代替
      const start = cardNumber.substring(0, 4)
      const end = cardNumber.substring(cardNumber.length - 4)
      return `${start} **** **** ${end}`
    },

    addBankCard() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    async handleWithdraw() {
      if (!this.canWithdraw) {
        uni.showToast({
          title: '请检查提现金额和银行卡',
          icon: 'none'
        })
        return
      }

      const amount = parseFloat(this.withdrawAmount)
      if (amount < 10) {
        uni.showToast({
          title: '最低提现金额为10元',
          icon: 'none'
        })
        return
      }

      if (amount > parseFloat(this.availableBalance)) {
        uni.showToast({
          title: '提现金额超过可用余额',
          icon: 'none'
        })
        return
      }

      const selectedBankAccount = this.bankAccounts.find(account => account.id === this.selectedAccount)
      
      uni.showModal({
        title: '确认提现',
        content: `确定要提现 ¥${amount} 到 ${selectedBankAccount.bankName}(${this.formatCardNumber(selectedBankAccount.cardNumber)}) 吗？\n\n手续费：¥${this.withdrawFee}\n实际到账：¥${this.actualAmount}`,
        success: (res) => {
          if (res.confirm) {
            this.processWithdraw(amount)
          }
        }
      })
    },

    async processWithdraw(amount) {
      this.loading = true
      try {
        const userStore = useUserStore()
        const res = await api.createWithdrawOrder({
          userId: userStore.userId,
          amount: amount,
          bankAccountId: this.selectedAccount,
          fee: parseFloat(this.withdrawFee)
        })

        if (res.success) {
          uni.showToast({
            title: '提现申请已提交',
            icon: 'success'
          })
          
          // 更新余额
          this.loadWalletInfo()
          
          // 清空输入
          this.withdrawAmount = ''
          this.selectedQuickAmount = null
          
          // 延迟返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(res.message || '提现申请失败')
        }
      } catch (error) {
        console.error('提现失败:', error)
        uni.showToast({
          title: error.message || '提现失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.withdraw-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 余额信息 */
.balance-info {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  padding: 40rpx 30rpx;
  color: #fff;
  text-align: center;
}

.balance-label {
  font-size: 28rpx;
  opacity: 0.9;
  display: block;
  margin-bottom: 10rpx;
}

.balance-amount {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.balance-tips {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 提现金额 */
.amount-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.amount-input {
  display: flex;
  align-items: center;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.currency {
  font-size: 36rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-field {
  flex: 1;
  font-size: 36rpx;
  color: #333;
}

.all-btn {
  font-size: 28rpx;
  color: #d81e06;
  padding: 10rpx 20rpx;
  border: 1rpx solid #d81e06;
  border-radius: 8rpx;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.amount-item {
  flex: 1;
  min-width: 140rpx;
  height: 80rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  background: #fff;
}

.amount-item.active {
  border-color: #d81e06;
  color: #d81e06;
  background: #fff2f0;
}

.amount-item.disabled {
  opacity: 0.5;
  background: #f5f5f5;
}

/* 账户选择 */
.account-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.account-item:last-child {
  border-bottom: none;
}

.account-item.active {
  background: #fff2f0;
  margin: 0 -30rpx;
  padding: 30rpx;
  border-radius: 12rpx;
}

.account-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.account-info {
  flex: 1;
}

.bank-name {
  font-size: 30rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.card-number {
  font-size: 24rpx;
  color: #999;
}

.account-radio {
  margin-left: 20rpx;
}

.radio {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio.checked {
  border-color: #d81e06;
}

.radio-inner {
  width: 20rpx;
  height: 20rpx;
  background: #d81e06;
  border-radius: 50%;
}

.add-account {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  color: #d81e06;
}

.add-icon {
  width: 60rpx;
  height: 60rpx;
  background: #fff2f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

/* 费用明细 */
.fee-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.fee-item:last-child {
  border-bottom: none;
}

.fee-item.total {
  font-weight: bold;
  color: #d81e06;
}

.fee-label {
  font-size: 28rpx;
  color: #666;
}

.fee-value {
  font-size: 28rpx;
  color: #333;
}

/* 提现说明 */
.withdraw-tips {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.tips-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tips-content text {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

/* 提现按钮 */
.withdraw-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-withdraw {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #d81e06, #ff4757);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.btn-withdraw[disabled] {
  background: #ccc;
  color: #999;
}
</style>