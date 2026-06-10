import { Router } from 'express'
import Screen from '../models/Screen.js'

const router = Router()

// GET /api/screens — 大屏列表
router.get('/', async (req, res, next) => {
  try {
    const screens = await Screen.find().sort({ updatedAt: -1 }).lean()
    res.json(screens)
  } catch (err) {
    next(err)
  }
})

// GET /api/screens/:id — 单个大屏详情
router.get('/:id', async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.params.id).lean()
    if (!screen) {
      return res.status(404).json({ error: { message: '大屏不存在' } })
    }
    res.json(screen)
  } catch (err) {
    next(err)
  }
})

// POST /api/screens — 创建大屏
router.post('/', async (req, res, next) => {
  try {
    const screen = await Screen.create(req.body)
    res.status(201).json(screen)
  } catch (err) {
    next(err)
  }
})

// PUT /api/screens/:id — 更新大屏
router.put('/:id', async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean()
    if (!screen) {
      return res.status(404).json({ error: { message: '大屏不存在' } })
    }
    res.json(screen)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/screens/:id — 删除大屏
router.delete('/:id', async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndDelete(req.params.id).lean()
    if (!screen) {
      return res.status(404).json({ error: { message: '大屏不存在' } })
    }
    res.json({ message: '删除成功', id: req.params.id })
  } catch (err) {
    next(err)
  }
})

export default router
