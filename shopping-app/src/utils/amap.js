/**
 * 高德地图工具类
 * 提供地图相关功能的统一接口
 */

// 高德地图配置
const AMAP_CONFIG = {
  // Web端key
  webKey: "95145f5619f2cc78270d66b3722a221c",
  // 微信小程序key
  wxKey: "67305a8562159e888104e9e69d5e3604",
  // 高德地图API基础URL
  baseUrl: "https://restapi.amap.com/v3",
  // 地理编码API
  geocodeUrl: "https://restapi.amap.com/v3/geocode/geo",
  // 逆地理编码API
  regeoUrl: "https://restapi.amap.com/v3/geocode/regeo",
};

/**
 * 获取当前平台对应的API Key
 * @returns {string} API Key
 */
function getApiKey() {
  // #ifdef MP-WEIXIN
  return AMAP_CONFIG.wxKey;
  // #endif

  // #ifdef H5 || APP-PLUS
  return AMAP_CONFIG.webKey;
  // #endif

  return AMAP_CONFIG.webKey;
}

/**
 * 检查地图功能是否可用
 * @returns {Promise<boolean>} 是否可用
 */
export function checkMapAvailability() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    // 微信小程序检查授权
    uni.getSetting({
      success: (res) => {
        if (res.authSetting["scope.userLocation"]) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: () => {
        resolve(false);
      },
    });
    // #endif

    // #ifdef APP-PLUS
    // App端检查权限
    uni.getSetting({
      success: (res) => {
        if (res.authSetting["scope.userLocation"]) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: () => {
        resolve(false);
      },
    });
    // #endif

    // #ifdef H5
    // H5端检查浏览器支持
    if (navigator.geolocation) {
      resolve(true);
    } else {
      resolve(false);
    }
    // #endif
  });
}

/**
 * 请求位置权限
 * @returns {Promise<boolean>} 是否授权成功
 */
export function requestLocationPermission() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.authorize({
      scope: "scope.userLocation",
      success: () => {
        resolve(true);
      },
      fail: () => {
        // 授权失败，引导用户手动开启
        uni.showModal({
          title: "位置权限申请",
          content:
            "需要获取您的位置信息以提供更好的服务，请在设置中开启位置权限",
          confirmText: "去设置",
          cancelText: "取消",
          success: (modalRes) => {
            if (modalRes.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting["scope.userLocation"]) {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                },
                fail: () => {
                  resolve(false);
                },
              });
            } else {
              resolve(false);
            }
          },
        });
      },
    });
    // #endif

    // #ifdef APP-PLUS
    // App端直接尝试获取位置
    uni.getLocation({
      type: "gcj02",
      success: () => {
        resolve(true);
      },
      fail: () => {
        resolve(false);
      },
    });
    // #endif

    // #ifdef H5
    // H5端直接返回true，权限在使用时申请
    resolve(true);
    // #endif
  });
}

/**
 * 获取当前位置
 * @returns {Promise<Object>} 位置信息
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: "gcj02", // 高德地图坐标系
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          altitude: res.altitude,
          verticalAccuracy: res.verticalAccuracy,
          horizontalAccuracy: res.horizontalAccuracy,
          speed: res.speed,
        });
      },
      fail: (err) => {
        console.error("获取位置失败:", err);
        reject(err);
      },
    });
  });
}

/**
 * 打开位置选择器
 * @param {Object} options 选项
 * @returns {Promise<Object>} 选择的位置信息
 */
export function chooseLocation(options = {}) {
  return new Promise((resolve, reject) => {
    // 先检查权限
    requestLocationPermission()
      .then((hasPermission) => {
        if (!hasPermission) {
          reject(new Error("没有位置权限"));
          return;
        }

        // 调用位置选择器
        uni.chooseLocation({
          latitude: options.latitude,
          longitude: options.longitude,
          success: (res) => {
            resolve({
              name: res.name,
              address: res.address,
              latitude: res.latitude,
              longitude: res.longitude,
            });
          },
          fail: (err) => {
            console.error("选择位置失败:", err);
            reject(err);
          },
        });
      })
      .catch(reject);
  });
}

/**
 * 逆地理编码 - 根据坐标获取地址信息
 * @param {number} longitude 经度
 * @param {number} latitude 纬度
 * @returns {Promise<Object>} 地址信息
 */
export function regeocode(longitude, latitude) {
  return new Promise((resolve, reject) => {
    const key = getApiKey();
    const location = `${longitude},${latitude}`;

    console.log('逆地理编码请求参数:', { key, location });

    uni.request({
      url: AMAP_CONFIG.regeoUrl,
      method: "GET",
      data: {
        key: key,
        location: location,
        poitype: "",
        radius: 1000,
        extensions: "base",
        batch: false,
        roadlevel: 0,
      },
      success: (res) => {
        console.log('逆地理编码API原始响应:', res.data);
        console.log('addressComponent详细结构:', JSON.stringify(res.data.regeocode?.addressComponent, null, 2));
        
        if (res.data.status === "1" && res.data.regeocode) {
          const regeocode = res.data.regeocode;
          const addressComponent = regeocode.addressComponent;
          
          console.log('province字段:', addressComponent.province, '类型:', typeof addressComponent.province);
          console.log('city字段:', addressComponent.city, '类型:', typeof addressComponent.city);
          console.log('district字段:', addressComponent.district, '类型:', typeof addressComponent.district);

          // 检查是否为中国大陆地区坐标
          const isChina = addressComponent.country === '中国' || 
                         (longitude >= 73 && longitude <= 135 && latitude >= 18 && latitude <= 54);
          
          if (!isChina) {
            console.warn('当前坐标不在中国大陆地区，高德地图可能无法提供详细地址信息');
            resolve({
              formattedAddress: regeocode.formatted_address || '海外地区',
              province: '',
              city: '',
              district: '',
              township: '',
              street: '',
              streetNumber: '',
              adcode: '',
              citycode: '',
              isOverseas: true
            });
            return;
          }

          // 处理可能的数组格式数据
          const getStringValue = (value) => {
            if (Array.isArray(value)) {
              return value.length > 0 ? value[0] : '';
            }
            return value || '';
          };

          const result = {
            formattedAddress: getStringValue(regeocode.formatted_address),
            province: getStringValue(addressComponent.province),
            city: getStringValue(addressComponent.city),
            district: getStringValue(addressComponent.district),
            township: getStringValue(addressComponent.township),
            street: getStringValue(addressComponent.streetNumber?.street),
            streetNumber: getStringValue(addressComponent.streetNumber?.number),
            adcode: getStringValue(addressComponent.adcode),
            citycode: getStringValue(addressComponent.citycode),
            isOverseas: false
          };

          console.log('逆地理编码解析结果:', result);
          resolve(result);
        } else {
          console.error('逆地理编码API返回错误:', res.data);
          reject(new Error(res.data.info || "逆地理编码失败"));
        }
      },
      fail: (err) => {
        console.error("逆地理编码请求失败:", err);
        reject(err);
      },
    });
  });
}

/**
 * 地理编码 - 根据地址获取坐标
 * @param {string} address 地址
 * @param {string} city 城市（可选）
 * @returns {Promise<Object>} 坐标信息
 */
export function geocode(address, city = "") {
  return new Promise((resolve, reject) => {
    const key = getApiKey();

    uni.request({
      url: AMAP_CONFIG.geocodeUrl,
      method: "GET",
      data: {
        key: key,
        address: address,
        city: city,
      },
      success: (res) => {
        if (
          res.data.status === "1" &&
          res.data.geocodes &&
          res.data.geocodes.length > 0
        ) {
          const geocode = res.data.geocodes[0];
          const location = geocode.location.split(",");

          resolve({
            longitude: parseFloat(location[0]),
            latitude: parseFloat(location[1]),
            level: geocode.level,
            province: geocode.province,
            city: geocode.city,
            district: geocode.district,
            adcode: geocode.adcode,
          });
        } else {
          reject(new Error(res.data.info || "地理编码失败"));
        }
      },
      fail: (err) => {
        console.error("地理编码请求失败:", err);
        reject(err);
      },
    });
  });
}

/**
 * 计算两点间距离
 * @param {number} lat1 纬度1
 * @param {number} lng1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lng2 经度2
 * @returns {number} 距离（米）
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 解析地址字符串，提取省市区信息
 * @param {string} address 完整地址
 * @returns {Object} 解析后的地址信息
 */
export function parseAddressString(address) {
  if (!address) {
    return {
      province: "",
      city: "",
      district: "",
      detail: "",
    };
  }

  // 常见的省份后缀
  const provincePattern = /(.*?(?:省|自治区|特别行政区|市))/;
  // 常见的城市后缀
  const cityPattern = /(.*?(?:市|州|盟|地区|县))/;
  // 常见的区县后缀
  const districtPattern = /(.*?(?:区|县|市|旗))/;

  let province = "";
  let city = "";
  let district = "";
  let remaining = address;

  // 提取省份
  const provinceMatch = remaining.match(provincePattern);
  if (provinceMatch) {
    province = provinceMatch[1];
    remaining = remaining.replace(province, "");
  }

  // 提取城市
  const cityMatch = remaining.match(cityPattern);
  if (cityMatch) {
    city = cityMatch[1];
    remaining = remaining.replace(city, "");
  }

  // 提取区县
  const districtMatch = remaining.match(districtPattern);
  if (districtMatch) {
    district = districtMatch[1];
    remaining = remaining.replace(district, "");
  }

  return {
    province,
    city,
    district,
    detail: remaining.trim(),
  };
}

/**
 * 格式化地址显示
 * @param {Object} addressInfo 地址信息
 * @returns {string} 格式化后的地址
 */
export function formatAddress(addressInfo) {
  const { province, city, district, detail } = addressInfo;
  let result = "";

  if (province) result += province;
  if (city && city !== province) result += city;
  if (district) result += district;
  if (detail) result += detail;

  return result;
}

// 默认导出
export default {
  checkMapAvailability,
  requestLocationPermission,
  getCurrentLocation,
  chooseLocation,
  regeocode,
  geocode,
  calculateDistance,
  parseAddressString,
  formatAddress,
};
