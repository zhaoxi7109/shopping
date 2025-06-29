<template>
  <view class="container">
    <!-- 密码修改表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">当前密码</text>
        <input
          class="input"
          v-model="formData.oldPassword"
          placeholder="请输入当前密码"
          type="password"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">新密码</text>
        <input
          class="input"
          v-model="formData.newPassword"
          placeholder="请输入新密码"
          type="password"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">确认密码</text>
        <input
          class="input"
          v-model="formData.confirmPassword"
          placeholder="请再次输入新密码"
          type="password"
          maxlength="20"
        />
      </view>
    </view>

    <!-- 密码强度提示 -->
    <view class="password-tips">
      <view class="tips-title">密码强度要求：</view>
      <view class="tips-item" :class="{ active: passwordChecks.length }">
        <UnifiedIcon
          :type="passwordChecks.length ? 'icon-favorite' : 'icon-user'"
          :size="16"
          :color="passwordChecks.length ? '#52c41a' : '#ccc'"
        />
        <text>密码长度8-20位</text>
      </view>
      <view class="tips-item" :class="{ active: passwordChecks.hasLetter }">
        <UnifiedIcon
          :type="passwordChecks.hasLetter ? 'icon-favorite' : 'icon-user'"
          :size="16"
          :color="passwordChecks.hasLetter ? '#52c41a' : '#ccc'"
        />
        <text>包含字母</text>
      </view>
      <view class="tips-item" :class="{ active: passwordChecks.hasNumber }">
        <UnifiedIcon
          :type="passwordChecks.hasNumber ? 'icon-favorite' : 'icon-user'"
          :size="16"
          :color="passwordChecks.hasNumber ? '#52c41a' : '#ccc'"
        />
        <text>包含数字</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        @click="changePassword"
        :loading="submitting"
        :disabled="!isFormValid"
      >
        确认修改
      </button>
    </view>

    <!-- 忘记密码链接 -->
    <view class="forgot-section">
      <text class="forgot-link" @click="navToForgetPassword"
        >忘记当前密码？</text
      >
    </view>
  </view>
</template>

<script>
import { useUserStore } from "@/store/user";
import { api } from "@/utils/api";

export default {
  data() {
    return {
      formData: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
      submitting: false,
    };
  },

  computed: {
    /**
     * 密码强度检查
     */
    passwordChecks() {
      const password = this.formData.newPassword;
      return {
        length: password.length >= 8 && password.length <= 20,
        hasLetter: /[a-zA-Z]/.test(password),
        hasNumber: /\d/.test(password),
      };
    },

    /**
     * 表单验证
     */
    isFormValid() {
      const { oldPassword, newPassword, confirmPassword } = this.formData;
      const { length, hasLetter, hasNumber } = this.passwordChecks;

      return (
        oldPassword.length > 0 &&
        length &&
        hasLetter &&
        hasNumber &&
        newPassword === confirmPassword
      );
    },
  },

  methods: {
    /**
     * 修改密码
     */
    async changePassword() {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }

      this.submitting = true;

      try {
        const res = await api.changePassword({
          currentPassword: this.formData.oldPassword,
          newPassword: this.formData.newPassword,
          confirmPassword: this.formData.confirmPassword,
        });

        if (res.success) {
          uni.showModal({
            title: "修改成功",
            content: "密码修改成功，请重新登录",
            showCancel: false,
            success: () => {
              // 清除登录状态
              const userStore = useUserStore();
              userStore.logout();

              // 跳转到登录页
              uni.reLaunch({
                url: "/pages/login/login",
              });
            },
          });
        } else {
          uni.showToast({
            title: res.message || "修改失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("修改密码失败:", error);
        uni.showToast({
          title: "修改失败",
          icon: "error",
        });
      } finally {
        this.submitting = false;
      }
    },

    /**
     * 表单验证
     */
    validateForm() {
      const { oldPassword, newPassword, confirmPassword } = this.formData;

      if (!oldPassword.trim()) {
        uni.showToast({
          title: "请输入当前密码",
          icon: "error",
        });
        return false;
      }

      if (!newPassword.trim()) {
        uni.showToast({
          title: "请输入新密码",
          icon: "error",
        });
        return false;
      }

      if (newPassword.length < 8 || newPassword.length > 20) {
        uni.showToast({
          title: "密码长度应为8-20位",
          icon: "error",
        });
        return false;
      }

      if (!/[a-zA-Z]/.test(newPassword)) {
        uni.showToast({
          title: "密码必须包含字母",
          icon: "error",
        });
        return false;
      }

      if (!/\d/.test(newPassword)) {
        uni.showToast({
          title: "密码必须包含数字",
          icon: "error",
        });
        return false;
      }

      if (newPassword !== confirmPassword) {
        uni.showToast({
          title: "两次输入的密码不一致",
          icon: "error",
        });
        return false;
      }

      if (oldPassword === newPassword) {
        uni.showToast({
          title: "新密码不能与当前密码相同",
          icon: "error",
        });
        return false;
      }

      return true;
    },

    /**
     * 跳转到忘记密码页面
     */
    navToForgetPassword() {
      uni.navigateTo({
        url: "/pages/login/forget-password",
      });
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 40rpx 0;
}

/* 表单区域 */
.form-section {
  background-color: #fff;
  margin: 0 40rpx 40rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 160rpx;
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
}

.input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  text-align: right;
}

/* 密码强度提示 */
.password-tips {
  background-color: #fff;
  margin: 0 40rpx 40rpx;
  border-radius: 10rpx;
  padding: 30rpx;
}

.tips-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.tips-item {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
  font-size: 28rpx;
  color: #666;
}

.tips-item:last-child {
  margin-bottom: 0;
}

.tips-item text {
  margin-left: 10rpx;
}

.tips-item.active {
  color: #52c41a;
}

/* 提交按钮 */
.submit-section {
  padding: 0 40rpx;
  margin-bottom: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 32rpx;
  border-radius: 10rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:active {
  background-color: #c01a05;
}

.submit-btn:disabled {
  background-color: #ccc;
  color: #999;
}

/* 忘记密码链接 */
.forgot-section {
  text-align: center;
  padding: 0 40rpx;
}

.forgot-link {
  font-size: 28rpx;
  color: #d81e06;
  text-decoration: underline;
}
</style>
