// 图表类型及其数据/交互协议定义
// (接口/类型别名在 JS 中无运行时等价物，保留 ChartType 供运行时使用)

// 图表类型枚举
export const ChartType = {
  LINE: 'line',  //线性图
  BAR: 'bar',    //柱状图
  PIE: 'pie',    //饼图
  AREA: 'area',  //面积图
  RADAR: 'radar',  //雷达图
  SCATTER: 'scatter',  //散点图
  GAUGE: 'gauge',   //仪表盘图
  FUNNEL: 'funnel',  //漏斗图
  HEATMAP: 'heatmap',  //热力图
}
