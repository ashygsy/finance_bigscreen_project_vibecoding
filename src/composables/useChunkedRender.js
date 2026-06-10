import { ref } from 'vue'

/**
 * useChunkedRender — 分块渲染 Composable
 *
 * 用于大数据集的渐进式渲染，避免 UI 主线程长时间阻塞。
 * 内部使用 requestIdleCallback（降级到 requestAnimationFrame）。
 *
 * 用法:
 *   const { schedule, flush, pending } = useChunkedRender()
 *
 *   // 调度: 将大数据集的渲染分批执行
 *   items.forEach((item, i) => {
 *     schedule(() => {
 *       renderedList.value.push(item)
 *     })
 *   })
 */
export function useChunkedRender(options = {}) {
  const { chunkSize = 50, delayMs = 16 } = options // 每批 50 项，间隔 16ms (~60fps)

  const pending = ref(0)
  const completed = ref(0)
  const isComplete = ref(false)

  let queue = []
  let rafId = null
  let idleCallbackId = null
  let cancelled = false

  /**
   * 调度一个渲染任务
   * @param {Function} fn 渲染回调
   */
  function schedule(fn) {
    if (cancelled) return
    queue.push(fn)
    pending.value = queue.length
    _drain()
  }

  /**
   * 调度批量任务并带进度回调
   * @param {Array} items 数据数组
   * @param {Function} renderFn 每项渲染回调 (item, index)
   * @param {Function} onProgress 进度回调 (completed, total)
   */
  function scheduleBatch(items, renderFn, onProgress) {
    if (cancelled) return
    const total = items.length

    for (let i = 0; i < total; i++) {
      queue.push(() => renderFn(items[i], i))
    }

    pending.value = total
    completed.value = 0

    const drainWithProgress = () => {
      if (cancelled) return

      const start = performance.now()
      let processed = 0

      while (queue.length > 0 && processed < chunkSize) {
        const fn = queue.shift()
        try { fn() } catch (e) { console.error('[ChunkedRender]', e) }
        processed++
        completed.value++
      }

      onProgress?.(completed.value, total)

      if (queue.length > 0) {
        const elapsed = performance.now() - start
        const nextDelay = Math.max(0, delayMs - elapsed)
        rafId = requestAnimationFrame(() => {
          setTimeout(drainWithProgress, nextDelay)
        })
      } else {
        pending.value = 0
        isComplete.value = true
      }
    }

    drainWithProgress()
  }

  /**
   * 立即清空队列
   */
  function flush() {
    while (queue.length > 0) {
      const fn = queue.shift()
      try { fn() } catch (e) { /* ignore */ }
      completed.value++
    }
    pending.value = 0
    isComplete.value = true
  }

  /** 取消所有未执行的任务 */
  function cancel() {
    cancelled = true
    queue = []
    pending.value = 0
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    if (idleCallbackId) { cancelIdleCallback(idleCallbackId); idleCallbackId = null }
  }

  // ---- 内部 ----

  function _drain() {
    if (rafId) return // 避免重复调度

    const execChunk = (deadline) => {
      if (cancelled) return

      let processed = 0
      while (
        queue.length > 0 &&
        processed < chunkSize &&
        (typeof deadline === 'number' ? true : deadline.timeRemaining() > 1)
      ) {
        const fn = queue.shift()
        try { fn() } catch (e) { /* ignore */ }
        processed++
        completed.value++
        pending.value--
      }

      if (queue.length > 0) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          if (typeof requestIdleCallback !== 'undefined') {
            idleCallbackId = requestIdleCallback(execChunk)
          } else {
            setTimeout(() => execChunk(100), delayMs)
          }
        })
      } else {
        rafId = null
        isComplete.value = true
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      idleCallbackId = requestIdleCallback(execChunk)
    } else {
      rafId = requestAnimationFrame(() => {
        rafId = null
        execChunk(100)
      })
    }
  }

  return {
    pending,
    completed,
    isComplete,
    schedule,
    scheduleBatch,
    flush,
    cancel,
  }
}

// 工具函数
function cancelAnimationFrame(id) {
  if (typeof cancelAnimationFrame !== 'undefined') {
    window.cancelAnimationFrame(id)
  }
}

function cancelIdleCallback(id) {
  if (typeof cancelIdleCallback !== 'undefined') {
    window.cancelIdleCallback(id)
  }
}
