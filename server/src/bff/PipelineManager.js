/**
 * PipelineManager — 管道分组管理并发请求
 *
 * 用法:
 *   const pm = new PipelineManager(6)
 *   pm.createPipeline('charts', 3)      // charts 管道最多 3 并发
 *   pm.createPipeline('transactions', 2) // transactions 管道最多 2 并发
 *
 *   const results = await pm.aggregate([
 *     { pipeline: 'charts', tasks: [() => ModelA.find(), () => ModelB.find()] },
 *     { pipeline: 'transactions', tasks: [() => ModelC.find()] },
 *   ])
 */
export class PipelineManager {
  constructor(maxConcurrency = 6) {
    this.maxConcurrency = maxConcurrency
    this.pipelines = new Map()      // name → { concurrency, queue: [], running: 0 }
    this.globalRunning = 0
    this.globalQueue = []
  }

  /**
   * 创建命名管道
   * @param {string} name 管道名称
   * @param {number} concurrency 该管道最大并发数
   */
  createPipeline(name, concurrency = 3) {
    if (this.pipelines.has(name)) return
    this.pipelines.set(name, {
      concurrency: Math.min(concurrency, this.maxConcurrency),
      queue: [],
      running: 0,
    })
  }

  /**
   * 通过管道执行任务（自动排队/限流）
   */
  execute(pipelineName, task) {
    return new Promise((resolve, reject) => {
      const pipe = this.pipelines.get(pipelineName)
      if (!pipe) {
        // 未注册管道：使用全局队列
        this._enqueueGlobal(task, resolve, reject)
        return
      }
      pipe.queue.push({ task, resolve, reject })
      this._drain(pipelineName)
    })
  }

  /**
   * 聚合多个管道的结果
   * @param {Array} groups — [{ pipeline: string, tasks: Array<() => Promise> }]
   * @returns {Promise<Array<Array>>} 每个 group 的结果数组，顺序与 groups 一致
   */
  async aggregate(groups) {
    const groupPromises = groups.map(async (group, index) => {
      const { pipeline, tasks } = group
      const taskPromises = tasks.map((task) =>
        this.execute(pipeline, task)
      )
      const settled = await Promise.allSettled(taskPromises)
      const values = settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
      return { index, values }
    })

    const settled = await Promise.all(groupPromises)
    // 按原始顺序排列
    const ordered = new Array(groups.length)
    for (const { index, values } of settled) {
      ordered[index] = values
    }
    return ordered
  }

  // ---- 内部方法 ----

  _enqueueGlobal(task, resolve, reject) {
    this.globalQueue.push({ task, resolve, reject })
    this._drainGlobal()
  }

  _drain(pipelineName) {
    const pipe = this.pipelines.get(pipelineName)
    if (!pipe) return

    while (pipe.running < pipe.concurrency && pipe.queue.length > 0) {
      const { task, resolve, reject } = pipe.queue.shift()
      pipe.running++
      this._runTask(task, resolve, reject).finally(() => {
        pipe.running--
        this._drain(pipelineName)
      })
    }
  }

  _drainGlobal() {
    while (this.globalRunning < this.maxConcurrency && this.globalQueue.length > 0) {
      const { task, resolve, reject } = this.globalQueue.shift()
      this.globalRunning++
      this._runTask(task, resolve, reject).finally(() => {
        this.globalRunning--
        this._drainGlobal()
      })
    }
  }

  async _runTask(task, resolve, reject) {
    try {
      const result = await task()
      resolve(result)
    } catch (err) {
      reject(err)
    }
  }

  /** 获取管道状态（调试用） */
  status() {
    const pipeStatus = {}
    this.pipelines.forEach((pipe, name) => {
      pipeStatus[name] = {
        concurrency: pipe.concurrency,
        running: pipe.running,
        queued: pipe.queue.length,
      }
    })
    return {
      globalRunning: this.globalRunning,
      globalQueued: this.globalQueue.length,
      pipelines: pipeStatus,
    }
  }
}

// 单例
let instance = null
export function getPipelineManager() {
  if (!instance) {
    instance = new PipelineManager(6)
    instance.createPipeline('charts', 4)        // 图表数据查询
    instance.createPipeline('transactions', 2)  // 交易查询
    instance.createPipeline('aggregation', 3)   // 聚合查询
  }
  return instance
}
