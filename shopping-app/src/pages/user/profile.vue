<template>
  <view class="container">
    <!-- 头像设置 -->
    <view class="profile-section">
      <view class="avatar-section" @click="changeAvatar">
        <image class="avatar" :src="avatarUrl" mode="aspectFill"></image>
        <view class="avatar-overlay">
          <UnifiedIcon type="icon-camera" :size="14" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 个人信息表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">昵称</text>
        <input
          class="input"
          v-model="userInfo.nickname"
          placeholder="请输入昵称"
          maxlength="20"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item arrow">
        <text class="label">性别</text>
        <picker
          mode="selector"
          :range="genderOptions"
          :value="genderIndex"
          @change="onGenderChange"
          class="picker-full"
        >
          <view class="picker-value">
            <text>{{ genderOptions[genderIndex] || "请选择性别" }}</text>
          </view>
        </picker>
      </view>

      <view class="form-item arrow">
        <text class="label">生日</text>
        <picker
          mode="date"
          :value="userInfo.birthday"
          @change="onBirthdayChange"
          class="picker-full"
        >
          <view class="picker-value">
            <text>{{ userInfo.birthday || "请选择生日" }}</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input
          class="input"
          v-model="userInfo.phone"
          placeholder="请输入手机号"
          type="number"
          maxlength="11"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">邮箱</text>
        <input
          class="input"
          v-model="userInfo.email"
          placeholder="请输入邮箱"
          type="email"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item bio-item">
        <text class="label">个人简介</text>
        <textarea
          class="textarea"
          v-model="userInfo.bio"
          placeholder="请输入个人简介"
          maxlength="200"
          auto-height
          placeholder-class="placeholder"
        ></textarea>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button class="save-btn" @click="saveProfile" :loading="saving">
        保存
      </button>
    </view>
  </view>
</template>

<script>
import { useUserStore } from "@/store/user";
import { api } from "@/utils/api";
import { getImageUrl } from "@/utils/image";

export default {
  data() {
    return {
      userInfo: {
        nickname: "",
        avatar: "",
        gender: 0, // 0: 未知, 1: 男, 2: 女
        birthday: "",
        phone: "",
        email: "",
        bio: "",
      },
      genderOptions: ["未知", "男", "女"],
      genderIndex: 0,
      saving: false,
    };
  },

  computed: {
    avatarUrl() {
      // 处理头像URL，确保能正确显示
      if (this.userInfo.avatar) {
        // 如果是临时文件路径（本地上传的图片），直接返回
        if (
          this.userInfo.avatar.startsWith("blob:") ||
          this.userInfo.avatar.startsWith("file:") ||
          this.userInfo.avatar.startsWith("/storage/") ||
          this.userInfo.avatar.startsWith("wxfile://")
        ) {
          return this.userInfo.avatar;
        }
        // 否则使用图片处理工具处理URL
        return getImageUrl(this.userInfo.avatar);
      }
      // 默认头像
      return "/static/images/user/default-avatar.png";
    },
  },

  onLoad() {
    this.initData();
  },

  methods: {
    /**
     * 初始化数据
     */
    async initData() {
      await this.getUserInfo();
    },

    /**
     * 获取用户信息
     */
    async getUserInfo() {
      try {
        // 先从本地获取用户信息
        const userStore = useUserStore();
        if (userStore.userInfo) {
          this.userInfo = {
            nickname: userStore.userInfo.username || "",
            avatar: userStore.userInfo.avatar || "",
            gender: userStore.userInfo.gender || 0,
            birthday: userStore.userInfo.birthday || "",
            phone: userStore.userInfo.phone || "",
            email: userStore.userInfo.email || "",
            bio: userStore.userInfo.bio || "",
          };
          this.genderIndex = this.userInfo.gender;
        }

        // 从服务器获取最新用户信息
        const res = await api.getUserInfo();
        if (res.success && res.data) {
          // 合并用户信息，保留本地临时头像（如果有）
          const serverAvatar = res.data.avatar;
          const localAvatar = this.userInfo.avatar;

          // 如果本地有临时上传的头像且与服务器不同，保留本地头像
          const isLocalTempAvatar =
            localAvatar &&
            (localAvatar.startsWith("blob:") ||
              localAvatar.startsWith("file:") ||
              localAvatar.startsWith("/storage/") ||
              localAvatar.startsWith("wxfile://"));

          this.userInfo = {
            ...this.userInfo,
            ...res.data,
            // 如果本地有临时头像，优先使用本地头像
            avatar: isLocalTempAvatar
              ? localAvatar
              : serverAvatar || localAvatar,
          };

          this.genderIndex = this.userInfo.gender || 0;

          // 更新用户信息到store
          userStore.updateUserInfo({
            avatar: this.userInfo.avatar,
            username: this.userInfo.nickname,
            gender: this.userInfo.gender,
            birthday: this.userInfo.birthday,
            phone: this.userInfo.phone,
            email: this.userInfo.email,
            bio: this.userInfo.bio,
          });
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        uni.showToast({
          title: "获取用户信息失败",
          icon: "none",
        });
      }
    },

    /**
     * 更换头像
     */
    changeAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        },
        fail: (error) => {
          console.error("选择图片失败:", error);
          uni.showToast({
            title: "选择图片失败",
            icon: "error",
          });
        },
      });
    },

    /**
     * 上传头像
     */
    async uploadAvatar(filePath) {
      uni.showLoading({
        title: "上传中...",
      });

      try {
        // 这里应该调用实际的上传接口
        const res = await api.updateAvatar({
          avatar: filePath,
        });

        if (res.success) {
          // 更新本地头像
          this.userInfo.avatar = res.data.avatar || filePath;

          // 更新用户信息
          const userStore = useUserStore();
          userStore.updateUserInfo({ avatar: this.userInfo.avatar });

          uni.hideLoading();
          uni.showToast({
            title: "头像上传成功",
            icon: "success",
          });
        } else {
          throw new Error(res.message || "上传失败");
        }
      } catch (error) {
        uni.hideLoading();
        console.error("上传头像失败:", error);

        // 如果是开发环境，模拟上传成功
        if (process.env.NODE_ENV === "development") {
          this.userInfo.avatar = filePath;
          const userStore = useUserStore();
          userStore.updateUserInfo({ avatar: filePath });

          uni.showToast({
            title: "开发环境：头像已更新",
            icon: "success",
          });
        } else {
          uni.showToast({
            title: "上传失败",
            icon: "error",
          });
        }
      }
    },

    /**
     * 性别选择变化
     */
    onGenderChange(e) {
      this.genderIndex = e.detail.value;
      this.userInfo.gender = parseInt(e.detail.value);
    },

    /**
     * 生日选择变化
     */
    onBirthdayChange(e) {
      this.userInfo.birthday = e.detail.value;
    },

    /**
     * 保存个人资料
     */
    async saveProfile() {
      // 验证必填字段
      if (!this.userInfo.nickname.trim()) {
        uni.showToast({
          title: "请输入昵称",
          icon: "error",
        });
        return;
      }

      // 验证手机号格式
      if (this.userInfo.phone && !/^1[3-9]\d{9}$/.test(this.userInfo.phone)) {
        uni.showToast({
          title: "手机号格式不正确",
          icon: "error",
        });
        return;
      }

      // 验证邮箱格式
      if (
        this.userInfo.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.userInfo.email)
      ) {
        uni.showToast({
          title: "邮箱格式不正确",
          icon: "error",
        });
        return;
      }

      this.saving = true;

      try {
        // 调用更新用户信息接口
        const res = await api.updateUserInfo(this.userInfo);

        if (res.success) {
          // 更新本地用户信息
          const userStore = useUserStore();
          userStore.updateUserInfo(this.userInfo);

          uni.showToast({
            title: "保存成功",
            icon: "success",
          });

          // 延迟返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || "保存失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("保存个人资料失败:", error);
        uni.showToast({
          title: "保存失败",
          icon: "error",
        });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

/* 头像设置区域 */
.profile-section {
  background-color: #fff;
  padding: 30rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.avatar-section {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid #f0f0f0;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8rpx;
  border-radius: 50%;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
}

/* 表单区域 */
.form-section {
  background-color: #fff;
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
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
  padding-right: 20rpx;
  height: 60rpx;
}

.textarea {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  min-height: 120rpx;
  text-align: right;
  padding-right: 20rpx;
  padding-top: 10rpx;
}

.picker-full {
  flex: 1;
  width: 100%;
}

.picker-value {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 30rpx;
  color: #333;
  padding-right: 40rpx;
  text-align: right;
}

.picker-value text {
  text-align: right;
  width: 100%;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

/* 右箭头图标样式 */
.arrow::after {
  content: "";
  position: absolute;
  right: 30rpx;
  top: 50%;
  width: 12rpx;
  height: 12rpx;
  border-top: 2rpx solid #ccc;
  border-right: 2rpx solid #ccc;
  transform: translateY(-50%) rotate(45deg);
  z-index: 1;
}

/* 个人简介特殊处理 */
.bio-item {
  align-items: flex-start;
  padding-top: 20rpx;
}

.bio-item .label {
  margin-top: 10rpx;
}

/* 保存按钮 */
.save-section {
  padding: 0 40rpx;
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(216, 30, 6, 0.3);
}

.save-btn:active {
  background-color: #c01a05;
  transform: scale(0.98);
}
</style>
