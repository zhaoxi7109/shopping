import { defineStore } from "pinia";
import { useUserStore } from "./user";
import { api } from "@/utils/api";

/**
 * 购物车状态管理
 * 提供购物车的增删改查功能，支持本地存储和服务器同步
 */
export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [], // 购物车商品列表
    lastSynced: null, // 最后同步时间
    cartCount: 0, // 购物车商品总数量
  }),

  getters: {
    // 购物车商品种类数量
    count: (state) => state.items.length,

    // 购物车商品总数量
    totalCount: (state) => {
      return state.items.reduce((total, item) => {
        return total + item.quantity;
      }, 0);
    },

    // 购物车总金额
    totalAmount: (state) => {
      return state.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);
    },

    // 已选中商品总金额
    selectedAmount: (state) => {
      return state.items.reduce((total, item) => {
        if (item.selected) {
          return total + item.price * item.quantity;
        }
        return total;
      }, 0);
    },

    // 已选中商品数量
    selectedCount: (state) => {
      return state.items.filter((item) => item.selected).length;
    },

    // 购物车商品列表
    cartItems: (state) => state.items,
  },

  actions: {
    /**
     * 添加商品到购物车
     * @param {Object} product 商品信息
     * @param {number} quantity 数量
     * @param {string} spec 规格
     */
    async addToCart(product, quantity = 1, spec = "默认规格") {
      const userStore = useUserStore();

      // 如果用户已登录，直接调用API
      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.addToCart({
            productId: product.id,
            quantity: quantity,
            spec: spec,
          });

          // 检查响应是否成功（状态码200或201都表示成功）
          if (
            res &&
            (res.success || res.statusCode === 201 || res.statusCode === 200)
          ) {
            // API调用成功，重新加载购物车数据
            await this.loadFromServer();
            return res;
          } else {
            throw new Error(res.error || "添加到购物车失败");
          }
        } catch (error) {
          console.error("添加到购物车失败:", error);

          // 特殊处理429错误
          if (error.statusCode === 429) {
            uni.showToast({
              title: "操作过于频繁，请稍后再试",
              icon: "none",
              duration: 2000,
            });
          } else {
            uni.showToast({
              title: "添加到购物车失败，请重试",
              icon: "none",
              duration: 2000,
            });
          }
          throw error;
        }
      } else {
        // 未登录时存储到本地
        const existingItem = this.items.find(
          (item) => item.productId === product.id && item.spec === spec
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          this.items.push({
            id: Date.now(), // 临时ID
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.images?.[0],
            quantity: quantity,
            spec: spec,
            selected: true,
          });
        }

        this.updateCartCount();
      }
    },

    /**
     * 从购物车移除商品
     * @param {string} itemId 购物车项目ID
     */
    async removeFromCart(itemId) {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.removeFromCart(itemId);
          await this.loadFromServer();
          return res;
        } catch (error) {
          console.error("删除购物车商品失败:", error);
          throw error;
        }
      } else {
        const index = this.items.findIndex((item) => item.id === itemId);
        if (index !== -1) {
          this.items.splice(index, 1);
          this.updateCartCount();
        }
      }
    },

    /**
     * 更新购物车商品数量
     * @param {string} itemId 购物车项目ID
     * @param {number} quantity 新数量
     */
    async updateQuantity(itemId, quantity) {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.updateCartItem(itemId, { quantity });
          await this.loadFromServer();
          return res;
        } catch (error) {
          console.error("更新商品数量失败:", error);
          throw error;
        }
      } else {
        const item = this.items.find((item) => item.id === itemId);
        if (item) {
          item.quantity = quantity;
          this.updateCartCount();
        }
      }
    },

    /**
     * 更新商品选中状态
     * @param {string} itemId 购物车项目ID
     * @param {boolean} selected 选中状态
     */
    async updateSelected(itemId, selected) {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.updateCartItem(itemId, { selected });
          // 不重新加载数据，让页面组件自己管理状态
          // await this.loadFromServer();
          return res;
        } catch (error) {
          console.error("更新选中状态失败:", error);
          throw error;
        }
      } else {
        const item = this.items.find((item) => item.id === itemId);
        if (item) {
          item.selected = selected;
        }
      }
    },

    /**
     * 全选/取消全选
     * @param {boolean} selected 选中状态
     */
    async selectAll(selected) {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          // 调用后端全选API
          const res = await api.selectAllCart(selected);
          // 不重新加载数据，让页面组件自己管理状态
          // await this.loadFromServer();
          return res;
        } catch (error) {
          console.error("全选操作失败:", error);
          throw error;
        }
      } else {
        this.items.forEach((item) => {
          item.selected = selected;
        });
      }
    },

    /**
     * 清空购物车
     */
    async clearCart() {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.clearCart();
          this.items = [];
          this.cartCount = 0;
          return res;
        } catch (error) {
          console.error("清空购物车失败:", error);
          throw error;
        }
      } else {
        this.items = [];
        this.cartCount = 0;
      }
    },

    /**
     * 从服务器加载购物车数据
     */
    async loadFromServer() {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && userStore.checkTokenExpiration()) {
        try {
          const res = await api.getCart();
          this.items = res.data.items || [];
          this.cartCount = res.data.summary?.totalCount || 0;
          this.lastSynced = new Date().toISOString();
          return res;
        } catch (error) {
          console.error("加载购物车失败:", error);
          throw error;
        }
      }
    },

    /**
     * 更新购物车数量统计
     */
    updateCartCount() {
      this.cartCount = this.totalCount;
    },

    /**
     * 登录后同步本地购物车到服务器
     */
    async syncLocalCartToServer() {
      const userStore = useUserStore();

      if (userStore.isLoggedIn && this.items.length > 0) {
        try {
          // 将本地购物车商品逐个添加到服务器
          for (const item of this.items) {
            await api.addToCart({
              productId: item.productId,
              quantity: item.quantity,
              spec: item.spec || "默认规格",
            });
          }

          // 清空本地购物车，从服务器重新加载
          this.items = [];
          await this.loadFromServer();
        } catch (error) {
          console.error("同步本地购物车失败:", error);
        }
      }
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: "cart-store",
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value),
          removeItem: (key) => uni.removeStorageSync(key),
        },
      },
    ],
  },
});
