/**
 *  这是所有图标策略的父类
 * — 父类定义骨架,子类填充具体细节 封装统一交互行为（模板方法模式）
 * — 子类只需实现 transformData 和 getDefaultOption
 */
// 导出这个类 其他文件可以导出 class定义一个类
export class BaseChartStrategy {
  //实例属性, 用来存放数据,原始业务数据
  currentData = null
  // 用来存处理函数 键名事件名 值为函数
  interactionHandlers = new Map()
  //传入的id标识, 用于标识当前图表
  constructor(id) {
    this.identifier = id
    // 调用下面的方法, 设置默认的交互逻辑
    this.setupDefaultInteractions()
  }

  // ============ 子类必须实现 ============

 
  transformData(data, theme) {
    // 子类不重写该方法,就报错
    throw new Error(`transformData() must be implemented by subclass (chartId: ${this.identifier})`)
  }


  getDefaultOption(theme) {
    // 子类不重写该方法,就报错 
    throw new Error(`getDefaultOption() must be implemented by subclass (chartId: ${this.identifier})`)
  }

  // ============ 统一交互行为 — 所有图表共用 ============

  /**
   * 统一交互入口
   * 所有图表的 click、hover、zoom 等事件统一由此方法分发
   */
  handleInteraction(event) {
    // 1. 记录交互埋点（收集用户行为数据，用于分析）
    this.trackInteraction(event)

    // 2. 执行默认交互行为
    this.defaultClickBehavior(event)
    //3. 执行默认的悬停行为
    this.defaultHoverBehavior(event)
    //4. 执行默认的缩放行为
    this.defaultZoomBehavior(event)

    // 如果有自定义的处理器, 如果有,就执行它
    const handler = this.interactionHandlers.get(event.event)
    if (handler) {
      handler(event)
    }
  }

  /** 注册自定义交互处理器 */
  on(event, handler) {
    //存储事件和对应的事件处理函数
    this.interactionHandlers.set(event, handler)
    //返回this, 支持链式调用
    return this
  }

  /** 移除交互处理器 */
  off(event) {
    this.interactionHandlers.delete(event)
    return this
  }

  // ============ 数据管理 ============

  updateData(partial) {
    // 合并当前数据和新数据
    if (this.currentData) {
      this.currentData = { ...this.currentData, ...partial }
    }
  }

  getCurrentData() {
    // 返回当前数据
    return this.currentData
  }

  setData(data) {
    // 设置当前数据
    this.currentData = data
  }

  // ============ 钩子方法 ============

  /** 生成图表唯一 DOM ID */
  getDomId() {
    return `chart_${this.identifier}`
  }

  /** 获取统一 tooltip提示框 配置 */
  getUnifiedTooltip() {
    return {
      // 触发方式：鼠标悬停坐标触发tooltip提示框的触发方式
      trigger: 'axis',
      backgroundColor: 'rgba(6, 30, 93, 0.9)',
      borderColor: 'rgba(0, 168, 255, 0.3)',
      textStyle: { color: '#e0e6f0', fontSize: 13 },
      //坐标轴指示器配置
      axisPointer: {
        // 显示十字准线
        type: 'cross',
        //十字线颜色
        crossStyle: { color: '#8899bb' },
      },
    }
  }

  /*
    动画过度效果


  */
  getUnifiedAnimation() {
    return {
      // 开启动画效果
      animation: true,
      // 动画持续时间, 600毫秒
      animationDuration: 600,
      // 动画缓动效果
      animationEasing: 'cubicOut',
    }
  }

  // ============ 内部方法 ============
  // 点击时 执行defaultClickBehavior 这个函数
  setupDefaultInteractions() {
    // map字典中key 为click, 函数为 defaultClickBehavior  被调用时候this指向图表实例
    this.interactionHandlers.set('click', this.defaultClickBehavior.bind(this))
  }

  defaultClickBehavior(event) {
    // 默认点击行为：高亮 + 联动通知
    // 由 composable 层通过 provide/inject 实现跨组件通信
    const { params } = event
    //判断点击的是不是数据系列（柱子、折线、饼图扇区等）
    if (params.componentType === 'series') {
      console.log(`[Chart:${this.identifier}] 点击了:`, params.name, params.value)
    }
  }

  defaultHoverBehavior(event) {
    // 当悬停时候触发 先预留未来扩展
  }

  defaultZoomBehavior(event) {
    // 默认 zoom: datazoom  当触发缩放时候打印日志
    if (event.event === 'datazoom') {
      console.log(`[Chart:${this.identifier}] 缩放:`, event.params)
    }
  }

  trackInteraction(event) {
    // 交互埋点，统一记录用户行为
    const payload = {
      // 知道用户点击的是哪个图表
      chartId: this.identifier,
      // 图表类型
      chartType: this.chartType,
      // 用户交互的对象是哪个图表
      event: event.event,
      // Date.now() 是一个静态方法，直接通过 Date 对象调用，不需要 new
      timestamp: Date.now(),
    }
    // 后续可接入埋点 SDK
    console.debug('[ChartTrack]', payload)
  }
}
