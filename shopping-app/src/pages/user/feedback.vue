<template>
  <view class="container">
    <view class="feedback-form">
      <view class="form-item">
        <view class="form-label">反馈类型</view>
        <view class="type-selector">
          <view
            class="type-tag"
            v-for="(item, index) in feedbackTypes"
            :key="index"
            :class="{ active: selectedType === item.value }"
            @click="selectedType = item.value"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">反馈内容</view>
        <textarea
          class="feedback-content"
          placeholder="请详细描述您遇到的问题或建议..."
          v-model="content"
          maxlength="500"
        ></textarea>
        <view class="counter">{{ content.length }}/500</view>
      </view>

      <view class="form-item">
        <view class="form-label"
          >上传截图 <text class="label-tip">(选填，最多3张)</text></view
        >
        <view class="upload-box">
          <view class="image-list">
            <view
              class="image-item"
              v-for="(item, index) in imageList"
              :key="index"
            >
              <image :src="item" mode="aspectFill"></image>
              <view class="delete-btn" @click="removeImage(index)">
                <UnifiedIcon type="icon-close" :size="16" color="#fff" />
              </view>
            </view>

            <view
              class="upload-btn"
              v-if="imageList.length < 3"
              @click="chooseImage"
            >
              <UnifiedIcon type="icon-camera" :size="24" color="#999" />
              <text>上传图片</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label"
          >联系方式 <text class="label-tip">(选填)</text></view
        >
        <input
          class="contact-input"
          placeholder="请留下您的手机号或邮箱，方便我们联系您"
          v-model="contactInfo"
        />
      </view>
    </view>

    <view class="submit-section">
      <button class="submit-btn" @click="submitFeedback" :disabled="!content">
        提交反馈
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      feedbackTypes: [
        { label: "功能异常", value: "bug" },
        { label: "体验问题", value: "experience" },
        { label: "功能建议", value: "feature" },
        { label: "其他", value: "other" },
      ],
      selectedType: "bug",
      content: "",
      imageList: [],
      contactInfo: "",
    };
  },
  methods: {
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 3 - this.imageList.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          // 合并选择的图片
          this.imageList = [...this.imageList, ...res.tempFilePaths];
        },
        fail: (err) => {
          console.error("选择图片失败:", err);
        },
      });
    },

    // 移除图片
    removeImage(index) {
      this.imageList.splice(index, 1);
    },

    // 提交反馈
    async submitFeedback() {
      if (!this.content) {
        uni.showToast({
          title: "请输入反馈内容",
          icon: "none",
        });
        return;
      }

      // 显示加载中
      uni.showLoading({
        title: "正在提交...",
      });

      try {
        // 上传图片（如果有）
        let imageUrls = [];
        if (this.imageList.length > 0) {
          imageUrls = await this.uploadImages();
        }

        // 提交反馈数据
        const feedbackData = {
          type: this.selectedType,
          content: this.content,
          images: imageUrls,
          contactInfo: this.contactInfo,
          timestamp: Date.now(),
        };

        // 这里应该调用实际的接口，这里用setTimeout模拟
        setTimeout(() => {
          console.log("提交的反馈数据:", feedbackData);

          // 隐藏加载提示
          uni.hideLoading();

          // 显示成功提示
          uni.showToast({
            title: "提交成功，感谢您的反馈！",
            icon: "success",
            duration: 2000,
          });

          // 延时返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }, 1500);
      } catch (error) {
        console.error("提交反馈失败:", error);
        uni.hideLoading();
        uni.showToast({
          title: "提交失败，请稍后再试",
          icon: "none",
        });
      }
    },

    // 上传图片
    async uploadImages() {
      const promises = this.imageList.map(async (path) => {
        // 这里应该是实际的上传接口，这里用Promise模拟上传过程
        return new Promise((resolve) => {
          setTimeout(() => {
            // 模拟返回URL
            const randomId = Math.floor(Math.random() * 1000000);
            resolve(`https://example.com/uploads/feedback_${randomId}.jpg`);
          }, 500);
        });
      });

      return Promise.all(promises);
    },
  },
};
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.feedback-form {
  background-color: #ffffff;
  padding: 30rpx;
  margin-top: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.label-tip {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

.type-selector {
  display: flex;
  flex-wrap: wrap;
}

.type-tag {
  padding: 12rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 6rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.type-tag.active {
  background-color: rgba(216, 30, 6, 0.1);
  color: #d81e06;
}

.feedback-content {
  width: 100%;
  height: 240rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}

.counter {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.upload-box {
  margin-top: 10rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
}

.image-item {
  width: 160rpx;
  height: 160rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  position: relative;
  overflow: hidden;
  border-radius: 8rpx;
}

.image-item image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  background-color: #f8f8f8;
  border: 1px dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-btn text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.contact-input {
  width: 100%;
  height: 80rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}

.submit-section {
  padding: 40rpx 30rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn[disabled] {
  background-color: #f8f8f8;
  color: #999;
}
</style>
