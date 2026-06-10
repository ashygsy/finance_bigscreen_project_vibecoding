import { defineStore } from 'pinia'
import { ref } from 'vue'
import { themes as themeList, applyTheme, getSavedTheme } from '@/themes'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentTheme = ref(getSavedTheme())

  /** 所有可用主题（供下拉菜单渲染） */
  const themes = themeList

  /** 数据大屏全屏模式 — 隐藏侧边栏和顶栏，只显示大屏内容 */
  const dataScreenFullscreen = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTheme(themeId) {
    currentTheme.value = themeId
    applyTheme(themeId)
  }

  function setDataScreenFullscreen(value) {
    dataScreenFullscreen.value = value
  }

  return {
    sidebarCollapsed,
    currentTheme,
    themes,
    dataScreenFullscreen,
    toggleSidebar,
    setTheme,
    setDataScreenFullscreen,
  }
})
