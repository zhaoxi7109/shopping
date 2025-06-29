import { createSSRApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// 引入统一图标组件
import UnifiedIcon from "@/components/UnifiedIcon.vue";
// 手动导入uni-icons组件
import uniIcons from "@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue";
// 引入API
import { api } from "@/utils/api";

export function createApp() {
  const app = createSSRApp(App);

  // 注册全局组件
  app.component("UnifiedIcon", UnifiedIcon);
  app.component("uni-icons", uniIcons);

  // 注入API到全局属性
  app.config.globalProperties.$api = api;

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  return {
    app,
  };
}
