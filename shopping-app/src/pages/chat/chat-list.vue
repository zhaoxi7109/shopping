<template>
  <view class="chat-list-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <UnifiedIcon type="icon-search" :size="16" color="#999" />
        <input
          class="search-field"
          v-model="searchKeyword"
          placeholder="搜索聊天记录"
          @input="onSearchInput"
        />
        <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">
          <UnifiedIcon type="icon-close" :size="14" color="#999" />
        </view>
      </view>
    </view>

    <!-- 聊天列表 -->
    <view class="chat-list" v-if="filteredChatList.length > 0">
      <view
        class="chat-item"
        v-for="(chat, index) in filteredChatList"
        :key="index"
        @click="openChat(chat)"
      >
        <!-- 头像 -->
        <view class="chat-avatar">
          <image :src="chat.targetAvatar" class="avatar-img" />
          <view
            class="online-status"
            v-if="chat.targetId.startsWith('service')"
          ></view>
        </view>

        <!-- 聊天信息 -->
        <view class="chat-info">
          <view class="chat-header">
            <text class="chat-name">{{ chat.targetName }}</text>
            <text class="chat-time">{{ formatChatTime(chat.updatedAt) }}</text>
          </view>
          <view class="chat-preview">
            <text
              class="last-message"
              :class="{ unread: chat.unreadCount > 0 }"
            >
              {{ getMessagePreview(chat.lastMessage) }}
            </text>
            <view class="unread-badge" v-if="chat.unreadCount > 0">
              <text class="unread-count">{{
                chat.unreadCount > 99 ? "99+" : chat.unreadCount
              }}</text>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="chat-actions">
          <view class="action-btn" @click.stop="deleteChat(chat, index)">
            <UnifiedIcon type="icon-delete" :size="16" color="#999" />
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <UnifiedIcon type="icon-chat" :size="80" color="#ccc" />
      </view>
      <text class="empty-text">暂无聊天记录</text>
      <text class="empty-desc">开始与客服聊天吧</text>
      <view class="start-chat-btn" @click="startNewChat">
        <text>联系客服</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <uni-load-more status="loading" />
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user'

export default {
  data() {
    return {
      chatList: [],
      searchKeyword: "",
      loading: false,
      userInfo: null,
    };
  },

  computed: {
    /**
     * 过滤后的聊天列表
     */
    filteredChatList() {
      if (!this.searchKeyword.trim()) {
        return this.chatList;
      }

      const keyword = this.searchKeyword.toLowerCase();
      return this.chatList.filter(
        (chat) =>
          chat.targetName.toLowerCase().includes(keyword) ||
          chat.lastMessage.content.toLowerCase().includes(keyword)
      );
    },
  },

  onLoad() {
    // 初始化用户store
    this.userStore = useUserStore();
    this.checkLoginStatus();
  },

  onShow() {
    // 页面显示时刷新聊天列表
    this.loadChatList();
  },

  onPullDownRefresh() {
    this.loadChatList().then(() => {
      uni.stopPullDownRefresh();
    });
  },

  methods: {
    /**
     * 检查登录状态
     */
    checkLoginStatus() {
      // 检查token是否过期
      if (!this.userStore.checkTokenExpiration()) {
        uni.showModal({
          title: "登录提示",
          content: "登录已过期，请重新登录后查看聊天记录",
          showCancel: true,
          confirmText: "去登录",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              uni.redirectTo({
                url: "/pages/login/login",
              });
            } else {
              uni.navigateBack();
            }
          },
        });
        return;
      }

      // 检查是否已登录
      if (!this.userStore.isLoggedIn || !this.userStore.userInfo) {
        uni.showModal({
          title: "登录提示",
          content: "请先登录后再查看聊天记录",
          showCancel: true,
          confirmText: "去登录",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              uni.redirectTo({
                url: "/pages/login/login",
              });
            } else {
              uni.navigateBack();
            }
          },
        });
        return;
      }

      // 登录状态正常，初始化页面
      this.getUserInfo();
      this.loadChatList();
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
      if (this.userStore.userInfo) {
        this.userInfo = {
          id: this.userStore.userInfo.id,
          username: this.userStore.userInfo.username,
          email: this.userStore.userInfo.email,
          avatar: this.userStore.userInfo.avatar,
        };
      }
    },

    /**
     * 加载聊天列表
     */
    async loadChatList() {
      try {
        this.loading = true;

        if (!this.userStore.token) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          setTimeout(() => {
            uni.navigateTo({
              url: "/pages/login/login",
            });
          }, 1500);
          return;
        }

        const response = await uni.request({
          url: "http://localhost:3000/api/chat/list",
          method: "GET",
          header: {
            Authorization: `Bearer ${this.userStore.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data.success) {
          this.chatList = response.data.data || [];
        } else {
          uni.showToast({
            title: response.data.message || "加载失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("加载聊天列表失败:", error);
        uni.showToast({
          title: "加载失败，请重试",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 打开聊天
     */
    openChat(chat) {
      uni.navigateTo({
        url: `/pages/chat/chat?type=service&targetId=${chat.targetId}`,
      });
    },

    /**
     * 开始新聊天
     */
    startNewChat() {
      uni.navigateTo({
        url: "/pages/chat/chat?type=service&targetId=service001",
      });
    },

    /**
     * 删除聊天
     */
    async deleteChat(chat, index) {
      try {
        const result = await uni.showModal({
          title: "确认删除",
          content: `确定要删除与${chat.targetName}的聊天记录吗？`,
          confirmText: "删除",
          confirmColor: "#d81e06",
        });

        if (!result.confirm) {
          return;
        }

        const response = await uni.request({
          url: `http://localhost:3000/api/chat/${chat.targetId}`,
          method: "DELETE",
          header: {
            Authorization: `Bearer ${this.userStore.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data.success) {
          this.chatList.splice(index, 1);
          uni.showToast({
            title: "删除成功",
            icon: "success",
          });
        } else {
          uni.showToast({
            title: response.data.message || "删除失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("删除聊天失败:", error);
        uni.showToast({
          title: "删除失败，请重试",
          icon: "none",
        });
      }
    },

    /**
     * 搜索输入
     */
    onSearchInput() {
      // 可以添加防抖逻辑
    },

    /**
     * 清除搜索
     */
    clearSearch() {
      this.searchKeyword = "";
    },

    /**
     * 获取消息预览
     */
    getMessagePreview(lastMessage) {
      if (!lastMessage) {
        return "暂无消息";
      }

      let preview = lastMessage.content;
      if (lastMessage.type === "image") {
        preview = "[图片]";
      } else if (lastMessage.type === "file") {
        preview = "[文件]";
      }

      // 限制预览长度
      return preview.length > 30 ? preview.substring(0, 30) + "..." : preview;
    },

    /**
     * 格式化聊天时间
     */
    formatChatTime(timestamp) {
      const now = new Date();
      const messageTime = new Date(timestamp);
      const diffMs = now - messageTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // 今天
        const hours = messageTime.getHours().toString().padStart(2, "0");
        const minutes = messageTime.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      } else if (diffDays === 1) {
        // 昨天
        return "昨天";
      } else if (diffDays < 7) {
        // 一周内
        const weekdays = [
          "周日",
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
        ];
        return weekdays[messageTime.getDay()];
      } else {
        // 超过一周
        const month = (messageTime.getMonth() + 1).toString().padStart(2, "0");
        const day = messageTime.getDate().toString().padStart(2, "0");
        return `${month}/${day}`;
      }
    },
  },
};
</script>

<style>
.chat-list-container {
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow: hidden;
}

.search-bar {
  background-color: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 50rpx;
  padding: 20rpx 30rpx;
  border: 2rpx solid #e9ecef;
  transition: all 0.3s ease;
}

.search-input:focus-within {
  border-color: #d81e06;
  background-color: #fff;
  box-shadow: 0 0 0 4rpx rgba(216, 30, 6, 0.1);
}

.search-field {
  flex: 1;
  font-size: 28rpx;
  margin-left: 20rpx;
  background-color: transparent;
  border: none;
  outline: none;
}

.clear-btn {
  padding: 10rpx;
  margin-left: 10rpx;
}

.chat-list {
  background-color: #fff;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  transition: all 0.3s ease;
}

.chat-item:active {
  background-color: #f8f9fa;
  transform: translateX(4rpx);
}

.chat-avatar {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  border: 2rpx solid #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-status {
  position: absolute;
  bottom: 5rpx;
  right: 5rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #52c41a;
  border-radius: 50%;
  border: 2rpx solid #fff;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.chat-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.chat-time {
  font-size: 22rpx;
  color: #999;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 26rpx;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message.unread {
  font-weight: 500;
  color: #333;
}

.unread-badge {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  border-radius: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(216, 30, 6, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.unread-count {
  font-size: 20rpx;
  color: #fff;
  padding: 0 8rpx;
}

.chat-actions {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
}

.action-btn {
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  text-align: center;
}

.empty-icon {
  margin-bottom: 40rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.start-chat-btn {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  color: #fff;
  padding: 28rpx 64rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(216, 30, 6, 0.3);
  transition: all 0.3s ease;
}

.start-chat-btn:active {
  background: linear-gradient(135deg, #c01e06 0%, #e74c3c 100%);
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(216, 30, 6, 0.4);
}

.loading-state {
  padding: 40rpx;
  text-align: center;
}
</style>
