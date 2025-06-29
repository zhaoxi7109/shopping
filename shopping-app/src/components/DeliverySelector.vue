<template>
  <view class="delivery-selector" v-if="visible" @click="close">
    <view class="selector-content" @click.stop>
      <view class="selector-header">
        <text class="title">{{ title }}</text>
        <view class="close-btn" @click="close">
          <UnifiedIcon type="icon-close" :size="20" color="#666" />
        </view>
      </view>

      <view class="selector-body">
        <view
          class="option-item"
          v-for="(option, index) in options"
          :key="index"
          :class="{ active: selectedIndex === index }"
          @click="selectOption(index)"
        >
          <view class="option-content">
            <view class="option-main">
              <text class="option-name">{{ option.name || option }}</text>
              <text class="option-fee" v-if="option.fee !== undefined">
                {{ option.fee > 0 ? "+¥" + option.fee : "免费" }}
              </text>
            </view>
            <text class="option-desc" v-if="option.desc">{{
              option.desc
            }}</text>
          </view>
          <view class="option-check" v-if="selectedIndex === index">
            <UnifiedIcon type="icon-check" :size="18" color="#d81e06" />
          </view>
        </view>
      </view>

      <view class="selector-footer">
        <view class="cancel-btn" @click="close">取消</view>
        <view class="confirm-btn" @click="confirm">确定</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "DeliverySelector",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "请选择",
    },
    options: {
      type: Array,
      default: () => [],
    },
    defaultIndex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      selectedIndex: this.defaultIndex,
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.selectedIndex = this.defaultIndex;
      }
    },
    defaultIndex(newVal) {
      this.selectedIndex = newVal;
    },
  },
  methods: {
    selectOption(index) {
      this.selectedIndex = index;
    },
    confirm() {
      this.$emit("confirm", {
        index: this.selectedIndex,
        option: this.options[this.selectedIndex],
      });
      this.close();
    },
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.delivery-selector {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}

.selector-content {
  width: 100%;
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  animation: slideUp 0.3s ease;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  padding: 6rpx;
}

.selector-body {
  max-height: 50vh;
  overflow-y: auto;
  padding: 12rpx 0;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 24rpx;
  border-bottom: 1rpx solid #f8f8f8;
  transition: background-color 0.2s;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item.active {
  background-color: #fef7f7;
}

.option-content {
  flex: 1;
}

.option-main {
  display: flex;
  align-items: center;
  margin-bottom: 6rpx;
}

.option-name {
  font-size: 28rpx;
  color: #333;
  margin-right: 16rpx;
}

.option-fee {
  font-size: 24rpx;
  color: #d81e06;
  font-weight: 500;
}

.option-desc {
  font-size: 22rpx;
  color: #999;
}

.option-check {
  margin-left: 16rpx;
}

.selector-footer {
  display: flex;
  padding: 16rpx 24rpx 32rpx;
  gap: 16rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:active {
  background-color: #e8e8e8;
}

.confirm-btn {
  background-color: #d81e06;
  color: #fff;
}

.confirm-btn:active {
  background-color: #c01a05;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
