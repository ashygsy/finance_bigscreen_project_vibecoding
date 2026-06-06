import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType, type ChartData, type ChartIdentifier } from './types'
import type { EChartsOption } from 'echarts'

export class GaugeChartStrategy extends BaseChartStrategy {
  readonly chartType = ChartType.GAUGE

  constructor(id: ChartIdentifier) {
    super(id)
  }

  getDefaultOption(theme: 'dark' | 'light' = 'dark'): EChartsOption {
    return {
      tooltip: { formatter: '{b}: {c}%' },
      ...this.getUnifiedAnimation(),
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          center: ['50%', '55%'],
          radius: '85%',
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#00ff88'],
                [0.7, '#ffa940'],
                [1, '#ff4d4f'],
              ],
            },
          },
          pointer: { length: '60%', width: 6 },
          detail: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#e0e6f0',
            offsetCenter: [0, '60%'],
          },
          data: [],
        },
      ],
    }
  }

  transformData(data: ChartData, theme: 'dark' | 'light' = 'dark'): EChartsOption {
    const base = this.getDefaultOption(theme)
    this.setData(data)

    const gaugeData = data.rawData.map((r) => ({
      value: r.value || r[data.measures[0]] || 0,
      name: r.name || r[data.dimensions[0]] || '',
    }))

    return {
      ...base,
      series: [
        {
          ...(base.series as any[])[0],
          data: gaugeData,
        },
      ],
    }
  }
}
