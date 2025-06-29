<template>
  <view class="forget-container">
    <view class="header">
      <text class="back-btn" @tap="goBack">返回</text>
      <text class="title">找回密码</text>
      <text class="placeholder"></text>
    </view>

    <view class="form-area">
      <view class="step-indicators">
        <view class="step" :class="{ active: currentStep >= 1 }">
          <view class="step-num">1</view>
          <text class="step-text">验证手机</text>
        </view>
        <view class="step-line" :class="{ active: currentStep >= 2 }"></view>
        <view class="step" :class="{ active: currentStep >= 2 }">
          <view class="step-num">2</view>
          <text class="step-text">设置密码</text>
        </view>
        <view class="step-line" :class="{ active: currentStep >= 3 }"></view>
        <view class="step" :class="{ active: currentStep >= 3 }">
          <view class="step-num">3</view>
          <text class="step-text">完成</text>
        </view>
      </view>

      <!-- 步骤1: 验证手机号 -->
      <view v-if="currentStep === 1">
        <view class="input-group">
          <text class="label">手机号码</text>
          <input
            type="number"
            v-model="phone"
            placeholder="请输入手机号码"
            maxlength="11"
            class="input"
          />
        </view>

        <view class="input-group sms-group">
          <text class="label">验证码</text>
          <input
            type="number"
            v-model="smsCode"
            placeholder="请输入短信验证码"
            maxlength="6"
            class="input sms-input"
          />
          <button
            class="sms-btn"
            :disabled="smsBtnDisabled || sending"
            @tap="sendSmsCode"
          >
            {{ smsBtnText }}
          </button>
        </view>

        <button class="next-btn" @tap="verifyPhone" :disabled="loading">
          {{ loading ? "验证中..." : "下一步" }}
        </button>
      </view>

      <!-- 步骤2: 设置新密码 -->
      <view v-if="currentStep === 2">
        <view class="input-group">
          <text class="label">新密码</text>
          <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="password"
            placeholder="请设置新密码 (不少于6位)"
            class="input"
          />
          <text class="password-toggle" @tap="togglePasswordVisibility">
            {{ passwordVisible ? "隐藏" : "显示" }}
          </text>
        </view>

        <view class="input-group">
          <text class="label">确认密码</text>
          <input
            :type="confirmPasswordVisible ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            class="input"
          />
          <text class="password-toggle" @tap="toggleConfirmPasswordVisibility">
            {{ confirmPasswordVisible ? "隐藏" : "显示" }}
          </text>
        </view>

        <button class="next-btn" @tap="resetPassword" :disabled="loading">
          {{ loading ? "提交中..." : "提交" }}
        </button>
      </view>

      <!-- 步骤3: 完成 -->
      <view v-if="currentStep === 3" class="success-step">
        <view class="success-icon">✓</view>
        <text class="success-title">密码重置成功</text>
        <text class="success-desc">您的密码已成功重置，请使用新密码登录</text>
        <button class="next-btn" @tap="goToLogin">返回登录</button>
      </view>
    </view>
  </view>
</template>

<script>
import CryptoJS from "crypto-js";

export default {
  data() {
    return {
      currentStep: 1,
      phone: "",
      smsCode: "",
      password: "",
      confirmPassword: "",
      passwordVisible: false,
      confirmPasswordVisible: false,
      loading: false,
      countdown: 0,
      sending: false,
    };
  },

  computed: {
    smsBtnDisabled() {
      return !this.phone || this.phone.length !== 11 || this.countdown > 0;
    },

    smsBtnText() {
      if (this.countdown > 0) {
        return `${this.countdown}秒后重发`;
      }
      return this.sending ? "发送中..." : "获取验证码";
    },
  },

  methods: {
    // 返回上一页
    goBack() {
      if (this.currentStep > 1 && this.currentStep < 3) {
        this.currentStep--;
      } else {
        uni.navigateBack();
      }
    },

    // 前往登录页
    goToLogin() {
      uni.navigateBack();
    },

    // 切换密码可见性
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },

    // 切换确认密码可见性
    toggleConfirmPasswordVisibility() {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    },

    // 发送短信验证码
    async sendSmsCode() {
      // 手机号验证
      if (!this.phone || !/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({
          title: "请输入有效的手机号码",
          icon: "none",
        });
        return;
      }

      this.sending = true;

      try {
        // 这里应该调用实际的发送短信API
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 开始倒计时
        this.startCountdown();

        uni.showToast({
          title: "验证码已发送",
          icon: "success",
        });
      } catch (error) {
        uni.showToast({
          title: "验证码发送失败",
          icon: "none",
        });
        console.error("发送验证码错误:", error);
      } finally {
        this.sending = false;
      }
    },

    // 开始倒计时
    startCountdown() {
      this.countdown = 60;
      const timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    },

    // 验证手机号
    async verifyPhone() {
      // 表单验证
      if (!this.phone || !/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({
          title: "请输入有效的手机号码",
          icon: "none",
        });
        return;
      }

      if (!this.smsCode || this.smsCode.length !== 6) {
        uni.showToast({
          title: "请输入6位验证码",
          icon: "none",
        });
        return;
      }

      this.loading = true;

      try {
        // 这里应该调用实际的验证API
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 验证成功，进入下一步
        if (this.smsCode === "123456") {
          // 模拟验证码
          this.currentStep = 2;
        } else {
          uni.showToast({
            title: "验证码错误",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "验证过程中发生错误",
          icon: "none",
        });
        console.error("验证错误:", error);
      } finally {
        this.loading = false;
      }
    },

    // 重置密码
    async resetPassword() {
      // 表单验证
      if (!this.password || this.password.length < 6) {
        uni.showToast({
          title: "密码不能少于6位",
          icon: "none",
        });
        return;
      }

      if (this.password !== this.confirmPassword) {
        uni.showToast({
          title: "两次输入的密码不一致",
          icon: "none",
        });
        return;
      }

      this.loading = true;

      try {
        // 加密密码
        const hashedPassword = CryptoJS.SHA256(this.password).toString();

        // 这里应该调用实际的重置密码API
        // 示例：调用模拟重置密码接口
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 重置成功，进入成功页面
        this.currentStep = 3;
      } catch (error) {
        uni.showToast({
          title: "重置密码过程中发生错误",
          icon: "none",
        });
        console.error("重置密码错误:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss">
.forget-container {
  padding: 30rpx;
  background-color: #fff;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50rpx;

  .back-btn {
    font-size: 32rpx;
    color: #333;
  }

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }

  .placeholder {
    width: 60rpx;
  }
}

.step-indicators {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 60rpx;

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-num {
      width: 60rpx;
      height: 60rpx;
      border-radius: 30rpx;
      background-color: #e5e5e5;
      color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      margin-bottom: 10rpx;
    }

    .step-text {
      font-size: 24rpx;
      color: #999;
    }

    &.active {
      .step-num {
        background-color: #ff6700;
        color: #fff;
      }

      .step-text {
        color: #ff6700;
      }
    }
  }

  .step-line {
    flex: 1;
    height: 2rpx;
    background-color: #e5e5e5;
    margin: 0 10rpx;
    margin-bottom: 30rpx;

    &.active {
      background-color: #ff6700;
    }
  }
}

.form-area {
  .input-group {
    margin-bottom: 30rpx;
    position: relative;

    .label {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 10rpx;
      display: block;
    }

    .input {
      height: 88rpx;
      border-bottom: 1px solid #e5e5e5;
      font-size: 30rpx;
      width: 100%;
    }

    .password-toggle {
      position: absolute;
      right: 0;
      bottom: 30rpx;
      color: #999;
      font-size: 28rpx;
    }
  }

  .sms-group {
    display: flex;
    flex-direction: column;

    .sms-input {
      width: 65%;
    }

    .sms-btn {
      position: absolute;
      right: 0;
      bottom: 20rpx;
      height: 60rpx;
      line-height: 60rpx;
      font-size: 24rpx;
      color: #fff;
      background-color: #ff6700;
      border-radius: 30rpx;
      padding: 0 20rpx;
      min-width: 180rpx;

      &:disabled {
        background-color: #cccccc;
      }
    }
  }

  .next-btn {
    height: 88rpx;
    background-color: #ff6700;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 60rpx;

    &:active {
      opacity: 0.8;
    }

    &:disabled {
      background-color: #cccccc;
    }
  }
}

.success-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;

  .success-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 80rpx;
    background-color: #ff6700;
    color: #fff;
    font-size: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
  }

  .success-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }

  .success-desc {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 60rpx;
  }
}
</style>
