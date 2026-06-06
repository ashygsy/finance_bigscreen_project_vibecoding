<template>
  <div class="screen-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <el-divider direction="vertical" />
        <el-input
          v-model="screenTitle"
          placeholder="大屏名称"
          style="width: 240px"
          size="small"
        />
      </div>
      <div class="toolbar-center">
        <el-radio-group v-model="currentTheme" size="small">
          <el-radio-button value="dark">深色主题</el-radio-button>
          <el-radio-button value="light">浅色主题</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button :icon="View" @click="handlePreview">预览</el-button>
        <el-button type="primary" :icon="Check" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 主编辑区 -->
    <div class="editor-body">
      <!-- 左侧组件面板 -->
      <div class="widget-panel">
        <div class="widget-category">
          <h4>基础图表</h4>
          <div class="widget-grid">
            <div
              v-for="widget in basicWidgets"
              :key="widget.type"
              class="widget-item"
              draggable="true"
              @dragstart="handleDragStart($event, widget)"
            >
              <el-icon :size="24"><component :is="widget.icon" /></el-icon>
              <span>{{ widget.label }}</span>
            </div>
          </div>
        </div>
        <div class="widget-category">
          <h4>DataV 装饰</h4>
          <div class="widget-grid">
            <div
              v-for="widget in datavWidgets"
              :key="widget.type"
              class="widget-item"
              draggable="true"
              @dragstart="handleDragStart($event, widget)"
            >
              <el-icon :size="24"><MagicStick /></el-icon>
              <span>{{ widget.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 画布 -->
      <div class="editor-canvas-wrap">
        <div
          class="editor-canvas"
          :class="`theme-${currentTheme}`"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <!-- 画布网格背景 -->
          <div class="canvas-grid"></div>

          <!-- 已拖入的组件 -->
          <div
            v-for="widget in widgets"
            :key="widget.id"
            class="canvas-widget"
            :style="widgetStyle(widget)"
            @mousedown="handleWidgetSelect(widget)"
          >
            <div class="widget-placeholder">
              <el-icon :size="28"><component :is="getWidgetIcon(widget.type)" /></el-icon>
              <span>{{ widget.title || widget.type }}</span>
            </div>
            <div v-if="selectedWidgetId === widget.id" class="widget-controls">
              <el-button :icon="Delete" size="small" circle @click="removeWidget(widget.id)" />
              <el-button :icon="Setting" size="small" circle />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="props-panel">
        <el-tabs>
          <el-tab-pane label="属性" />
          <el-tab-pane label="数据" />
          <el-tab-pane label="样式" />
        </el-tabs>
        <el-empty v-if="!selectedWidgetId" description="选择一个组件以编辑属性" :image-size="80" />
        <div v-else class="props-content">
          <el-form label-width="80px" size="small">
            <el-form-item label="标题">
              <el-input v-model="selectedWidget!.title" />
            </el-form-item>
            <el-form-item label="X坐标">
              <el-input-number v-model="selectedWidget!.x" :min="0" />
            </el-form-item>
            <el-form-item label="Y坐标">
              <el-input-number v-model="selectedWidget!.y" :min="0" />
            </el-form-item>
            <el-form-item label="宽度">
              <el-input-number v-model="selectedWidget!.w" :min="100" />
            </el-form-item>
            <el-form-item label="高度">
              <el-input-number v-model="selectedWidget!.h" :min="100" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, View, Check, Delete, Setting, MagicStick,
  DataAnalysis, TrendCharts, PieChart, Histogram,
  Odometer, Collection, Tickets, Clock,
} from '@element-plus/icons-vue'
import type { ScreenWidget, WidgetType } from '@/types/screen'

const route = useRoute()
const router = useRouter()

const screenTitle = ref('未命名大屏')
const currentTheme = ref<'dark' | 'light'>('dark')
const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const widgets = ref<ScreenWidget[]>([])
const selectedWidgetId = ref<string | null>(null)

const selectedWidget = computed(() =>
  widgets.value.find((w) => w.id === selectedWidgetId.value) || null
)

// 组件库
const basicWidgets = [
  { type: 'number-card' as WidgetType, label: '指标卡', icon: Odometer },
  { type: 'line-chart' as WidgetType, label: '折线图', icon: TrendCharts },
  { type: 'bar-chart' as WidgetType, label: '柱状图', icon: Histogram },
  { type: 'pie-chart' as WidgetType, label: '饼图', icon: PieChart },
  { type: 'area-chart' as WidgetType, label: '面积图', icon: DataAnalysis },
  { type: 'table' as WidgetType, label: '表格', icon: Collection },
  { type: 'ranking-list' as WidgetType, label: '排名列表', icon: Tickets },
  { type: 'datetime' as WidgetType, label: '日期时间', icon: Clock },
]

const datavWidgets = [
  { type: 'border-box' as WidgetType, label: '边框1', icon: MagicStick },
  { type: 'border-box' as WidgetType, label: '边框2', icon: MagicStick },
  { type: 'border-box' as WidgetType, label: '装饰1', icon: MagicStick },
  { type: 'border-box' as WidgetType, label: '装饰2', icon: MagicStick },
]

function goBack() {
  router.push('/data-screen')
}

function handlePreview() {
  window.open(`/data-screen/display/1`, '_blank')
}

function handleSave() {
  ElMessage.success('保存成功')
}

function handleDragStart(event: DragEvent, widget: (typeof basicWidgets)[0] | (typeof datavWidgets)[0]) {
  event.dataTransfer!.setData('widgetType', widget.type)
  event.dataTransfer!.setData('widgetLabel', widget.label)
}

function handleDrop(event: DragEvent) {
  const type = event.dataTransfer!.getData('widgetType') as WidgetType
  const label = event.dataTransfer!.getData('widgetLabel')
  const rect = (event.target as HTMLElement).closest('.editor-canvas')?.getBoundingClientRect()
  if (!rect) return

  const newWidget: ScreenWidget = {
    id: `w_${Date.now()}`,
    type,
    title: label,
    x: Math.round(event.clientX - rect.left - 60),
    y: Math.round(event.clientY - rect.top - 20),
    w: 320,
    h: 240,
    options: {},
  }
  widgets.value.push(newWidget)
  selectedWidgetId.value = newWidget.id
}

function handleWidgetSelect(widget: ScreenWidget) {
  selectedWidgetId.value = widget.id
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter((w) => w.id !== id)
  if (selectedWidgetId.value === id) selectedWidgetId.value = null
}

function getWidgetIcon(type: WidgetType) {
  const found = basicWidgets.find((w) => w.type === type)
  return found?.icon || DataAnalysis
}

function widgetStyle(widget: ScreenWidget) {
  return {
    left: widget.x + 'px',
    top: widget.y + 'px',
    width: widget.w + 'px',
    height: widget.h + 'px',
  }
}
</script>

<style lang="scss" scoped>
.screen-editor {
  height: calc(100vh - $header-height);
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 左侧组件面板
.widget-panel {
  width: 200px;
  background: #fafafa;
  border-right: 1px solid #e5e6eb;
  padding: 12px;
  overflow-y: auto;
  flex-shrink: 0;

  .widget-category {
    margin-bottom: 16px;

    h4 {
      font-size: 13px;
      color: #86909c;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .widget-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    .widget-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      background: #fff;
      border: 1px solid #e5e6eb;
      border-radius: 6px;
      cursor: grab;
      transition: all 0.2s;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
      }

      &:active { cursor: grabbing; }

      span {
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }
}

// 画布区
.editor-canvas-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e6eb;
  overflow: auto;

  .editor-canvas {
    position: relative;
    background-size: 20px 20px;
    border: 2px solid #c9cdd4;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    transform-origin: top left;

    &.theme-dark {
      background-color: #0a1633;
      background-image:
        linear-gradient(rgba(0, 168, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 168, 255, 0.05) 1px, transparent 1px);
    }

    &.theme-light {
      background-color: #fff;
      background-image:
        linear-gradient(#f0f0f0 1px, transparent 1px),
        linear-gradient(90deg, #f0f0f0 1px, transparent 1px);
    }
  }
}

// 画布上的组件
.canvas-widget {
  position: absolute;
  background: rgba(6, 30, 93, 0.5);
  border: 1px dashed rgba(0, 168, 255, 0.4);
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;

  &:hover {
    border-color: #00d4ff;
  }

  .widget-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: #667799;
    pointer-events: none;
    font-size: 13px;
  }

  .widget-controls {
    position: absolute;
    top: -12px;
    right: -12px;
    display: flex;
    gap: 4px;
    z-index: 10;
  }
}

// 右侧属性面板
.props-panel {
  width: 280px;
  background: #fafafa;
  border-left: 1px solid #e5e6eb;
  padding: 12px;
  flex-shrink: 0;
  overflow-y: auto;

  .props-content {
    padding: 8px 0;
  }
}
</style>
