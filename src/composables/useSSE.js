// ref响应式数据 onUnmounted 组件销毁时候自动触发的钩子
import { ref, onUnmounted } from 'vue'

/**
 * useSSE — SSE (Server-Sent Events) 连接管理 Composable
 *
 * 用法:
 *   const { connected, lastEvent, error } = useSSE({
 *     types: ['indicators', 'trade-trend'],
 *     onMessage: (event, data) => { ... },
 *   })
 *
 * 
 *   传入params option对象
 *   
 *   
 */
export function useSSE(options = {}) {
  const {
    // type 要监听的事件类型 *表示监听所有 oMessage 收到消息时候的回调函数
    // onConnected 连接成功的回调函数 onError 出错时候的回调函数
    // reconnectInterval初始重连间隔 3 秒
    // maxReconnectInterval 最大重连间隔 30秒
    types = ['*'],
    onMessage,
    onConnected,
    onError,
    reconnectInterval = 3000,  // 初始重连间隔 ms
    maxReconnectInterval = 30000,
  } = options

  /*
   *创建响应式变量 connected，初始值 false 表示sse连接是否建立, 可绑定到UI显示连接状态
   *lastEvent 存储到最后收到的事件
   *error存储错误信息，连接出错时记录
   *存储 EventSource 实例（SSE 连接对象）
   *reconnectTimer存储重连定时器 ID，用于清除定时器
   *currentReconnectInterval当前实际使用的重连间隔，会随着重连失败次数增加而增大（指数退避）
   *disposed标记组件是否已被销毁，防止销毁后还尝试重连
  */
  const connected = ref(false)
  const lastEvent = ref(null)
  const error = ref(null)
  let eventSource = null
  let reconnectTimer = null
  let currentReconnectInterval = reconnectInterval
  let disposed = false

  //  定义连接函数, 建立sse连接
  function connect() {
    // 如果组件被销毁了, 就不用再继续连接了
    if (disposed) return

    // 如果是数组 从['user', 'order', 'product']变成 /api/sse/stream?types=user%2Corder%2Cproduct
    const typesParam = Array.isArray(types) ? types.join(',') : types
    //encodeURIComponent对URL中的特殊字符进行编码,确保参数能够安全传输
    const url = `/api/sse/stream?types=${encodeURIComponent(typesParam)}`

    //创建EventSource,建立sse连接
    eventSource = new EventSource(url)

    // 连接成功时候触发回调 
    eventSource.onopen = () => {
      // 更新状态为已连接
      connected.value = true
      //清除错误信息
      error.value = null
      // 重置重连间隔
      currentReconnectInterval = reconnectInterval // 重置退避
      //调用用户传入的成功连接回调函数
      onConnected?.()
    }

    // 确保eventType是数组
    const eventTypes = Array.isArray(types) ? types : []
    //这里还能自定义事件监听,编个事件名
    // 后端res.write(`event: 事件名\ndata: ${JSON.stringify({ userId: 123, time: '10:30' })}\n\n`)
    eventTypes.forEach((eventType) => {
      //为每种事件注册事件监听器,当收到对应事件时候触发回调
      eventSource.addEventListener(eventType, (e) => {
        try {
          //解析接收到的json数据
          const data = JSON.parse(e.data)
          //保存最后一次收到的事件信息 
          lastEvent.value = { type: eventType, data, timestamp: Date.now() }
          // 调用用户传入的消息回调函数
          onMessage?.(eventType, data)
        } catch (err) {
          //解析失败时候, 打印警告信息 不中断程序
          console.warn('[SSE] 解析事件失败:', eventType, err)
        }
      })
    })

    // 通用 message 处理器（未指定类型的消息）
    //当没有指定事件类型时候, 会触发onMessage这个回调
    eventSource.onmessage = (e) => {
      try {
        //解析json数据
        const parsed = JSON.parse(e.data)
        //从数据中取 type 字段，没有则用默认值 'message'
        const eventType = parsed.type || 'message'
        //保存最后一次收到的事件
        lastEvent.value = { type: eventType, data: parsed, timestamp: Date.now() }
        //调用用户回调
        onMessage?.(eventType, parsed)
      } catch (err) {
        // 忽略非 JSON 消息（如心跳）
      }
    }
    
    // 连接出错时候触发回调, 可能是网络断开,服务器错误等
    eventSource.onerror = (e) => {
      //更新状态为已断开
      connected.value = false
      //记录错误信息
      error.value = 'SSE 连接中断'
      //调用用户传入的错误回调
      onError?.(e)
      //关闭当前连接
      eventSource.close()
      
      // 指数退避重连
      // 如果组件没有被销毁
      if (!disposed) {
        // 设置定时器，延迟重连
        reconnectTimer = setTimeout(() => {
          //指数退避：每次重连失败，间隔时间 × 1.5
          currentReconnectInterval = Math.min(
            currentReconnectInterval * 1.5,
            maxReconnectInterval
          )
          // new EventSource(url)  手动重连,sse也有自动重连机制 也是指数退避算法
          connect()
        }, currentReconnectInterval)
      }
    }
  }

  // 断开连接函数, 关闭sse连接, 清理定时器, 更新状态
  function close() {
    disposed = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    connected.value = false
  }

  // 手动重连函数
  function reconnect() {
    //先关闭连接
    close()
    //重置状态和标记，准备重新连接
    disposed = false
    //重置重连间隔
    currentReconnectInterval = reconnectInterval
    //重新建立连接
    connect()
  }

  // 启动连接
  connect()

  // 组件卸载时清理
  onUnmounted(() => {
    close()
  })

  return {
    connected,  //响应式状态,是否已连接
    lastEvent,  //最后一次收到的事件
    error,  //错误信息
    close,  //关闭连接的方法
    reconnect,  //手动重连的方法
  }
}
