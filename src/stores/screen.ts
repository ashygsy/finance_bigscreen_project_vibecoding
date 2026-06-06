import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ScreenConfig, ScreenWidget } from '@/types/screen'

export const useScreenStore = defineStore('screen', () => {
  const screens = ref<ScreenConfig[]>([])
  const currentScreen = ref<ScreenConfig | null>(null)
  const editingWidget = ref<ScreenWidget | null>(null)

  const screenCount = computed(() => screens.value.length)

  function loadScreens() {
    // Mock data — 后续对接API
    screens.value = [
      {
        id: '1',
        title: '经营总览大屏',
        description: '核心经营指标实时监控',
        thumbnail: '',
        theme: 'dark',
        widgets: [],
        createdAt: '2026-06-01',
        updatedAt: '2026-06-05',
      },
      {
        id: '2',
        title: '风险监控大屏',
        description: '风控指标与预警',
        thumbnail: '',
        theme: 'dark',
        widgets: [],
        createdAt: '2026-06-02',
        updatedAt: '2026-06-04',
      },
      {
        id: '3',
        title: '营销分析大屏',
        description: '营销活动效果分析',
        thumbnail: '',
        theme: 'dark',
        widgets: [],
        createdAt: '2026-06-03',
        updatedAt: '2026-06-03',
      },
    ]
  }

  function getScreenById(id: string): ScreenConfig | undefined {
    return screens.value.find((s) => s.id === id)
  }

  function setCurrentScreen(screen: ScreenConfig | null) {
    currentScreen.value = screen
  }

  function addScreen(screen: ScreenConfig) {
    screens.value.push(screen)
  }

  function updateScreen(id: string, updates: Partial<ScreenConfig>) {
    const idx = screens.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      screens.value[idx] = { ...screens.value[idx], ...updates }
    }
  }

  function removeScreen(id: string) {
    screens.value = screens.value.filter((s) => s.id !== id)
  }

  return {
    screens,
    currentScreen,
    editingWidget,
    screenCount,
    loadScreens,
    getScreenById,
    setCurrentScreen,
    addScreen,
    updateScreen,
    removeScreen,
  }
})
