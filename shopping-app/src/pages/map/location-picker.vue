<template>
  <view class="location-picker">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <UnifiedIcon type="icon-search" :size="16" color="#999" />
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索地点"
          @input="onSearchInput"
          @confirm="searchLocation"
        />
        <view class="search-btn" @click="searchLocation" v-if="searchKeyword">
          <text>搜索</text>
        </view>
      </view>
    </view>

    <!-- 地图容器 -->
    <view class="map-container">
      <AmapView
        ref="amapView"
        :longitude="currentLongitude"
        :latitude="currentLatitude"
        :scale="mapScale"
        :markers="mapMarkers"
        :show-location="true"
        :show-controls="true"
        :show-address-info="false"
        height="250px"
        @ready="onMapReady"
        @tap="onMapTap"
        @locationchange="onLocationChange"
        @regionchange="onRegionChange"
      />

      <!-- 中心点标记 -->
      <view class="center-marker">
        <UnifiedIcon type="icon-location" :size="24" color="#d81e06" />
      </view>
    </view>

    <!-- 底部地址信息和操作 -->
    <view class="bottom-panel">
      <!-- 当前选中地址 -->
      <view class="selected-address">
        <view class="address-header">
          <UnifiedIcon type="icon-location" :size="16" color="#d81e06" />
          <text class="address-title">选中位置</text>
        </view>
        <view class="address-content">
          <text class="address-name" v-if="selectedLocation.name">{{
            selectedLocation.name
          }}</text>
          <text class="address-detail">{{
            selectedLocation.address || "正在获取地址信息..."
          }}</text>
        </view>
      </view>

      <!-- 附近地点列表 -->
      <view class="nearby-places" v-if="nearbyPlaces.length > 0">
        <view class="places-header">
          <text class="places-title">附近地点</text>
        </view>
        <scroll-view scroll-y class="places-list">
          <view
            v-for="place in nearbyPlaces"
            :key="place.id"
            class="place-item"
            :class="{ active: selectedLocation.id === place.id }"
            @click="selectPlace(place)"
          >
            <view class="place-info">
              <text class="place-name">{{ place.name }}</text>
              <text class="place-address">{{ place.address }}</text>
            </view>
            <view class="place-distance" v-if="place.distance">
              <text>{{ formatDistance(place.distance) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button
          class="confirm-btn"
          @click="confirm"
          :disabled="!selectedLocation.address"
        >
          确定选择
        </button>
      </view>
    </view>

    <!-- 搜索结果列表 -->
    <view class="search-results" v-if="showSearchResults">
      <view class="results-header">
        <text class="results-title">搜索结果</text>
        <view class="close-btn" @click="closeSearchResults">
          <UnifiedIcon type="icon-close" :size="16" color="#999" />
        </view>
      </view>
      <scroll-view scroll-y class="results-list">
        <view
          v-for="result in searchResults"
          :key="result.id"
          class="result-item"
          @click="selectSearchResult(result)"
        >
          <view class="result-info">
            <text class="result-name">{{ result.name }}</text>
            <text class="result-address">{{ result.address }}</text>
          </view>
        </view>
        <view
          class="no-results"
          v-if="searchResults.length === 0 && !searchLoading"
        >
          <text>未找到相关地点</text>
        </view>
      </scroll-view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import AmapView from "@/components/AmapView.vue";
import UnifiedIcon from "@/components/UnifiedIcon.vue";
import amapUtils from "@/utils/amap.js";

export default {
  name: "LocationPicker",
  components: {
    AmapView,
    UnifiedIcon,
  },
  data() {
    return {
      // 地图相关
      currentLongitude: 116.397428,
      currentLatitude: 39.90923,
      mapScale: 16,
      mapMarkers: [],
      mapContext: null,

      // 选中位置信息
      selectedLocation: {
        id: "",
        name: "",
        address: "",
        longitude: 0,
        latitude: 0,
      },

      // 附近地点
      nearbyPlaces: [],

      // 搜索相关
      searchKeyword: "",
      searchResults: [],
      showSearchResults: false,
      searchLoading: false,
      searchTimer: null,

      // 状态
      loading: false,
      loadingText: "加载中...",

      // 防抖定时器
      debounceTimer: null,
    };
  },
  onLoad(options) {
    // 获取传入的初始位置
    if (options.longitude && options.latitude) {
      this.currentLongitude = parseFloat(options.longitude);
      this.currentLatitude = parseFloat(options.latitude);
    }

    // 初始化当前位置
    this.initCurrentLocation();
  },
  onUnload() {
    // 清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  },
  methods: {
    /**
     * 初始化当前位置
     */
    async initCurrentLocation() {
      try {
        this.loading = true;
        this.loadingText = "正在获取当前位置...";

        // 如果没有传入坐标，获取当前位置
        if (
          this.currentLongitude === 116.397428 &&
          this.currentLatitude === 39.90923
        ) {
          const location = await amapUtils.getCurrentLocation();
          this.currentLongitude = location.longitude;
          this.currentLatitude = location.latitude;
        }

        // 更新选中位置
        this.selectedLocation.longitude = this.currentLongitude;
        this.selectedLocation.latitude = this.currentLatitude;

        // 获取地址信息
        await this.updateSelectedAddress();

        // 获取附近地点
        await this.loadNearbyPlaces();
      } catch (error) {
        console.error("初始化位置失败:", error);
        uni.showToast({
          title: "获取位置失败",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 地图准备完成
     */
    onMapReady(mapContext) {
      this.mapContext = mapContext;
      console.log("地图初始化完成");
    },

    /**
     * 地图点击事件
     */
    onMapTap(e) {
      console.log("地图点击:", e);
      this.selectLocationByCoordinate(e.longitude, e.latitude);
    },

    /**
     * 位置变化事件
     */
    onLocationChange(location) {
      console.log("位置变化:", location);
      this.selectLocationByCoordinate(location.longitude, location.latitude);
    },

    /**
     * 地图区域变化事件
     */
    onRegionChange(e) {
      if (e.type === "end") {
        // 防抖处理，避免频繁更新
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
          // 获取地图中心点坐标
          this.getMapCenter();
        }, 500);
      }
    },

    /**
     * 获取地图中心点坐标
     */
    getMapCenter() {
      // #ifdef H5
      if (this.$refs.amapView && this.$refs.amapView.amapInstance) {
        const center = this.$refs.amapView.amapInstance.getCenter();
        this.selectLocationByCoordinate(center.lng, center.lat);
      }
      // #endif

      // #ifdef MP-WEIXIN || APP-PLUS
      if (this.mapContext) {
        this.mapContext.getCenterLocation({
          success: (res) => {
            this.selectLocationByCoordinate(res.longitude, res.latitude);
          },
        });
      }
      // #endif
    },

    /**
     * 根据坐标选择位置
     */
    async selectLocationByCoordinate(longitude, latitude) {
      try {
        this.selectedLocation.longitude = longitude;
        this.selectedLocation.latitude = latitude;
        this.selectedLocation.id = `${longitude}_${latitude}`;
        this.selectedLocation.name = "";

        // 更新地图中心
        this.currentLongitude = longitude;
        this.currentLatitude = latitude;

        // 获取地址信息
        await this.updateSelectedAddress();

        // 获取附近地点
        await this.loadNearbyPlaces();
      } catch (error) {
        console.error("选择位置失败:", error);
      }
    },

    /**
     * 更新选中地址信息
     */
    async updateSelectedAddress() {
      try {
        const addressInfo = await amapUtils.regeocode(
          this.selectedLocation.longitude,
          this.selectedLocation.latitude
        );

        this.selectedLocation.address = addressInfo.formattedAddress;
      } catch (error) {
        console.error("获取地址信息失败:", error);
        this.selectedLocation.address = "地址解析失败";
      }
    },

    /**
     * 加载附近地点
     */
    async loadNearbyPlaces() {
      try {
        console.log("开始加载附近地点，当前位置:", {
          longitude: this.selectedLocation.longitude,
          latitude: this.selectedLocation.latitude,
          address: this.selectedLocation.address,
        });

        // 添加当前位置到附近地点列表
        this.nearbyPlaces = [
          {
            id: "current",
            name: "当前位置",
            address: this.selectedLocation.address || "正在获取地址...",
            longitude: this.selectedLocation.longitude,
            latitude: this.selectedLocation.latitude,
            distance: 0,
          },
        ];

        // 尝试获取更多附近地点（模拟数据）
        const mockNearbyPlaces = [
          {
            id: "nearby_1",
            name: "附近商店",
            address: "距离当前位置约100米",
            longitude: this.selectedLocation.longitude + 0.001,
            latitude: this.selectedLocation.latitude + 0.001,
            distance: 100,
          },
          {
            id: "nearby_2",
            name: "附近餐厅",
            address: "距离当前位置约200米",
            longitude: this.selectedLocation.longitude - 0.001,
            latitude: this.selectedLocation.latitude + 0.001,
            distance: 200,
          },
        ];

        // 添加模拟的附近地点
        this.nearbyPlaces.push(...mockNearbyPlaces);

        console.log("附近地点加载完成，共", this.nearbyPlaces.length, "个地点");
      } catch (error) {
        console.error("获取附近地点失败:", error);
        this.nearbyPlaces = [
          {
            id: "current",
            name: "当前位置",
            address: this.selectedLocation.address || "地址获取失败",
            longitude: this.selectedLocation.longitude,
            latitude: this.selectedLocation.latitude,
            distance: 0,
          },
        ];
      }
    },

    /**
     * 选择附近地点
     */
    selectPlace(place) {
      this.selectedLocation = { ...place };
      this.currentLongitude = place.longitude;
      this.currentLatitude = place.latitude;

      // 移动地图到选中位置
      if (this.$refs.amapView) {
        this.$refs.amapView.moveToLocation(place.longitude, place.latitude);
      }
    },

    /**
     * 搜索输入事件
     */
    onSearchInput() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      if (this.searchKeyword.trim()) {
        this.searchTimer = setTimeout(() => {
          this.searchLocation();
        }, 500);
      } else {
        this.closeSearchResults();
      }
    },

    /**
     * 搜索地点
     */
    async searchLocation() {
      if (!this.searchKeyword.trim()) {
        return;
      }

      try {
        this.searchLoading = true;
        this.showSearchResults = true;

        // 这里可以调用高德地图的地点搜索API
        // 由于API限制，这里使用地理编码API进行简单搜索
        const result = await amapUtils.geocode(this.searchKeyword);

        this.searchResults = [
          {
            id: "search_result",
            name: this.searchKeyword,
            address: `${result.province}${result.city}${result.district}`,
            longitude: result.longitude,
            latitude: result.latitude,
          },
        ];
      } catch (error) {
        console.error("搜索失败:", error);
        this.searchResults = [];
        uni.showToast({
          title: "搜索失败",
          icon: "none",
        });
      } finally {
        this.searchLoading = false;
      }
    },

    /**
     * 选择搜索结果
     */
    selectSearchResult(result) {
      this.selectLocationByCoordinate(result.longitude, result.latitude);
      this.selectedLocation.name = result.name;
      this.closeSearchResults();
      this.searchKeyword = "";
    },

    /**
     * 关闭搜索结果
     */
    closeSearchResults() {
      this.showSearchResults = false;
      this.searchResults = [];
    },

    /**
     * 格式化距离显示
     */
    formatDistance(distance) {
      if (distance < 1000) {
        return `${Math.round(distance)}m`;
      } else {
        return `${(distance / 1000).toFixed(1)}km`;
      }
    },

    /**
     * 取消选择
     */
    cancel() {
      uni.navigateBack();
    },

    /**
     * 确认选择
     */
    confirm() {
      if (!this.selectedLocation.address) {
        uni.showToast({
          title: "请选择一个位置",
          icon: "none",
        });
        return;
      }

      // 返回选中的位置信息
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];

      if (prevPage) {
        // 调用上一页的回调方法
        if (prevPage.onLocationSelected) {
          prevPage.onLocationSelected(this.selectedLocation);
        }
      }

      uni.navigateBack();
    },
  },
};
</script>

<style scoped>
.location-picker {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 搜索头部 */
.search-header {
  background-color: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  border-radius: 25rpx;
  padding: 0 20rpx;
  height: 70rpx;
}

.search-input {
  flex: 1;
  margin-left: 15rpx;
  font-size: 28rpx;
  color: #333;
}

.search-btn {
  padding: 10rpx 20rpx;
  background-color: #d81e06;
  color: #fff;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-left: 15rpx;
}

/* 地图容器 */
.map-container {
  flex: 1;
  position: relative;
  min-height: 200px;
  height: calc(50vh - 100px);
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  pointer-events: none;
}

/* 底部面板 */
.bottom-panel {
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

/* 选中地址 */
.selected-address {
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 15rpx;
}

.address-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.address-content {
  margin-left: 26rpx;
}

.address-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.address-detail {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 附近地点 */
.nearby-places {
  flex: 1;
  min-height: 0;
}

.places-header {
  padding: 20rpx 30rpx 10rpx;
  border-bottom: 1rpx solid #eee;
}

.places-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.places-list {
  max-height: 300rpx;
}

.place-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.place-item.active {
  background-color: #f0f9ff;
}

.place-info {
  flex: 1;
}

.place-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
}

.place-address {
  font-size: 24rpx;
  color: #666;
}

.place-distance {
  font-size: 24rpx;
  color: #999;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.confirm-btn {
  flex: 2;
  height: 80rpx;
  background-color: #d81e06;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.confirm-btn:disabled {
  background-color: #ccc;
  color: #999;
}

/* 搜索结果 */
.search-results {
  position: absolute;
  top: 110rpx;
  left: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.results-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  padding: 10rpx;
}

.results-list {
  flex: 1;
}

.result-item {
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.result-name {
  font-size: 28rpx;
  color: #333;
}

.result-address {
  font-size: 24rpx;
  color: #666;
}

.no-results {
  padding: 60rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #d81e06;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
