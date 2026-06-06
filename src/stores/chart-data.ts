import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChartData, ChartIdentifier, ChartType } from '@/strategies/chart/types'

/**
 * 图表数据 Store
 * — 使用 Pinia (Vuex 体系) 实现数据解耦
 * — Action: 异步获取/刷新图表数据
 * — Mutation: 同步更新数据集
 * — Getter: 按 key 获取数据，计算派生状态
 */

// 数据集条目
interface DataSetEntry {
  key: string
  data: ChartData
  status: 'idle' | 'loading' | 'loaded' | 'error'
  error: string | null
  cachedAt: number
  ttl: number // 缓存有效期 (ms)，0 表示不过期
}

export const useChartDataStore = defineStore('chartData', () => {
  // ============ State ============
  const dataSets = ref<Map<string, DataSetEntry>>(new Map())
  const globalFilters = ref<Record<string, any>>({})
  const refreshQueue = ref<Set<string>>(new Set())

  // ============ Getters ============

  /** 按 key 获取数据集 */
  function getDataByKey(key: string): ChartData | null {
    const entry = dataSets.value.get(key)
    if (!entry) return null
    // 检查缓存是否过期
    if (entry.ttl > 0 && Date.now() - entry.cachedAt > entry.ttl) {
      return null
    }
    return entry.data
  }

  /** 获取数据集加载状态 */
  function getDataStatus(key: string): string {
    return dataSets.value.get(key)?.status || 'idle'
  }

  /** 所有正在加载的数据集 */
  const loadingKeys = computed(() => {
    const keys: string[] = []
    dataSets.value.forEach((entry, key) => {
      if (entry.status === 'loading') keys.push(key)
    })
    return keys
  })

  /** 数据总量统计 */
  const dataSetCount = computed(() => dataSets.value.size)

  // ============ Mutations (同步) ============

  /** 同步设置数据集 */
  function setDataSet(key: string, data: ChartData, ttl = 0): void {
    const existed = dataSets.value.get(key)
    dataSets.value.set(key, {
      key,
      data,
      status: 'loaded',
      error: null,
      cachedAt: Date.now(),
      ttl,
    })

    // 如有待刷新标记，清除
    refreshQueue.value.delete(key)
  }

  /** 设置数据集为 loading 状态 */
  function setDataLoading(key: string): void {
    const existed = dataSets.value.get(key)
    dataSets.value.set(key, {
      key,
      data: existed?.data || { id: key, chartType: 'line' as ChartType, dimensions: [], measures: [], rawData: [] },
      status: 'loading',
      error: null,
      cachedAt: existed?.cachedAt || 0,
      ttl: existed?.ttl || 0,
    })
  }

  /** 设置数据集错误 */
  function setDataError(key: string, error: string): void {
    const existed = dataSets.value.get(key)
    dataSets.value.set(key, {
      key,
      data: existed?.data || { id: key, chartType: 'line' as ChartType, dimensions: [], measures: [], rawData: [] },
      status: 'error',
      error,
      cachedAt: existed?.cachedAt || 0,
      ttl: existed?.ttl || 0,
    })
  }

  /** 批量更新数据集 */
  function bulkSetDataSets(entries: { key: string; data: ChartData; ttl?: number }[]): void {
    entries.forEach(({ key, data, ttl = 0 }) => setDataSet(key, data, ttl))
  }

  /** 标记数据集需要刷新 */
  function markForRefresh(key: string): void {
    refreshQueue.value.add(key)
  }

  /** 标记全部刷新 */
  function markAllForRefresh(): void {
    dataSets.value.forEach((_, key) => refreshQueue.value.add(key))
  }

  /** 设置全局筛选器 */
  function setGlobalFilter(filterKey: string, value: any): void {
    globalFilters.value = { ...globalFilters.value, [filterKey]: value }
  }

  /** 清除全局筛选器 */
  function clearGlobalFilters(): void {
    globalFilters.value = {}
  }

  /** 移除数据集 */
  function removeDataSet(key: string): void {
    dataSets.value.delete(key)
    refreshQueue.value.delete(key)
  }

  /** 清空所有数据集 */
  function clearAll(): void {
    dataSets.value.clear()
    refreshQueue.value.clear()
  }

  // ============ Actions (异步) ============

  /**
   * 从 API 获取图表数据
   * @param key 数据集唯一标识
   * @param fetchFn 自定义获取函数，默认调用 /api/chart-data/:key
   * @param ttl 缓存有效期 (ms)
   */
  async function fetchChartData(
    key: string,
    fetchFn?: () => Promise<ChartData>,
    ttl = 0
  ): Promise<ChartData | null> {
    // 检查缓存是否有效
    const existing = dataSets.value.get(key)
    if (existing && existing.status === 'loaded' && existing.ttl > 0) {
      if (Date.now() - existing.cachedAt < existing.ttl) {
        return existing.data
      }
    }

    setDataLoading(key)
    try {
      let data: ChartData
      if (fetchFn) {
        data = await fetchFn()
      } else {
        // 默认 API 调用
        const response = await fetch(`/api/chart-data/${key}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        data = await response.json()
      }
      setDataSet(key, data, ttl)
      return data
    } catch (err: any) {
      setDataError(key, err.message || '未知错误')
      console.error(`[ChartDataStore] 获取数据失败 [${key}]:`, err)
      return null
    }
  }

  /**
   * 批量获取图表数据
   */
  async function fetchMultipleChartData(
    keys: string[],
    fetchFn?: (key: string) => Promise<ChartData>,
    ttl = 0
  ): Promise<Map<string, ChartData | null>> {
    const results = new Map<string, ChartData | null>()

    const promises = keys.map(async (key) => {
      const data = await fetchChartData(
        key,
        fetchFn ? () => fetchFn(key) : undefined,
        ttl
      )
      results.set(key, data)
    })

    await Promise.allSettled(promises)
    return results
  }

  /**
   * 刷新指定数据集（强制重新获取）
   */
  async function refreshChartData(key: string): Promise<ChartData | null> {
    markForRefresh(key)
    // 先清除缓存
    const entry = dataSets.value.get(key)
    if (entry) {
      entry.cachedAt = 0 // 过期缓存
    }
    return fetchChartData(key)
  }

  /**
   * 批量刷新
   */
  async function refreshAll(): Promise<void> {
    markAllForRefresh()
    const keys = [...refreshQueue.value]
    await fetchMultipleChartData(keys)
  }

  /**
   * 应用全局筛选器后刷新所有数据
   */
  async function applyFiltersAndRefresh(filters: Record<string, any>): Promise<void> {
    setGlobalFilter('__all__', filters) // 有实际 filter key，这里统一为 all
    Object.entries(filters).forEach(([k, v]) => setGlobalFilter(k, v))
    await refreshAll()
  }

  return {
    // state
    dataSets,
    globalFilters,
    refreshQueue,
    // getters
    getDataByKey,
    getDataStatus,
    loadingKeys,
    dataSetCount,
    // mutations
    setDataSet,
    setDataLoading,
    setDataError,
    bulkSetDataSets,
    markForRefresh,
    markAllForRefresh,
    setGlobalFilter,
    clearGlobalFilters,
    removeDataSet,
    clearAll,
    // actions
    fetchChartData,
    fetchMultipleChartData,
    refreshChartData,
    refreshAll,
    applyFiltersAndRefresh,
  }
})
