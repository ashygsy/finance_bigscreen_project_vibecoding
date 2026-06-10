import { Router } from 'express'
import chartDataRoutes from './chartData.js'
import screenRoutes from './screens.js'
import dashboardRoutes from './dashboard.js'
import authRoutes from './auth.js'
import bffRoutes from './bffRoutes.js'

const router = Router()

// 挂载各模块路由
router.use('/chart-data', chartDataRoutes)
router.use('/screens', screenRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/auth', authRoutes)
router.use('/', bffRoutes)

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export { router as routes }
