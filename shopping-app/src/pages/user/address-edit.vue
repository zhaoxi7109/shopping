<template>
  <view class="container">
    <form @submit="submitForm">
      <!-- 收货人信息 -->
      <view class="form-section">
        <view class="section-title">收货人信息</view>

        <view class="form-item">
          <text class="label">收货人 <text class="required">*</text></text>
          <input
            class="input"
            type="text"
            v-model="formData.name"
            placeholder="请输入收货人姓名"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="label">手机号 <text class="required">*</text></text>
          <input
            class="input"
            type="number"
            v-model="formData.mobile"
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="form-section">
        <view class="section-title">收货地址</view>

        <view class="form-item">
          <text class="label">所在地区 <text class="required">*</text></text>
          <view class="region-selector" @click="chooseRegion">
            <text class="region-text" v-if="regionText">{{ regionText }}</text>
            <text class="placeholder" v-else>请选择省市区</text>
            <UnifiedIcon type="icon-right" :size="16" color="#999" />
          </view>
          <!-- 快捷操作按钮 -->
          <view class="location-actions">
            <view
              class="action-btn"
              @click="getCurrentLocationAndFill"
              v-if="mapAvailable"
            >
              <UnifiedIcon type="icon-location" :size="14" color="#d81e06" />
              <text>获取当前位置</text>
            </view>
            <view
              class="action-btn"
              @click="chooseLocationByMap"
              v-if="mapAvailable"
            >
              <UnifiedIcon type="icon-map" :size="14" color="#d81e06" />
              <text>地图选择</text>
            </view>
            <view class="action-btn" @click="showRegionPicker">
              <UnifiedIcon type="icon-list" :size="14" color="#666" />
              <text>手动选择</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="label">详细地址 <text class="required">*</text></text>
          <textarea
            class="textarea"
            v-model="formData.detail"
            placeholder="请输入详细地址，如街道、楼牌号等"
            maxlength="100"
            :show-count="true"
          />
        </view>

        <view class="form-item">
          <text class="label">地址标签</text>
          <view class="tag-selector">
            <view
              v-for="tag in addressTags"
              :key="tag"
              class="tag-item"
              :class="{ active: formData.tag === tag }"
              @click="selectTag(tag)"
            >
              {{ tag }}
            </view>
            <input
              v-if="showCustomTag"
              class="custom-tag-input"
              type="text"
              v-model="customTag"
              placeholder="自定义标签"
              maxlength="10"
              @blur="confirmCustomTag"
            />
            <view class="tag-item" @click="addCustomTag" v-else>
              <UnifiedIcon type="icon-add" :size="14" color="#999" />
              <text>自定义</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 设置选项 -->
      <view class="form-section">
        <view class="form-item">
          <text class="label">设为默认地址</text>
          <switch
            :checked="formData.isDefault"
            @change="toggleDefault"
            color="#d81e06"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-container">
        <button class="submit-btn" @click="submitForm" :disabled="!isFormValid">
          {{ isEdit ? "保存修改" : "保存地址" }}
        </button>
      </view>
    </form>

    <!-- 地区选择弹窗 -->
    <view class="region-picker-popup" v-if="showRegionPickerPopup">
      <view class="popup-mask" @click="closeRegionPicker"></view>
      <view class="popup-content">
        <!-- 弹窗头部 -->
        <view class="popup-header">
          <view class="header-left">
            <view class="back-btn" @click="goBackRegion" v-if="regionType !== 'province'">
              <UnifiedIcon type="icon-left" :size="16" color="#333" />
            </view>
          </view>
          <view class="popup-title">{{ getRegionTitle() }}</view>
          <view class="header-right">
            <view class="close-btn" @click="closeRegionPicker">
              <UnifiedIcon type="icon-close" :size="16" color="#999" />
            </view>
          </view>
        </view>

        <!-- 面包屑导航 -->
        <view class="breadcrumb" v-if="getBreadcrumbText()">
          <text class="breadcrumb-text">{{ getBreadcrumbText() }}</text>
        </view>

        <!-- 地区列表 -->
        <scroll-view scroll-y class="region-list" :scroll-top="scrollTop">
          <!-- 省份列表 -->
          <view v-if="regionType === 'province'" class="region-group">
            <view class="group-title">请选择省份/直辖市/自治区</view>
            <view
              v-for="province in provinces"
              :key="province.code"
              class="region-item"
              :class="{ selected: formData.province === province.name }"
              @click="selectProvince(province)"
            >
              <text class="region-name">{{ province.name }}</text>
              <UnifiedIcon 
                v-if="formData.province === province.name" 
                type="icon-check" 
                :size="16" 
                color="#d81e06" 
              />
            </view>
          </view>

          <!-- 城市列表 -->
          <view v-if="regionType === 'city'" class="region-group">
            <view class="group-title">请选择城市</view>
            <view
              v-for="city in cities"
              :key="city.code"
              class="region-item"
              :class="{ selected: formData.city === city.name }"
              @click="selectCity(city)"
            >
              <text class="region-name">{{ city.name }}</text>
              <UnifiedIcon 
                v-if="formData.city === city.name" 
                type="icon-check" 
                :size="16" 
                color="#d81e06" 
              />
            </view>
          </view>

          <!-- 区县列表 -->
          <view v-if="regionType === 'district'" class="region-group">
            <view class="group-title">请选择区县</view>
            <view
              v-for="district in districts"
              :key="district.code"
              class="region-item"
              :class="{ selected: formData.district === district.name }"
              @click="selectDistrict(district)"
            >
              <text class="region-name">{{ district.name }}</text>
              <UnifiedIcon 
                v-if="formData.district === district.name" 
                type="icon-check" 
                :size="16" 
                color="#d81e06" 
              />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";
import UnifiedIcon from "@/components/UnifiedIcon.vue";
import { provinceData, cityData, districtData } from "@/utils/area-data.js"; // 引入地区数据
import amapUtils from "@/utils/amap.js"; // 引入高德地图工具类

export default {
  name: "AddressEditPage",
  components: {
    UnifiedIcon,
  },
  data() {
    return {
      isEdit: false,
      addressId: "",
      formData: {
        name: "",
        mobile: "",
        province: "",
        city: "",
        district: "",
        detail: "",
        tag: "",
        isDefault: false,
        latitude: 0,
        longitude: 0,
      },
      addressTags: ["家", "公司", "学校"],
      showCustomTag: false,
      customTag: "",
      loading: false,
      showRegionPickerPopup: false, // 省市区选择器弹窗
      regionType: "province", // 当前选择的区域类型：province, city, district
      provinces: [], // 省份列表
      cities: [], // 城市列表
      districts: [], // 区县列表
      currentProvince: {}, // 当前选中的省份
      currentCity: {}, // 当前选中的城市
      mapAvailable: true, // 地图是否可用
    };
  },
  computed: {
    /**
     * 地区显示文本
     */
    regionText() {
      const { province, city, district } = this.formData;
      if (province && city && district) {
        return `${province} ${city} ${district}`;
      }
      return "";
    },

    /**
     * 表单是否有效
     */
    isFormValid() {
      const { name, mobile, province, city, district, detail } = this.formData;
      const mobileRegex = /^1[3-9]\d{9}$/;

      return (
        name.trim() &&
        mobileRegex.test(mobile) &&
        province &&
        city &&
        district &&
        detail.trim()
      );
    },
  },
  onLoad(options) {
    // 初始化地区数据
    this.initRegionData();

    // 检查地图功能是否可用
    this.checkMapAvailability();

    if (options.id) {
      this.isEdit = true;
      this.addressId = options.id;
      this.loadAddressDetail();
    }
  },
  methods: {
    /**
     * 初始化地区数据
     */
    initRegionData() {
      try {
        // 加载省份数据
        this.provinces = provinceData || [];
        console.log("省份数据加载成功，共", this.provinces.length, "条");
      } catch (error) {
        console.error("加载地区数据失败:", error);
        uni.showToast({
          title: "地区数据加载失败",
          icon: "none",
        });
      }
    },

    /**
     * 检查地图功能是否可用
     */
    async checkMapAvailability() {
      try {
        this.mapAvailable = await amapUtils.checkMapAvailability();
        console.log("地图功能可用性:", this.mapAvailable);
      } catch (error) {
        console.error("检查地图功能失败:", error);
        this.mapAvailable = false;
      }
    },

    /**
     * 加载地址详情（编辑模式）
     */
    async loadAddressDetail() {
      try {
        const res = await api.getAddressList();

        if (res.success) {
          const address = res.data.find((item) => item.id === this.addressId);
          if (address) {
            this.formData = { ...address };
          } else {
            uni.showToast({
              title: "地址不存在",
              icon: "none",
            });
            uni.navigateBack();
          }
        }
      } catch (error) {
        console.error("获取地址详情失败:", error);
        uni.showToast({
          title: "获取地址信息失败",
          icon: "none",
        });
      }
    },

    /**
     * 选择地区
     */
    chooseRegion() {
      // 如果地图可用，优先使用地图选择
      if (this.mapAvailable) {
        this.chooseLocationByMap();
      } else {
        // 地图不可用，使用多级菜单选择
        this.showRegionPicker();
      }
    },

    /**
     * 通过地图选择位置
     */
    async chooseLocationByMap() {
      try {
        // 跳转到地图选择页面
        uni.navigateTo({
          url: `/pages/map/location-picker?longitude=${
            this.formData.longitude || 116.397428
          }&latitude=${this.formData.latitude || 39.90923}`,
        });
      } catch (error) {
        console.error("打开地图选择页面失败:", error);
        uni.showToast({
          title: "打开地图失败",
          icon: "none",
        });
      }
    },

    /**
     * 地图选择位置回调
     */
    onLocationSelected(location) {
      console.log("选择的位置:", location);

      // 更新坐标
      this.formData.longitude = location.longitude;
      this.formData.latitude = location.latitude;

      // 解析地址信息
      this.parseLocationByAmap(
        location.latitude,
        location.longitude,
        location.name
      );
    },

    /**
     * 使用高德地图API解析位置信息
     * @param {number} latitude 纬度
     * @param {number} longitude 经度
     * @param {string} locationName 位置名称
     */
    async parseLocationByAmap(latitude, longitude, locationName = "") {
      try {
        // 使用高德地图逆地理编码API获取详细地址信息
        const addressInfo = await amapUtils.regeocode(longitude, latitude);

        console.log("逆地理编码结果:", addressInfo);

        // 检查是否为海外地区
        if (addressInfo.isOverseas) {
          uni.showModal({
            title: '位置提示',
            content: '检测到您当前位置在海外地区，高德地图无法提供详细的省市区信息。请手动选择地区信息。',
            showCancel: false,
            success: () => {
              this.showRegionPicker();
            }
          });
          
          // 只设置详细地址
          if (!this.formData.detail && locationName) {
            this.formData.detail = locationName;
          } else if (!this.formData.detail && addressInfo.formattedAddress) {
            this.formData.detail = addressInfo.formattedAddress;
          }
          return;
        }

        // 设置省市区信息
        this.formData.province = addressInfo.province || "";
        
        // 处理city字段（可能是字符串或数组）
        let cityValue = addressInfo.city;
        if (Array.isArray(cityValue)) {
          cityValue = cityValue.length > 0 ? cityValue[0] : "";
        }
        this.formData.city = cityValue || "";
        
        this.formData.district = addressInfo.district || "";
        
        // 特殊处理：如果是特别行政区（如香港、澳门），city为空时使用district作为city
        if (!this.formData.city && this.formData.province && 
            (this.formData.province.includes('特别行政区') || this.formData.province.includes('香港') || this.formData.province.includes('澳门'))) {
          this.formData.city = this.formData.district;
        }
        
        console.log('地址填充结果:', {
          province: this.formData.province,
          city: this.formData.city,
          district: this.formData.district
        });

        // 如果详细地址为空，则自动填充
        if (!this.formData.detail && locationName) {
          this.formData.detail = locationName;
        } else if (!this.formData.detail && addressInfo.street) {
          // 使用街道信息作为详细地址
          this.formData.detail = `${addressInfo.street}${addressInfo.streetNumber}`;
        }

        uni.showToast({
          title: "地址解析成功",
          icon: "success",
          duration: 1500,
        });
      } catch (error) {
        console.error("逆地理编码失败:", error);

        // 如果API调用失败，尝试使用简单的地址解析
        if (locationName) {
          const parsedAddress = amapUtils.parseAddressString(locationName);
          this.formData.province =
            parsedAddress.province || this.formData.province;
          this.formData.city = parsedAddress.city || this.formData.city;
          this.formData.district =
            parsedAddress.district || this.formData.district;

          if (!this.formData.detail) {
            this.formData.detail = parsedAddress.detail || locationName;
          }
        }

        uni.showToast({
          title: "地址解析不完整，请手动补充",
          icon: "none",
        });
      }
    },

    /**
     * 获取当前位置并自动填充地址
     */
    async getCurrentLocationAndFill() {
      try {
        uni.showLoading({
          title: "正在获取位置...",
        });

        // 获取当前位置
        const location = await amapUtils.getCurrentLocation();
        console.log("当前位置:", location);

        // 保存坐标
        this.formData.latitude = location.latitude;
        this.formData.longitude = location.longitude;

        // 解析地址信息
        await this.parseLocationByAmap(location.latitude, location.longitude);

        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        console.error("获取当前位置失败:", error);

        uni.showToast({
          title: "获取位置失败，请手动选择",
          icon: "none",
        });

        this.showRegionPicker();
      }
    },

    /**
     * 显示地区选择器
     */
    showRegionPicker() {
      this.regionType = "province";
      this.showRegionPickerPopup = true;
    },

    /**
     * 关闭地区选择器
     */
    closeRegionPicker() {
      this.showRegionPickerPopup = false;
    },

    /**
     * 选择省份
     */
    selectProvince(province) {
      this.formData.province = province.name;
      this.currentProvince = province;

      // 加载该省的城市数据
      this.cities = cityData[province.code] || [];
      this.regionType = "city";
    },

    /**
     * 选择城市
     */
    selectCity(city) {
      this.formData.city = city.name;
      this.currentCity = city;

      // 加载该市的区县数据
      this.districts = districtData[city.code] || [];
      this.regionType = "district";
    },

    /**
     * 选择区县
     */
    selectDistrict(district) {
      this.formData.district = district.name;
      this.closeRegionPicker();
    },

    /**
     * 返回上一级选择
     */
    goBackRegion() {
      if (this.regionType === "district") {
        this.regionType = "city";
        // 清空区县选择
        this.formData.district = "";
      } else if (this.regionType === "city") {
        this.regionType = "province";
        // 清空城市和区县选择
        this.formData.city = "";
        this.formData.district = "";
        this.currentCity = {};
        this.districts = [];
      } else {
        this.closeRegionPicker();
      }
    },

    /**
     * 获取面包屑导航文本
     */
    getBreadcrumbText() {
      const parts = [];
      if (this.formData.province) {
        parts.push(this.formData.province);
      }
      if (this.formData.city) {
        parts.push(this.formData.city);
      }
      if (this.formData.district) {
        parts.push(this.formData.district);
      }
      return parts.join(" > ");
    },

    /**
     * 获取当前选择级别的标题
     */
    getCurrentLevelTitle() {
      switch (this.regionType) {
        case "province":
          return "选择省份";
        case "city":
          return "选择城市";
        case "district":
          return "选择区县";
        default:
          return "选择地区";
      }
    },

    /**
     * 检查地区项是否被选中
     */
    isRegionSelected(item) {
      switch (this.regionType) {
        case "province":
          return this.formData.province === item.name;
        case "city":
          return this.formData.city === item.name;
        case "district":
          return this.formData.district === item.name;
        default:
          return false;
      }
    },

    /**
     * 选择标签
     */
    selectTag(tag) {
      this.formData.tag = this.formData.tag === tag ? "" : tag;
    },

    /**
     * 添加自定义标签
     */
    addCustomTag() {
      this.showCustomTag = true;
      this.customTag = "";
      this.$nextTick(() => {
        // 聚焦到输入框
      });
    },

    /**
     * 确认自定义标签
     */
    confirmCustomTag() {
      if (this.customTag.trim()) {
        this.formData.tag = this.customTag.trim();
        if (!this.addressTags.includes(this.customTag.trim())) {
          this.addressTags.push(this.customTag.trim());
        }
      }
      this.showCustomTag = false;
      this.customTag = "";
    },

    /**
     * 切换默认地址
     */
    toggleDefault(e) {
      this.formData.isDefault = e.detail.value;
    },

    /**
     * 提交表单
     */
    async submitForm() {
      if (!this.isFormValid) {
        uni.showToast({
          title: "请完善地址信息",
          icon: "none",
        });
        return;
      }

      if (this.loading) return;

      try {
        this.loading = true;
        uni.showLoading({
          title: this.isEdit ? "保存中..." : "添加中...",
        });

        let res;
        if (this.isEdit) {
          res = await api.updateAddress(this.addressId, this.formData);
        } else {
          res = await api.addAddress(this.formData);
        }

        if (res.success) {
          uni.showToast({
            title: this.isEdit ? "修改成功" : "添加成功",
            icon: "success",
          });

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || (this.isEdit ? "修改失败" : "添加失败"),
            icon: "none",
          });
        }
      } catch (error) {
        console.error("提交地址失败:", error);
        uni.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      } finally {
        this.loading = false;
        uni.hideLoading();
      }
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

/* 表单区域样式 */
.form-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.required {
  color: #d81e06;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
}

.input:focus {
  border-color: #d81e06;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
  resize: none;
}

.textarea:focus {
  border-color: #d81e06;
}

/* 地区选择器样式 */
.region-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  background-color: #fff;
}

.region-text {
  font-size: 28rpx;
  color: #333;
}

.placeholder {
  font-size: 28rpx;
  color: #999;
}

/* 位置操作按钮样式 */
.location-actions {
  display: flex;
  gap: 15rpx;
  margin-top: 15rpx;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 20rpx;
  font-size: 24rpx;
  background-color: #f8f8f8;
  color: #666;
  transition: all 0.3s;
}

.action-btn:active {
  background-color: #e8e8e8;
  transform: scale(0.95);
}

.action-btn text {
  font-size: 24rpx;
}

/* 标签选择器样式 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 15rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 15rpx 25rpx;
  border: 1rpx solid #ddd;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #f8f8f8;
}

.tag-item.active {
  background-color: #d81e06;
  color: #fff;
  border-color: #d81e06;
}

.custom-tag-input {
  padding: 15rpx 25rpx;
  border: 1rpx solid #d81e06;
  border-radius: 30rpx;
  font-size: 26rpx;
  background-color: #fff;
  min-width: 120rpx;
}

/* 提交按钮样式 */
.submit-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.submit-btn {
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
}

.submit-btn:disabled {
  background-color: #ccc;
  color: #999;
}

.submit-btn:active:not(:disabled) {
  background-color: #c01e06;
}

/* 地区选择弹窗样式 */
.region-picker-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  position: relative;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: center;
}

.popup-back {
  position: absolute;
  left: 30rpx;
  font-size: 36rpx;
  color: #666;
  padding: 10rpx;
  z-index: 1;
}

.popup-close {
  position: absolute;
  right: 30rpx;
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
  z-index: 1;
}

/* 面包屑导航样式 */
.breadcrumb {
  padding: 20rpx 30rpx;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #eee;
}

.breadcrumb-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.breadcrumb-text:empty {
  display: none;
}

.region-tabs {
  display: flex;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.region-tab {
  padding: 10rpx 20rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.region-tab.active {
  color: #d81e06;
  font-weight: bold;
}

.region-tab.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background-color: #d81e06;
}

.region-tab.disabled {
  color: #ccc;
}

.region-list {
  flex: 1;
  padding: 20rpx 30rpx;
  max-height: 60vh;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 0;
  font-size: 28rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
  transition: background-color 0.2s;
}

.region-item:active {
  background-color: #f9f9f9;
}

.region-item.selected {
  color: #d81e06;
  background-color: #fef7f7;
}

.region-item.selected .region-name {
  font-weight: bold;
}

.region-name {
  flex: 1;
}

.region-check {
  font-size: 32rpx;
  color: #d81e06;
  margin-left: 20rpx;
}
</style>
