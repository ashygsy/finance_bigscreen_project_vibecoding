import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType, type ChartData, type ChartIdentifier } from './types'
import type { EChartsOption } from 'echarts'

export class BarChartStrategy extends BaseChartStrategy {
  readonly chartType = ChartType.BAR

  constructor(id: ChartIdentifier) {
    super(id)
  }

  getDefaultOption(theme: 'dark' | 'light' = 'dark'): EChartsOption {
    return {
      tooltip: this.getUnifiedTooltip(),
      ...this.getUnifiedAnimation(),
      grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
      xAxis: {
        type: 'category',
        axisLine: { lineStyle: { color: '#8899bb' } },
        axisLabel: { color: '#8899bb', rotate: 0 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: { color: '#8899bb' },
      },
      series: [],
    }
  }

  transformData(data: ChartData, theme: 'dark' | 'light' = 'dark'): EChartsOption {
    const base = this.getDefaultOption(theme)
    this.setData(data)

    const xField = data.dimensions[0] || 'x'
    const xData = data.rawData.map((r) => r[xField])

    const series = data.measures.map((measure) => ({
      name: measure,
      type: 'bar' as const,
      data: data.rawData.map((r) => r[measure]),
      barMaxWidth: 40,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 212, 255, 0.5)',
        },
      },
    }))

    return {
      ...base,
      xAxis: { ...((base.xAxis as any) || {}), data: xData },
      series,
    }
  }
}
