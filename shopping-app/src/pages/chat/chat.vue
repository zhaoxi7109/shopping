<template>
  <view class="chat-container">
    <!-- 聊天消息区域 -->
    <scroll-view
      class="chat-messages"
      scroll-y
      :scroll-top="scrollTop"
      scroll-with-animation
      :show-scrollbar="false"
      :enhanced="true"
      :bounces="true"
    >
      <view class="message-list">
        <!-- 系统欢迎消息 -->
        <view class="message-item system" v-if="showWelcome">
          <view class="message-content">
            <text class="welcome-text">{{ welcomeMessage }}</text>
          </view>
        </view>

        <!-- 聊天消息 -->
        <view
          class="message-item"
          :class="{
            user: message.type === 'user',
            service: message.type === 'service',
          }"
          v-for="(message, index) in messageList"
          :key="index"
        >
          <!-- 用户头像 -->
          <view class="avatar" v-if="message.type === 'user'">
            <image :src="userAvatar" class="avatar-img" />
          </view>

          <!-- 客服头像 -->
          <view class="avatar" v-if="message.type === 'service'">
            <image :src="serviceAvatar" class="avatar-img" />
          </view>

          <!-- 消息内容 -->
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <view class="message-time">
              <text>{{ message.time }}</text>
            </view>
          </view>
        </view>

        <!-- 客服正在输入提示 -->
        <view class="message-item service" v-if="isServiceTyping">
          <view class="avatar">
            <image :src="serviceAvatar" class="avatar-img" />
          </view>
          <view class="message-content">
            <view class="typing-indicator">
              <view class="typing-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
              <text class="typing-text">客服正在输入...</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷回复区域 -->
    <view class="quick-replies" v-if="showQuickReplies">
      <scroll-view class="quick-scroll" scroll-x>
        <view class="quick-list">
          <view
            class="quick-item"
            v-for="(item, index) in quickReplies"
            :key="index"
            @click="sendQuickReply(item)"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 输入区域 -->
    <view class="chat-input">
      <view class="input-wrapper">
        <input
          class="input-field"
          v-model="inputText"
          placeholder="请输入您的问题..."
          confirm-type="send"
          @confirm="sendMessage"
          @focus="onInputFocus"
          @blur="onInputBlur"
        />
        <view class="input-actions">
          <view class="action-btn" @click="showEmojiPanel">
            <UnifiedIcon type="icon-emoji" :size="24" color="#999" />
          </view>
          <view
            class="send-btn"
            :class="{ active: inputText.trim() }"
            @click="sendMessage"
          >
            <UnifiedIcon type="icon-send" :size="20" color="#fff" />
          </view>
        </view>
      </view>
    </view>

    <!-- 表情面板 -->
    <view class="emoji-panel" v-if="showEmoji">
      <view class="emoji-grid">
        <view
          class="emoji-item"
          v-for="(emoji, index) in emojiList"
          :key="index"
          @click="insertEmoji(emoji)"
        >
          <text>{{ emoji }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from "@/store/user";

export default {
  data() {
    return {
      // 聊天相关数据
      messageList: [],
      inputText: "",
      scrollTop: 0,
      isServiceTyping: false,
      showWelcome: true,
      showQuickReplies: true,
      showEmoji: false,

      // 用户信息
      userInfo: {
        id: "user001",
        name: "用户",
        avatar: "/static/images/avatar/user.png",
      },

      // 客服信息
      serviceInfo: {
        id: "service001",
        name: "客服小助手",
        avatar: "/static/images/avatar/service.png",
      },

      // 头像路径
      userAvatar: "/static/images/avatar/user.png",
      serviceAvatar: "/static/images/avatar/service.png",

      // 欢迎消息
      welcomeMessage:
        "您好！欢迎咨询客服，我是您的专属客服小助手，有什么可以帮助您的吗？",

      // 快捷回复
      quickReplies: [
        "订单问题",
        "退款退货",
        "物流查询",
        "商品咨询",
        "优惠券使用",
        "账户问题",
      ],

      // 表情列表
      emojiList: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "😂",
        "🤣",
        "😊",
        "😇",
        "🙂",
        "🙃",
        "😉",
        "😌",
        "😍",
        "🥰",
        "😘",
        "😗",
        "😙",
        "😚",
        "😋",
        "😛",
        "😝",
        "😜",
        "🤪",
        "🤨",
        "🧐",
        "🤓",
        "😎",
        "🤩",
        "🥳",
        "😏",
        "😒",
        "😞",
        "😔",
        "😟",
        "😕",
        "🙁",
        "☹️",
        "😣",
        "😖",
        "😫",
        "😩",
        "🥺",
        "😢",
        "😭",
        "😤",
        "😠",
      ],

      // 聊天类型和目标ID
      chatType: "",
      targetId: "",

      // 适配相关参数
      safeAreaHeight: 0,
      keyboardHeight: 0,
    };
  },

  onLoad(options) {
    // 获取页面参数
    this.chatType = options.type || "service";
    this.targetId = options.targetId || "service001";

    // 初始化用户store
    this.userStore = useUserStore();

    // 检查登录状态
    this.checkLoginStatus();

    // 获取安全区域高度
    this.getSafeAreaHeight();

    // 监听键盘高度变化
    uni.onKeyboardHeightChange((res) => {
      this.keyboardHeight = res.height;
      this.adjustLayout();
      this.scrollToBottom();
    });
  },

  onReady() {
    // 页面渲染完成后滚动到底部
    this.scrollToBottom();
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
          content: "登录已过期，请重新登录后使用在线客服功能",
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
          content: "请先登录后再使用在线客服功能",
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

      // 登录状态正常，初始化聊天
      this.initChat();
    },

    /**
     * 初始化聊天
     */
    initChat() {
      // 获取用户信息
      this.getUserInfo();

      // 加载聊天历史
      this.loadChatHistory();

      // 模拟延迟显示欢迎消息
      setTimeout(() => {
        this.showWelcome = true;
        this.scrollToBottom();
      }, 500);
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
      if (this.userStore.userInfo) {
        this.userInfo = {
          id: this.userStore.userInfo.id,
          name: this.userStore.userInfo.username,
          avatar:
            this.userStore.userInfo.avatar || "/static/images/avatar/user.png",
        };
        this.userAvatar = this.userInfo.avatar;
      }
    },

    /**
     * 加载聊天历史
     */
    async loadChatHistory() {
      try {
        if (!this.userStore.token) {
          console.log("未登录，跳过加载聊天历史");
          return;
        }

        const response = await uni.request({
          url: `http://localhost:3000/api/chat/history/${this.targetId}`,
          method: "GET",
          header: {
            Authorization: `Bearer ${this.userStore.token}`,
            "Content-Type": "application/json",
          },
          data: {
            page: 1,
            limit: 50,
          },
        });

        if (response.data.success && response.data.data.messages) {
          // 转换服务器消息格式为前端格式
          this.messageList = response.data.data.messages.map((msg) => ({
            id: msg.id,
            type: msg.senderId === this.userInfo.id ? "user" : "service",
            content: msg.content,
            time: this.formatTime(new Date(msg.timestamp)),
            avatar:
              msg.senderId === this.userInfo.id
                ? this.userAvatar
                : this.serviceAvatar,
          }));

          this.showWelcome = this.messageList.length === 0;
          this.scrollToBottom();
        }
      } catch (error) {
        console.error("加载聊天历史失败:", error);
      }
    },

    /**
     * 发送消息
     */
    async sendMessage() {
      const content = this.inputText.trim();
      if (!content) {
        return;
      }

      // 添加用户消息到界面
      const userMessage = {
        id: Date.now(),
        type: "user",
        content: content,
        time: this.formatTime(new Date()),
        avatar: this.userAvatar,
      };

      this.messageList.push(userMessage);
      this.inputText = "";
      this.showQuickReplies = false;
      this.scrollToBottom();

      // 发送消息到服务器
      await this.sendMessageToServer(content);
    },

    /**
     * 发送快捷回复
     */
    sendQuickReply(content) {
      this.inputText = content;
      this.sendMessage();
    },

    /**
     * 发送消息到服务器
     */
    async sendMessageToServer(content) {
      try {
        if (!this.userStore.token) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          return;
        }

        // 显示正在输入状态
        this.isServiceTyping = true;
        this.scrollToBottom();

        const response = await uni.request({
          url: "http://localhost:3000/api/chat/send",
          method: "POST",
          header: {
            Authorization: `Bearer ${this.userStore.token}`,
            "Content-Type": "application/json",
          },
          data: {
            targetId: this.targetId,
            content: content,
            type: "text",
          },
        });

        if (response.data.success) {
          // 消息发送成功，等待服务器自动回复
          setTimeout(() => {
            this.loadLatestMessages();
          }, 2000);
        } else {
          this.isServiceTyping = false;
          uni.showToast({
            title: response.data.message || "发送失败",
            icon: "none",
          });
        }
      } catch (error) {
        this.isServiceTyping = false;
        console.error("发送消息失败:", error);
        uni.showToast({
          title: "发送失败，请重试",
          icon: "none",
        });
      }
    },

    /**
     * 加载最新消息
     */
    async loadLatestMessages() {
      try {
        if (!this.userStore.token) return;

        const response = await uni.request({
          url: `http://localhost:3000/api/chat/history/${this.targetId}`,
          method: "GET",
          header: {
            Authorization: `Bearer ${this.userStore.token}`,
            "Content-Type": "application/json",
          },
          data: {
            page: 1,
            limit: 10,
          },
        });

        if (response.data.success && response.data.data.messages) {
          const serverMessages = response.data.data.messages;
          const lastLocalMessageId =
            this.messageList.length > 0
              ? this.messageList[this.messageList.length - 1].id
              : 0;

          // 只添加新消息
          const newMessages = serverMessages
            .filter((msg) => parseInt(msg.id) > lastLocalMessageId)
            .map((msg) => ({
              id: msg.id,
              type: msg.senderId === this.userInfo.id ? "user" : "service",
              content: msg.content,
              time: this.formatTime(new Date(msg.timestamp)),
              avatar:
                msg.senderId === this.userInfo.id
                  ? this.userAvatar
                  : this.serviceAvatar,
            }));

          if (newMessages.length > 0) {
            this.messageList.push(...newMessages);
            this.scrollToBottom();
          }
        }

        this.isServiceTyping = false;
      } catch (error) {
        this.isServiceTyping = false;
        console.error("加载最新消息失败:", error);
      }
    },

    /**
     * 输入框聚焦
     */
    onInputFocus() {
      this.showEmoji = false;
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    },

    /**
     * 输入框失焦
     */
    onInputBlur() {
      // 延迟隐藏表情面板，避免点击表情时面板消失
      setTimeout(() => {
        this.showEmoji = false;
      }, 200);
    },

    /**
     * 显示表情面板
     */
    showEmojiPanel() {
      this.showEmoji = !this.showEmoji;
      if (this.showEmoji) {
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      }
    },

    /**
     * 插入表情
     */
    insertEmoji(emoji) {
      this.inputText += emoji;
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.scrollTop = this.scrollTop + 999999;
        }, 100);
      });
    },

    /**
     * 格式化时间
     */
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },

    /**
     * 获取安全区域高度
     */
    getSafeAreaHeight() {
      const systemInfo = uni.getSystemInfoSync();
      this.safeAreaHeight = systemInfo.safeArea
        ? systemInfo.screenHeight - systemInfo.safeArea.bottom
        : 0;
    },

    /**
     * 调整布局
     */
    adjustLayout() {
      // 键盘弹出时自动滚动到底部
      if (this.keyboardHeight > 0) {
        this.showEmoji = false;
        this.scrollToBottom();
      }
    },
  },
};
</script>

<style>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.message-list {
  padding-bottom: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.system {
  justify-content: center;
  margin: 40rpx 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 20rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  border: 2rpx solid #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-item.service .message-content {
  align-items: flex-start;
}

.message-bubble {
  padding: 24rpx 32rpx;
  border-radius: 24rpx;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  color: #fff;
  border-radius: 24rpx 24rpx 8rpx 24rpx;
}

.message-item.service .message-bubble {
  background-color: #fff;
  color: #333;
  border: 1rpx solid #e8e8e8;
  border-radius: 24rpx 24rpx 24rpx 8rpx;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.4;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 10rpx;
}

.welcome-text {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #666;
  padding: 20rpx 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid #dee2e6;
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.typing-dots {
  display: flex;
  margin-right: 20rpx;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #999;
  margin-right: 6rpx;
  animation: typing 1.4s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

.typing-text {
  font-size: 24rpx;
  color: #999;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10rpx);
    opacity: 1;
  }
}

.quick-replies {
  background-color: #fff;
  padding: 20rpx 20rpx 10rpx;
  border-top: 1rpx solid #e0e0e0;
  flex-shrink: 0;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.quick-scroll {
  white-space: nowrap;
}

.quick-list {
  display: flex;
  flex-wrap: nowrap;
}

.quick-item {
  padding: 16rpx 28rpx;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 32rpx;
  margin-right: 16rpx;
  font-size: 24rpx;
  color: #495057;
  white-space: nowrap;
  border: 2rpx solid #e9ecef;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.quick-item:active {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  color: #fff;
  border-color: #d81e06;
  transform: translateY(1rpx);
}

.chat-input {
  background-color: #fff;
  padding: 20rpx;
  border-top: 1rpx solid #e0e0e0;
  flex-shrink: 0;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  z-index: 10;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 50rpx;
  padding: 12rpx 24rpx;
  border: 2rpx solid #e9ecef;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #d81e06;
  background-color: #fff;
  box-shadow: 0 0 0 4rpx rgba(216, 30, 6, 0.1);
}

.input-field {
  flex: 1;
  font-size: 28rpx;
  padding: 20rpx 0;
  background-color: transparent;
  border: none;
  outline: none;
}

.input-actions {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
}

.action-btn {
  padding: 10rpx;
  margin-right: 10rpx;
}

.send-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ccc 0%, #adb5bd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.send-btn.active {
  background: linear-gradient(135deg, #d81e06 0%, #ff4757 100%);
  transform: scale(1.05);
  box-shadow: 0 4rpx 12rpx rgba(216, 30, 6, 0.3);
}

.emoji-panel {
  background-color: #fff;
  border-top: 1rpx solid #e0e0e0;
  padding: 20rpx;
  height: 360rpx;
  flex-shrink: 0;
  box-sizing: border-box;
  z-index: 9;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  height: 100%;
  overflow-y: auto;
}

.emoji-item {
  width: 12.5%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.emoji-item:active {
  background-color: #f8f9fa;
  transform: scale(1.2);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
</style>
