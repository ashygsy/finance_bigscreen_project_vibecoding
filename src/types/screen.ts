// 大屏相关类型定义

export interface ScreenConfig {
  id: string
  title: string
  description: string
  thumbnail: string
  theme: 'dark' | 'light'
  widgets: ScreenWidget[]
  createdAt: string
  updatedAt: string
}

export interface ScreenWidget {
  id: string
  type: WidgetType
  title: string
  x: number
  y: number
  w: number
  h: number
  options: Record<string, any>
  dataSource?: WidgetDataSource
  refreshInterval?: number // 数据刷新间隔(秒)
}

export type WidgetType =
  | 'number-card'      // 指标卡
  | 'line-chart'       // 折线图
  | 'bar-chart'        // 柱状图
  | 'pie-chart'        // 饼图
  | 'area-chart'       // 面积图
  | 'radar-chart'      // 雷达图
  | 'gauge-chart'      // 仪表盘
  | 'scatter-chart'    // 散点图
  | 'funnel-chart'     // 漏斗图
  | 'heatmap-chart'    // 热力图
  | 'table'            // 表格
  | 'ranking-list'     // 排名列表
  | 'text'             // 文本
  | 'image'            // 图片
  | 'border-box'       // 边框容器
  | 'datetime'         // 日期时间

export interface WidgetDataSource {
  type: 'static' | 'api' | 'dataset'
  config: Record<string, any>
}

export interface NumberCardOption {
  title: string
  value: number
  prefix?: string
  suffix?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: number
  color?: string
}
