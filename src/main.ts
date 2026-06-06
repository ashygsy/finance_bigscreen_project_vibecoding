import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import '@kjgl77/datav-vue3/dist/style.css'

import App from './App.vue'
import router from './router'
import { setupStores } from './stores'
import { registerECharts } from './utils/echarts'

import '@/styles/global.scss'

const app = createApp(App)

app.use(ElementPlus, { locale: zhCn })
app.use(router)
setupStores(app)
registerECharts()

app.mount('#app')
