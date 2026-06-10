import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useScreenStore = defineStore('screen', () => {
  const screens = ref([])
  const currentScreen = ref(null)
  const editingWidget = ref(null)
  const loading = ref(false)

  const screenCount = computed(() => screens.value.length)

  async function loadScreens() {
    loading.value = true
    try {
      const data = await api.get('/screens')
      screens.value = data || []
    } catch (err) {
      console.error('加载大屏列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  function getScreenById(id) {
    return screens.value.find((s) => s._id === id || s.id === id)
  }

  function setCurrentScreen(screen) {
    currentScreen.value = screen
  }

  async function addScreen(screen) {
    try {
      const data = await api.post('/screens', screen)
      screens.value.push(data)
      return data
    } catch (err) {
      console.error('创建大屏失败:', err)
      return null
    }
  }

  async function updateScreen(id, updates) {
    try {
      const data = await api.put(`/screens/${id}`, updates)
      const idx = screens.value.findIndex((s) => s._id === id || s.id === id)
      if (idx !== -1) {
        screens.value[idx] = { ...screens.value[idx], ...data }
      }
      return data
    } catch (err) {
      console.error('更新大屏失败:', err)
      return null
    }
  }

  async function removeScreen(id) {
    try {
      await api.delete(`/screens/${id}`)
      screens.value = screens.value.filter((s) => s._id !== id && s.id !== id)
    } catch (err) {
      console.error('删除大屏失败:', err)
    }
  }

  return {
    screens,
    currentScreen,
    editingWidget,
    loading,
    screenCount,
    loadScreens,
    getScreenById,
    setCurrentScreen,
    addScreen,
    updateScreen,
    removeScreen,
  }
})
