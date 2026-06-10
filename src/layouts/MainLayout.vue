<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside
      v-show="showLayoutChrome"
      :width="sidebarCollapsed ? '64px' : '220px'"
      class="main-aside"
    >
      <div class="logo-area" @click="goHome">
        <img src="/vite.svg" alt="logo" class="logo-img" />
        <span v-show="!sidebarCollapsed" class="logo-text">金融数据平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        background-color="var(--bg-sidebar)"
        text-color="var(--text-sidebar)"
        active-text-color="var(--text-sidebar-active)"
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
      <el-header v-show="showLayoutChrome" class="main-header">
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
          <el-dropdown trigger="click" @command="handleThemeSelect">
            <el-button :icon="Brush" text title="切换主题" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="theme in appStore.themes"
                  :key="theme.id"
                  :command="theme.id"
                  :class="{ 'is-active': appStore.currentTheme === theme.id }"
                >
                  <span class="theme-colors">
                    <span
                      v-for="color in theme.colors"
                      :key="color"
                      class="theme-dot"
                      :style="{ background: color }"
                    />
                  </span>
                  <span>{{ theme.name }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      <el-main :class="['main-content', { 'fullscreen-mode': isDataScreenFullscreen }]">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Monitor, Document, DataAnalysis, Setting, Fold, Bell, Brush } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title)

/** 当前路由是否为大屏展示页 */
const isDataScreenDisplay = computed(() =>
  route.path.startsWith('/data-screen/display/')
)

/** 大屏展示页的全屏模式 */
const isDataScreenFullscreen = computed(() =>
  isDataScreenDisplay.value && appStore.dataScreenFullscreen
)

/** 是否显示侧边栏和顶栏（大屏全屏时隐藏） */
const showLayoutChrome = computed(() => !isDataScreenFullscreen.value)

function goHome() {
  router.push('/data-screen')
}

function handleThemeSelect(themeId) {
  appStore.setTheme(themeId)
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.main-aside {
  background: var(--bg-sidebar);
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
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
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
        color: var(--text-primary);
      }
    }
  }
}

.main-content {
  height: calc(100vh - $header-height);
  overflow: auto;
  background: var(--bg-body);
  padding: 0;

  &.fullscreen-mode {
    height: 100vh;
    overflow: hidden;
  }
}

// ========== 主题切换下拉 ==========
.theme-colors {
  display: inline-flex;
  gap: 3px;
  vertical-align: middle;
  margin-right: 8px;
}

.theme-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
