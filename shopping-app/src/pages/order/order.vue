<template>
  <view class="container">
    <!-- 收货地址 -->
    <view class="address-section" @click="chooseAddress">
      <view class="address-box" v-if="address.name">
        <view class="address-info">
          <text class="name">{{ address.name }}</text>
          <text class="mobile">{{ address.mobile }}</text>
        </view>
        <view class="address-detail">
          <text class="tag" v-if="address.tag">{{ address.tag }}</text>
          <text class="detail">{{
            address.province + address.city + address.district + address.detail
          }}</text>
        </view>
      </view>
      <view class="address-empty" v-else>
        <UnifiedIcon type="icon-add" :size="16" color="#999" />
        <text>添加收货地址</text>
      </view>
      <view class="address-arrow">
        <UnifiedIcon type="icon-right" :size="16" color="#999" />
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-section">
      <view class="section-title">商品信息</view>
      <view class="product-list">
        <view
          class="product-item"
          v-for="(item, index) in orderItems"
          :key="index"
          @click="goToProductDetail(item.id)"
        >
          <image :src="item.image" mode="aspectFill"></image>
          <view class="product-info">
            <view class="product-name">{{ item.name }}</view>
            <view class="product-spec">{{ item.specs }}</view>
            <view class="product-price-wrapper">
              <text class="product-price">¥{{ item.price }}</text>
              <text class="product-quantity">x{{ item.quantity }}</text>
            </view>
          </view>
          <view class="product-arrow">
            <UnifiedIcon type="icon-right" :size="16" color="#ccc" />
          </view>
        </view>
      </view>
    </view>

    <!-- 配送方式 -->
    <view class="delivery-section">
      <view class="section-item" @click="chooseDeliveryMethod">
        <text>配送方式</text>
        <view class="item-right">
          <text>{{ deliveryMethod }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
      <view class="section-item" @click="chooseDeliveryTime">
        <text>配送时间</text>
        <view class="item-right">
          <text>{{ deliveryTime }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
    </view>

    <!-- 优惠信息 -->
    <view class="discount-section">
      <view class="section-item" @click="chooseCoupon">
        <text>优惠券</text>
        <view class="item-right">
          <text>{{ couponText }}</text>
          <UnifiedIcon type="icon-right" :size="16" color="#999" />
        </view>
      </view>
      <view class="section-item">
        <text>积分抵扣</text>
        <view class="item-right">
          <switch
            color="#d81e06"
            @change="togglePointsDeduction"
            :checked="usePoints"
          />
        </view>
      </view>
    </view>

    <!-- 订单金额 -->
    <view class="amount-section">
      <view class="amount-item">
        <text>商品金额</text>
        <text>¥{{ productAmount }}</text>
      </view>
      <view class="amount-item">
        <text>运费</text>
        <text>¥{{ deliveryFee }}</text>
      </view>
      <view class="amount-item" v-if="couponAmount > 0">
        <text>优惠券</text>
        <text>-¥{{ couponAmount }}</text>
      </view>
      <view class="amount-item" v-if="pointsDeduction > 0">
        <text>积分抵扣</text>
        <text>-¥{{ pointsDeduction }}</text>
      </view>
      <view class="amount-item total">
        <text>实付款</text>
        <text class="total-price">¥{{ totalAmount }}</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="remark-section">
      <view class="remark-title">订单备注</view>
      <textarea
        class="remark-input"
        placeholder="请输入备注信息"
        v-model="remark"
        maxlength="100"
      />
      <text class="remark-count">{{ remark.length }}/100</text>
    </view>

    <!-- 底部结算栏 -->
    <view class="footer">
      <view class="total-box">
        <text>合计：</text>
        <text class="total-price">¥{{ totalAmount }}</text>
      </view>
      <view class="submit-btn" @click="submitOrder">提交订单</view>
    </view>

    <!-- 配送选择弹窗 -->
    <DeliverySelector
      :visible="deliverySelectorVisible"
      :title="selectorTitle"
      :options="selectorOptions"
      :defaultIndex="selectorDefaultIndex"
      @confirm="onSelectorConfirm"
      @close="closeSelectorModal"
    />
  </view>
</template>

<script>
import { api } from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";
import DeliverySelector from "@/components/DeliverySelector.vue";

export default {
  components: {
    DeliverySelector,
  },
  data() {
    return {
      orderSource: "", // buyNow 或 cart
      orderItems: [],
      address: {
        name: "",
        mobile: "",
        province: "",
        city: "",
        district: "",
        detail: "",
        tag: "",
      },
      deliveryMethod: "快递配送",
      deliveryTime: "不限送货时间",
      deliveryFee: 0,
      couponSelected: false,
      couponAmount: 0,
      selectedCoupon: null,
      usePoints: false,
      pointsDeduction: 0,
      userPoints: 0,
      maxPointsDeduction: 0,
      remark: "",
      submitting: false, // 防止重复提交
      // 弹窗相关
      deliverySelectorVisible: false,
      selectorTitle: "",
      selectorOptions: [],
      selectorDefaultIndex: 0,
      selectorType: "", // 'method' 或 'time'
      // 配送方式选项
      deliveryMethods: [
        { name: "快递配送", fee: 0, desc: "预计1-3天送达" },
        { name: "同城配送", fee: 5, desc: "预计2-4小时送达" },
        { name: "次日达", fee: 15, desc: "次日上午送达" },
        { name: "当日达", fee: 25, desc: "当日晚上送达" },
      ],
      // 配送时间选项
      deliveryTimes: [
        "不限送货时间",
        "工作日送货(周一至周五)",
        "双休日送货(周六至周日)",
        "上午送货(9:00-12:00)",
        "下午送货(13:00-18:00)",
        "晚上送货(19:00-21:00)",
      ],
    };
  },
  computed: {
    // 商品总金额
    productAmount() {
      let amount = 0;
      this.orderItems.forEach((item) => {
        amount += item.price * item.quantity;
      });
      return amount.toFixed(2);
    },
    // 总金额
    totalAmount() {
      let total = parseFloat(this.productAmount) + parseFloat(this.deliveryFee);

      // 减去优惠券金额（使用后端计算的结果）
      if (this.couponSelected && this.couponAmount > 0) {
        total -= parseFloat(this.couponAmount);
      }

      // 减去积分抵扣
      total -= parseFloat(this.pointsDeduction);

      return Math.max(0, total).toFixed(2);
    },
    /**
     * 优惠券文本显示
     * @returns {String} 优惠券显示文本
     */
    couponText() {
      if (this.couponSelected && this.selectedCoupon) {
        if (this.selectedCoupon.type === "shipping") {
          return "已选择，免运费";
        } else if (
          this.selectedCoupon.type === "amount" ||
          this.selectedCoupon.discountType === "amount"
        ) {
          // 满减券：显示减免金额
          const amount =
            this.selectedCoupon.discountValue || this.selectedCoupon.amount;
          if (amount) {
            return `已选择，-¥${amount}`;
          }
        } else if (
          this.selectedCoupon.type === "discount" ||
          this.selectedCoupon.discountType === "percentage"
        ) {
          // 折扣券：显示折扣率
          const discountValue = this.selectedCoupon.discountValue;
          if (discountValue) {
            return `已选择，${discountValue}折`;
          }
        }
        return "已选择";
      }
      return "未使用";
    },
  },
  onLoad(options) {
    this.orderSource = options.from || "cart";
    this.loadOrderItems();
    // 加载默认地址
    this.loadDefaultAddress();
    // 加载用户积分
    this.loadUserPoints();
  },
  onShow() {
    // 从地址页面返回时，获取选中的地址
    const selectedAddress = uni.getStorageSync("selectedAddress");
    if (selectedAddress) {
      this.address = JSON.parse(selectedAddress);
      // 清除缓存
      uni.removeStorageSync("selectedAddress");
    } else if (!this.address.name) {
      // 如果没有选中地址且当前没有地址，尝试加载默认地址
      this.loadDefaultAddress();
    }

    // 从优惠券页面返回时，获取选中的优惠券
    const selectedCoupon = uni.getStorageSync("selectedCoupon");
    if (selectedCoupon) {
      this.selectedCoupon = JSON.parse(selectedCoupon);
      this.couponSelected = true;

      // 计算优惠券金额
      this.calculateCouponAmount();

      // 清除缓存
      uni.removeStorageSync("selectedCoupon");
    }
  },
  methods: {
    // 加载订单商品
    loadOrderItems() {
      if (this.orderSource === "buyNow") {
        // 从立即购买进入
        const item = uni.getStorageSync("buyNowItem");
        if (item) {
          this.orderItems = [JSON.parse(item)];
        }
      } else {
        // 从购物车进入
        const items = uni.getStorageSync("checkoutItems");
        if (items) {
          this.orderItems = JSON.parse(items);
        }
      }

      // 根据订单金额设置运费
      if (parseFloat(this.productAmount) >= 99) {
        this.deliveryFee = 0;
      } else {
        this.deliveryFee = 10;
      }
    },

    /**
     * 加载默认地址
     */
    async loadDefaultAddress() {
      try {
        const res = await api.getAddressList();
        if (res.success && res.data && res.data.length > 0) {
          // 查找默认地址
          const defaultAddress = res.data.find((addr) => addr.isDefault);
          if (defaultAddress) {
            this.address = defaultAddress;
          } else {
            // 如果没有默认地址，使用第一个地址
            this.address = res.data[0];
          }
        }
      } catch (error) {
        console.error("加载默认地址失败:", error);
      }
    },

    /**
     * 加载用户积分
     */
    async loadUserPoints() {
      try {
        const userStore = useUserStore();
        if (!userStore.isLoggedIn || !userStore.userId) {
          console.log("用户未登录");
          return;
        }

        const res = await api.getPointsBalance(userStore.userId);
        if (res.success) {
          this.userPoints = res.data.points || 0;
        }
      } catch (error) {
        console.error("加载用户积分失败:", error);
      }
    },

    /**
     * 选择地址
     */
    chooseAddress() {
      uni.navigateTo({
        url: "/pages/user/address?from=order",
      });
    },

    /**
     * 跳转到商品详情页面
     */
    goToProductDetail(productId) {
      if (productId) {
        uni.navigateTo({
          url: `/pages/detail/detail?id=${productId}`,
        });
      }
    },

    /**
     * 选择配送方式
     */
    chooseDeliveryMethod() {
      const currentIndex = this.deliveryMethods.findIndex(
        (method) => method.name === this.deliveryMethod
      );

      this.selectorTitle = "选择配送方式";
      this.selectorOptions = this.deliveryMethods;
      this.selectorDefaultIndex = currentIndex >= 0 ? currentIndex : 0;
      this.selectorType = "method";
      this.deliverySelectorVisible = true;
    },

    /**
     * 选择配送时间
     */
    chooseDeliveryTime() {
      const currentIndex = this.deliveryTimes.findIndex(
        (time) => time === this.deliveryTime
      );

      this.selectorTitle = "选择配送时间";
      this.selectorOptions = this.deliveryTimes;
      this.selectorDefaultIndex = currentIndex >= 0 ? currentIndex : 0;
      this.selectorType = "time";
      this.deliverySelectorVisible = true;
    },

    /**
     * 弹窗确认选择
     */
    onSelectorConfirm(result) {
      if (this.selectorType === "method") {
        const selectedMethod = result.option;
        this.deliveryMethod = selectedMethod.name;

        // 更新运费
        if (
          parseFloat(this.productAmount) >= 99 &&
          selectedMethod.name === "快递配送"
        ) {
          this.deliveryFee = 0;
        } else {
          this.deliveryFee = selectedMethod.fee;
        }

        uni.showToast({
          title: `已选择${selectedMethod.name}`,
          icon: "success",
          duration: 1500,
        });
      } else if (this.selectorType === "time") {
        this.deliveryTime = result.option;
        uni.showToast({
          title: "配送时间已更新",
          icon: "success",
          duration: 1500,
        });
      }
    },

    /**
     * 关闭弹窗
     */
    closeSelectorModal() {
      this.deliverySelectorVisible = false;
    },

    // 选择优惠券
    chooseCoupon() {
      // 跳转到优惠券选择页面
      uni.navigateTo({
        url: `/pages/coupon/coupon?amount=${this.productAmount}&selectedId=${
          this.selectedCoupon ? this.selectedCoupon.id : ""
        }`,
      });
    },

    // 切换积分抵扣
    async togglePointsDeduction(e) {
      this.usePoints = e.detail.value;
      if (this.usePoints) {
        try {
          // 使用store检查登录状态
          const userStore = useUserStore();
          if (!userStore.isLoggedIn || !userStore.userId) {
            this.usePoints = false;
            uni.showToast({
              title: "请先登录",
              icon: "none",
            });
            setTimeout(() => {
              uni.navigateTo({
                url: "/pages/auth/login",
              });
            }, 1500);
            return;
          }

          const res = await api.calculatePointsDeduction({
            userId: userStore.userId,
            orderAmount: parseFloat(this.productAmount),
            usePoints: true,
          });
          if (res.success) {
            this.pointsDeduction = res.data.pointsDeduction;
            this.maxPointsDeduction = res.data.pointsDeduction;
          }
        } catch (error) {
          console.error("计算积分抵扣失败:", error);
          this.usePoints = false;
          uni.showToast({
            title: "积分计算失败",
            icon: "none",
          });
        }
      } else {
        this.pointsDeduction = 0;
      }
    },

    // 提交订单
    async submitOrder() {
      // 验证订单信息
      if (!this.validateOrder()) {
        return;
      }

      // 防止重复提交
      if (this.submitting) {
        return;
      }
      this.submitting = true;

      uni.showLoading({
        title: "提交中...",
        mask: true,
      });

      try {
        // 构建订单数据（匹配后端API格式）
        const orderData = {
          items: this.orderItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            spec: item.specs || "默认规格",
          })),
          shippingAddress: {
            name: this.address.name,
            phone: this.address.mobile,
            address:
              this.address.province +
              this.address.city +
              this.address.district +
              this.address.detail,
            province: this.address.province,
            city: this.address.city,
            district: this.address.district,
            detail: this.address.detail,
          },
          paymentMethod: "alipay", // 默认支付宝支付
          remark: this.remark.trim(),
          // 优惠券信息
          coupon: this.selectedCoupon
            ? {
                id: this.selectedCoupon.id,
                amount: this.couponAmount,
              }
            : null,
          // 积分抵扣信息
          pointsDeduction: this.usePoints
            ? {
                amount: this.pointsDeduction,
                points: Math.ceil(this.pointsDeduction * 100), // 假设1元=100积分
              }
            : null,
        };

        console.log("提交订单数据:", orderData);
        const res = await api.createOrder(orderData);

        if (res.success) {
          console.log("订单创建成功:", res.data);

          // 清除相关缓存
          this.clearOrderCache();

          uni.showToast({
            title: "订单提交成功",
            icon: "success",
            duration: 2000,
          });

          // 跳转到支付页面
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/payment/payment?orderNo=${res.data.orderNumber}&amount=${this.totalAmount}`,
              fail: (err) => {
                console.error("跳转支付页面失败:", err);
                // 如果跳转失败，可以跳转到订单列表
                uni.navigateTo({
                  url: "/pages/order/order-list",
                });
              },
            });
          }, 2000);
        } else {
          throw new Error(res.message || "订单提交失败");
        }
      } catch (error) {
        console.error("订单提交失败:", error);

        let errorMessage = "网络错误，请重试";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.errMsg) {
          errorMessage = error.errMsg;
        }

        uni.showModal({
          title: "提交失败",
          content: errorMessage,
          showCancel: false,
          confirmText: "我知道了",
        });
      } finally {
        uni.hideLoading();
        this.submitting = false;
      }
    },

    /**
     * 验证订单信息
     */
    validateOrder() {
      if (!this.address.name) {
        uni.showModal({
          title: "提示",
          content: "请选择收货地址",
          showCancel: false,
          confirmText: "去选择",
          success: () => {
            this.chooseAddress();
          },
        });
        return false;
      }

      if (this.orderItems.length === 0) {
        uni.showToast({
          title: "订单商品不能为空",
          icon: "none",
        });
        return false;
      }

      // 验证商品库存（模拟）
      for (let item of this.orderItems) {
        if (item.quantity <= 0) {
          uni.showToast({
            title: `${item.name}数量不能为0`,
            icon: "none",
          });
          return false;
        }
      }

      // 验证总金额
      if (parseFloat(this.totalAmount) <= 0) {
        uni.showToast({
          title: "订单金额异常",
          icon: "none",
        });
        return false;
      }

      return true;
    },

    /**
     * 计算优惠券金额
     */
    async calculateCouponAmount() {
      if (!this.selectedCoupon) {
        this.couponAmount = 0;
        return;
      }

      try {
        // 调用后端API计算优惠券折扣
        const response = await this.$api.calculateCouponDiscount({
          userCouponId: this.selectedCoupon.userCouponId,
          orderAmount: this.productAmount,
          shippingFee: this.shippingFee,
        });

        if (response.success) {
          // API返回的是discount字段，不是discountAmount
          this.couponAmount = response.data.discount || 0;
        } else {
          console.error("计算优惠券折扣失败:", response.message);
          this.couponAmount = 0;
        }
      } catch (error) {
        console.error("计算优惠券折扣出错:", error);
        this.couponAmount = 0;
      }
    },

    /**
     * 优惠券选择回调（统一使用API计算）
     */
    onCouponSelected(coupon) {
      if (coupon) {
        this.selectedCoupon = coupon;
        this.couponSelected = true;

        // 使用API计算优惠券折扣
        this.calculateCouponAmount();

        uni.showToast({
          title: "优惠券已选择",
          icon: "success",
        });
      } else {
        // 清除优惠券选择
        this.selectedCoupon = null;
        this.couponSelected = false;
        this.couponAmount = 0;

        uni.showToast({
          title: "已取消优惠券",
          icon: "none",
        });
      }
    },

    /**
     * 清除订单相关缓存
     */
    clearOrderCache() {
      try {
        if (this.orderSource === "cart") {
          // 清除结算商品缓存
          uni.removeStorageSync("checkoutItems");
        } else if (this.orderSource === "buyNow") {
          // 清除立即购买商品缓存
          uni.removeStorageSync("buyNowItem");
        }
        // 清除选中地址缓存
        uni.removeStorageSync("selectedAddress");
      } catch (error) {
        console.error("清除缓存失败:", error);
      }
    },
  },
};
</script>

<style>
.container {
  padding-bottom: 120rpx;
  background-color: #f5f5f5;
}

/* 地址样式 */
.address-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
  display: flex;
  position: relative;
}

.address-box {
  flex: 1;
}

.address-info {
  display: flex;
  margin-bottom: 10rpx;
}

.address-info .name {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.address-info .mobile {
  font-size: 28rpx;
  color: #333;
}

.address-detail {
  display: flex;
  align-items: center;
}

.address-detail .tag {
  font-size: 20rpx;
  color: #d81e06;
  border: 1rpx solid #d81e06;
  padding: 0 10rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
}

.address-detail .detail {
  font-size: 28rpx;
  color: #666;
}

.address-empty {
  display: flex;
  align-items: center;
}

.address-empty .iconfont {
  font-size: 40rpx;
  color: #999;
  margin-right: 10rpx;
}

.address-empty text:last-child {
  font-size: 28rpx;
  color: #999;
}

.address-arrow {
  margin-left: 20rpx;
  display: flex;
  align-items: center;
}

.address-arrow .iconfont {
  font-size: 40rpx;
  color: #ccc;
}

/* 商品列表样式 */
.product-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.product-list {
}

.product-item {
  display: flex;
  margin-bottom: 20rpx;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.product-item:active {
  background-color: #f8f8f8;
}

.product-item:last-child {
  margin-bottom: 0;
}

.product-item image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  line-height: 40rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-spec {
  font-size: 24rpx;
  color: #999;
  margin: 10rpx 0;
}

.product-price-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
}

.product-quantity {
  font-size: 28rpx;
  color: #999;
}

.product-arrow {
  margin-left: 10rpx;
  display: flex;
  align-items: center;
}

/* 配送方式样式 */
.delivery-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 0 30rpx;
}

.section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.section-item:last-child {
  border-bottom: none;
}

.section-item text:first-child {
  font-size: 28rpx;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-right text:first-child {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.item-right .iconfont {
  font-size: 32rpx;
  color: #ccc;
}

/* 优惠信息样式 */
.discount-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 0 30rpx;
}

/* 订单金额样式 */
.amount-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.amount-item:last-child {
  margin-bottom: 0;
}

.amount-item text:first-child {
  font-size: 28rpx;
  color: #333;
}

.amount-item text:last-child {
  font-size: 28rpx;
  color: #333;
}

.amount-item.total {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.amount-item .total-price {
  font-size: 32rpx;
  color: #d81e06;
  font-weight: bold;
}

/* 备注样式 */
.remark-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.remark-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.remark-input {
  width: 100%;
  height: 160rpx;
  background-color: #f7f7f7;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.remark-count {
  position: absolute;
  bottom: 30rpx;
  right: 50rpx;
  font-size: 24rpx;
  color: #999;
}

/* 底部结算栏样式 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.total-box {
  flex: 1;
  display: flex;
  align-items: center;
}

.total-box text:first-child {
  font-size: 28rpx;
  color: #333;
}

.total-box .total-price {
  font-size: 36rpx;
  color: #d81e06;
  font-weight: bold;
}

.submit-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #d81e06;
  color: #fff;
  font-size: 28rpx;
  text-align: center;
  border-radius: 40rpx;
}
</style>
