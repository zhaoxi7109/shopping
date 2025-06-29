<template>
  <view class="container">
    <!-- 个人信息设置 -->
    <view class="setting-section">
      <view class="section-title">个人信息</view>
      <view class="setting-item" @click="navTo('/pages/user/profile')">
        <view class="item-left">
          <UnifiedIcon type="icon-user" :size="20" color="#666" />
          <text>个人资料</text>
        </view>
        <view class="item-right">
          <text class="item-value">{{ userInfo.nickname || "未设置" }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>
    </view>

    <!-- 账号安全 -->
    <view class="setting-section">
      <view class="section-title">账号安全</view>
      <view class="setting-item" @click="navTo('/pages/user/change-password')">
        <view class="item-left">
          <UnifiedIcon type="icon-lock" :size="20" color="#666" />
          <text>修改密码</text>
        </view>
        <view class="item-right">
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>

      <view class="setting-item" @click="navTo('/pages/user/phone-bind')">
        <view class="item-left">
          <UnifiedIcon type="icon-phone" :size="20" color="#666" />
          <text>手机绑定</text>
        </view>
        <view class="item-right">
          <text class="item-value">{{ userInfo.phone || "未绑定" }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>

      <view class="setting-item" @click="navTo('/pages/user/email-bind')">
        <view class="item-left">
          <UnifiedIcon type="icon-email" :size="20" color="#666" />
          <text>邮箱绑定</text>
        </view>
        <view class="item-right">
          <text class="item-value">{{ userInfo.email || "未绑定" }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="setting-section">
      <view class="section-title">通知设置</view>
      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-bell" :size="20" color="#666" />
          <text>推送通知</text>
        </view>
        <view class="item-right">
          <switch
            :checked="notificationSettings.push"
            @change="onPushChange"
            color="#d81e06"
            :disabled="loading.notification"
          />
        </view>
      </view>
      <view class="setting-tips" v-if="notificationSettings.push">
        <text>开启后可接收订单状态、促销活动等重要通知</text>
      </view>

      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-message" :size="20" color="#666" />
          <text>短信通知</text>
        </view>
        <view class="item-right">
          <switch
            :checked="notificationSettings.sms"
            @change="onSmsChange"
            color="#d81e06"
            :disabled="loading.notification || !userInfo.phone"
          />
        </view>
      </view>
      <view class="setting-tips" v-if="!userInfo.phone">
        <text>需要先绑定手机号才能接收短信通知</text>
      </view>

      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-email" :size="20" color="#666" />
          <text>邮件通知</text>
        </view>
        <view class="item-right">
          <switch
            :checked="notificationSettings.email"
            @change="onEmailChange"
            color="#d81e06"
            :disabled="loading.notification || !userInfo.email"
          />
        </view>
      </view>
      <view class="setting-tips" v-if="!userInfo.email">
        <text>需要先绑定邮箱才能接收邮件通知</text>
      </view>
    </view>

    <!-- 隐私设置 -->
    <view class="setting-section">
      <view class="section-title">隐私设置</view>
      <view class="setting-item" @click="navTo('/pages/user/privacy-policy')">
        <view class="item-left">
          <UnifiedIcon type="icon-shield" :size="20" color="#666" />
          <text>隐私政策</text>
        </view>
        <view class="item-right">
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>

      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-eye" :size="20" color="#666" />
          <text>个人资料可见</text>
        </view>
        <view class="item-right">
          <switch
            :checked="privacySettings.profileVisible"
            @change="onProfileVisibleChange"
            color="#d81e06"
            :disabled="loading.privacy"
          />
        </view>
      </view>

      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-cart" :size="20" color="#666" />
          <text>购买历史可见</text>
        </view>
        <view class="item-right">
          <switch
            :checked="privacySettings.purchaseHistoryVisible"
            @change="onPurchaseHistoryVisibleChange"
            color="#d81e06"
            :disabled="loading.privacy"
          />
        </view>
      </view>

      <view class="setting-item">
        <view class="item-left">
          <UnifiedIcon type="icon-comment" :size="20" color="#666" />
          <text>评论可见</text>
        </view>
        <view class="item-right">
          <switch
            :checked="privacySettings.reviewsVisible"
            @change="onReviewsVisibleChange"
            color="#d81e06"
            :disabled="loading.privacy"
          />
        </view>
      </view>
    </view>

    <!-- 应用设置 -->
    <view class="setting-section">
      <view class="section-title">应用设置</view>
      <view class="setting-item" @click="clearCache">
        <view class="item-left">
          <UnifiedIcon type="icon-delete" :size="20" color="#666" />
          <text>清除缓存</text>
        </view>
        <view class="item-right">
          <text class="item-value">{{ cacheSize }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>

      <view class="setting-item" @click="checkUpdate">
        <view class="item-left">
          <UnifiedIcon type="icon-refresh" :size="20" color="#666" />
          <text>检查更新</text>
        </view>
        <view class="item-right">
          <text class="item-value">v1.0.0</text>
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>

      <view class="setting-item" @click="navTo('/pages/user/about')">
        <view class="item-left">
          <UnifiedIcon type="icon-info" :size="20" color="#666" />
          <text>关于我们</text>
        </view>
        <view class="item-right">
          <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { useUserStore } from "@/store/user";
import { api } from "@/utils/api";

export default {
  data() {
    return {
      userInfo: {
        nickname: "",
        avatar: "",
        phone: "",
        email: "",
      },
      // 通知设置
      notificationSettings: {
        push: true,
        sms: true,
        email: false,
      },
      // 隐私设置
      privacySettings: {
        profileVisible: true,
        purchaseHistoryVisible: false,
        reviewsVisible: true,
      },
      cacheSize: "0KB",
      // 添加加载状态
      loading: {
        notification: false,
        privacy: false,
      },
    };
  },

  onLoad() {
    this.initData();
  },

  methods: {
    /**
     * 初始化页面数据
     */
    async initData() {
      await this.getUserInfo();
      await this.getSettings();
      this.calculateCacheSize();
    },

    /**
     * 获取用户信息
     */
    async getUserInfo() {
      try {
        const userStore = useUserStore();
        if (userStore.userInfo) {
          this.userInfo = {
            nickname: userStore.userInfo.username || "",
            avatar: userStore.userInfo.avatar || "",
            phone: userStore.userInfo.phone || "",
            email: userStore.userInfo.email || "",
          };
        }

        // 从服务器获取最新用户信息
        const res = await api.getUserInfo();
        if (res.success && res.data) {
          this.userInfo = {
            ...this.userInfo,
            ...res.data,
          };
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    },

    /**
     * 获取用户设置
     */
    async getSettings() {
      try {
        // 先从本地存储获取设置
        const notificationSettings = uni.getStorageSync("notificationSettings");
        if (notificationSettings) {
          this.notificationSettings = JSON.parse(notificationSettings);
        }

        const privacySettings = uni.getStorageSync("privacySettings");
        if (privacySettings) {
          this.privacySettings = JSON.parse(privacySettings);
        }

        // 从服务器获取最新设置
        await this.getNotificationSettingsFromServer();
        await this.getPrivacySettingsFromServer();
      } catch (error) {
        console.error("获取设置失败:", error);
      }
    },

    /**
     * 从服务器获取通知设置
     */
    async getNotificationSettingsFromServer() {
      try {
        this.loading.notification = true;
        const res = await api.getNotificationSettings();
        if (res.success && res.data) {
          this.notificationSettings = res.data;
          // 更新本地存储
          this.saveNotificationSettings();
        }
      } catch (error) {
        console.error("从服务器获取通知设置失败:", error);
        // 如果是开发环境，模拟获取成功
        if (process.env.NODE_ENV === "development") {
          // 使用默认值或本地存储的值
          uni.showToast({
            title: "开发环境：使用本地通知设置",
            icon: "none",
            duration: 1500,
          });
        }
      } finally {
        this.loading.notification = false;
      }
    },

    /**
     * 从服务器获取隐私设置
     */
    async getPrivacySettingsFromServer() {
      try {
        this.loading.privacy = true;
        const res = await api.getPrivacySettings();
        if (res.success && res.data) {
          this.privacySettings = {
            ...this.privacySettings,
            ...res.data,
          };
          // 更新本地存储
          this.savePrivacySettings();
        }
      } catch (error) {
        console.error("从服务器获取隐私设置失败:", error);
        // 如果是开发环境，模拟获取成功
        if (process.env.NODE_ENV === "development") {
          // 使用默认值或本地存储的值
          uni.showToast({
            title: "开发环境：使用本地隐私设置",
            icon: "none",
            duration: 1500,
          });
        }
      } finally {
        this.loading.privacy = false;
      }
    },

    /**
     * 保存通知设置到本地
     */
    saveNotificationSettings() {
      try {
        uni.setStorageSync(
          "notificationSettings",
          JSON.stringify(this.notificationSettings)
        );
      } catch (error) {
        console.error("保存通知设置失败:", error);
      }
    },

    /**
     * 保存通知设置到服务器
     */
    async saveNotificationSettingsToServer() {
      try {
        this.loading.notification = true;
        const res = await api.updateNotificationSettings(
          this.notificationSettings
        );

        if (res.success) {
          // 同步成功后再保存到本地
          this.saveNotificationSettings();
          uni.showToast({
            title: "设置已更新",
            icon: "success",
            duration: 1500,
          });
        } else {
          throw new Error(res.message || "更新失败");
        }
      } catch (error) {
        console.error("保存通知设置到服务器失败:", error);
        // 如果是开发环境，模拟保存成功
        if (process.env.NODE_ENV === "development") {
          this.saveNotificationSettings();
          uni.showToast({
            title: "开发环境：设置已更新",
            icon: "success",
            duration: 1500,
          });
        } else {
          uni.showToast({
            title: "设置更新失败",
            icon: "none",
            duration: 1500,
          });
        }
      } finally {
        this.loading.notification = false;
      }
    },

    /**
     * 保存隐私设置到本地
     */
    savePrivacySettings() {
      try {
        uni.setStorageSync(
          "privacySettings",
          JSON.stringify(this.privacySettings)
        );
      } catch (error) {
        console.error("保存隐私设置失败:", error);
      }
    },

    /**
     * 保存隐私设置到服务器
     */
    async savePrivacySettingsToServer() {
      try {
        this.loading.privacy = true;
        const res = await api.updatePrivacySettings(this.privacySettings);

        if (res.success) {
          // 同步成功后再保存到本地
          this.savePrivacySettings();
          uni.showToast({
            title: "隐私设置已更新",
            icon: "success",
            duration: 1500,
          });
        } else {
          throw new Error(res.message || "更新失败");
        }
      } catch (error) {
        console.error("保存隐私设置到服务器失败:", error);
        // 如果是开发环境，模拟保存成功
        if (process.env.NODE_ENV === "development") {
          this.savePrivacySettings();
          uni.showToast({
            title: "开发环境：隐私设置已更新",
            icon: "success",
            duration: 1500,
          });
        } else {
          uni.showToast({
            title: "隐私设置更新失败",
            icon: "none",
            duration: 1500,
          });
        }
      } finally {
        this.loading.privacy = false;
      }
    },

    /**
     * 推送通知开关变化
     */
    async onPushChange(e) {
      // 请求通知权限
      if (e.detail.value) {
        await this.requestNotificationPermission("push");
      }

      this.notificationSettings.push = e.detail.value;
      this.saveNotificationSettingsToServer();
    },

    /**
     * 短信通知开关变化
     */
    async onSmsChange(e) {
      this.notificationSettings.sms = e.detail.value;
      this.saveNotificationSettingsToServer();
    },

    /**
     * 邮件通知开关变化
     */
    async onEmailChange(e) {
      this.notificationSettings.email = e.detail.value;
      this.saveNotificationSettingsToServer();
    },

    /**
     * 请求通知权限
     */
    async requestNotificationPermission(type) {
      // 根据不同平台请求通知权限
      // #ifdef APP-PLUS
      const result = await new Promise((resolve) => {
        plus.push.requestPermission(
          { type: type === "push" ? "push" : "all" },
          (result) => {
            resolve(result);
          },
          (error) => {
            console.error("请求通知权限失败:", error);
            resolve(false);
          }
        );
      });

      if (!result) {
        uni.showModal({
          title: "提示",
          content: "需要通知权限才能接收推送消息，请在系统设置中开启",
          showCancel: true,
          confirmText: "去设置",
          success: (res) => {
            if (res.confirm) {
              // 跳转到系统设置
              if (uni.openAppAuthorizeSetting) {
                uni.openAppAuthorizeSetting();
              } else {
                plus.runtime.openSystemSettings();
              }
            } else {
              // 用户取消，关闭开关
              this.notificationSettings.push = false;
              this.saveNotificationSettings();
            }
          },
        });
      }
      // #endif

      // #ifdef MP-WEIXIN
      wx.requestSubscribeMessage({
        tmplIds: ["your_template_id_here"], // 需要替换为实际的模板ID
        success: (res) => {
          if (res["your_template_id_here"] === "accept") {
            // 用户同意
          } else {
            // 用户拒绝
            this.notificationSettings.push = false;
            this.saveNotificationSettings();
            uni.showToast({
              title: "需要订阅消息权限才能接收通知",
              icon: "none",
            });
          }
        },
        fail: (err) => {
          console.error("请求订阅消息失败:", err);
          this.notificationSettings.push = false;
          this.saveNotificationSettings();
        },
      });
      // #endif

      return true;
    },

    /**
     * 个人信息可见开关变化
     */
    onProfileVisibleChange(e) {
      this.privacySettings.profileVisible = e.detail.value;
      this.savePrivacySettingsToServer();
    },

    /**
     * 购买历史可见开关变化
     */
    onPurchaseHistoryVisibleChange(e) {
      this.privacySettings.purchaseHistoryVisible = e.detail.value;
      this.savePrivacySettingsToServer();
    },

    /**
     * 评论可见开关变化
     */
    onReviewsVisibleChange(e) {
      this.privacySettings.reviewsVisible = e.detail.value;
      this.savePrivacySettingsToServer();
    },

    /**
     * 计算缓存大小
     */
    calculateCacheSize() {
      // 模拟计算缓存大小
      const size = Math.floor(Math.random() * 1000) + 100;
      if (size < 1024) {
        this.cacheSize = size + "KB";
      } else {
        this.cacheSize = (size / 1024).toFixed(1) + "MB";
      }
    },

    /**
     * 清除缓存
     */
    clearCache() {
      uni.showModal({
        title: "提示",
        content: "确定要清除缓存吗？",
        success: (res) => {
          if (res.confirm) {
            // 清除缓存逻辑
            try {
              // 清除图片缓存等
              uni.clearStorageSync();
              this.cacheSize = "0KB";
              uni.showToast({
                title: "缓存清除成功",
                icon: "success",
              });
            } catch (error) {
              uni.showToast({
                title: "清除缓存失败",
                icon: "error",
              });
            }
          }
        },
      });
    },

    /**
     * 检查更新
     */
    checkUpdate() {
      uni.showLoading({
        title: "检查中...",
      });

      // 模拟检查更新
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: "已是最新版本",
          icon: "success",
        });
      }, 2000);
    },

    /**
     * 通用导航方法
     */
    navTo(url) {
      uni.navigateTo({
        url: url,
      });
    },

    /**
     * 退出登录
     */
    handleLogout() {
      uni.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            const userStore = useUserStore();
            userStore.logout();

            uni.showToast({
              title: "已退出登录",
              icon: "success",
            });

            // 返回上一页或跳转到首页
            setTimeout(() => {
              uni.switchTab({
                url: "/pages/index/index",
              });
            }, 1500);
          }
        },
      });
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 100rpx;
}

/* 设置区域样式 */
.setting-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #eee;
}

/* 设置项样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background-color: #fff;
}

.setting-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
}

.item-left text {
  margin-left: 20rpx;
  font-size: 30rpx;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-value {
  font-size: 28rpx;
  color: #999;
  margin-right: 10rpx;
}

.avatar-preview {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

/* 退出登录按钮样式 */
.logout-section {
  padding: 40rpx 20rpx;
}

.logout-btn {
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

.logout-btn:active {
  background-color: #c01a05;
}

/* 设置提示文本样式 */
.setting-tips {
  padding: 0 30rpx 20rpx;
  font-size: 24rpx;
  color: #999;
  background-color: #fff;
  line-height: 1.4;
}
</style>
