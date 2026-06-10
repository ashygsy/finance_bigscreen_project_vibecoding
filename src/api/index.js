import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 响应拦截器: 统一提取 data
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error?.message || err.message || '请求失败'
    console.error('[API]', err.config?.url, msg)
    return Promise.reject(err)
  }
)

export default api
