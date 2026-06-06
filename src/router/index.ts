import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/data-screen',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardPage.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'data-screen',
        name: 'DataScreenList',
        component: () => import('@/views/data-screen/ScreenListPage.vue'),
        meta: { title: '数据大屏' },
      },
      {
        path: 'data-screen/editor/:id?',
        name: 'DataScreenEditor',
        component: () => import('@/views/data-screen/ScreenEditorPage.vue'),
        meta: { title: '大屏编辑器' },
      },
      {
        path: 'data-screen/display/:id',
        name: 'DataScreenDisplay',
        component: () => import('@/views/data-screen/ScreenDisplayPage.vue'),
        meta: { title: '大屏展示', fullscreen: true },
      },
      {
        path: 'report-center',
        name: 'ReportCenter',
        component: () => import('@/views/report-center/ReportCenterPage.vue'),
        meta: { title: '报表中心' },
      },
      {
        path: 'smart-bi',
        name: 'SmartBI',
        component: () => import('@/views/smart-bi/SmartBIPage.vue'),
        meta: { title: '智能 BI' },
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        children: [
          {
            path: 'user',
            name: 'UserManage',
            component: () => import('@/views/system/UserManagePage.vue'),
            meta: { title: '用户管理' },
          },
          {
            path: 'role',
            name: 'RoleManage',
            component: () => import('@/views/system/RoleManagePage.vue'),
            meta: { title: '角色权限' },
          },
          {
            path: 'audit',
            name: 'AuditLog',
            component: () => import('@/views/system/AuditLogPage.vue'),
            meta: { title: '操作日志' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
