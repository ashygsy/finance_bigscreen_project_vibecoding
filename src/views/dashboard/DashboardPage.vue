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

<script setup lang="ts">
import { ref } from 'vue'

const stats = ref([
  { label: '大屏总数', value: 3, prefix: '', suffix: '个' },
  { label: '报表数量', value: 128, prefix: '', suffix: '份' },
  { label: '今日访问', value: 2563, prefix: '', suffix: '次' },
  { label: '活跃用户', value: 486, prefix: '', suffix: '人' },
])
</script>
