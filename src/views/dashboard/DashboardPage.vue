<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-header__title">工作台</h2>
      <p class="page-header__desc">金融数据平台概览</p>
    </div>
    <el-row :gutter="16">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover">
          <el-statistic :title="stat.label" :value="stat.value" :prefix="stat.prefix" :suffix="stat.suffix" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const stats = ref([
  { label: '大屏总数', value: '--', prefix: '', suffix: '个' },
  { label: '报表数量', value: '--', prefix: '', suffix: '份' },
  { label: '今日交易', value: '--', prefix: '', suffix: '笔' },
  { label: '活跃用户', value: '--', prefix: '', suffix: '人' },
])

onMounted(async () => {
  try {
    const data = await api.get('/dashboard/stats')
    if (Array.isArray(data) && data.length > 0) {
      stats.value = data
    }
  } catch (err) {
    console.error('获取仪表盘数据失败:', err)
  }
})
</script>
