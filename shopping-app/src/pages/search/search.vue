<template>
  <view class="search-container">
    <view class="search-header">
      <view class="search-input-box">
        <UnifiedIcon type="icon-search" :size="16" color="#999" />
        <input
          type="text"
          v-model="keyword"
          class="search-input"
          placeholder="搜索商品"
          confirm-type="search"
          @confirm="search"
          focus
        />
        <UnifiedIcon
          v-if="keyword"
          type="icon-delete"
          :size="14"
          color="#999"
          @click="clearKeyword"
        />
      </view>
      <text class="cancel-btn" @tap="goBack">取消</text>
    </view>

    <view class="search-content">
      <!-- 搜索历史 -->
      <view
        class="search-history"
        v-if="!keyword && searchHistory.length > 0 && !loading"
      >
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-btn" @tap="clearHistory">清空</text>
        </view>
        <view class="history-tags">
          <view
            class="tag"
            v-for="(item, index) in searchHistory"
            :key="index"
            @tap="useHistoryKeyword(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="hot-search" v-if="!keyword && !loading">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="hot-tags">
          <view
            class="tag"
            v-for="(item, index) in hotKeywords"
            :key="index"
            @tap="useHistoryKeyword(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <!-- 搜索建议 -->
      <view
        class="search-suggestions"
        v-if="keyword && suggestions.length > 0 && !isSearched"
      >
        <view
          class="suggestion-item"
          v-for="(item, index) in suggestions"
          :key="index"
          @tap="useSuggestion(item)"
        >
          <UnifiedIcon type="icon-search" :size="14" color="#999" />
          <text class="suggestion-text">{{ item }}</text>
        </view>
      </view>

      <!-- 加载中 -->
      <view class="loading-box" v-if="loading">
        <text class="loading-text">搜索中...</text>
      </view>

      <!-- 搜索结果 -->
      <view class="search-results" v-if="isSearched && !loading">
        <!-- 筛选排序 -->
        <view class="filter-sort">
          <view
            class="sort-item"
            :class="{ active: sortType === 'default' }"
            @tap="setSortType('default')"
          >
            综合
          </view>
          <view
            class="sort-item"
            :class="{ active: sortType === 'sales' }"
            @tap="setSortType('sales')"
          >
            销量
          </view>
          <view class="sort-item" @tap="setSortType('price')">
            价格
            <text
              class="sort-icon"
              :class="{
                'sort-up': sortType === 'price' && sortOrder === 'asc',
                'sort-down': sortType === 'price' && sortOrder === 'desc',
              }"
            >
              ⇅
            </text>
          </view>
          <view
            class="sort-item"
            :class="{ active: sortType === 'new' }"
            @tap="setSortType('new')"
          >
            新品
          </view>
        </view>

        <!-- 结果列表 -->
        <view class="result-list" v-if="searchResults.length > 0">
          <view
            class="result-item"
            v-for="(item, index) in searchResults"
            :key="index"
            @tap="goToDetail(item.id)"
          >
            <image
              class="item-image"
              :src="item.image"
              mode="aspectFill"
            ></image>
            <view class="item-info">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-price">¥{{ item.price.toFixed(2) }}</text>
              <text class="item-sales">销量 {{ item.sales }}</text>
            </view>
          </view>
        </view>

        <!-- 无结果 -->
        <view class="no-result" v-else>
          <text class="no-result-text">没有找到"{{ keyword }}"相关商品</text>
          <text class="no-result-tips">换个关键词试试吧</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from "@/utils/api.js";

export default {
  data() {
    return {
      keyword: "",
      searchHistory: [],
      hotKeywords: [],
      suggestions: [],
      searchResults: [],
      loading: false,
      isSearched: false,
      sortType: "default", // default, sales, price, new
      sortOrder: "asc", // asc, desc
    };
  },

  onLoad(options) {
    // 如果从其他页面跳转带有关键词参数
    if (options.keyword) {
      this.keyword = decodeURIComponent(options.keyword);
      this.search();
    }

    // 加载搜索历史和热门搜索
    this.loadSearchHistory();
    this.getHotKeywords();
  },

  watch: {
    keyword(newVal) {
      if (newVal) {
        this.getSuggestions(newVal);
      } else {
        this.suggestions = [];
        this.isSearched = false;
      }
    },
  },

  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 清空关键词
    clearKeyword() {
      this.keyword = "";
      this.suggestions = [];
      this.isSearched = false;
    },

    // 获取热门搜索
    async getHotKeywords() {
      try {
        const res = await api.getHotSearch();
        // 提取关键词字符串数组
        this.hotKeywords = (res.data || []).map((item) => item.keyword);
      } catch (error) {
        console.error("获取热门搜索失败:", error);
      }
    },

    // 加载搜索历史
    loadSearchHistory() {
      const history = uni.getStorageSync("search_history");
      this.searchHistory = history ? JSON.parse(history) : [];
    },

    // 保存搜索历史
    saveSearchHistory(keyword) {
      if (!keyword) return;

      // 从历史中移除相同关键词
      const index = this.searchHistory.indexOf(keyword);
      if (index !== -1) {
        this.searchHistory.splice(index, 1);
      }

      // 添加到历史最前面
      this.searchHistory.unshift(keyword);

      // 最多保存10条历史记录
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10);
      }

      // 保存到本地存储
      uni.setStorageSync("search_history", JSON.stringify(this.searchHistory));
    },

    // 清空搜索历史
    clearHistory() {
      uni.showModal({
        title: "提示",
        content: "确定要清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            uni.removeStorageSync("search_history");
          }
        },
      });
    },

    // 使用历史关键词
    useHistoryKeyword(keyword) {
      this.keyword = keyword;
      this.search();
    },

    // 使用搜索建议
    useSuggestion(suggestion) {
      this.keyword = suggestion;
      this.search();
    },

    // 获取搜索建议
    getSuggestions(keyword) {
      // 简单的本地搜索建议
      setTimeout(() => {
        if (keyword) {
          this.suggestions = [
            `${keyword}`,
            `${keyword} 新款`,
            `${keyword} 推荐`,
            `${keyword} 品牌`,
            `${keyword} 热门`,
          ];
        } else {
          this.suggestions = [];
        }
      }, 100);
    },

    // 执行搜索
    async search() {
      if (!this.keyword) return;

      this.isSearched = true;
      this.loading = true;
      this.saveSearchHistory(this.keyword);

      try {
        const res = await api.searchProducts(this.keyword, {
          page: 1,
          limit: 20,
          sortBy: this.sortType,
          sortOrder: this.sortOrder,
        });

        if (res.success) {
          // 后端返回的数据结构是 { products: [...], pagination: {...} }
          const products = res.data.products || [];
          // 转换字段名以匹配前端模板
          this.searchResults = products.map((item) => ({
            ...item,
            title: item.name, // 将name字段映射为title
            price: parseFloat(item.price), // 确保price是数字类型
          }));
          console.log("搜索成功:", this.searchResults);
        } else {
          console.error("搜索失败:", res);
          this.searchResults = [];
          uni.showToast({
            title: res.message || "搜索失败，请重试",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("搜索错误:", error);
        uni.showToast({
          title: "搜索失败，请重试",
          icon: "none",
        });
        this.searchResults = [];
      } finally {
        this.loading = false;
      }
    },

    // 设置排序方式
    setSortType(type) {
      if (type === this.sortType) {
        // 如果是价格排序，切换升降序
        if (type === "price") {
          this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
        }
      } else {
        this.sortType = type;
        if (type === "price") {
          this.sortOrder = "asc";
        }
      }

      this.sortResults();
    },

    // 排序搜索结果
    sortResults() {
      if (!this.searchResults.length) return;

      switch (this.sortType) {
        case "default":
          // 默认排序（按相关度，这里简单按ID排序）
          this.searchResults.sort((a, b) => a.id - b.id);
          break;
        case "sales":
          // 销量排序
          this.searchResults.sort((a, b) => b.sales - a.sales);
          break;
        case "price":
          // 价格排序
          if (this.sortOrder === "asc") {
            this.searchResults.sort((a, b) => a.price - b.price);
          } else {
            this.searchResults.sort((a, b) => b.price - a.price);
          }
          break;
        case "new":
          // 新品排序（按上架时间）
          this.searchResults.sort(
            (a, b) => new Date(b.createTime) - new Date(a.createTime)
          );
          break;
      }
    },

    // 跳转到商品详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      });
    },
  },
};
</script>

<style lang="scss">
.search-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;

  .search-input-box {
    flex: 1;
    height: 70rpx;
    background-color: #f0f0f0;
    border-radius: 35rpx;
    display: flex;
    align-items: center;
    padding: 0 20rpx;
    margin-right: 20rpx;

    .icon-search {
      margin-right: 10rpx;
      font-size: 32rpx;
      color: #999;
    }

    .search-input {
      flex: 1;
      height: 70rpx;
      font-size: 28rpx;
    }

    .icon-delete {
      font-size: 28rpx;
      color: #999;
      padding: 10rpx;
    }
  }

  .cancel-btn {
    font-size: 28rpx;
    color: #333;
  }
}

.search-content {
  padding: 20rpx 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 28rpx;
    color: #333;
    font-weight: bold;
  }

  .clear-btn {
    font-size: 24rpx;
    color: #999;
  }
}

.history-tags,
.hot-tags {
  display: flex;
  flex-wrap: wrap;

  .tag {
    padding: 10rpx 20rpx;
    background-color: #fff;
    border-radius: 30rpx;
    margin-right: 20rpx;
    margin-bottom: 20rpx;
    font-size: 24rpx;
    color: #666;
  }
}

.hot-search {
  margin-top: 40rpx;
}

.search-suggestions {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;

  .suggestion-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    border-bottom: 1px solid #f5f5f5;

    .icon-search {
      margin-right: 20rpx;
      color: #999;
      font-size: 28rpx;
    }

    .suggestion-text {
      font-size: 28rpx;
      color: #333;
    }

    &:active {
      background-color: #f9f9f9;
    }
  }
}

.loading-box {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;

  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.filter-sort {
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  margin-bottom: 20rpx;

  .sort-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #ff6700;
      font-weight: bold;
    }

    .sort-icon {
      margin-left: 4rpx;

      &.sort-up {
        transform: rotate(180deg);
      }

      &.sort-down {
        transform: rotate(0);
      }
    }

    &:not(:last-child)::after {
      content: "";
      position: absolute;
      right: 0;
      top: 20%;
      height: 60%;
      width: 1px;
      background-color: #eee;
    }
  }
}

.result-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  .result-item {
    width: 48%;
    background-color: #fff;
    border-radius: 12rpx;
    overflow: hidden;
    margin-bottom: 20rpx;

    .item-image {
      width: 100%;
      height: 320rpx;
    }

    .item-info {
      padding: 20rpx;

      .item-title {
        font-size: 28rpx;
        color: #333;
        line-height: 1.4;
        height: 80rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-price {
        font-size: 32rpx;
        color: #ff6700;
        font-weight: bold;
        margin-top: 10rpx;
      }

      .item-sales {
        font-size: 24rpx;
        color: #999;
        margin-top: 10rpx;
      }
    }
  }
}

.no-result {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  .no-result-text {
    font-size: 32rpx;
    color: #333;
    margin-bottom: 20rpx;
  }

  .no-result-tips {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
