<template>
  <!-- 统一图标组件 - 使用uni-icons -->
  <uni-icons
    :type="iconType"
    :size="size"
    :color="color"
    :class="customClass"
    @click="handleClick"
  ></uni-icons>
</template>

<script>
/**
 * 统一图标组件
 * 使用uni-app内置的uni-icons组件库
 * 提供统一的图标接口，替换原有的iconfont图标
 */
export default {
  name: "UnifiedIcon",
  props: {
    // 图标类型映射
    type: {
      type: String,
      required: true,
    },
    // 图标大小
    size: {
      type: [String, Number],
      default: 20,
    },
    // 图标颜色
    color: {
      type: String,
      default: "#333",
    },
    // 自定义样式类
    customClass: {
      type: String,
      default: "",
    },
  },
  computed: {
    /**
     * 图标类型映射
     * 将原有的iconfont图标名称映射到uni-icons的图标名称
     */
    iconType() {
      const iconMap = {
        // 基础图标
        "icon-search": "search",
        "icon-home": "home",
        "icon-user": "person",
        "icon-cart": "cart",
        "icon-category": "list",
        "icon-right": "right",
        "icon-delete": "trash",
        "icon-add": "plus",

        // 功能图标
        "icon-favorite": "heart",
        "icon-favorite-fill": "heart-filled",
        "icon-setting": "gear",
        "icon-pay": "wallet",
        "icon-send": "paperplane",
        "icon-receive": "download",
        "icon-comment": "chat",
        "icon-service": "help",
        "icon-address": "location",
        "icon-kefu": "phone",
        "icon-help": "help",
        "icon-feedback": "compose",
        "icon-about": "info",

        // 第三方登录图标
        "icon-wechat": "weixin",
        "icon-qq": "qq",
        "icon-weibo": "weibo",

        // 其他图标
        "icon-left": "left",
        "icon-share": "redo",
        "icon-order": "list",

        // 设置页面图标
        "icon-camera": "camera",
        "icon-lock": "locked",
        "icon-phone": "phone",
        "icon-email": "email",
        "icon-bell": "notification",
        "icon-message": "chatbubble",
        "icon-shield": "checkmarkempty",
        "icon-eye": "eye",
        "icon-refresh": "refresh",
        "icon-info": "info",
        "icon-cart": "cart",
        "icon-pay": "wallet",
        "icon-send": "paperplane",
        "icon-service": "headphones",
        "icon-right": "right",
        "icon-check": "checkmarkempty",
        "icon-check-filled": "checkbox",
        "icon-delete": "trash",
        "icon-radio": "radio-button-off",
        "icon-radio-filled": "radio-button-on",
        "icon-refund": "undo",
        "icon-return": "reply",
        "icon-exchange": "swap",
        "icon-camera": "camera",
        "icon-close": "close",
      };

      return iconMap[this.type] || "help";
    },
  },
  methods: {
    /**
     * 处理点击事件
     */
    handleClick() {
      this.$emit("click");
    },
  },
};
</script>

<style scoped>
/* 统一图标样式 */
.unified-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
