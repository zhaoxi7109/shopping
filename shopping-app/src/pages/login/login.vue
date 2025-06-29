<template>
  <view class="login-container">
    <view class="logo-area">
      <image src="/static/logo.png" mode="widthFix" class="logo"></image>
      <text class="title">商城登录</text>
    </view>

    <view class="form-area">
      <view class="input-group">
        <text class="label">用户名/手机号</text>
        <input
          type="text"
          v-model="loginForm.username"
          placeholder="请输入用户名或手机号"
          class="input"
        />
      </view>

      <view class="input-group">
        <text class="label">密码</text>
        <input
          :type="passwordVisible ? 'text' : 'password'"
          v-model="loginForm.password"
          placeholder="请输入密码"
          class="input"
        />
        <text class="password-toggle" @tap="togglePasswordVisibility">
          {{ passwordVisible ? "隐藏" : "显示" }}
        </text>
      </view>

      <view class="remember-row">
        <label class="remember-check">
          <checkbox
            :checked="rememberMe"
            @tap="rememberMe = !rememberMe"
            color="#ff6700"
          />
          <text>记住我</text>
        </label>
        <text class="forget-pwd" @tap="goToForgetPwd">忘记密码?</text>
      </view>

      <button class="login-btn" @tap="handleLogin" :disabled="loading">
        {{ loading ? "登录中..." : "登 录" }}
      </button>

      <view class="register-link">
        还没有账号? <text @tap="goToRegister" class="link">立即注册</text>
      </view>
    </view>

    <view class="third-party-login">
      <view class="divider">
        <view class="line"></view>
        <text class="text">其他登录方式</text>
        <view class="line"></view>
      </view>

      <view class="third-party-icons">
        <view class="icon-item" @tap="thirdPartyLogin('wechat')">
          <UnifiedIcon type="icon-wechat" :size="30" color="#1aad19" />
          <text class="icon-text">微信</text>
        </view>
        <view class="icon-item" @tap="thirdPartyLogin('qq')">
          <UnifiedIcon type="icon-qq" :size="30" color="#12b7f5" />
          <text class="icon-text">QQ</text>
        </view>
        <view class="icon-item" @tap="thirdPartyLogin('weibo')">
          <UnifiedIcon type="icon-weibo" :size="30" color="#e6162d" />
          <text class="icon-text">微博</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from "@/store/user";
import { api } from "@/utils/api.js";

/**
 * 登录页面组件
 * 提供用户登录功能，支持用户名/密码登录
 * 集成后端API进行身份验证
 */

export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      rememberMe: false,
      passwordVisible: false,
      loading: false,
    };
  },

  onLoad() {
    // 尝试从本地存储中获取之前保存的用户名
    const savedUsername = uni.getStorageSync("remembered_username");
    if (savedUsername) {
      this.loginForm.username = savedUsername;
      this.rememberMe = true;
    }
  },

  methods: {
    /**
     * 切换密码可见性
     * 在显示和隐藏密码之间切换
     */
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },

    /**
     * 前往注册页
     * 跳转到用户注册页面
     */
    goToRegister() {
      uni.navigateTo({
        url: "/pages/login/register",
      });
    },

    /**
     * 前往忘记密码页
     * 跳转到密码找回页面
     */
    goToForgetPwd() {
      uni.navigateTo({
        url: "/pages/login/forget-password",
      });
    },

    /**
     * 处理第三方登录
     * @param {string} type - 登录类型（wechat/qq/weibo）
     */
    thirdPartyLogin(platform) {
      uni.showToast({
        title: `${platform} 登录功能开发中`,
        icon: "none",
      });
    },

    /**
     * 处理用户登录
     * 验证表单数据，调用后端API进行身份验证
     * 登录成功后保存token并跳转到首页
     */
    async handleLogin() {
      // 简单表单验证
      if (!this.loginForm.username || !this.loginForm.username.trim()) {
        uni.showToast({
          title: "请输入用户名或手机号",
          icon: "none",
        });
        return;
      }

      if (!this.loginForm.password || !this.loginForm.password.trim()) {
        uni.showToast({
          title: "请输入密码",
          icon: "none",
        });
        return;
      }

      this.loading = true;

      try {
        // 调用真实的登录API
        const response = await api.login({
          username: this.loginForm.username,
          password: this.loginForm.password, // 后端会处理密码加密
        });

        if (response.success) {
          // 如果选择了记住我，保存用户名到本地存储
          if (this.rememberMe) {
            uni.setStorageSync("remembered_username", this.loginForm.username);
          } else {
            uni.removeStorageSync("remembered_username");
          }

          // 存储token
          const userStore = useUserStore();
          userStore.setToken(response.data.accessToken);

          // 提示登录成功
          uni.showToast({
            title: "登录成功",
            icon: "success",
          });

          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/index/index",
            });
          }, 1500);
        } else {
          uni.showToast({
            title: response.message || "登录失败",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "登录过程中发生错误",
          icon: "none",
        });
        console.error("登录错误:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss">
.login-container {
  padding: 60rpx;
  height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;

  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 20rpx;
  }

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
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

  .remember-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 50rpx;

    .remember-check {
      font-size: 28rpx;
      color: #666;
      display: flex;
      align-items: center;
    }

    .forget-pwd {
      font-size: 28rpx;
      color: #666;
    }
  }

  .login-btn {
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

  .register-link {
    text-align: center;
    font-size: 28rpx;
    color: #666;

    .link {
      color: #ff6700;
    }
  }
}

.third-party-login {
  margin-top: 100rpx;

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;

    .line {
      flex: 1;
      height: 1px;
      background-color: #e5e5e5;
    }

    .text {
      padding: 0 20rpx;
      font-size: 24rpx;
      color: #999;
    }
  }

  .third-party-icons {
    display: flex;
    justify-content: space-around;

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .iconfont {
        font-size: 60rpx;
        margin-bottom: 10rpx;
      }

      .icon-text {
        font-size: 24rpx;
        color: #666;
      }

      .icon-wechat {
        color: #07c160;
      }

      .icon-qq {
        color: #12b7f5;
      }

      .icon-weibo {
        color: #e6162d;
      }
    }
  }
}
</style>
