/**
 * Web Worker — 数据处理线程
 *
 * 负责:
 *   - LTTB (Largest Triangle Three Buckets) 降采样
 *   - 多维数据过滤
 *   - 聚合计算（分组求和/平均/最大/最小）
 *
 * 主线程通过 postMessage 发送任务，Worker 处理完成后返回结果。
 */
'use strict' // 禁用全局 this，使用 self

// ============ LTTB 降采样算法 ============

/**
 * LTTB 降采样 — 将海量数据点压缩到指定数量，保持视觉趋势
 * @param {Array} data - 原始数据点，每个点需有 value 属性 (或 price)
 * @param {number} threshold - 目标点数
 * @param {string} valueKey - 数值字段名，默认 'value'
 */
function lttb(data, threshold, valueKey = 'value') {
  if (!data || data.length <= threshold) return data
  if (threshold <= 2) return [data[0], data[data.length - 1]]

  const dataLength = data.length
  const sampled = []
  const bucketSize = (dataLength - 2) / (threshold - 2)

  // 第一个点保留
  sampled.push(data[0])

  let a = 0 // 锚点索引
  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    const nextBucketStart = Math.min(Math.floor((i + 2) * bucketSize) + 1, dataLength - 1)
    const avgEnd = Math.min(bucketEnd, dataLength - 1)

    // 下一个 bucket 的平均点
    let avgX = 0, avgY = 0
    const range = avgEnd - nextBucketStart + 1
    for (let j = nextBucketStart; j <= avgEnd; j++) {
      avgX += j
      avgY += data[j][valueKey] || data[j].price || 0
    }
    avgX /= range
    avgY /= range

    // 找当前 bucket 中离三角形面积最大的点
    let maxArea = -1
    let maxIndex = bucketStart
    const ay = data[a][valueKey] || data[a].price || 0

    for (let j = bucketStart; j <= Math.min(bucketEnd, dataLength - 1); j++) {
      const py = data[j][valueKey] || data[j].price || 0
      const area = Math.abs((a - avgX) * (py - ay) - (a - j) * (avgY - ay))
      if (area > maxArea) {
        maxArea = area
        maxIndex = j
      }
    }

    sampled.push(data[maxIndex])
    a = maxIndex
  }

  // 最后一个点保留
  sampled.push(data[dataLength - 1])
  return sampled
}

// ============ 固定间隔采样 (简单快速) ============

function intervalSample(data, threshold) {
  if (!data || data.length <= threshold) return data

  const step = data.length / threshold
  const result = []
  for (let i = 0; i < threshold; i++) {
    const idx = Math.floor(i * step)
    result.push(data[idx])
  }
  return result
}

// ============ 多维过滤 ============

function filterData(data, filters) {
  if (!filters || Object.keys(filters).length === 0) return data

  return data.filter((item) => {
    return Object.entries(filters).every(([key, val]) => {
      if (val === '' || val === undefined || val === null) return true
      if (typeof val === 'object') {
        // 范围过滤: { min: X, max: Y }
        const numVal = parseFloat(item[key])
        if (val.min !== undefined && numVal < val.min) return false
        if (val.max !== undefined && numVal > val.max) return false
        return true
      }
      return item[key] === val || String(item[key]).includes(String(val))
    })
  })
}

// ============ 分组聚合 ============

function aggregateData(data, groupKey, aggKey, method = 'sum') {
  const groups = new Map()

  data.forEach((item) => {
    const key = item[groupKey]
    const val = parseFloat(item[aggKey]) || 0

    if (!groups.has(key)) {
      groups.set(key, { count: 0, sum: 0, min: val, max: val })
    }

    const g = groups.get(key)
    g.count++
    g.sum += val
    g.min = Math.min(g.min, val)
    g.max = Math.max(g.max, val)
  })

  const results = []
  groups.forEach((g, key) => {
    let value
    switch (method) {
      case 'sum': value = g.sum; break
      case 'avg': value = g.sum / g.count; break
      case 'count': value = g.count; break
      case 'min': value = g.min; break
      case 'max': value = g.max; break
      default: value = g.sum
    }
    results.push({ [groupKey]: key, [aggKey]: value })
  })

  return results
}

// ============ 消息处理 ============

self.onmessage = function (e) {
  const { id, type, payload } = e.data

  try {
    let result
    switch (type) {
      case 'lttb-sample': {
        const { data, threshold, valueKey } = payload
        result = lttb(data, threshold, valueKey)
        break
      }
      case 'interval-sample': {
        const { data, threshold } = payload
        result = intervalSample(data, threshold)
        break
      }
      case 'filter-data': {
        const { data, filters } = payload
        result = filterData(data, filters)
        break
      }
      case 'aggregate': {
        const { data, groupKey, aggKey, method } = payload
        result = aggregateData(data, groupKey, aggKey, method)
        break
      }
      default:
        throw new Error(`未知任务类型: ${type}`)
    }

    self.postMessage({ id, type, success: true, data: result })
  } catch (err) {
    self.postMessage({ id, type, success: false, error: err.message })
  }
}
