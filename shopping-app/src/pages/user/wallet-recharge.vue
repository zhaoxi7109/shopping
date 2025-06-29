<template>
  <view class="recharge-page">
    <!-- 当前余额 -->
    <view class="balance-info">
      <text class="balance-label">当前余额</text>
      <text class="balance-amount">¥{{ currentBalance }}</text>
    </view>

    <!-- 充值金额选择 -->
    <view class="amount-section">
      <view class="section-title">充值金额</view>
      <view class="amount-input">
        <text class="currency">¥</text>
        <input 
          class="amount-field"
          type="digit"
          placeholder="请输入充值金额"
          v-model="rechargeAmount"
          @input="onAmountInput"
        />
      </view>
      
      <!-- 快捷金额 -->
      <view class="quick-amounts">
        <view 
          class="amount-item"
          v-for="(amount, index) in quickAmounts"
          :key="index"
          :class="{ active: selectedQuickAmount === amount }"
          @click="selectQuickAmount(amount)"
        >
          <text>{{ amount }}</text>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-section">
      <view class="section-title">支付方式</view>
      <view class="payment-methods">
        <view 
          class="payment-item"
          v-for="(method, index) in paymentMethods"
          :key="index"
          :class="{ active: selectedPayment === method.type }"
          @click="selectPayment(method.type)"
        >
          <view class="payment-icon">
            <UnifiedIcon :type="method.icon" :size="24" :color="method.color" />
          </view>
          <view class="payment-info">
            <text class="payment-name">{{ method.name }}</text>
            <text class="payment-desc">{{ method.desc }}</text>
          </view>
          <view class="payment-radio">
            <view class="radio" :class="{ checked: selectedPayment === method.type }">
              <view class="radio-inner" v-if="selectedPayment === method.type"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 充值说明 -->
    <view class="recharge-tips">
      <view class="tips-title">充值说明</view>
      <view class="tips-content">
        <text>1. 充值金额将实时到账，可用于购买商品</text>
        <text>2. 最低充值金额为1元，最高单次充值10000元</text>
        <text>3. 充值过程中请勿关闭页面或切换应用</text>
        <text>4. 如有疑问请联系客服：400-123-4567</text>
      </view>
    </view>

    <!-- 充值按钮 -->
    <view class="recharge-button">
      <button 
        class="btn-recharge"
        :disabled="!canRecharge"
        :loading="loading"
        @click="handleRecharge"
      >
        {{ loading ? '处理中...' : `立即充值 ¥${rechargeAmount || '0.00'}` }}
      </button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api'
import { useUserStore } from '@/store/user'

export default {
  name: 'WalletRecharge',
  data() {
    return {
      loading: false,
      currentBalance: '0.00',
      rechargeAmount: '',
      selectedQuickAmount: null,
      selectedPayment: 'wechat',
      quickAmounts: [10, 50, 100, 200, 500, 1000],
      paymentMethods: [
        {
          type: 'wechat',
          name: '微信支付',
          desc: '推荐使用，安全便捷',
          icon: 'icon-wechat',
          color: '#07c160'
        },
        {
          type: 'alipay',
          name: '支付宝',
          desc: '支持花呗、余额宝',
          icon: 'icon-alipay',
          color: '#1677ff'
        },
        {
          type: 'bank',
          name: '银行卡',
          desc: '支持各大银行储蓄卡',
          icon: 'icon-bank',
          color: '#ff6b35'
        }
      ]
    }
  },
  computed: {
    canRecharge() {
      const amount = parseFloat(this.rechargeAmount)
      return amount >= 1 && amount <= 10000 && this.selectedPayment
    }
  },
  onLoad() {
    this.loadCurrentBalance()
  },
  methods: {
    async loadCurrentBalance() {
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
          this.currentBalance = res.data.balance || '0.00'
        }
      } catch (error) {
        console.error('获取余额失败:', error)
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
      this.rechargeAmount = value
      this.selectedQuickAmount = null
    },

    selectQuickAmount(amount) {
      this.rechargeAmount = amount.toString()
      this.selectedQuickAmount = amount
    },

    selectPayment(type) {
      this.selectedPayment = type
    },

    async handleRecharge() {
      if (!this.canRecharge) {
        uni.showToast({
          title: '请检查充值金额和支付方式',
          icon: 'none'
        })
        return
      }

      const amount = parseFloat(this.rechargeAmount)
      if (amount < 1) {
        uni.showToast({
          title: '最低充值金额为1元',
          icon: 'none'
        })
        return
      }

      if (amount > 10000) {
        uni.showToast({
          title: '单次最高充值10000元',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '确认充值',
        content: `确定要充值 ¥${amount} 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.processRecharge(amount)
          }
        }
      })
    },

    async processRecharge(amount) {
      this.loading = true
      try {
        const userStore = useUserStore()
        const res = await api.createRechargeOrder({
          userId: userStore.userId,
          amount: amount,
          paymentMethod: this.selectedPayment
        })

        if (res.success) {
          // 模拟支付成功
          await this.simulatePayment(res.data.orderId)
        } else {
          throw new Error(res.message || '创建充值订单失败')
        }
      } catch (error) {
        console.error('充值失败:', error)
        uni.showToast({
          title: error.message || '充值失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async simulatePayment(orderId) {
      // 模拟支付过程
      uni.showLoading({
        title: '正在支付...'
      })

      setTimeout(async () => {
        try {
          const res = await api.confirmRecharge(orderId)
          uni.hideLoading()
          
          if (res.success) {
            uni.showToast({
              title: '充值成功',
              icon: 'success'
            })
            
            // 更新余额
            this.loadCurrentBalance()
            
            // 清空输入
            this.rechargeAmount = ''
            this.selectedQuickAmount = null
            
            // 延迟返回上一页
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          } else {
            throw new Error(res.message || '充值确认失败')
          }
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: error.message || '充值失败',
            icon: 'none'
          })
        }
      }, 2000)
    }
  }
}
</script>

<style scoped>
.recharge-page {
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
}

/* 充值金额 */
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

/* 支付方式 */
.payment-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.payment-item:last-child {
  border-bottom: none;
}

.payment-item.active {
  background: #fff2f0;
  margin: 0 -30rpx;
  padding: 30rpx;
  border-radius: 12rpx;
}

.payment-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.payment-info {
  flex: 1;
}

.payment-name {
  font-size: 30rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.payment-desc {
  font-size: 24rpx;
  color: #999;
}

.payment-radio {
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

/* 充值说明 */
.recharge-tips {
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

/* 充值按钮 */
.recharge-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-recharge {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #d81e06, #ff4757);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.btn-recharge[disabled] {
  background: #ccc;
  color: #999;
}
</style>