<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="main-aside">
      <div class="logo-area" @click="goHome">
        <img src="/vite.svg" alt="logo" class="logo-img" />
        <span v-show="!sidebarCollapsed" class="logo-text">金融数据平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#ffffff80"
        active-text-color="#00d4ff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/data-screen">
          <el-icon><Monitor /></el-icon>
          <span>数据大屏</span>
        </el-menu-item>
        <el-menu-item index="/report-center">
          <el-icon><Document /></el-icon>
          <span>报表中心</span>
        </el-menu-item>
        <el-menu-item index="/smart-bi">
          <el-icon><DataAnalysis /></el-icon>
          <span>智能 BI</span>
        </el-menu-item>
        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">用户管理</el-menu-item>
          <el-menu-item index="/system/role">角色权限</el-menu-item>
          <el-menu-item index="/system/audit">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="main-header">
        <div class="header-left">
          <el-button
            :icon="Fold"
            text
            @click="appStore.toggleSidebar()"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-switch
            v-model="isDark"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            inline-prompt
            @change="handleThemeChange"
          />
          <el-badge :value="3" :max="99">
            <el-button :icon="Bell" circle text />
          </el-badge>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" src="" />
              <span class="user-name">管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Monitor, Document, DataAnalysis, Setting, Fold, Bell, Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isDark = computed(() => appStore.currentTheme === 'dark')
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title as string)

function goHome() {
  router.push('/data-screen')
}

function handleThemeChange(val: string | number | boolean) {
  appStore.setTheme(val ? 'dark' : 'light')
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.main-aside {
  background: #001529;
  overflow: hidden;
  transition: width 0.3s;

  .logo-area {
    display: flex;
    align-items: center;
    height: $header-height;
    padding: 0 16px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-img {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      margin-left: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  padding: 0 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .user-name {
        font-size: 14px;
        color: #333;
      }
    }
  }
}

.main-content {
  height: calc(100vh - $header-height);
  overflow: auto;
  background: #f0f2f5;
  padding: 0;
}
</style>
