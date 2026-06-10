<template>
  <div
    ref="containerRef"
    class="virtual-list"
    :class="{ 'virtual-list--auto': autoScroll, 'virtual-list--user-active': userActive }"
    :style="containerHeight === '100%' ? { position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' } : { height: containerHeight }"
    @scroll="onScroll"
    @wheel="onUserInteract"
    @touchstart="onUserInteract"
    @mousedown="onUserInteract"
  >
    <!-- 撑开总高度的幽灵元素 -->
    <div class="virtual-list__phantom" :style="{ height: totalHeight + 'px' }"></div>
    <!-- 可视区渲染层 -->
    <div class="virtual-list__content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item[itemKey]"
        class="virtual-list__item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot name="item" :item="item.data" :index="item.index" />
      </div>
    </div>
    <!-- 加载指示器 -->
    <div v-if="loading || isLoadingMore" class="virtual-list__loading">
      <span>{{ isLoadingMore ? '加载更多...' : '加载中...' }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * VirtualList — 虚拟滚动列表组件 + 自动滚动 + 无限加载
 *
 * Props:
 *   data           — 完整数据数组
 *   itemHeight     — 每项固定高度 (px)
 *   buffer         — 缓冲区项数
 *   itemKey        — 唯一标识字段名
 *   loading        — 是否正在加载
 *   containerHeight — 容器高度
 *   autoScroll     — 是否开启自动滚动
 *   scrollSpeed    — 自动滚动速度 (px/s)，默认 30
 *   resumeDelay    — 用户交互后恢复延迟 (ms)，默认 3000
 *   loadThreshold  — 距底部多远触发 load-more（容器高度的倍数），默认 1.5
 *   hasMore        — 是否还有更多数据可加载
 *
 * Events:
 *   scroll-end     — 滚动到底部
 *   load-more      — 接近底部，需要加载更多数据
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  itemHeight: { type: Number, default: 40 },
  buffer: { type: Number, default: 5 },
  itemKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  containerHeight: { type: String, default: '100%' },
  autoScroll: { type: Boolean, default: false },
  scrollSpeed: { type: Number, default: 30 },
  resumeDelay: { type: Number, default: 3000 },
  loadThreshold: { type: Number, default: 1.5 },
  hasMore: { type: Boolean, default: true },
})

const emit = defineEmits(['scroll-end', 'load-more'])

// ============ 状态 ============
const containerRef = ref(null)
const scrollTop = ref(0)
const containerClientHeight = ref(600)
const userActive = ref(false)
const autoScrollPaused = ref(false)
const isLoadingMore = ref(false)
const nearBottomFired = ref(false)    // 防重复触发

let rafId = null
let resumeTimer = null
let lastFrameTime = 0
let resizeObserver = null
let loadMoreTimer = null

// ============ 计算 ============

const totalHeight = computed(() => props.data.length * props.itemHeight)

const startIndex = computed(() => {
  const idx = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, idx)
})

const endIndex = computed(() => {
  const visible = Math.ceil(containerClientHeight.value / props.itemHeight)
  const idx = startIndex.value + visible + props.buffer * 2
  return Math.min(props.data.length, idx)
})

const visibleItems = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value).map((data, i) => ({
    data,
    index: startIndex.value + i,
    [props.itemKey]: data[props.itemKey] || `${startIndex.value + i}`,
  }))
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

// ============ 底部检测 ============

function checkNearBottom() {
  if (!props.hasMore || isLoadingMore.value || nearBottomFired.value) return

  const maxScroll = Math.max(0, totalHeight.value - containerClientHeight.value)
  const threshold = containerClientHeight.value * props.loadThreshold
  const distanceToBottom = maxScroll - scrollTop.value

  if (distanceToBottom <= threshold) {
    nearBottomFired.value = true
    isLoadingMore.value = true
    emit('load-more')

    // 超时重置（防止回调丢失导致永久卡住）
    if (loadMoreTimer) clearTimeout(loadMoreTimer)
    loadMoreTimer = setTimeout(() => {
      nearBottomFired.value = false
      isLoadingMore.value = false
    }, 10000)
  }
}

/** 外部调用：加载完成后重置标记 */
function loadMoreDone() {
  nearBottomFired.value = false
  isLoadingMore.value = false
  if (loadMoreTimer) {
    clearTimeout(loadMoreTimer)
    loadMoreTimer = null
  }
}

// ============ 滚动处理 ============

function onScroll(e) {
  scrollTop.value = e.target.scrollTop

  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    emit('scroll-end')
  }

  checkNearBottom()
}

// ============ 用户交互检测 ============

function onUserInteract() {
  if (!props.autoScroll) return

  userActive.value = true
  autoScrollPaused.value = true

  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    userActive.value = false
    autoScrollPaused.value = false
  }, props.resumeDelay)
}

// ============ 自动滚动引擎 ============

function autoScrollLoop(timestamp) {
  if (!props.autoScroll || autoScrollPaused.value) {
    rafId = requestAnimationFrame(autoScrollLoop)
    return
  }

  if (!lastFrameTime) lastFrameTime = timestamp
  const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.1) // 上限 100ms，防掉帧跳跃
  lastFrameTime = timestamp

  const el = containerRef.value
  if (!el) {
    rafId = requestAnimationFrame(autoScrollLoop)
    return
  }

  const step = props.scrollSpeed * delta
  const maxScroll = Math.max(0, totalHeight.value - containerClientHeight.value)

  // 接近底部 → 触发加载更多。有更多数据时不停在底部，而是
  // 继续微步滚动让 checkNearBottom 持续触发直到数据到达
  if (props.hasMore && (maxScroll - el.scrollTop) <= containerClientHeight.value * props.loadThreshold) {
    // 还有更多数据：尽可能保持在底部附近但不完全停止
    const target = Math.min(el.scrollTop + step, maxScroll)
    el.scrollTop = Math.max(0, target)
    scrollTop.value = el.scrollTop
    checkNearBottom()
  } else if (el.scrollTop >= maxScroll - 2 && !props.hasMore) {
    // 没有更多数据了 → 平滑回到顶部
    el.scrollTop = 0
    scrollTop.value = 0
  } else {
    el.scrollBy({ top: step, behavior: 'auto' })
    scrollTop.value = el.scrollTop
  }

  rafId = requestAnimationFrame(autoScrollLoop)
}

function startAutoScroll() {
  if (!props.autoScroll) return
  lastFrameTime = 0
  rafId = requestAnimationFrame(autoScrollLoop)
}

function stopAutoScroll() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

watch(() => props.autoScroll, (val) => {
  if (val) startAutoScroll()
  else stopAutoScroll()
})

// ============ 暴露方法 ============

function scrollToIndex(index) {
  if (!containerRef.value) return
  const top = index * props.itemHeight
  containerRef.value.scrollTop = top
  scrollTop.value = top
}

function scrollToTop() {
  if (!containerRef.value) return
  containerRef.value.scrollTop = 0
  scrollTop.value = 0
}

function scrollToBottom() {
  if (!containerRef.value) return
  const maxScroll = Math.max(0, totalHeight.value - containerClientHeight.value)
  containerRef.value.scrollTop = maxScroll
  scrollTop.value = maxScroll
}

/** 顶部插入数据时同步调整 scrollTop，防止视图跳动 */
function adjustScrollTop(delta) {
  if (!containerRef.value) return
  containerRef.value.scrollTop = Math.max(0, containerRef.value.scrollTop + delta)
  scrollTop.value = containerRef.value.scrollTop
}

function refreshAndReset() {
  stopAutoScroll()
  autoScrollPaused.value = false
  lastFrameTime = 0
  nearBottomFired.value = false
  isLoadingMore.value = false

  if (containerRef.value) containerRef.value.scrollTop = 0
  scrollTop.value = 0

  if (props.autoScroll) {
    requestAnimationFrame(() => startAutoScroll())
  }
}

defineExpose({
  scrollToIndex, scrollToTop, scrollToBottom,
  adjustScrollTop, refreshAndReset, loadMoreDone,
  userActive,
})

// ============ 生命周期 ============

onMounted(() => {
  if (containerRef.value) {
    containerClientHeight.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerClientHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }

  // 初始数据不足以填满可视区域 → 立即预加载，防止半屏空白
  nextTick(() => {
    if (props.hasMore && props.data.length * props.itemHeight < containerClientHeight.value * 2) {
      checkNearBottom()
    }
  })

  if (props.autoScroll) startAutoScroll()
})

onUnmounted(() => {
  stopAutoScroll()
  if (resumeTimer) clearTimeout(resumeTimer)
  if (loadMoreTimer) clearTimeout(loadMoreTimer)
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;

  &--auto {
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &--user-active {
    scrollbar-width: thin;
    &::-webkit-scrollbar { width: 4px; display: block; }
    &::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 2px; }
    &::-webkit-scrollbar-track { background: transparent; }
  }

  &:not(&--auto) {
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 2px; }
    &::-webkit-scrollbar-track { background: transparent; }
  }

  &__phantom { pointer-events: none; }

  &__content {
    position: absolute;
    top: 0; left: 0; right: 0;
  }

  &__item { box-sizing: border-box; overflow: hidden; }

  &__loading {
    text-align: center;
    padding: 12px;
    color: #8899bb;
    font-size: 13px;
  }
}
</style>
