<template>
  <view class="container">
    <!-- 顶部标签栏 -->
    <view class="tab-bar">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentTab === index }"
        @click="switchTab(index)"
      >
        <text>{{ tab.name }}</text>
        <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
      </view>
    </view>

    <!-- 申请售后页面 -->
    <view v-if="currentTab === 0" class="apply-after-sale">
      <!-- 订单信息 -->
      <view v-if="orderInfo" class="order-info">
        <view class="section-title">订单信息</view>
        <view class="order-item">
          <view class="order-header">
            <text class="order-number"
              >订单号：{{ orderInfo.orderNumber }}</text
            >
            <text class="order-time">{{
              formatTime(orderInfo.createTime)
            }}</text>
          </view>
          <view class="product-list">
            <view
              v-for="(product, index) in orderInfo.products"
              :key="index"
              class="product-item"
              :class="{ selected: product.selected }"
              @click="toggleProductSelect(index)"
            >
              <view class="checkbox">
                <UnifiedIcon
                  :type="product.selected ? 'icon-check-filled' : 'icon-check'"
                  :size="20"
                  :color="product.selected ? '#d81e06' : '#ccc'"
                />
              </view>
              <view class="product-image">
                <image :src="product.image" mode="aspectFill"></image>
              </view>
              <view class="product-info">
                <view class="product-title">{{ product.title }}</view>
                <view class="product-spec">{{ product.spec }}</view>
                <view class="product-price-qty">
                  <text class="product-price">¥{{ product.price }}</text>
                  <text class="product-qty">x{{ product.quantity }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 售后类型 -->
      <view class="form-section">
        <view class="section-title">售后类型</view>
        <view class="service-types">
          <view
            v-for="(type, index) in serviceTypes"
            :key="index"
            class="service-type-item"
            :class="{ active: selectedServiceType === type.value }"
            @click="selectServiceType(type.value)"
          >
            <view class="type-icon">
              <UnifiedIcon
                :type="type.icon"
                :size="24"
                :color="selectedServiceType === type.value ? '#d81e06' : '#666'"
              />
            </view>
            <view class="type-info">
              <text class="type-name">{{ type.name }}</text>
              <text class="type-desc">{{ type.desc }}</text>
            </view>
            <view class="type-radio">
              <UnifiedIcon
                :type="
                  selectedServiceType === type.value
                    ? 'icon-radio-filled'
                    : 'icon-radio'
                "
                :size="20"
                :color="selectedServiceType === type.value ? '#d81e06' : '#ccc'"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 退款金额 -->
      <view v-if="selectedServiceType" class="form-section">
        <view class="section-title">退款金额</view>
        <view class="refund-amount">
          <view class="amount-item">
            <text class="amount-label">商品金额：</text>
            <text class="amount-value">¥{{ calculateProductAmount() }}</text>
          </view>
          <view class="amount-item">
            <text class="amount-label">运费：</text>
            <text class="amount-value">¥{{ orderInfo?.shippingFee || 0 }}</text>
          </view>
          <view class="amount-item total">
            <text class="amount-label">退款金额：</text>
            <text class="amount-value">¥{{ calculateRefundAmount() }}</text>
          </view>
        </view>
      </view>

      <!-- 退款原因 -->
      <view class="form-section">
        <view class="section-title">退款原因</view>
        <view class="reason-list">
          <view
            v-for="(reason, index) in refundReasons"
            :key="index"
            class="reason-item"
            :class="{ active: selectedReason === reason }"
            @click="selectReason(reason)"
          >
            <text>{{ reason }}</text>
            <UnifiedIcon
              :type="
                selectedReason === reason ? 'icon-check-filled' : 'icon-check'
              "
              :size="20"
              :color="selectedReason === reason ? '#d81e06' : '#ccc'"
            />
          </view>
        </view>
      </view>

      <!-- 问题描述 -->
      <view class="form-section">
        <view class="section-title">问题描述</view>
        <textarea
          v-model="description"
          class="description-input"
          placeholder="请详细描述遇到的问题，以便我们更好地为您处理"
          maxlength="500"
        ></textarea>
        <view class="char-count">{{ description.length }}/500</view>
      </view>

      <!-- 上传凭证 -->
      <view class="form-section">
        <view class="section-title">上传凭证</view>
        <view class="upload-area">
          <view
            v-for="(image, index) in uploadedImages"
            :key="index"
            class="image-item"
          >
            <image :src="image" mode="aspectFill"></image>
            <view class="delete-btn" @click="removeImage(index)">
              <UnifiedIcon type="icon-close" :size="16" color="#fff" />
            </view>
          </view>
          <view
            v-if="uploadedImages.length < 6"
            class="upload-btn"
            @click="chooseImage"
          >
            <UnifiedIcon type="icon-camera" :size="32" color="#ccc" />
            <text>上传图片</text>
          </view>
        </view>
        <view class="upload-tip">最多可上传6张图片，支持jpg、png格式</view>
      </view>

      <!-- 联系方式 -->
      <view class="form-section">
        <view class="section-title">联系方式</view>
        <view class="contact-input">
          <input
            v-model="contactPhone"
            type="text"
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          @click="submitAfterSale"
          :disabled="!canSubmit"
        >
          提交申请
        </button>
      </view>
    </view>

    <!-- 售后记录页面 -->
    <view v-else class="after-sale-list">
      <!-- 空状态 -->
      <view v-if="afterSaleList.length === 0 && !loading" class="empty-state">
        <image
          src="/static/images/empty-after-sale.png"
          mode="aspectFit"
          class="empty-image"
        ></image>
        <text class="empty-text">暂无售后记录</text>
        <text class="empty-desc">如有问题可联系客服处理</text>
      </view>

      <!-- 售后记录列表 -->
      <view v-else class="record-list">
        <view
          v-for="record in afterSaleList"
          :key="record.id"
          class="record-item"
          @click="goToAfterSaleDetail(record.id)"
        >
          <!-- 记录头部 -->
          <view class="record-header">
            <view class="record-info">
              <text class="record-number"
                >售后单号：{{ record.afterSaleNumber }}</text
              >
              <text class="record-time">{{
                formatTime(record.createTime)
              }}</text>
            </view>
            <view
              class="record-status"
              :class="getAfterSaleStatusClass(record.status)"
            >
              {{ getAfterSaleStatusText(record.status) }}
            </view>
          </view>

          <!-- 商品信息 -->
          <view class="record-product">
            <view class="product-image">
              <image :src="record.product.image" mode="aspectFill"></image>
            </view>
            <view class="product-info">
              <view class="product-title">{{ record.product.title }}</view>
              <view class="product-spec">{{ record.product.spec }}</view>
              <view class="service-type">{{ record.serviceType }}</view>
            </view>
            <view class="refund-amount">
              <text>¥{{ record.refundAmount }}</text>
            </view>
          </view>

          <!-- 进度信息 -->
          <view class="record-progress">
            <text class="progress-text">{{ record.progressText }}</text>
            <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";

export default {
  data() {
    return {
      currentTab: 0,
      tabs: [
        { name: "申请售后", count: 0 },
        { name: "售后记录", count: 0 },
      ],

      // 申请售后相关数据
      orderId: "",
      orderInfo: null,
      selectedServiceType: "",
      serviceTypes: [
        {
          value: "refund_only",
          name: "仅退款",
          desc: "未收到货或商品有问题",
          icon: "icon-refund",
        },
        {
          value: "return_refund",
          name: "退货退款",
          desc: "已收到货，需要退回商品",
          icon: "icon-return",
        },
        {
          value: "exchange",
          name: "换货",
          desc: "商品有质量问题需要更换",
          icon: "icon-exchange",
        },
      ],
      selectedReason: "",
      refundReasons: [
        "商品质量问题",
        "商品与描述不符",
        "收到商品破损",
        "商品缺件/漏发",
        "不喜欢/不想要",
        "尺寸/颜色选错",
        "发货太慢",
        "其他原因",
      ],
      description: "",
      uploadedImages: [],
      contactPhone: "",

      // 售后记录相关数据
      afterSaleList: [],
      loading: false,
    };
  },

  computed: {
    /**
     * 是否可以提交申请
     */
    canSubmit() {
      return (
        this.selectedServiceType &&
        this.selectedReason &&
        this.description.trim() &&
        this.contactPhone &&
        this.hasSelectedProducts()
      );
    },

    /**
     * 是否有选中的商品
     */
    hasSelectedProducts() {
      return (
        this.orderInfo?.products?.some((product) => product.selected) || false
      );
    },
  },

  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId;
      this.loadOrderInfo();
    } else {
      this.currentTab = 1;
      this.loadAfterSaleList();
    }
  },

  methods: {
    /**
     * 切换标签
     */
    switchTab(index) {
      this.currentTab = index;

      if (index === 1) {
        this.loadAfterSaleList();
      }
    },

    /**
     * 加载订单信息
     */
    async loadOrderInfo() {
      try {
        const res = await api.getOrderDetail(this.orderId);

        if (res.code === 200) {
          this.orderInfo = {
            ...res.data,
            products: res.data.products.map((product) => ({
              ...product,
              selected: false,
            })),
          };
        } else {
          uni.showToast({
            title: res.message || "获取订单信息失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("获取订单信息失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      }
    },

    /**
     * 切换商品选择状态
     */
    toggleProductSelect(index) {
      this.orderInfo.products[index].selected =
        !this.orderInfo.products[index].selected;
    },

    /**
     * 选择售后类型
     */
    selectServiceType(type) {
      this.selectedServiceType = type;
    },

    /**
     * 选择退款原因
     */
    selectReason(reason) {
      this.selectedReason = reason;
    },

    /**
     * 计算商品金额
     */
    calculateProductAmount() {
      if (!this.orderInfo?.products) return 0;

      return this.orderInfo.products
        .filter((product) => product.selected)
        .reduce((total, product) => total + product.price * product.quantity, 0)
        .toFixed(2);
    },

    /**
     * 计算退款金额
     */
    calculateRefundAmount() {
      const productAmount = parseFloat(this.calculateProductAmount());
      const shippingFee =
        this.selectedServiceType === "refund_only"
          ? this.orderInfo?.shippingFee || 0
          : 0;

      return (productAmount + shippingFee).toFixed(2);
    },

    /**
     * 选择图片
     */
    chooseImage() {
      uni.chooseImage({
        count: 6 - this.uploadedImages.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.uploadedImages.push(...res.tempFilePaths);
        },
      });
    },

    /**
     * 删除图片
     */
    removeImage(index) {
      this.uploadedImages.splice(index, 1);
    },

    /**
     * 提交售后申请
     */
    async submitAfterSale() {
      if (!this.canSubmit) {
        uni.showToast({
          title: "请完善申请信息",
          icon: "none",
        });
        return;
      }

      try {
        uni.showLoading({ title: "提交中..." });

        const selectedProducts = this.orderInfo.products.filter(
          (product) => product.selected
        );

        const res = await api.submitAfterSale({
          orderId: this.orderId,
          products: selectedProducts.map((product) => ({
            productId: product.id,
            quantity: product.quantity,
          })),
          serviceType: this.selectedServiceType,
          reason: this.selectedReason,
          description: this.description,
          images: this.uploadedImages,
          contactPhone: this.contactPhone,
          refundAmount: this.calculateRefundAmount(),
        });

        if (res.code === 200) {
          uni.showToast({
            title: "申请提交成功",
            icon: "success",
          });

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || "提交失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("提交售后申请失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        uni.hideLoading();
      }
    },

    /**
     * 加载售后记录列表
     */
    async loadAfterSaleList() {
      try {
        this.loading = true;
        const res = await api.getAfterSaleList();

        if (res.code === 200) {
          this.afterSaleList = res.data;
        } else {
          uni.showToast({
            title: res.message || "获取售后记录失败",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("获取售后记录失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "error",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 跳转到售后详情
     */
    goToAfterSaleDetail(afterSaleId) {
      uni.navigateTo({
        url: `/pages/order/after-sale-detail?id=${afterSaleId}`,
      });
    },

    /**
     * 获取售后状态文本
     */
    getAfterSaleStatusText(status) {
      const statusMap = {
        pending: "待审核",
        approved: "已同意",
        rejected: "已拒绝",
        processing: "处理中",
        completed: "已完成",
        cancelled: "已取消",
      };
      return statusMap[status] || "未知状态";
    },

    /**
     * 获取售后状态样式类
     */
    getAfterSaleStatusClass(status) {
      return {
        "status-pending": status === "pending",
        "status-approved": status === "approved",
        "status-rejected": status === "rejected",
        "status-processing": status === "processing",
        "status-completed": status === "completed",
        "status-cancelled": status === "cancelled",
      };
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 标签栏样式 */
.tab-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 20rpx;
  position: relative;
  font-size: 28rpx;
  color: #666;
}

.tab-item.active {
  color: #d81e06;
  font-weight: bold;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #d81e06;
  border-radius: 2rpx;
}

.tab-badge {
  position: absolute;
  top: 15rpx;
  right: 20rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  min-width: 32rpx;
  text-align: center;
  line-height: 1;
}

/* 申请售后页面样式 */
.apply-after-sale {
  padding: 20rpx;
}

.form-section {
  background-color: #fff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

/* 订单信息样式 */
.order-info {
  background-color: #fff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.order-item {
  border: 1rpx solid #f0f0f0;
  border-radius: 8rpx;
  padding: 20rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-number {
  font-size: 26rpx;
  color: #333;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
  border: 1rpx solid #f0f0f0;
}

.product-item.selected {
  border-color: #d81e06;
  background-color: #fef7f6;
}

.checkbox {
  margin-right: 15rpx;
  padding: 5rpx;
}

.product-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 15rpx;
  flex-shrink: 0;
}

.product-image image {
  width: 100%;
  height: 100%;
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8rpx;
}

.product-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.product-price-qty {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 26rpx;
  color: #d81e06;
  font-weight: bold;
}

.product-qty {
  font-size: 24rpx;
  color: #999;
}

/* 售后类型样式 */
.service-types {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.service-type-item {
  display: flex;
  align-items: center;
  padding: 25rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 8rpx;
  background-color: #fafafa;
}

.service-type-item.active {
  border-color: #d81e06;
  background-color: #fef7f6;
}

.type-icon {
  margin-right: 20rpx;
}

.type-info {
  flex: 1;
}

.type-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.type-desc {
  font-size: 24rpx;
  color: #999;
}

.type-radio {
  margin-left: 20rpx;
}

/* 退款金额样式 */
.refund-amount {
  background-color: #fafafa;
  border-radius: 8rpx;
  padding: 25rpx;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.amount-item:last-child {
  margin-bottom: 0;
}

.amount-item.total {
  border-top: 1rpx solid #e0e0e0;
  padding-top: 15rpx;
  font-weight: bold;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
}

.amount-value {
  font-size: 26rpx;
  color: #333;
}

.amount-item.total .amount-value {
  color: #d81e06;
  font-size: 28rpx;
}

/* 退款原因样式 */
.reason-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.reason-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 8rpx;
  background-color: #fafafa;
  font-size: 26rpx;
  color: #333;
}

.reason-item.active {
  border-color: #d81e06;
  background-color: #fef7f6;
  color: #d81e06;
}

/* 问题描述样式 */
.description-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 8rpx;
  font-size: 26rpx;
  line-height: 1.5;
  background-color: #fafafa;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

/* 上传凭证样式 */
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  border-radius: 8rpx;
  overflow: hidden;
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
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  width: 150rpx;
  height: 150rpx;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.upload-btn text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 15rpx;
}

/* 联系方式样式 */
.contact-input {
  border: 1rpx solid #f0f0f0;
  border-radius: 8rpx;
  background-color: #fafafa;
}

.contact-input input {
  width: 100%;
  padding: 25rpx;
  font-size: 26rpx;
  border: none;
  background: transparent;
}

/* 提交按钮样式 */
.submit-section {
  padding: 40rpx 20rpx;
}

.submit-btn {
  width: 100%;
  background-color: #d81e06;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 25rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-btn:disabled {
  background-color: #ccc;
  color: #999;
}

/* 售后记录页面样式 */
.after-sale-list {
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 10rpx;
  padding: 30rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-info {
  flex: 1;
}

.record-number {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-status {
  font-size: 26rpx;
  font-weight: bold;
}

.status-pending {
  color: #ff6b35;
}

.status-approved {
  color: #4ecdc4;
}

.status-rejected {
  color: #e74c3c;
}

.status-processing {
  color: #f39c12;
}

.status-completed {
  color: #27ae60;
}

.status-cancelled {
  color: #95a5a6;
}

.record-product {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-product .product-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 15rpx;
  flex-shrink: 0;
}

.record-product .product-info {
  flex: 1;
}

.record-product .product-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8rpx;
}

.record-product .product-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.service-type {
  font-size: 24rpx;
  color: #d81e06;
  background-color: #fef7f6;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  display: inline-block;
}

.record-product .refund-amount {
  font-size: 28rpx;
  color: #d81e06;
  font-weight: bold;
}

.record-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.progress-text {
  font-size: 26rpx;
  color: #666;
}
</style>
