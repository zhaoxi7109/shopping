<template>
  <view class="container">
    <view class="content">
      <view class="section">
        <view class="section-title">隐私政策</view>
        <view class="update-time">最后更新时间：2024年1月1日</view>
      </view>

      <view class="section">
        <view class="section-header">1. 信息收集</view>
        <view class="section-content">
          <text class="paragraph">
            我们可能收集您提供的个人信息，包括但不限于：
          </text>
          <view class="list-item">• 姓名、电话号码、邮箱地址等联系信息</view>
          <view class="list-item">• 收货地址、支付信息等交易相关信息</view>
          <view class="list-item">• 设备信息、IP地址、浏览记录等技术信息</view>
          <view class="list-item">• 您主动提供的其他信息</view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">2. 信息使用</view>
        <view class="section-content">
          <text class="paragraph"> 我们使用收集的信息用于以下目的： </text>
          <view class="list-item">• 提供、维护和改进我们的服务</view>
          <view class="list-item">• 处理交易和发送相关通知</view>
          <view class="list-item">• 提供客户支持和技术支持</view>
          <view class="list-item">• 发送产品更新、营销信息等</view>
          <view class="list-item">• 遵守法律法规要求</view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">3. 信息共享</view>
        <view class="section-content">
          <text class="paragraph">
            我们不会出售、交易或转让您的个人信息给第三方，除非：
          </text>
          <view class="list-item">• 获得您的明确同意</view>
          <view class="list-item">• 为完成交易所必需的服务提供商</view>
          <view class="list-item">• 法律法规要求或政府部门要求</view>
          <view class="list-item">• 保护我们的权利、财产或安全</view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">4. 信息安全</view>
        <view class="section-content">
          <text class="paragraph">
            我们采取适当的安全措施保护您的个人信息：
          </text>
          <view class="list-item">• 使用加密技术保护数据传输</view>
          <view class="list-item">• 限制员工访问个人信息</view>
          <view class="list-item">• 定期审查安全措施</view>
          <view class="list-item">• 及时通知安全事件</view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">5. 您的权利</view>
        <view class="section-content">
          <text class="paragraph"> 您对个人信息享有以下权利： </text>
          <view class="list-item">• 访问和查看您的个人信息</view>
          <view class="list-item">• 更正不准确的个人信息</view>
          <view class="list-item">• 删除您的个人信息</view>
          <view class="list-item">• 限制或反对处理您的个人信息</view>
          <view class="list-item">• 数据可携带权</view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">6. Cookie使用</view>
        <view class="section-content">
          <text class="paragraph"> 我们使用Cookie和类似技术来： </text>
          <view class="list-item">• 记住您的偏好设置</view>
          <view class="list-item">• 分析网站使用情况</view>
          <view class="list-item">• 提供个性化内容</view>
          <view class="list-item">• 改善用户体验</view>
          <text class="paragraph"> 您可以通过浏览器设置管理Cookie偏好。 </text>
        </view>
      </view>

      <view class="section">
        <view class="section-header">7. 第三方链接</view>
        <view class="section-content">
          <text class="paragraph">
            我们的服务可能包含第三方网站链接。我们不对这些第三方网站的隐私做法负责。建议您查看这些网站的隐私政策。
          </text>
        </view>
      </view>

      <view class="section">
        <view class="section-header">8. 儿童隐私</view>
        <view class="section-content">
          <text class="paragraph">
            我们的服务不面向13岁以下儿童。我们不会故意收集13岁以下儿童的个人信息。如果我们发现收集了此类信息，将立即删除。
          </text>
        </view>
      </view>

      <view class="section">
        <view class="section-header">9. 政策更新</view>
        <view class="section-content">
          <text class="paragraph">
            我们可能会不时更新本隐私政策。重大变更将通过应用内通知或其他方式告知您。继续使用我们的服务即表示您接受更新后的政策。
          </text>
        </view>
      </view>

      <view class="section">
        <view class="section-header">10. 联系我们</view>
        <view class="section-content">
          <text class="paragraph">
            如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
          </text>
          <view class="contact-info">
            <view class="contact-item">
              <text class="contact-label">邮箱：</text>
              <text class="contact-value">privacy@shopping.com</text>
            </view>
            <view class="contact-item">
              <text class="contact-label">电话：</text>
              <text class="contact-value">400-123-4567</text>
            </view>
            <view class="contact-item">
              <text class="contact-label">地址：</text>
              <text class="contact-value">北京市朝阳区科技园区</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  },

  onLoad() {
    // 页面加载时的逻辑
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.content {
  padding: 20rpx;
}

.section {
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20rpx;
}

.update-time {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

.section-header {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-content {
  line-height: 1.8;
}

.paragraph {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 20rpx;
  display: block;
}

.list-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 10rpx;
  padding-left: 20rpx;
}

.contact-info {
  margin-top: 20rpx;
}

.contact-item {
  display: flex;
  margin-bottom: 15rpx;
  align-items: flex-start;
}

.contact-label {
  font-size: 28rpx;
  color: #333;
  width: 100rpx;
  flex-shrink: 0;
}

.contact-value {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}
</style>
