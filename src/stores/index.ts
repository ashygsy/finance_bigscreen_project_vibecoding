import { createPinia } from 'pinia'
import type { App } from 'vue'

export function setupStores(app: App) {
  app.use(createPinia())
}

export { useAppStore } from './app'
export { useScreenStore } from './screen'
export { useChartDataStore } from './chart-data'
