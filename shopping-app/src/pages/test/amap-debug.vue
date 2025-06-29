<template>
  <view class="container">
    <view class="header">
      <text class="title">高德地图API调试</text>
    </view>
    
    <view class="section">
      <text class="section-title">测试坐标</text>
      <view class="input-group">
        <input v-model="testLongitude" placeholder="经度" type="number" />
        <input v-model="testLatitude" placeholder="纬度" type="number" />
      </view>
      <button @click="testRegeocode" class="test-btn">测试逆地理编码</button>
    </view>
    
    <view class="section">
      <text class="section-title">API响应结果</text>
      <view class="result-box">
        <text class="result-text">{{ resultText }}</text>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">解析后的地址</text>
      <view class="address-info">
        <view class="info-item">
          <text class="label">省份:</text>
          <text class="value">{{ parsedAddress.province }}</text>
        </view>
        <view class="info-item">
          <text class="label">城市:</text>
          <text class="value">{{ parsedAddress.city }}</text>
        </view>
        <view class="info-item">
          <text class="label">区县:</text>
          <text class="value">{{ parsedAddress.district }}</text>
        </view>
        <view class="info-item">
          <text class="label">详细地址:</text>
          <text class="value">{{ parsedAddress.formattedAddress }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import amapUtils from '@/utils/amap.js';

export default {
  data() {
    return {
      testLongitude: '116.397428',
      testLatitude: '39.90923',
      resultText: '点击测试按钮查看结果',
      parsedAddress: {
        province: '',
        city: '',
        district: '',
        formattedAddress: ''
      }
    };
  },
  
  methods: {
    async testRegeocode() {
      try {
        uni.showLoading({
          title: '测试中...'
        });
        
        const longitude = parseFloat(this.testLongitude);
        const latitude = parseFloat(this.testLatitude);
        
        console.log('测试坐标:', { longitude, latitude });
        
        // 直接调用高德地图API
        const response = await this.callAmapAPI(longitude, latitude);
        
        this.resultText = JSON.stringify(response, null, 2);
        
        // 解析结果
        if (response.status === '1' && response.regeocode) {
          const regeocode = response.regeocode;
          const addressComponent = regeocode.addressComponent;
          
          this.parsedAddress = {
            province: addressComponent.province || '',
            city: addressComponent.city || '',
            district: addressComponent.district || '',
            formattedAddress: regeocode.formatted_address || ''
          };
        }
        
        uni.hideLoading();
        
      } catch (error) {
        uni.hideLoading();
        console.error('测试失败:', error);
        this.resultText = `错误: ${error.message}`;
        
        uni.showToast({
          title: '测试失败',
          icon: 'none'
        });
      }
    },
    
    // 直接调用高德地图API
    callAmapAPI(longitude, latitude) {
      return new Promise((resolve, reject) => {
        const key = '95145f5619f2cc78270d66b3722a221c'; // Web端key
        const location = `${longitude},${latitude}`;
        
        uni.request({
          url: 'https://restapi.amap.com/v3/geocode/regeo',
          method: 'GET',
          data: {
            key: key,
            location: location,
            poitype: '',
            radius: 1000,
            extensions: 'base',
            batch: false,
            roadlevel: 0
          },
          success: (res) => {
            console.log('API原始响应:', res.data);
            resolve(res.data);
          },
          fail: (err) => {
            console.error('API请求失败:', err);
            reject(err);
          }
        });
      });
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.section {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.input-group input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.test-btn {
  width: 100%;
  padding: 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}

.result-box {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.result-text {
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
}

.address-info {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  width: 80px;
  font-weight: bold;
  color: #333;
}

.value {
  flex: 1;
  color: #666;
}
</style>