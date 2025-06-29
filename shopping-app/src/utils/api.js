import { useUserStore } from "@/store/user";

// API 基础配置
const BASE_URL = "http://localhost:3000/api";

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 延迟函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 请求重试函数
const requestWithRetry = async (options, maxRetries = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await makeRequest(options);
      return result;
    } catch (error) {
      // 如果是429错误且还有重试次数，则等待后重试
      if (error.statusCode === 429 && attempt < maxRetries) {
        console.log(
          `请求被限流，第${attempt}次重试，等待${retryDelay}ms后重试...`
        );
        await delay(retryDelay * attempt); // 递增延迟
        continue;
      }
      // 其他错误或重试次数用完，抛出错误
      throw error;
    }
  }
};

// 基础请求函数
const makeRequest = (options) => {
  return new Promise((resolve, reject) => {
    // 添加基础URL
    options.url = BASE_URL + options.url;

    // 添加默认请求头
    options.header = {
      "Content-Type": "application/json",
      ...options.header,
    };

    // 添加token（如果存在）
    const userStore = useUserStore();
    if (userStore.token) {
      options.header.Authorization = `Bearer ${userStore.token}`;
    }

    // 发起请求
    uni.request({
      ...options,
      success: (res) => {
        // 处理成功状态码（200和201都表示成功）
        if (res.statusCode === 200 || res.statusCode === 201) {
          if (res.data.success) {
            // 返回包含code字段的标准格式，保持与现有代码兼容
            resolve({
              code: 200,
              success: true,
              data: res.data.data,
              message: res.data.message,
            });
          } else {
            uni.showToast({
              title: res.data.error || res.data.message || "请求失败",
              icon: "none",
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // token失效，清除用户状态
          const userStore = useUserStore();
          userStore.logout();
          uni.showToast({
            title: "登录已过期，请重新登录",
            icon: "none",
          });
          reject(res);
        } else if (res.statusCode === 429) {
          // 请求频率限制，不显示错误提示，由重试机制处理
          console.warn("请求频率限制，准备重试...");
          reject(res);
        } else {
          uni.showToast({
            title: "网络请求失败",
            icon: "none",
          });
          reject(res);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "网络连接失败",
          icon: "none",
        });
        reject(err);
      },
    });
  });
};

// 请求拦截器（带重试机制）
const request = (options) => {
  return requestWithRetry(options);
};

// API 接口定义
export const api = {
  // 商品相关
  getProducts: (params = {}) => {
    return request({
      url: "/products",
      method: "GET",
      data: params,
    });
  },

  getProductDetail: (id) => {
    return request({
      url: `/products/${id}`,
      method: "GET",
    });
  },

  getRecommendProducts: (params = {}) => {
    return request({
      url: "/products/recommend/list",
      method: "GET",
      data: params,
    });
  },

  // 分类相关
  getCategories: () => {
    return request({
      url: "/categories",
      method: "GET",
    });
  },

  getCategoryDetail: (id) => {
    return request({
      url: `/categories/${id}`,
      method: "GET",
    });
  },

  // 轮播图
  getBanners: () => {
    return request({
      url: "/banners",
      method: "GET",
    });
  },

  // 搜索相关
  searchProducts: (keyword, params = {}) => {
    return request({
      url: "/search",
      method: "GET",
      data: {
        q: keyword,
        ...params,
      },
    });
  },

  getHotSearch: () => {
    return request({
      url: "/search/hot",
      method: "GET",
    });
  },

  // 用户相关
  login: (data) => {
    return request({
      url: "/auth/login",
      method: "POST",
      data,
    });
  },

  register: (data) => {
    return request({
      url: "/auth/register",
      method: "POST",
      data,
    });
  },

  getUserInfo: () => {
    return request({
      url: "/auth/me",
      method: "GET",
    });
  },

  // 更新用户信息
  updateUserInfo: (data) => {
    return request({
      url: "/user/profile",
      method: "PUT",
      data,
    });
  },

  // 修改密码
  changePassword: (data) => {
    return request({
      url: "/user/password",
      method: "PUT",
      data,
    });
  },

  // 更新头像
  updateAvatar: (data) => {
    return request({
      url: "/user/avatar",
      method: "PUT",
      data,
    });
  },

  // 获取收藏列表
  getFavoriteList: (params = {}) => {
    return request({
      url: "/user/favorites",
      method: "GET",
      data: params,
    });
  },

  // 取消收藏
  removeFavorite: (productId) => {
    return request({
      url: `/user/favorites/${productId}`,
      method: "DELETE",
    });
  },

  // 获取订单列表
  getOrderList: (params = {}) => {
    return request({
      url: "/order/list",
      method: "GET",
      data: params,
    });
  },

  // 获取订单统计
  getOrderCounts: () => {
    return request({
      url: "/order/counts",
      method: "GET",
    });
  },

  // 获取订单详情
  getOrderDetail: (orderId) => {
    return request({
      url: `/orders/${orderId}`,
      method: "GET",
    });
  },

  // 取消订单
  cancelOrder: (orderId) => {
    return request({
      url: `/orders/${orderId}/cancel`,
      method: "PUT",
    });
  },

  // 支付订单
  payOrder: (orderId, paymentMethod = "alipay") => {
    return request({
      url: `/orders/${orderId}/pay`,
      method: "POST",
      data: { paymentMethod },
    });
  },

  // 提醒发货
  remindShip: (orderId) => {
    return request({
      url: `/order/remind-ship/${orderId}`,
      method: "POST",
    });
  },

  // 确认收货
  confirmReceive: (orderId) => {
    return request({
      url: `/orders/${orderId}/confirm`,
      method: "PUT",
    });
  },

  // 完成评价
  completeOrder: (orderId) => {
    return request({
      url: `/orders/${orderId}/complete`,
      method: "PUT",
    });
  },

  // 再次购买
  buyAgain: (orderId) => {
    return request({
      url: `/order/buy-again/${orderId}`,
      method: "POST",
    });
  },

  // 删除订单
  deleteOrder: (orderId) => {
    return request({
      url: `/orders/${orderId}`,
      method: "DELETE",
    });
  },

  // 创建订单
  createOrder: (data) => {
    return request({
      url: "/order",
      method: "POST",
      data,
    });
  },

  // 提交售后申请
  submitAfterSale: (data) => {
    return request({
      url: "/after-sale/submit",
      method: "POST",
      data,
    });
  },

  // 获取售后记录列表
  getAfterSaleList: (params = {}) => {
    return request({
      url: "/after-sale/list",
      method: "GET",
      data: params,
    });
  },

  // 获取用户通知设置
  getNotificationSettings: () => {
    return request({
      url: "/user/notification-settings",
      method: "GET",
    });
  },

  // 更新用户通知设置
  updateNotificationSettings: (data) => {
    return request({
      url: "/user/notification-settings",
      method: "PUT",
      data,
    });
  },

  // 获取用户隐私设置
  getPrivacySettings: () => {
    return request({
      url: "/user/privacy-settings",
      method: "GET",
    });
  },

  // 更新用户隐私设置
  updatePrivacySettings: (data) => {
    return request({
      url: "/user/privacy-settings",
      method: "PUT",
      data,
    });
  },

  // 收藏相关
  toggleFavorite: (productId) => {
    return request({
      url: `/products/${productId}/favorite`,
      method: "POST",
    });
  },

  getFavorites: (params = {}) => {
    return request({
      url: "/favorites",
      method: "GET",
      data: params,
    });
  },

  // 购物车相关
  getCart: () => {
    return request({
      url: "/cart",
      method: "GET",
    });
  },

  // 添加到购物车（带防抖处理）
  addToCart: (() => {
    const debouncedAddToCart = debounce((data, resolve, reject) => {
      request({
        url: "/cart",
        method: "POST",
        data,
      })
        .then(resolve)
        .catch(reject);
    }, 300); // 减少防抖时间到300ms，提升用户体验

    return (data) => {
      return new Promise((resolve, reject) => {
        debouncedAddToCart(data, resolve, reject);
      });
    };
  })(),

  updateCartItem: (id, data) => {
    return request({
      url: `/cart/${id}`,
      method: "PUT",
      data,
    });
  },

  removeFromCart: (id) => {
    return request({
      url: `/cart/${id}`,
      method: "DELETE",
    });
  },

  // 全选/取消全选购物车
  selectAllCart: (selected) => {
    return request({
      url: "/cart/select/all",
      method: "PUT",
      data: { selected },
    });
  },

  // 清空购物车
  clearCart: () => {
    return request({
      url: "/cart/clear",
      method: "DELETE",
    });
  },

  // 删除选中的购物车项目
  removeSelectedCartItems: () => {
    return request({
      url: "/cart/selected/items",
      method: "DELETE",
    });
  },

  // 收货地址相关
  getAddressList: () => {
    return request({
      url: "/user/addresses",
      method: "GET",
    });
  },

  addAddress: (data) => {
    return request({
      url: "/user/addresses",
      method: "POST",
      data,
    });
  },

  updateAddress: (id, data) => {
    return request({
      url: `/user/addresses/${id}`,
      method: "PUT",
      data,
    });
  },

  deleteAddress: (id) => {
    return request({
      url: `/user/addresses/${id}`,
      method: "DELETE",
    });
  },

  setDefaultAddress: (id) => {
    return request({
      url: `/user/addresses/${id}/default`,
      method: "PUT",
    });
  },

  // 优惠券相关
  getUserCoupons: (userId, orderAmount) => {
    console.log(
      `正在请求用户优惠券, userId: ${userId}, orderAmount: ${
        orderAmount || "undefined"
      }`
    );
    return request({
      url: `/coupons/user/${userId}`,
      method: "GET",
      data: orderAmount ? { orderAmount } : {},
    })
      .then((response) => {
        console.log("getUserCoupons API 响应:", response);
        if (response.data && Array.isArray(response.data)) {
          console.log(`获取到 ${response.data.length} 张用户优惠券`);
          // 记录每个优惠券的完整数据结构以便调试
          const firstCoupon = response.data[0];
          if (firstCoupon) {
            console.log("优惠券数据结构:", Object.keys(firstCoupon).join(", "));
          }

          // 记录每个优惠券ID以方便调试 - 使用正确的字段
          response.data.forEach((coupon) => {
            const idField = coupon.couponId !== undefined ? "couponId" : "id";
            console.log(
              `用户优惠券ID: ${coupon[idField] || "未知"}, 状态: ${
                coupon.status
              }, 完整数据:`,
              coupon
            );
          });
        }
        return response;
      })
      .catch((error) => {
        console.error("获取用户优惠券失败:", error);
        throw error;
      });
  },

  getAvailableCoupons: () => {
    console.log("正在请求可领取优惠券");
    return request({
      url: "/coupons/available",
      method: "GET",
    })
      .then((response) => {
        console.log("getAvailableCoupons API 响应:", response);
        if (response.data && Array.isArray(response.data)) {
          console.log(`获取到 ${response.data.length} 张可领取优惠券`);
        }
        return response;
      })
      .catch((error) => {
        console.error("获取可领取优惠券失败:", error);
        throw error;
      });
  },

  claimCoupon: (data) => {
    console.log("正在请求领取优惠券:", data);
    return request({
      url: "/coupons/claim",
      method: "POST",
      data,
    })
      .then((response) => {
        console.log("claimCoupon API 响应:", response);
        return response;
      })
      .catch((error) => {
        console.error("领取优惠券失败:", error);
        throw error;
      });
  },

  calculateCouponDiscount: (data) => {
    return request({
      url: "/coupons/calculate",
      method: "POST",
      data,
    });
  },

  // 积分相关
  getPointsBalance: (userId) => {
    return request({
      url: `/points/balance/${userId}`,
      method: "GET",
    });
  },

  getPointsRecords: (userId, params = {}) => {
    return request({
      url: `/points/records/${userId}`,
      method: "GET",
      data: params,
    });
  },

  calculatePointsDeduction: (data) => {
    return request({
      url: "/points/calculate",
      method: "POST",
      data,
    });
  },

  spendPoints: (data) => {
    return request({
      url: "/points/spend",
      method: "POST",
      data,
    });
  },

  earnPoints: (data) => {
    return request({
      url: "/points/earn",
      method: "POST",
      data,
    });
  },

  // 提交评价
  submitReview: (orderId, data) => {
    return request({
      url: `/orders/${orderId}/review`,
      method: "POST",
      data,
    });
  },

  // 获取评价列表
  getReviews: (params = {}) => {
    return request({
      url: "/orders/reviews",
      method: "GET",
      data: params,
    });
  },

  // 获取物流信息
  getLogistics: (orderId) => {
    return request({
      url: `/orders/${orderId}/logistics`,
      method: "GET",
    });
  },

  // 钱包相关
  getWalletInfo: (userId) => {
    return request({
      url: `/wallet/info/${userId}`,
      method: "GET",
    });
  },

  // 钱包充值
  createRechargeOrder: (data) => {
    return request({
      url: "/wallet/recharge",
      method: "POST",
      data,
    });
  },

  // 钱包提现
  createWithdrawOrder: (data) => {
    return request({
      url: "/wallet/withdraw",
      method: "POST",
      data,
    });
  },

  // 获取钱包交易记录
  getWalletRecords: (params = {}) => {
    return request({
      url: "/wallet/records",
      method: "GET",
      data: params,
    });
  },

  // 获取银行卡列表
  getBankAccounts: (userId) => {
    return request({
      url: `/user/bank-accounts/${userId}`,
      method: "GET",
    });
  },

  // 添加银行卡
  addBankAccount: (data) => {
    return request({
      url: "/user/bank-accounts",
      method: "POST",
      data,
    });
  },

  // 删除银行卡
  deleteBankAccount: (id) => {
    return request({
      url: `/user/bank-accounts/${id}`,
      method: "DELETE",
    });
  },

  // 设置默认银行卡
  setDefaultBankAccount: (id) => {
    return request({
      url: `/user/bank-accounts/${id}/default`,
      method: "PUT",
    });
  },

  // 钱包支付
  walletPay: (data) => {
    return request({
      url: "/wallet/pay",
      method: "POST",
      data,
    });
  },

  // 获取钱包余额
  getWalletBalance: (userId) => {
    return request({
      url: `/wallet/balance/${userId}`,
      method: "GET",
    });
  },
};

export default api;
