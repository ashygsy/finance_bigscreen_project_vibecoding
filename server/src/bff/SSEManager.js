import { randomUUID } from 'crypto'

/**
 * SSEManager — SSE 连接池 + 定时推送管理
 *
 * 用法:
 *   const sse = getSSEManager()
 *   sse.startAutoPush(3000)  // 每 3 秒推送一次
 */
export class SSEManager {
  constructor() {
    this.clients = new Map()     // clientId → { res, filter, createdAt }
    this.pushInterval = null
    this.dataProvider = null     // 数据获取函数
  }

  /**
   * 设置数据提供者（查询最新数据的回调）
   */
  setDataProvider(fn) {
    this.dataProvider = fn
  }

  /**
   * 添加 SSE 客户端
   * @param {string} id 客户端标识
   * @param {http.ServerResponse} res Express response 对象
   * @param {string[]} filter 订阅的数据类型，如 ['indicators', 'trade-trend']
   */
  addClient(id, res, filter = []) {
    const clientId = id || randomUUID()

    // 设置 SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // 发送初始连接确认
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`)

    // 心跳
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`)
    }, 15000)

    const client = { res, filter, heartbeat, createdAt: Date.now() }
    this.clients.set(clientId, client)

    // 客户端断开时清理
    res.on('close', () => {
      clearInterval(heartbeat)
      this.clients.delete(clientId)
    })

    return clientId
  }

  /**
   * 移除客户端
   */
  removeClient(id) {
    const client = this.clients.get(id)
    if (client) {
      clearInterval(client.heartbeat)
      client.res.end()
      this.clients.delete(id)
    }
  }

  /**
   * 向单个客户端发送事件
   */
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId)
    if (client) {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }
  }

  /**
   * 向匹配过滤器的客户端广播
   */
  broadcast(event, data) {
    const payload = JSON.stringify(data)
    this.clients.forEach((client, id) => {
      // 若不设过滤器，推送给所有客户端
      if (client.filter.length === 0 || client.filter.includes(event) || client.filter.includes('*')) {
        client.res.write(`event: ${event}\ndata: ${payload}\n\n`)
      }
    })
  }

  /**
   * 按间隔自动推送（从 dataProvider 获取最新数据）
   * @param {number} intervalMs 推送间隔 (ms)，默认 5000
   */
  startAutoPush(intervalMs = 5000) {
    if (this.pushInterval) return
    this.pushInterval = setInterval(async () => {
      if (this.clients.size === 0) return
      if (!this.dataProvider) return

      try {
        const dataMap = await this.dataProvider()
        if (dataMap && typeof dataMap === 'object') {
          Object.entries(dataMap).forEach(([event, data]) => {
            this.broadcast(event, data)
          })
        }
      } catch (err) {
        console.error('[SSE] 数据推送失败:', err.message)
      }
    }, intervalMs)
  }

  /** 停止自动推送 */
  stopAutoPush() {
    if (this.pushInterval) {
      clearInterval(this.pushInterval)
      this.pushInterval = null
    }
  }

  /** 获取连接统计 */
  getStats() {
    return {
      totalClients: this.clients.size,
      autoPushActive: !!this.pushInterval,
      uptime: process.uptime(),
    }
  }
}

// 单例
let instance = null
export function getSSEManager() {
  if (!instance) {
    instance = new SSEManager()
  }
  return instance
}
