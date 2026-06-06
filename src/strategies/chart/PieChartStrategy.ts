import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType, type ChartData, type ChartIdentifier } from './types'
import type { EChartsOption } from 'echarts'

export class PieChartStrategy extends BaseChartStrategy {
  readonly chartType = ChartType.PIE

  constructor(id: ChartIdentifier) {
    super(id)
  }

  getDefaultOption(theme: 'dark' | 'light' = 'dark'): EChartsOption {
    return {
      tooltip: { trigger: 'item', ...this.getUnifiedTooltip() },
      ...this.getUnifiedAnimation(),
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        textStyle: { color: '#8899bb' },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['38%', '50%'],
          roseType: 'area',
          itemStyle: { borderRadius: 4, borderColor: 'rgba(10, 22, 51, 0.8)', borderWidth: 3 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
            scaleSize: 12,
          },
        },
      ],
    }
  }

  transformData(data: ChartData, theme: 'dark' | 'light' = 'dark'): EChartsOption {
    const base = this.getDefaultOption(theme)
    this.setData(data)

    const nameField = data.dimensions[0] || 'name'
    const valueField = data.measures[0] || 'value'

    const pieData = data.rawData.map((r) => ({
      name: r[nameField],
      value: r[valueField],
    }))

    return {
      ...base,
      series: [
        {
          ...(base.series as any[])[0],
          data: pieData,
        },
      ],
    }
  }
}
