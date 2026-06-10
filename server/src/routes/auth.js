import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const router = Router()

/**
 * POST /api/auth/login
 *
 * Body: { username, password }
 * 简单登录验证（后续可扩展 JWT）
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: { message: '用户名和密码不能为空' } })
    }

    const user = await User.findOne({ username }).lean()
    if (!user) {
      return res.status(401).json({ error: { message: '用户名或密码错误' } })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: { message: '用户名或密码错误' } })
    }

    // 简单返回用户信息（不返回密码）
    const { password: _, ...userInfo } = user
    res.json({
      message: '登录成功',
      user: userInfo,
      token: 'mock-jwt-token-for-demo', // 后续可替换为真实 JWT
    })
  } catch (err) {
    next(err)
  }
})

export default router
