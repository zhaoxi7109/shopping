import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    userInfo: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.userInfo?.id || null,
    username: (state) => state.userInfo?.username || "",
  },

  actions: {
    setToken(token) {
      this.token = token;

      try {
        // 解析JWT获取用户信息
        const decoded = jwtDecode(token);
        this.userInfo = {
          id: decoded.sub,
          username: decoded.username,
          email: decoded.email,
          avatar: decoded.avatar,
          roles: decoded.roles || [],
          exp: decoded.exp,
        };
      } catch (error) {
        console.error("解析Token失败:", error);
        this.logout();
      }
    },

    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo };
    },

    logout() {
      this.token = "";
      this.userInfo = null;
      // 清除其他可能的用户相关状态
      // 在实际集成时解除注释
      // const cartStore = useCartStore()
      // cartStore.clearCart()
    },

    // 检查token是否过期
    checkTokenExpiration() {
      if (!this.token || !this.userInfo?.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      // 如果token已过期，则登出用户
      if (this.userInfo.exp < currentTime) {
        this.logout();
        uni.showToast({
          title: "登录已过期，请重新登录",
          icon: "none",
        });
        return false;
      }

      return true;
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: "user-store",
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value),
          removeItem: (key) => uni.removeStorageSync(key),
        },
      },
    ],
  },
});
