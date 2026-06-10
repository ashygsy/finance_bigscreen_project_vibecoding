// ============================================================
// 主题配置文件 — VS Code 风格多主题切换
//
// 每个主题定义:
//   id           — 唯一标识，对应 data-theme 属性值
//   name         — 中文显示名
//   type         — 'dark' | 'light'，驱动 Element Plus 暗黑模式
//   colors       — 下拉菜单中的调色板预览（4-5 个色块）
//   cssVariables — 运行时注入的 CSS 自定义属性（可选，如不需要额外覆盖）
//
// 主题切换由 themes.scss 中的 [data-theme="..."] 选择器驱动，
// applyTheme() 负责切换 data-theme 属性 + Element Plus dark 类。
// ============================================================

/** 所有可用主题 */
export const themes = [
  {
    id: 'dark-blue',
    name: '暗夜蓝',
    type: 'dark',
    colors: ['#001529', '#0a1633', '#00d4ff', '#1890ff', '#e0e6f0'],
  },
  {
    id: 'minimal-light',
    name: '极简白',
    type: 'light',
    colors: ['#ffffff', '#f0f2f5', '#1890ff', '#1d2129', '#e5e6eb'],
  },
  {
    id: 'deep-purple',
    name: '深邃紫',
    type: 'dark',
    colors: ['#1a1025', '#2d1b4e', '#a855f7', '#c084fc', '#e8d5ff'],
  },
  {
    id: 'ink-gold',
    name: '墨金',
    type: 'dark',
    colors: ['#1c1917', '#292524', '#f59e0b', '#fbbf24', '#fef3c7'],
  },
  {
    id: 'jade-green',
    name: '青翠绿',
    type: 'dark',
    colors: ['#0d1f17', '#0a2e1f', '#10b981', '#34d399', '#d1fae5'],
  },
]

const STORAGE_KEY = 'app-theme'
const DEFAULT_THEME = 'dark-blue'

/**
 * 应用主题
 * - 设置 <html data-theme="...">
 * - 对 dark 主题添加 html.dark（Element Plus 暗黑模式）
 * - 持久化到 localStorage
 */
export function applyTheme(themeId) {
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) return

  document.documentElement.setAttribute('data-theme', themeId)

  // Element Plus 暗黑模式
  if (theme.type === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  localStorage.setItem(STORAGE_KEY, themeId)
}

/**
 * 读取本地存储的主题，未存储时使用默认主题
 */
export function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
}

/**
 * 初始化：应用已保存的主题
 */
export function initTheme() {
  applyTheme(getSavedTheme())
}
