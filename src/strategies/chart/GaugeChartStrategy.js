import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType } from './types'

export class GaugeChartStrategy extends BaseChartStrategy {
  chartType = ChartType.GAUGE

  constructor(id) {
    super(id)
  }

  getDefaultOption(theme = 'dark') {
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

  transformData(data, theme = 'dark') {
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
          ...base.series[0],
          data: gaugeData,
        },
      ],
    }
  }
}
