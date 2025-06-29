<template>
  <view class="container">
    <view class="header">
      <text class="title">物流详情</text>
      <view class="header-actions">
        <view class="action-btn" @click="toggleMapView">
          <UnifiedIcon
            :type="showMap ? 'icon-list' : 'icon-location'"
            :size="16"
            color="#666"
          />
          <text class="action-text">{{ showMap ? "列表" : "地图" }}</text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="order" class="logistics-content">
      <!-- 物流状态 -->
      <view class="status-section">
        <view class="status-icon">
          <UnifiedIcon type="icon-truck" color="#d81e06" :size="20" />
        </view>
        <view class="status-info">
          <text class="status-text">{{ getLogisticsStatusText() }}</text>
          <text class="status-desc">{{ getLogisticsStatusDesc() }}</text>
        </view>
        <view class="status-time">
          <text class="time-text">{{ getLatestUpdateTime() }}</text>
        </view>
      </view>

      <!-- 地图视图 -->
      <view v-if="showMap" class="map-section">
        <view class="section-header">
          <text class="section-title">物流轨迹地图</text>
          <view class="map-controls">
            <view class="control-btn" @click="centerToCurrentLocation">
              <UnifiedIcon type="icon-location" :size="14" color="#666" />
              <text>定位</text>
            </view>
            <view class="control-btn" @click="fitTrackingRoute">
              <UnifiedIcon type="icon-route" :size="14" color="#666" />
              <text>全览</text>
            </view>
          </view>
        </view>
        <view class="map-container">
          <AmapView
            ref="logisticsMap"
            :longitude="mapCenter.longitude"
            :latitude="mapCenter.latitude"
            :scale="mapScale"
            :markers="mapMarkers"
            :polyline="trackingPolyline"
            :show-location="true"
            :show-controls="false"
            height="400rpx"
            @ready="onMapReady"
            @markertap="onMarkerTap"
          />
        </view>

        <!-- 当前位置信息 -->
        <view class="current-location" v-if="currentTrackingInfo">
          <view class="location-header">
            <UnifiedIcon type="icon-truck" color="#d81e06" :size="16" />
            <text class="location-title">当前位置</text>
          </view>
          <view class="location-content">
            <text class="location-status">{{
              currentTrackingInfo.status
            }}</text>
            <text class="location-time">{{ currentTrackingInfo.time }}</text>
            <text class="location-address">{{
              currentTrackingInfo.location
            }}</text>
          </view>
        </view>
      </view>

      <!-- 列表视图 -->
      <view v-else>
        <!-- 物流信息 -->
        <view class="logistics-info">
          <view class="section-header">
            <text class="section-title">物流信息</text>
          </view>
          <view class="info-item">
            <text class="label">快递公司</text>
            <text class="value">{{
              order.shippingInfo?.carrier || "未知"
            }}</text>
          </view>
          <view class="info-item">
            <text class="label">运单号码</text>
            <view class="tracking-number">
              <text class="value">{{
                order.shippingInfo?.trackingNumber || "暂无"
              }}</text>
              <button class="copy-btn" @click="copyTrackingNumber">复制</button>
            </view>
          </view>
          <view class="info-item">
            <text class="label">发货时间</text>
            <text class="value">{{ formatTime(order.shippingTime) }}</text>
          </view>
          <view class="info-item">
            <text class="label">预计送达</text>
            <text class="value">{{ getEstimatedDeliveryTime() }}</text>
          </view>
        </view>

        <!-- 收货信息 -->
        <view class="address-section">
          <view class="section-header">
            <text class="section-title">收货信息</text>
            <view class="address-actions">
              <view class="action-btn" @click="showAddressOnMap">
                <UnifiedIcon type="icon-location" :size="14" color="#d81e06" />
                <text>查看位置</text>
              </view>
            </view>
          </view>
          <view class="address-content">
            <view class="address-info">
              <text class="name">{{ order.shippingAddress.name }}</text>
              <text class="phone">{{ order.shippingAddress.phone }}</text>
            </view>
            <text class="address-detail">{{
              getFullAddress(order.shippingAddress)
            }}</text>
          </view>
        </view>

        <!-- 物流轨迹 -->
        <view class="tracking-section">
          <view class="section-header">
            <text class="section-title">物流轨迹</text>
            <view class="tracking-actions">
              <view class="action-btn" @click="refreshTracking">
                <UnifiedIcon type="icon-refresh" :size="14" color="#666" />
                <text>刷新</text>
              </view>
            </view>
          </view>
          <view class="tracking-timeline">
            <view
              v-for="(track, index) in trackingData"
              :key="index"
              class="track-item"
              @click="showTrackingOnMap(track)"
            >
              <view class="track-dot" :class="{ active: index === 0 }"></view>
              <view
                class="track-line"
                v-if="index < trackingData.length - 1"
              ></view>
              <view class="track-content">
                <view class="track-header">
                  <text class="track-status">{{ track.status }}</text>
                  <view
                    class="track-location-btn"
                    v-if="track.longitude && track.latitude"
                  >
                    <UnifiedIcon type="icon-location" :size="12" color="#999" />
                  </view>
                </view>
                <view class="track-time">{{ track.time }}</view>
                <view class="track-location">{{ track.location }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="error-state">
      <uni-icons type="info" color="#999" size="60" />
      <text class="error-text">订单不存在或已被删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="order && order.status === 'shipped'" class="bottom-actions">
      <button class="confirm-btn" @click="confirmReceive">确认收货</button>
    </view>
  </view>
</template>

<script>
import api from "@/utils/api";
import AmapView from "@/components/AmapView.vue";
import UnifiedIcon from "@/components/UnifiedIcon.vue";
import amapUtils from "@/utils/amap.js";

export default {
  components: {
    AmapView,
    UnifiedIcon,
  },
  data() {
    return {
      orderId: "",
      order: null,
      loading: true,

      // 视图切换
      showMap: false,

      // 地图相关
      mapCenter: {
        longitude: 116.397428,
        latitude: 39.90923,
      },
      mapScale: 12,
      mapMarkers: [],
      trackingPolyline: [],
      mapContext: null,

      // 物流轨迹数据
      trackingData: [],
      currentTrackingInfo: null,

      // 模拟物流位置数据
      mockTrackingLocations: [
        { city: "深圳", longitude: 114.057868, latitude: 22.543099 },
        { city: "广州", longitude: 113.264385, latitude: 23.129163 },
        { city: "长沙", longitude: 112.938814, latitude: 28.228209 },
        { city: "武汉", longitude: 114.305392, latitude: 30.593099 },
        { city: "北京", longitude: 116.397428, latitude: 39.90923 },
      ],
    };
  },

  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId;
      this.loadOrderDetail();
    } else {
      this.loading = false;
    }
  },

  methods: {
    /**
     * 加载订单详情
     */
    async loadOrderDetail() {
      try {
        this.loading = true;
        const res = await api.getOrderDetail(this.orderId);

        if (res.code === 200) {
          this.order = res.data;

          // 检查订单状态
          if (!this.order.shippingInfo) {
            uni.showToast({
              title: "该订单暂无物流信息",
              icon: "none",
            });
          }

          // 生成模拟物流轨迹数据
          this.generateTrackingData();
        } else {
          uni.showToast({
            title: res.message || "获取订单失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取订单详情失败:", error);
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 生成模拟物流轨迹数据
     */
    generateTrackingData() {
      if (!this.order || !this.order.shippingInfo) return;

      const carrier = this.order.shippingInfo.carrier;
      const shippedTime = new Date(this.order.shippingTime);
      const now = new Date();
      const isDelivered =
        this.order.status === "delivered" || this.order.status === "completed";
      const deliveryTime = isDelivered
        ? new Date(this.order.deliveryTime)
        : null;

      // 计算时间差（天）
      const daysDiff = Math.floor((now - shippedTime) / (24 * 60 * 60 * 1000));

      // 根据订单状态生成不同的物流轨迹
      const trackingData = [];
      const locations = this.mockTrackingLocations;
      let locationIndex = 0;

      // 如果已送达
      if (isDelivered) {
        const deliveryLocation = locations[locations.length - 1];
        trackingData.push({
          status: "已签收",
          time: this.formatTime(deliveryTime),
          location: `${this.order.shippingAddress.province}${this.order.shippingAddress.city}`,
          longitude: deliveryLocation.longitude,
          latitude: deliveryLocation.latitude,
          city: deliveryLocation.city,
        });
        locationIndex++;
      }

      // 在途中
      if (daysDiff >= 1 || isDelivered) {
        const inTransitTime = isDelivered
          ? new Date(deliveryTime.getTime() - 12 * 60 * 60 * 1000)
          : new Date(now.getTime() - 12 * 60 * 60 * 1000);

        const transitLocation =
          locations[Math.min(locationIndex + 1, locations.length - 1)];
        locationIndex++;

        trackingData.push({
          status: "运输中",
          time: this.formatTime(inTransitTime),
          location: `快件在${transitLocation.city}转运中心`,
          longitude: transitLocation.longitude,
          latitude: transitLocation.latitude,
          city: transitLocation.city,
        });
      }

      // 已发货
      const shippedLocation =
        locations[Math.min(locationIndex, locations.length - 1)];
      trackingData.push({
        status: "已发货",
        time: this.formatTime(shippedTime),
        location: `商品已从${shippedLocation.city}仓库发出`,
        longitude: shippedLocation.longitude,
        latitude: shippedLocation.latitude,
        city: shippedLocation.city,
      });
      locationIndex++;

      // 已揽收
      const pickupTime = new Date(shippedTime.getTime() - 2 * 60 * 60 * 1000);
      const pickupLocation =
        locations[Math.min(locationIndex, locations.length - 1)];
      trackingData.push({
        status: "已揽收",
        time: this.formatTime(pickupTime),
        location: `${carrier}在${pickupLocation.city}已揽收`,
        longitude: pickupLocation.longitude,
        latitude: pickupLocation.latitude,
        city: pickupLocation.city,
      });

      // 已下单
      trackingData.push({
        status: "已下单",
        time: this.formatTime(this.order.orderTime),
        location: "商品已下单",
        longitude: null,
        latitude: null,
        city: null,
      });

      this.trackingData = trackingData;

      // 设置当前位置信息
      this.currentTrackingInfo = trackingData[0];

      // 生成地图数据
      this.generateMapData();
    },

    /**
     * 生成地图数据
     */
    generateMapData() {
      if (!this.trackingData || this.trackingData.length === 0) return;

      // 生成地图标记点
      this.mapMarkers = [];
      const polylinePoints = [];

      this.trackingData.forEach((track, index) => {
        if (track.longitude && track.latitude) {
          // 添加标记点
          this.mapMarkers.push({
            id: index,
            longitude: track.longitude,
            latitude: track.latitude,
            title: track.status,
            iconPath:
              index === 0
                ? "/static/images/marker-current.png"
                : "/static/images/marker-track.png",
            width: index === 0 ? 30 : 24,
            height: index === 0 ? 30 : 24,
            callout: {
              content: `${track.status}\n${track.time}`,
              color: "#333",
              fontSize: 12,
              borderRadius: 4,
              bgColor: "#fff",
              padding: 8,
              display: "BYCLICK",
            },
          });

          // 添加路线点
          polylinePoints.push({
            longitude: track.longitude,
            latitude: track.latitude,
          });
        }
      });

      // 生成路线
      if (polylinePoints.length > 1) {
        this.trackingPolyline = [
          {
            points: polylinePoints.reverse(), // 反转数组，从起点到终点
            color: "#d81e06",
            width: 4,
            dottedLine: false,
            arrowLine: true,
          },
        ];
      }

      // 设置地图中心为当前位置
      if (this.currentTrackingInfo && this.currentTrackingInfo.longitude) {
        this.mapCenter = {
          longitude: this.currentTrackingInfo.longitude,
          latitude: this.currentTrackingInfo.latitude,
        };
      }
    },

    /**
     * 切换地图/列表视图
     */
    toggleMapView() {
      this.showMap = !this.showMap;

      if (this.showMap && this.trackingData.length > 0) {
        // 切换到地图视图时，确保地图数据已生成
        this.$nextTick(() => {
          this.generateMapData();
        });
      }
    },

    /**
     * 地图准备完成
     */
    onMapReady(mapContext) {
      this.mapContext = mapContext;
      console.log("物流地图初始化完成");
    },

    /**
     * 地图标记点击事件
     */
    onMarkerTap(e) {
      const markerId = e.markerId;
      const trackInfo = this.trackingData[markerId];

      if (trackInfo) {
        uni.showModal({
          title: trackInfo.status,
          content: `时间：${trackInfo.time}\n位置：${trackInfo.location}`,
          showCancel: false,
        });
      }
    },

    /**
     * 定位到当前位置
     */
    centerToCurrentLocation() {
      if (this.currentTrackingInfo && this.currentTrackingInfo.longitude) {
        this.mapCenter = {
          longitude: this.currentTrackingInfo.longitude,
          latitude: this.currentTrackingInfo.latitude,
        };
        this.mapScale = 15;

        if (this.$refs.logisticsMap) {
          this.$refs.logisticsMap.moveToLocation(
            this.currentTrackingInfo.longitude,
            this.currentTrackingInfo.latitude
          );
        }
      } else {
        uni.showToast({
          title: "暂无位置信息",
          icon: "none",
        });
      }
    },

    /**
     * 适配物流路线
     */
    fitTrackingRoute() {
      if (this.mapMarkers.length === 0) {
        uni.showToast({
          title: "暂无轨迹数据",
          icon: "none",
        });
        return;
      }

      // 计算所有标记点的边界
      let minLng = 180,
        maxLng = -180,
        minLat = 90,
        maxLat = -90;

      this.mapMarkers.forEach((marker) => {
        minLng = Math.min(minLng, marker.longitude);
        maxLng = Math.max(maxLng, marker.longitude);
        minLat = Math.min(minLat, marker.latitude);
        maxLat = Math.max(maxLat, marker.latitude);
      });

      // 设置地图中心和缩放级别
      this.mapCenter = {
        longitude: (minLng + maxLng) / 2,
        latitude: (minLat + maxLat) / 2,
      };

      // 根据范围调整缩放级别
      const lngDiff = maxLng - minLng;
      const latDiff = maxLat - minLat;
      const maxDiff = Math.max(lngDiff, latDiff);

      if (maxDiff > 10) {
        this.mapScale = 6;
      } else if (maxDiff > 5) {
        this.mapScale = 8;
      } else if (maxDiff > 1) {
        this.mapScale = 10;
      } else {
        this.mapScale = 12;
      }
    },

    /**
     * 在地图上显示收货地址
     */
    showAddressOnMap() {
      if (!this.order || !this.order.shippingAddress) {
        uni.showToast({
          title: "暂无收货地址",
          icon: "none",
        });
        return;
      }

      // 切换到地图视图
      this.showMap = true;

      // 使用高德地图地理编码获取地址坐标
      const fullAddress = this.getFullAddress(this.order.shippingAddress);

      amapUtils
        .geocode(fullAddress)
        .then((result) => {
          this.mapCenter = {
            longitude: result.longitude,
            latitude: result.latitude,
          };
          this.mapScale = 15;

          // 添加收货地址标记
          const addressMarker = {
            id: "delivery_address",
            longitude: result.longitude,
            latitude: result.latitude,
            title: "收货地址",
            iconPath: "/static/images/marker-address.png",
            width: 30,
            height: 30,
            callout: {
              content: `收货地址\n${this.order.shippingAddress.name}\n${fullAddress}`,
              color: "#333",
              fontSize: 12,
              borderRadius: 4,
              bgColor: "#fff",
              padding: 8,
              display: "ALWAYS",
            },
          };

          this.mapMarkers.push(addressMarker);
        })
        .catch((error) => {
          console.error("地址解析失败:", error);
          uni.showToast({
            title: "地址解析失败",
            icon: "none",
          });
        });
    },

    /**
     * 在地图上显示轨迹点
     */
    showTrackingOnMap(track) {
      if (!track.longitude || !track.latitude) {
        uni.showToast({
          title: "该轨迹点暂无位置信息",
          icon: "none",
        });
        return;
      }

      // 切换到地图视图
      this.showMap = true;

      // 移动地图到该位置
      this.mapCenter = {
        longitude: track.longitude,
        latitude: track.latitude,
      };
      this.mapScale = 15;

      this.$nextTick(() => {
        if (this.$refs.logisticsMap) {
          this.$refs.logisticsMap.moveToLocation(
            track.longitude,
            track.latitude
          );
        }
      });
    },

    /**
     * 刷新物流信息
     */
    refreshTracking() {
      uni.showLoading({
        title: "刷新中...",
      });

      // 模拟刷新延迟
      setTimeout(() => {
        this.loadOrderDetail();
        uni.hideLoading();
        uni.showToast({
          title: "刷新成功",
          icon: "success",
        });
      }, 1000);
    },

    /**
     * 获取最新更新时间
     */
    getLatestUpdateTime() {
      if (this.trackingData && this.trackingData.length > 0) {
        return this.trackingData[0].time;
      }
      return "";
    },

    /**
     * 获取预计送达时间
     */
    getEstimatedDeliveryTime() {
      if (!this.order || !this.order.shippingTime) {
        return "暂无";
      }

      const shippedTime = new Date(this.order.shippingTime);
      const estimatedTime = new Date(
        shippedTime.getTime() + 3 * 24 * 60 * 60 * 1000
      ); // 3天后

      return this.formatTime(estimatedTime);
    },

    /**
     * 获取物流状态文本
     */
    getLogisticsStatusText() {
      if (!this.order) return "";

      if (
        this.order.status === "delivered" ||
        this.order.status === "completed"
      ) {
        return "已签收";
      } else if (this.order.status === "shipped") {
        return "运输中";
      }

      return "已发货";
    },

    /**
     * 获取物流状态描述
     */
    getLogisticsStatusDesc() {
      if (!this.order) return "";

      if (
        this.order.status === "delivered" ||
        this.order.status === "completed"
      ) {
        return "您的包裹已签收，感谢您的耐心等待";
      } else if (this.order.status === "shipped") {
        return "您的包裹正在配送中，请耐心等待";
      }

      return "商品已发货，正在等待揽收";
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      if (!timestamp) return "未知";

      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    /**
     * 获取完整地址
     */
    getFullAddress(address) {
      if (!address) return "";

      return `${address.province}${address.city}${address.district}${address.detail}`;
    },

    /**
     * 复制运单号
     */
    copyTrackingNumber() {
      if (
        !this.order ||
        !this.order.shippingInfo ||
        !this.order.shippingInfo.trackingNumber
      ) {
        uni.showToast({
          title: "暂无运单号",
          icon: "none",
        });
        return;
      }

      uni.setClipboardData({
        data: this.order.shippingInfo.trackingNumber,
        success: () => {
          uni.showToast({
            title: "复制成功",
            icon: "success",
          });
        },
      });
    },

    /**
     * 确认收货
     */
    confirmReceive() {
      uni.showModal({
        title: "确认收货",
        content: "确认已收到商品吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await api.confirmReceive(this.orderId);

              if (result.code === 200) {
                uni.showToast({
                  title: "确认收货成功",
                  icon: "success",
                });

                // 刷新订单详情
                setTimeout(() => {
                  this.loadOrderDetail();
                }, 1500);
              } else {
                uni.showToast({
                  title: result.message || "确认收货失败",
                  icon: "none",
                });
              }
            } catch (error) {
              console.error("确认收货失败:", error);
              uni.showToast({
                title: "网络错误",
                icon: "none",
              });
            }
          }
        },
      });
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
  },
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.header {
  background-color: #fff;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background-color: #f8f8f8;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

.loading {
  padding: 60rpx 0;
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

.logistics-content {
  padding: 20rpx 30rpx;
}

.status-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  position: relative;
}

.status-icon {
  margin-right: 20rpx;
  padding: 15rpx;
  background-color: #fff2f0;
  border-radius: 50%;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.status-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.status-time {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
}

.time-text {
  font-size: 24rpx;
  color: #999;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.logistics-info,
.address-section,
.tracking-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.tracking-number {
  display: flex;
  align-items: center;
}

.copy-btn {
  font-size: 22rpx;
  color: #4ecdc4;
  background: none;
  border: 1rpx solid #4ecdc4;
  border-radius: 30rpx;
  padding: 4rpx 16rpx;
  margin-left: 20rpx;
  line-height: 1.5;
}

.address-content {
  padding: 10rpx 0;
}

.address-info {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-right: 20rpx;
}

.phone {
  font-size: 26rpx;
  color: #666;
}

.address-detail {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.tracking-timeline {
  position: relative;
  padding: 20rpx 0;
}

.track-item {
  position: relative;
  padding-left: 40rpx;
  margin-bottom: 40rpx;
  cursor: pointer;
}

.track-item:last-child {
  margin-bottom: 0;
}

.track-item:hover {
  background-color: #f8f8f8;
  border-radius: 8rpx;
  margin: -10rpx -10rpx 30rpx -10rpx;
  padding: 10rpx 10rpx 10rpx 50rpx;
}

.track-dot {
  position: absolute;
  left: 0;
  top: 10rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #ccc;
  z-index: 2;
}

.track-dot.active {
  background-color: #4ecdc4;
  box-shadow: 0 0 0 6rpx rgba(78, 205, 196, 0.2);
}

.track-line {
  position: absolute;
  left: 9rpx;
  top: 30rpx;
  width: 2rpx;
  height: calc(100% + 10rpx);
  background-color: #eee;
  z-index: 1;
}

.track-content {
  padding: 0 10rpx;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.track-status {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  flex: 1;
}

.track-location-btn {
  padding: 4rpx;
}

.track-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 6rpx;
}

.track-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.track-location {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.error-text {
  font-size: 28rpx;
  color: #999;
  margin: 30rpx 0;
}

.back-btn {
  background-color: #4ecdc4;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 40rpx;
  border-radius: 30rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  justify-content: center;
}

.confirm-btn {
  background-color: #4ecdc4;
  color: #fff;
  font-size: 32rpx;
  width: 90%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
}

.actions {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  background-color: #d81e06;
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:disabled {
  background-color: #ccc;
  color: #999;
}

.action-btn.secondary {
  background-color: #f8f8f8;
  color: #666;
  border: 2rpx solid #e0e0e0;
  margin-bottom: 20rpx;
}

.refresh-btn {
  position: fixed;
  bottom: 120rpx;
  right: 30rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: #d81e06;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(216, 30, 6, 0.3);
  z-index: 100;
}

.refresh-btn:active {
  transform: scale(0.95);
}

.empty {
  text-align: center;
  padding: 100rpx 30rpx;
  color: #999;
  font-size: 28rpx;
}

.error {
  text-align: center;
  padding: 100rpx 30rpx;
  color: #d81e06;
  font-size: 28rpx;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 20rpx 40rpx;
  background-color: #d81e06;
  color: #fff;
  border-radius: 40rpx;
}

.view-location-btn {
  background-color: #f8f8f8;
  color: #666;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.estimated-time {
  font-size: 24rpx;
  color: #d81e06;
  margin-top: 8rpx;
}

.map-section {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.map-container {
  position: relative;
  height: 500rpx;
}

.map-controls {
  display: flex;
  gap: 20rpx;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background-color: #f8f8f8;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.current-location {
  padding: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 15rpx;
}

.location-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.location-content {
  padding-left: 26rpx;
}

.location-status {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
  display: block;
}

.location-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  display: block;
}

.location-address {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.address-actions {
  display: flex;
  gap: 20rpx;
}

.tracking-actions {
  display: flex;
  gap: 20rpx;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.track-location-btn {
  padding: 4rpx;
}
</style>
