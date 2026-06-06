import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType, type ChartData, type ChartIdentifier } from './types'
import type { EChartsOption } from 'echarts'

export class RadarChartStrategy extends BaseChartStrategy {
  readonly chartType = ChartType.RADAR

  constructor(id: ChartIdentifier) {
    super(id)
  }

  getDefaultOption(theme: 'dark' | 'light' = 'dark'): EChartsOption {
    return {
      tooltip: { trigger: 'item' },
      ...this.getUnifiedAnimation(),
      legend: { bottom: 0, textStyle: { color: '#8899bb' } },
      radar: {
        center: ['50%', '45%'],
        radius: '65%',
        axisName: { color: '#8899bb' },
        splitArea: {
          areaStyle: { color: ['rgba(0, 212, 255, 0.02)', 'rgba(0, 212, 255, 0.04)'] },
        },
      },
      series: [],
    }
  }

  transformData(data: ChartData, theme: 'dark' | 'light' = 'dark'): EChartsOption {
    const base = this.getDefaultOption(theme)
    this.setData(data)

    // dimensions 作为雷达指标
    const indicatorNames = data.dimensions || []
    const indicators = indicatorNames.map((name) => ({
      name,
      max: Math.max(...data.rawData.map((r) => Number(r[name] || 0))) * 1.2 || 100,
    }))

    const series = data.rawData.map((row, idx) => ({
      name: row.name || `系列${idx + 1}`,
      type: 'radar' as const,
      data: [{ value: indicatorNames.map((n) => row[n]), name: row.name || `系列${idx + 1}` }],
      areaStyle: idx === 0 ? { opacity: 0.2 } : undefined,
    }))

    return {
      ...base,
      radar: {
        ...(base.radar as any),
        indicator: indicators,
      },
      series,
    }
  }
}
