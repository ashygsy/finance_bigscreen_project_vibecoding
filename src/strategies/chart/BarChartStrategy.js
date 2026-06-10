//策略模式中的具体策略类, 实现柱状图特有的数据转换逻辑
import { BaseChartStrategy } from './BaseChartStrategy'
import { ChartType } from './types'

export class BarChartStrategy extends BaseChartStrategy {
  chartType = ChartType.BAR

  constructor(id) {
    //调用父类的构造方法
    super(id)
  }


  //这个基类两个要实现的其中一个,默认样式
  getDefaultOption(theme = 'dark') {
    return {
      // 调用父类的方法, 实现父类的tooltip设置
      tooltip: this.getUnifiedTooltip(),
      // 调用父类的动画配置方法,对象展开运算符,把父类方法返回的动画配置对象展开,合并到当前对象中.
      ...this.getUnifiedAnimation(),
      // 控制的是图表绘制区域的位置和大小 // left 绘图区域距离容器左侧的距离 right 绘图区域距离容器右侧的距离 botttom绘图区域距离容器底部的距离
      // 绘图区域距离容器顶部的距离（固定50像素） containLabel: true 坐标轴标签是否包含在 grid 区域内
      grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
      xAxis: {
        // x轴配置开始 
        type: 'category',
        // x轴线样式
        axisLine: { lineStyle: { color: '#8899bb' } },
        // X轴上文字（如"周一"、"周二"）的颜色和旋转角度
        axisLabel: { color: '#8899bb', rotate: 0 },
      },
      yAxis: {
        // y轴配置 数值轴
        type: 'value',
        //分隔线样式, y轴上的横向网格线的样式
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        //y轴上数字的颜色
        axisLabel: { color: '#8899bb' },
      },
      // series放展示数据和图表类型
      series: [],
    }
  }
  //数据转换逻辑,将原始数据转换为 ECharts 配置对象
  transformData(data, theme = 'dark') {
    //调用同一个类里的 getDefaultOption 方法, 返回一个基础的 ECharts 配置对象
    const base = this.getDefaultOption(theme)
    // 将传入的data保存在实例变量中 数据备份
    this.setData(data)
    //取第一个维度作为 X 轴的字段名 横坐标叫啥
    const xField = data.dimensions[0] || 'x'
    //data.rawData 是原始数据数组，每一项是一个对象
    //横坐标具体显示啥
    const xData = data.rawData.map((r) => r[xField])
    // 有几个指标, 花几个柱子
    const series = data.measures.map((measure) => ({
      // 图例名字
      name: measure,
      //柱状图
      type: 'bar',
      // 提取具体数值
      data: data.rawData.map((r) => r[measure]),
      //柱子最大宽度
      barMaxWidth: 40,
      //上面圆角
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
      //鼠标移上去发光
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 212, 255, 0.5)',
        },
      },
    }))
    
    //利用基础配置, xAxis和series配置 拼成整体配置
    return {
      ...base,
      xAxis: { ...(base.xAxis || {}), data: xData },
      series,
    }
  }
}
