import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import DataV from '@kjgl77/datav-vue3' // 引入新包
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@kjgl77/datav-vue3/dist/style.css'

import App from './App.vue'
import router from './router'
import { setupStores } from './stores'
import { registerECharts } from './utils/echarts'
import { initTheme } from './themes'

import '@/styles/themes.scss'
import '@/styles/global.scss'

// 初始化主题（读取 localStorage 并应用）
initTheme()

const app = createApp(App)

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.use(DataV)
setupStores(app)
registerECharts()

app.mount('#app')
