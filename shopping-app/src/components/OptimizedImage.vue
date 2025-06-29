<template>
  <!-- 简化的图片组件，只使用jpg/png格式确保微信小程序兼容性 -->
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    :srcset="generateSrcset()"
    :sizes="sizes"
    :class="className"
    :loading="loading"
    :width="width"
    :height="height"
    :style="imgStyle"
    @error="handleError"
    @load="handleLoad"
  />
  <img v-else :src="fallbackSrc" :alt="alt" :class="className" />
</template>

<script>
export default {
  name: "OptimizedImage",
  props: {
    // 图片路径 (相对于 static/optimized-images 目录)
    path: {
      type: String,
      required: true,
    },
    // 图片替代文本
    alt: {
      type: String,
      default: "",
    },
    // 尺寸响应配置 (CSS 尺寸规则)
    sizes: {
      type: String,
      default: "100vw",
    },
    // 宽度
    width: {
      type: [Number, String],
      default: null,
    },
    // 高度
    height: {
      type: [Number, String],
      default: null,
    },
    // 懒加载
    lazy: {
      type: Boolean,
      default: true,
    },
    // 额外 CSS 类
    className: {
      type: String,
      default: "",
    },
    // 备用图片
    fallbackSrc: {
      type: String,
      default: "/static/images/others/placeholder.png",
    },
    // 自定义样式
    imgStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      src: null,
      loaded: false,
      error: false,
      imageMap: null,
      sizeVariants: [640, 768, 1024],
    };
  },
  computed: {
    loading() {
      return this.lazy ? "lazy" : "eager";
    },
    actualPath() {
      return this.path.startsWith("/") ? this.path.substring(1) : this.path;
    },
  },
  mounted() {
    this.loadImageMap();
  },
  methods: {


    // 加载图片映射文件
    async loadImageMap() {
      try {
        if (!this.imageMap) {
          const response = await fetch(
            "/static/optimized-images/image-map.json"
          );
          if (response.ok) {
            this.imageMap = await response.json();
          }
        }

        this.updateImagePath();
      } catch (error) {
        console.error("无法加载图片映射:", error);
        // 回退到原始路径
        this.src = `/static/images/${this.actualPath}`;
      }
    },

    // 更新图片路径
    updateImagePath() {
      if (!this.imageMap) {
        // 如果映射不可用，使用原始图片
        this.src = `/static/images/${this.actualPath}`;
        return;
      }

      // 查找优化的图片路径
      const optimizedPaths = this.imageMap[this.actualPath];
      if (optimizedPaths && optimizedPaths.length > 0) {
        // 使用第一个匹配的图片 (jpg/png格式的优化版本)
        const originalFormatPath = optimizedPaths.find(
          (p) => !/-\d+\.\w+$/.test(p)
        );

        if (originalFormatPath) {
          this.src = `/static/optimized-images/${originalFormatPath}`;
        } else {
          this.src = `/static/optimized-images/${optimizedPaths[0]}`;
        }
      } else {
        // 找不到优化版本，使用原始图片
        this.src = `/static/images/${this.actualPath}`;
      }
    },

    // 生成srcset属性
    generateSrcset(format) {
      if (!this.imageMap || !this.src) return "";

      const ext = format || this.getExtension(this.src);
      const basePath = this.actualPath.replace(/\.\w+$/, "");

      // 查找符合条件的图片 (只使用jpg/png格式)
      const variants =
        this.imageMap[this.actualPath]?.filter((path) => {
          if (format) {
            return path.endsWith(`.${format}`);
          }
          // 只返回jpg/png格式的图片
          return path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png");
        }) || [];

      // 如果没有尺寸变体，返回原图
      if (variants.length === 0) {
        return this.src;
      }

      // 生成srcset字符串
      return variants
        .map((path) => {
          const match = path.match(/-(\d+)\.\w+$/);
          const width = match ? match[1] : "1200";
          return `/static/optimized-images/${path} ${width}w`;
        })
        .join(", ");
    },

    // 获取文件扩展名
    getExtension(path) {
      return path.split(".").pop();
    },

    // 图片加载错误处理
    handleError() {
      this.error = true;
      this.$emit("error");
    },

    // 图片加载完成处理
    handleLoad() {
      this.loaded = true;
      this.$emit("load");
    },
  },
};
</script>

<style scoped>
img {
  max-width: 100%;
  display: block;
}
</style>
