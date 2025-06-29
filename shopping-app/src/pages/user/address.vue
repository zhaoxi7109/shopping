<template>
  <view class="container">
    <!-- 地址列表 -->
    <view class="address-list" v-if="addressList.length > 0">
      <view
        v-for="address in addressList"
        :key="address.id"
        class="address-item"
        @click="selectAddress(address)"
        @longpress="showActionSheet(address)"
      >
        <view class="address-content">
          <view class="address-header">
            <text class="name">{{ address.name }}</text>
            <text class="mobile">{{ address.mobile }}</text>
            <view class="default-tag" v-if="address.isDefault">默认</view>
          </view>
          <view class="address-detail">
            <text class="tag" v-if="address.tag">{{ address.tag }}</text>
            <text class="detail">
              {{ address.province + address.city + address.district + address.detail }}
            </text>
          </view>
        </view>
        <view class="address-actions">
          <view class="action-btn" @click.stop="editAddress(address)">
            <UnifiedIcon type="icon-edit" :size="16" color="#666" />
            <text>编辑</text>
          </view>
          <view class="action-btn" @click.stop="deleteAddress(address.id)">
            <UnifiedIcon type="icon-delete" :size="16" color="#666" />
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <UnifiedIcon type="icon-location" :size="80" color="#ccc" />
      <text class="empty-text">暂无收货地址</text>
      <text class="empty-desc">添加收货地址，享受便捷购物体验</text>
    </view>

    <!-- 添加地址按钮 -->
    <view class="add-btn-container">
      <button class="add-btn" @click="addAddress">
        <UnifiedIcon type="icon-add" :size="20" color="#fff" />
        <text>添加新地址</text>
      </button>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";
import UnifiedIcon from "@/components/UnifiedIcon.vue";

export default {
  name: "AddressPage",
  components: {
    UnifiedIcon,
  },
  data() {
    return {
      addressList: [],
      loading: false,
      from: "", // 来源页面
    };
  },
  onLoad(options) {
    this.from = options.from || "";
    this.loadAddressList();
  },
  onShow() {
    // 从添加/编辑页面返回时刷新列表
    this.loadAddressList();
  },
  methods: {
    /**
     * 加载地址列表
     */
    async loadAddressList() {
      try {
        this.loading = true;
        const res = await api.getAddressList();
        
        if (res.success) {
          this.addressList = res.data || [];
        } else {
          uni.showToast({
            title: res.message || "获取地址列表失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取地址列表失败:", error);
        uni.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 选择地址（从订单页面进入时）
     */
    selectAddress(address) {
      if (this.from === "order") {
        // 将选中的地址存储到缓存中，供订单页面使用
        uni.setStorageSync('selectedAddress', JSON.stringify(address));
        
        uni.showToast({
          title: '地址已选择',
          icon: 'success',
          duration: 1000
        });
        
        // 延迟返回，让用户看到提示
        setTimeout(() => {
          uni.navigateBack();
        }, 1000);
      }
    },

    /**
     * 添加地址
     */
    addAddress() {
      uni.navigateTo({
        url: "/pages/user/address-edit",
      });
    },

    /**
     * 编辑地址
     */
    editAddress(address) {
      uni.navigateTo({
        url: `/pages/user/address-edit?id=${address.id}`,
      });
    },

    /**
     * 删除地址
     */
    deleteAddress(addressId) {
      uni.showModal({
        title: "提示",
        content: "确定要删除这个地址吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.deleteAddress(addressId);
              
              if (result.success) {
                uni.showToast({
                  title: "删除成功",
                  icon: "success",
                });
                this.loadAddressList();
              } else {
                uni.showToast({
                  title: result.message || "删除失败",
                  icon: "none",
                });
              }
            } catch (error) {
              console.error("删除地址失败:", error);
              uni.showToast({
                title: "网络错误，请重试",
                icon: "none",
              });
            }
          }
        },
      });
    },

    /**
     * 设置默认地址
     */
    async setDefaultAddress(addressId) {
      try {
        const res = await api.setDefaultAddress(addressId);
        
        if (res.success) {
          uni.showToast({
            title: "设置成功",
            icon: "success",
          });
          this.loadAddressList();
        } else {
          uni.showToast({
            title: res.message || "设置失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("设置默认地址失败:", error);
        uni.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      }
    },

    /**
     * 显示操作菜单（长按触发）
     */
    showActionSheet(address) {
      const itemList = [
        '复制地址',
      ];
      
      // 如果不是默认地址，添加设为默认选项
      if (!address.isDefault) {
        itemList.push('设为默认');
      }
      
      uni.showActionSheet({
        itemList: itemList,
        success: (res) => {
          const selectedItem = itemList[res.tapIndex];
          
          if (selectedItem === '复制地址') {
            this.copyAddress(address);
          } else if (selectedItem === '设为默认') {
            this.setDefaultAddress(address.id);
          }
        },
        fail: (res) => {
          console.log('取消操作');
        }
      });
    },

    /**
     * 复制地址到剪贴板
     */
    copyAddress(address) {
      const fullAddress = `${address.name} ${address.mobile}\n${address.province}${address.city}${address.district}${address.detail}`;
      
      // #ifdef H5
      // H5环境使用navigator.clipboard API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullAddress).then(() => {
          uni.showToast({
            title: '地址已复制',
            icon: 'success'
          });
        }).catch(() => {
          // 降级方案
          this.fallbackCopyToClipboard(fullAddress);
        });
      } else {
        this.fallbackCopyToClipboard(fullAddress);
      }
      // #endif
      
      // #ifndef H5
      // 小程序和App环境使用uni.setClipboardData
      uni.setClipboardData({
        data: fullAddress,
        success: () => {
          uni.showToast({
            title: '地址已复制',
            icon: 'success'
          });
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },

    /**
     * 降级复制方案（H5环境）
     */
    fallbackCopyToClipboard(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        uni.showToast({
          title: '地址已复制',
          icon: 'success'
        });
      } catch (err) {
        uni.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
      
      document.body.removeChild(textArea);
    },
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 地址列表样式 */
.address-list {
  padding: 20rpx;
}

.address-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
}

.address-item:active {
  transform: scale(0.98);
  background-color: #f8f8f8;
}

/* 长按提示 */
.address-item::after {
  content: '长按更多操作';
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  font-size: 20rpx;
  color: #ccc;
  opacity: 0.6;
}

.address-content {
  flex: 1;
  margin-right: 20rpx;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.address-header .name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.address-header .mobile {
  font-size: 28rpx;
  color: #666;
  margin-right: 20rpx;
}

.default-tag {
  background-color: #d81e06;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.address-detail {
  display: flex;
  align-items: flex-start;
}

.address-detail .tag {
  background-color: #f0f0f0;
  color: #666;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.address-detail .detail {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.address-actions {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  border-radius: 6rpx;
  background-color: #f8f8f8;
}

.action-btn text {
  font-size: 24rpx;
  color: #666;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin: 30rpx 0 15rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #ccc;
}

/* 添加按钮样式 */
.add-btn-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.add-btn {
  width: 100%;
  height: 80rpx;
  background-color: #d81e06;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-btn:active {
  background-color: #c01e06;
}
</style>