export function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message)
  res.status(err.status || 500).json({
    error: {
      message: err.message || '服务器内部错误',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  })
}

export function notFound(req, res) {
  res.status(404).json({ error: { message: `接口不存在: ${req.method} ${req.path}` } })
}
