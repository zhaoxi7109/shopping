<template>
  <view class="register-container">
    <view class="header">
      <text class="back-btn" @tap="goBack">返回</text>
      <text class="title">注册账号</text>
      <text class="placeholder"></text>
    </view>

    <view class="form-area">
      <view class="input-group">
        <text class="label">用户名</text>
        <input
          type="text"
          v-model="registerForm.username"
          placeholder="请设置用户名 (字母/数字, 不少于4位)"
          class="input"
        />
      </view>

      <view class="input-group">
        <text class="label">手机号码</text>
        <input
          type="number"
          v-model="registerForm.phone"
          placeholder="请输入手机号码"
          maxlength="11"
          class="input"
        />
      </view>

      <view class="input-group sms-group">
        <text class="label">验证码</text>
        <input
          type="number"
          v-model="registerForm.smsCode"
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

      <view class="input-group">
        <text class="label">设置密码</text>
        <input
          :type="passwordVisible ? 'text' : 'password'"
          v-model="registerForm.password"
          placeholder="请设置密码 (不少于6位)"
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
          v-model="registerForm.confirmPassword"
          placeholder="请再次输入密码"
          class="input"
        />
        <text class="password-toggle" @tap="toggleConfirmPasswordVisibility">
          {{ confirmPasswordVisible ? "隐藏" : "显示" }}
        </text>
      </view>

      <view class="agreement-row">
        <checkbox
          :checked="agreement"
          @tap="agreement = !agreement"
          color="#ff6700"
        />
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @tap="showUserAgreement">《用户协议》</text> 和
          <text class="link" @tap="showPrivacyPolicy">《隐私政策》</text>
        </text>
      </view>

      <button
        class="register-btn"
        @tap="handleRegister"
        :disabled="loading || !agreement"
      >
        {{ loading ? "注册中..." : "注 册" }}
      </button>

      <view class="login-link">
        已有账号? <text @tap="goToLogin" class="link">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import CryptoJS from "crypto-js";

export default {
  data() {
    return {
      registerForm: {
        username: "",
        phone: "",
        smsCode: "",
        password: "",
        confirmPassword: "",
      },
      passwordVisible: false,
      confirmPasswordVisible: false,
      agreement: false,
      loading: false,
      countdown: 0,
      sending: false,
    };
  },

  computed: {
    smsBtnDisabled() {
      return (
        !this.registerForm.phone ||
        this.registerForm.phone.length !== 11 ||
        this.countdown > 0
      );
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
      uni.navigateBack();
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

    // 显示用户协议
    showUserAgreement() {
      uni.showToast({
        title: "用户协议页面开发中",
        icon: "none",
      });
    },

    // 显示隐私政策
    showPrivacyPolicy() {
      uni.showToast({
        title: "隐私政策页面开发中",
        icon: "none",
      });
    },

    // 发送短信验证码
    async sendSmsCode() {
      // 手机号验证
      if (
        !this.registerForm.phone ||
        !/^1[3-9]\d{9}$/.test(this.registerForm.phone)
      ) {
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

    // 处理注册
    async handleRegister() {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }

      this.loading = true;

      try {
        // 加密密码
        const hashedPassword = CryptoJS.SHA256(
          this.registerForm.password
        ).toString();

        // 这里应该调用实际的注册API
        // 示例：调用模拟注册接口
        const response = await this.mockRegisterApi({
          username: this.registerForm.username,
          phone: this.registerForm.phone,
          smsCode: this.registerForm.smsCode,
          password: hashedPassword,
        });

        if (response.success) {
          uni.showToast({
            title: "注册成功",
            icon: "success",
          });

          // 跳转到登录页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: response.message || "注册失败",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "注册过程中发生错误",
          icon: "none",
        });
        console.error("注册错误:", error);
      } finally {
        this.loading = false;
      }
    },

    // 表单验证
    validateForm() {
      // 用户名验证
      if (
        !this.registerForm.username ||
        this.registerForm.username.length < 4
      ) {
        uni.showToast({
          title: "用户名不能少于4位",
          icon: "none",
        });
        return false;
      }

      // 手机号验证
      if (
        !this.registerForm.phone ||
        !/^1[3-9]\d{9}$/.test(this.registerForm.phone)
      ) {
        uni.showToast({
          title: "请输入有效的手机号码",
          icon: "none",
        });
        return false;
      }

      // 验证码验证
      if (
        !this.registerForm.smsCode ||
        this.registerForm.smsCode.length !== 6
      ) {
        uni.showToast({
          title: "请输入6位验证码",
          icon: "none",
        });
        return false;
      }

      // 密码验证
      if (
        !this.registerForm.password ||
        this.registerForm.password.length < 6
      ) {
        uni.showToast({
          title: "密码不能少于6位",
          icon: "none",
        });
        return false;
      }

      // 确认密码验证
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        uni.showToast({
          title: "两次输入的密码不一致",
          icon: "none",
        });
        return false;
      }

      // 协议勾选验证
      if (!this.agreement) {
        uni.showToast({
          title: "请阅读并同意协议",
          icon: "none",
        });
        return false;
      }

      return true;
    },

    // 模拟注册API (实际开发中应替换为真实API调用)
    mockRegisterApi(data) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 模拟服务器响应
          if (data.smsCode === "123456") {
            // 模拟验证码
            resolve({
              success: true,
              message: "注册成功",
            });
          } else {
            resolve({
              success: false,
              message: "验证码错误",
            });
          }
        }, 1000); // 模拟网络延迟
      });
    },
  },
};
</script>

<style lang="scss">
.register-container {
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

  .agreement-row {
    display: flex;
    align-items: center;
    margin: 40rpx 0;

    .agreement-text {
      font-size: 28rpx;
      color: #666;
      margin-left: 10rpx;

      .link {
        color: #ff6700;
      }
    }
  }

  .register-btn {
    height: 88rpx;
    background-color: #ff6700;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;

    &:active {
      opacity: 0.8;
    }

    &:disabled {
      background-color: #cccccc;
    }
  }

  .login-link {
    text-align: center;
    font-size: 28rpx;
    color: #666;

    .link {
      color: #ff6700;
    }
  }
}
</style>
