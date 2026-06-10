import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType } from './types'

export class LineChartStrategy extends BaseChartStrategy {
  chartType = ChartType.LINE

  constructor(id) {
    super(id)
  }

  getDefaultOption(theme = 'dark') {
    return {
      tooltip: this.getUnifiedTooltip(),
      ...this.getUnifiedAnimation(),
      grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#8899bb' } },
        axisLabel: { color: '#8899bb' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#8899bb' },
      },
      series: [],
    }
  }

  transformData(data, theme = 'dark') {
    const base = this.getDefaultOption(theme)
    const xField = data.dimensions[0] || 'x'
    const xData = data.rawData.map((r) => r[xField])

    const series = data.measures.map((measure) => ({
      name: measure,
      type: 'line',
      data: data.rawData.map((r) => r[measure]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.08 },
    }))

    return {
      ...base,
      xAxis: { ...(base.xAxis || {}), data: xData },
      series,
    }
  }
}
