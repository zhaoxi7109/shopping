<template>
  <view class="amap-container">
    <!-- H5端使用高德地图Web API -->
    <!-- #ifdef H5 -->
    <view class="map-wrapper">
      <view :id="mapId" class="map-view"></view>
      <!-- 地图控制按钮 -->
      <view class="map-controls" v-if="showControls">
        <view class="control-btn" @click="getCurrentLocation">
          <UnifiedIcon type="icon-location" :size="16" color="#fff" />
        </view>
        <view class="control-btn" @click="zoomIn">
          <text class="control-text">+</text>
        </view>
        <view class="control-btn" @click="zoomOut">
          <text class="control-text">-</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 小程序端使用原生地图组件 -->
    <!-- #ifdef MP-WEIXIN -->
    <map
      :id="mapId"
      class="map-view"
      :longitude="longitude"
      :latitude="latitude"
      :scale="scale"
      :markers="markers"
      :show-location="showLocation"
      :enable-3D="enable3D"
      :show-compass="showCompass"
      :enable-overlooking="enableOverlooking"
      :enable-zoom="enableZoom"
      :enable-scroll="enableScroll"
      :enable-rotate="enableRotate"
      :enable-satellite="enableSatellite"
      :enable-traffic="enableTraffic"
      @markertap="onMarkerTap"
      @tap="onMapTap"
      @regionchange="onRegionChange"
      @updated="onMapUpdated"
    >
      <!-- 地图控制按钮 -->
      <cover-view class="map-controls" v-if="showControls">
        <cover-view class="control-btn" @tap="getCurrentLocation">
          <cover-image
            class="control-icon"
            src="/static/icons/location.png"
          ></cover-image>
        </cover-view>
      </cover-view>
    </map>
    <!-- #endif -->

    <!-- App端使用原生地图组件 -->
    <!-- #ifdef APP-PLUS -->
    <map
      :id="mapId"
      class="map-view"
      :longitude="longitude"
      :latitude="latitude"
      :scale="scale"
      :markers="markers"
      :show-location="showLocation"
      :enable-3D="enable3D"
      :show-compass="showCompass"
      :enable-overlooking="enableOverlooking"
      :enable-zoom="enableZoom"
      :enable-scroll="enableScroll"
      :enable-rotate="enableRotate"
      :enable-satellite="enableSatellite"
      :enable-traffic="enableTraffic"
      @markertap="onMarkerTap"
      @tap="onMapTap"
      @regionchange="onRegionChange"
      @updated="onMapUpdated"
    >
    </map>
    <!-- #endif -->

    <!-- 地址信息显示 -->
    <view class="address-info" v-if="showAddressInfo && currentAddress">
      <view class="address-text">
        <UnifiedIcon type="icon-location" :size="16" color="#d81e06" />
        <text>{{ currentAddress }}</text>
      </view>
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
import UnifiedIcon from "@/components/UnifiedIcon.vue";
import amapUtils from "@/utils/amap.js";

export default {
  name: "AmapView",
  components: {
    UnifiedIcon,
  },
  props: {
    // 地图中心点经度
    longitude: {
      type: Number,
      default: 116.397428,
    },
    // 地图中心点纬度
    latitude: {
      type: Number,
      default: 39.90923,
    },
    // 地图缩放级别
    scale: {
      type: Number,
      default: 16,
    },
    // 地图标记点
    markers: {
      type: Array,
      default: () => [],
    },
    // 是否显示当前位置
    showLocation: {
      type: Boolean,
      default: true,
    },
    // 是否显示控制按钮
    showControls: {
      type: Boolean,
      default: true,
    },
    // 是否显示地址信息
    showAddressInfo: {
      type: Boolean,
      default: false,
    },
    // 地图高度
    height: {
      type: String,
      default: "400rpx",
    },
    // 是否启用3D
    enable3D: {
      type: Boolean,
      default: false,
    },
    // 是否显示指南针
    showCompass: {
      type: Boolean,
      default: false,
    },
    // 是否启用俯视
    enableOverlooking: {
      type: Boolean,
      default: false,
    },
    // 是否启用缩放
    enableZoom: {
      type: Boolean,
      default: true,
    },
    // 是否启用滚动
    enableScroll: {
      type: Boolean,
      default: true,
    },
    // 是否启用旋转
    enableRotate: {
      type: Boolean,
      default: false,
    },
    // 是否启用卫星图
    enableSatellite: {
      type: Boolean,
      default: false,
    },
    // 是否启用路况
    enableTraffic: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mapId: "amap_" + Date.now(),
      mapContext: null,
      currentAddress: "",
      loading: false,
      loadingText: "加载中...",
      // #ifdef H5
      amapInstance: null,
      // #endif
    };
  },
  mounted() {
    // 确保DOM渲染完成后再初始化地图
    this.$nextTick(() => {
      this.initMap();
    });
  },
  beforeDestroy() {
    this.destroyMap();
  },
  methods: {
    /**
     * 初始化地图
     */
    async initMap() {
      try {
        this.loading = true;
        this.loadingText = "正在初始化地图...";

        // #ifdef H5
        await this.initWebMap();
        // #endif

        // #ifdef MP-WEIXIN || APP-PLUS
        this.initNativeMap();
        // #endif

        // 获取当前地址信息
        if (this.showAddressInfo) {
          await this.updateAddressInfo();
        }
      } catch (error) {
        console.error("地图初始化失败:", error);
        this.$emit("error", error);
      } finally {
        this.loading = false;
      }
    },

    // #ifdef H5
    /**
     * 初始化Web端地图
     */
    async initWebMap() {
      return new Promise((resolve, reject) => {
        console.log('开始初始化Web端地图');
        
        // 动态加载高德地图JS API
        if (window.AMap) {
          console.log('高德地图API已存在，直接创建地图');
          this.createWebMap();
          resolve();
          return;
        }

        console.log('开始加载高德地图API');
        const script = document.createElement("script");
        script.src = `https://webapi.amap.com/maps?v=2.0&key=95145f5619f2cc78270d66b3722a221c&plugin=AMap.Geocoder`;
        script.onload = () => {
          console.log('高德地图API加载成功');
          this.createWebMap();
          resolve();
        };
        script.onerror = (error) => {
          console.error('高德地图API加载失败:', error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    },

    /**
     * 创建Web端地图实例
     */
    createWebMap() {
      try {
        console.log('创建地图实例，参数:', {
          mapId: this.mapId,
          zoom: this.scale,
          center: [this.longitude, this.latitude]
        });
        
        // 强制延迟确保DOM完全渲染
        setTimeout(() => {
          const mapContainer = document.getElementById(this.mapId);
          console.log('地图容器查找结果:', mapContainer);
          
          if (!mapContainer) {
            console.error('地图容器不存在:', this.mapId);
            // 尝试延迟重试
            setTimeout(() => {
              this.createWebMap();
            }, 500);
            return;
          }
          
          // 确保容器有尺寸
          if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
            console.warn('地图容器尺寸为0，设置默认尺寸');
            mapContainer.style.width = '100%';
            mapContainer.style.height = '400px';
            mapContainer.style.backgroundColor = '#f5f5f5';
            mapContainer.style.position = 'relative';
            mapContainer.style.display = 'block';
          }
          
          console.log('地图容器尺寸:', {
            width: mapContainer.offsetWidth,
            height: mapContainer.offsetHeight,
            clientWidth: mapContainer.clientWidth,
            clientHeight: mapContainer.clientHeight
          });
          
          // 检查AMap是否可用
          if (!window.AMap) {
            console.error('AMap对象不存在，可能是API加载失败');
            // 尝试重新加载API
            this.initWebMap();
            return;
          }
          
          try {
             this.amapInstance = new AMap.Map(this.mapId, {
               zoom: this.scale,
               center: [this.longitude, this.latitude],
               mapStyle: "amap://styles/normal",
               resizeEnable: true,
               viewMode: '2D',
               features: ['bg', 'road', 'building', 'point'],
               showLabel: true
             });
            
            console.log('地图实例创建成功:', this.amapInstance);
  
            // 添加标记点
            if (this.markers.length > 0) {
              this.addWebMarkers();
            }
  
            // 绑定事件
            this.amapInstance.on("click", this.onWebMapClick);
  
            // 添加地图加载完成事件
            this.amapInstance.on('complete', () => {
              console.log('地图加载完成事件触发');
              this.$emit("ready", this.amapInstance);
            });
            
            // 添加错误事件监听
            this.amapInstance.on('error', (e) => {
              console.error('地图加载错误:', e);
            });
          } catch (mapError) {
            console.error('创建地图实例时发生错误:', mapError);
          }
        }, 300);
      } catch (error) {
        console.error('创建地图实例失败:', error);
      }
    },

    /**
     * 添加Web端标记点
     */
    addWebMarkers() {
      this.markers.forEach((marker) => {
        const amapMarker = new AMap.Marker({
          position: [marker.longitude, marker.latitude],
          title: marker.title || "",
          content: marker.iconPath
            ? `<img src="${marker.iconPath}" style="width:${
                marker.width || 32
              }px;height:${marker.height || 32}px;">`
            : undefined,
        });

        this.amapInstance.add(amapMarker);

        // 绑定点击事件
        amapMarker.on("click", (e) => {
          this.$emit("markertap", {
            markerId: marker.id,
            marker: marker,
          });
        });
      });
    },

    /**
     * Web端地图点击事件
     */
    onWebMapClick(e) {
      this.$emit("tap", {
        longitude: e.lnglat.lng,
        latitude: e.lnglat.lat,
      });
    },
    // #endif

    // #ifdef MP-WEIXIN || APP-PLUS
    /**
     * 初始化原生地图
     */
    initNativeMap() {
      this.$nextTick(() => {
        this.mapContext = uni.createMapContext(this.mapId, this);
        this.$emit("ready", this.mapContext);
      });
    },
    // #endif

    /**
     * 销毁地图
     */
    destroyMap() {
      // #ifdef H5
      if (this.amapInstance) {
        this.amapInstance.destroy();
        this.amapInstance = null;
      }
      // #endif

      this.mapContext = null;
    },

    /**
     * 获取当前位置
     */
    async getCurrentLocation() {
      try {
        this.loading = true;
        this.loadingText = "正在获取位置...";

        const location = await amapUtils.getCurrentLocation();

        // 移动地图中心到当前位置
        this.moveToLocation(location.longitude, location.latitude);

        // 更新地址信息
        if (this.showAddressInfo) {
          await this.updateAddressInfo(location.longitude, location.latitude);
        }

        this.$emit("locationchange", location);
      } catch (error) {
        console.error("获取位置失败:", error);
        uni.showToast({
          title: "获取位置失败",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 移动地图中心到指定位置
     */
    moveToLocation(longitude, latitude) {
      // #ifdef H5
      if (this.amapInstance) {
        this.amapInstance.setCenter([longitude, latitude]);
      }
      // #endif

      // #ifdef MP-WEIXIN || APP-PLUS
      if (this.mapContext) {
        this.mapContext.moveToLocation({
          longitude,
          latitude,
        });
      }
      // #endif

      // 更新props
      this.$emit("update:longitude", longitude);
      this.$emit("update:latitude", latitude);
    },

    /**
     * 放大地图
     */
    zoomIn() {
      // #ifdef H5
      if (this.amapInstance) {
        this.amapInstance.zoomIn();
      }
      // #endif

      // #ifdef MP-WEIXIN || APP-PLUS
      const newScale = Math.min(this.scale + 1, 20);
      this.$emit("update:scale", newScale);
      // #endif
    },

    /**
     * 缩小地图
     */
    zoomOut() {
      // #ifdef H5
      if (this.amapInstance) {
        this.amapInstance.zoomOut();
      }
      // #endif

      // #ifdef MP-WEIXIN || APP-PLUS
      const newScale = Math.max(this.scale - 1, 3);
      this.$emit("update:scale", newScale);
      // #endif
    },

    /**
     * 更新地址信息
     */
    async updateAddressInfo(
      longitude = this.longitude,
      latitude = this.latitude
    ) {
      try {
        const addressInfo = await amapUtils.regeocode(longitude, latitude);
        this.currentAddress = addressInfo.formattedAddress;
        this.$emit("addresschange", addressInfo);
      } catch (error) {
        console.error("获取地址信息失败:", error);
      }
    },

    /**
     * 标记点击事件
     */
    onMarkerTap(e) {
      this.$emit("markertap", e);
    },

    /**
     * 地图点击事件
     */
    onMapTap(e) {
      this.$emit("tap", e);
    },

    /**
     * 地图区域变化事件
     */
    onRegionChange(e) {
      this.$emit("regionchange", e);

      // 如果显示地址信息，更新地址
      if (this.showAddressInfo && e.type === "end") {
        this.updateAddressInfo();
      }
    },

    /**
     * 地图更新事件
     */
    onMapUpdated(e) {
      this.$emit("updated", e);
    },
  },
};
</script>

<style scoped>
.amap-container {
  position: relative;
  width: 100%;
}

.map-wrapper {
  position: relative;
  width: 100%;
}

.map-view {
  width: 100%;
  height: v-bind(height);
  min-height: 200px;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  right: 20rpx;
  top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.control-btn {
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
}

.control-btn:active {
  background-color: rgba(255, 255, 255, 0.7);
  transform: scale(0.95);
}

.control-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.control-icon {
  width: 32rpx;
  height: 32rpx;
}

/* 地址信息 */
.address-info {
  position: absolute;
  bottom: 20rpx;
  left: 20rpx;
  right: 20rpx;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12rpx;
  padding: 20rpx;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.address-text {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
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
  z-index: 999;
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
