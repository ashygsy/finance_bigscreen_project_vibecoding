import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType } from './types'

export class ScatterChartStrategy extends BaseChartStrategy {
  chartType = ChartType.SCATTER

  constructor(id) {
    super(id)
  }

  getDefaultOption(theme = 'dark') {
    return {
      tooltip: { trigger: 'item' },
      ...this.getUnifiedAnimation(),
      grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
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
    this.setData(data)

    const xField = data.measures[0] || 'x'
    const yField = data.measures[1] || 'y'

    const scatterData = data.rawData.map((r) => [r[xField], r[yField]])

    return {
      ...base,
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: 10,
          emphasis: { scale: true },
        },
      ],
    }
  }
}
