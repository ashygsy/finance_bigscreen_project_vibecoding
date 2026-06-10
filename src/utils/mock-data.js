// Mock 数据 — 用于大屏展示演示

// 指标卡数据
export const mockNumberCards = [
  { title: '总资产规模', value: 285.36, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 12.5, color: '#00d4ff' },
  { title: '今日交易额', value: 16.82, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 8.3, color: '#00ff88' },
  { title: '活跃客户数', value: 48623, suffix: '户', trend: 'up', trendValue: 5.7, color: '#ffa940' },
  { title: '不良贷款率', value: 1.52, suffix: '%', trend: 'down', trendValue: 0.3, color: '#ff4d4f' },
  { title: '理财产品规模', value: 92.18, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 15.2, color: '#9254de' },
  { title: '本月营收', value: 3.65, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 9.8, color: '#36cfc9' },
]

// 交易趋势（折线图）
export const mockTradeTrend = {
  xAxis: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  series: [
    { name: '转账', data: [3200, 2800, 5600, 8900, 10200, 7800, 4100] },
    { name: '消费', data: [1800, 1200, 4500, 7200, 8500, 6200, 2500] },
    { name: '理财', data: [800, 600, 2300, 4200, 5100, 3500, 1100] },
  ],
}

// 业务分布（饼图）
export const mockBusinessDist = [
  { name: '个人储蓄', value: 320 },
  { name: '企业贷款', value: 280 },
  { name: '消费金融', value: 180 },
  { name: '财富管理', value: 120 },
  { name: '支付结算', value: 100 },
]

// 各分行排名（条形图）
export const mockBranchRanking = {
  yAxis: ['北京分行', '上海分行', '深圳分行', '广州分行', '杭州分行', '成都分行', '南京分行'],
  data: [428, 396, 385, 352, 318, 289, 267],
}

// 风险指标（雷达图）
export const mockRiskRadar = {
  indicator: [
    { name: '信用风险', max: 100 },
    { name: '市场风险', max: 100 },
    { name: '操作风险', max: 100 },
    { name: '流动性风险', max: 100 },
    { name: '合规风险', max: 100 },
    { name: '声誉风险', max: 100 },
  ],
  data: [
    { name: '当前', value: [42, 55, 38, 45, 32, 28] },
    { name: '行业均值', value: [55, 60, 48, 50, 42, 40] },
  ],
}

// 实时交易滚动
export const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
  id: `TX${String(i + 1).padStart(6, '0')}`,
  type: ['转账', '消费', '理财申购', '贷款放款', '信用卡还款'][i % 5],
  amount: (Math.random() * 1000000 + 10000).toFixed(2),
  time: new Date(Date.now() - i * 300000).toLocaleTimeString(),
  status: Math.random() > 0.1 ? 'success' : 'pending',
}))

// 客户增长趋势
export const mockCustomerGrowth = {
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  series: [
    { name: '个人客户(万)', data: [320, 335, 348, 362, 380, 395, 412, 428, 442, 458, 472, 486] },
    { name: '企业客户', data: [8200, 8450, 8760, 9020, 9350, 9680, 10120, 10580, 11020, 11450, 11980, 12460] },
  ],
}

// 产品销量（柱状图+折线图混合）
export const mockProductSales = {
  xAxis: ['基金', '保险', '理财', '债券', '信托', '外汇', '黄金'],
  series: [
    { name: '销售量(笔)', type: 'bar', data: [12500, 9800, 15200, 8400, 6200, 4800, 7600] },
    { name: '同比增长(%)', type: 'line', data: [15, 8, 22, 5, 12, -3, 18] },
  ],
}
