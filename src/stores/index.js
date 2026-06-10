import { createPinia } from 'pinia'

export function setupStores(app) {
  app.use(createPinia())
}

export { useAppStore } from './app'
export { useScreenStore } from './screen'
export { useChartDataStore } from './chart-data'
