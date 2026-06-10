<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-header__title">数据大屏</h2>
      <p class="page-header__desc">管理和展示金融数据可视化大屏</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索大屏..."
        :prefix-icon="Search"
        clearable
        style="width: 240px"
      />
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建大屏
      </el-button>
    </div>

    <!-- 大屏卡片列表 -->
    <div v-loading="loading" class="screen-grid">
      <el-empty v-if="filteredScreens.length === 0 && !loading" description="暂无大屏" />
      <div
        v-for="screen in filteredScreens"
        :key="screen.id"
        class="screen-card"
      >
        <div class="card-preview" @click="handlePreview(screen)">
          <div class="preview-placeholder">
            <el-icon :size="48"><Monitor /></el-icon>
            <span>{{ screen.title }}</span>
          </div>
        </div>
        <div class="card-info">
          <div class="card-title">{{ screen.title }}</div>
          <div class="card-desc">{{ screen.description }}</div>
          <div class="card-meta">
            <span>更新于 {{ screen.updatedAt }}</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button text :icon="View" @click="handlePreview(screen)">预览</el-button>
          <el-button text :icon="Edit" @click="handleEdit(screen)">编辑</el-button>
          <el-button text :icon="CopyDocument" @click="handleCopy(screen)">复制</el-button>
          <el-popconfirm title="确认删除此大屏？" @confirm="handleDelete(screen.id)">
            <template #reference>
              <el-button text :icon="Delete" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup >
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, View, Edit, CopyDocument, Delete, Monitor } from '@element-plus/icons-vue'
import { useScreenStore } from '@/stores/screen'
const router = useRouter()
const screenStore = useScreenStore()

const searchKeyword = ref('')
const loading = ref(false)

const filteredScreens = computed(() => {
  if (!searchKeyword.value) return screenStore.screens
  const keyword = searchKeyword.value.toLowerCase()
  return screenStore.screens.filter(
    (s) => s.title.toLowerCase().includes(keyword) || s.description.toLowerCase().includes(keyword)
  )
})

function handleCreate() {
  const newId = String(Date.now())
  router.push(`/data-screen/editor/${newId}`)
}

function handlePreview(screen) {
  window.open(`/data-screen/display/${screen.id}`, '_blank')
}

function handleEdit(screen) {
  router.push(`/data-screen/editor/${screen.id}`)
}

function handleCopy(screen) {
  const newScreen = {
    ...screen,
    id: String(Date.now()),
    title: `${screen.title} - 副本`,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
  screenStore.addScreen(newScreen)
}

function handleDelete(id) {
  screenStore.removeScreen(id)
}

onMounted(() => {
  screenStore.loadScreens()
})
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: 8px;
}

.screen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  min-height: 200px;
}

.screen-card {
  background: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.3s;

  &:hover {
    box-shadow: var(--shadow-card);
    transform: translateY(-2px);
  }

  .card-preview {
    height: 180px;
    background: linear-gradient(135deg, #0a1633 0%, #0d2450 100%);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.4);

      span {
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .card-info {
    padding: 16px 20px 12px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .card-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .card-meta {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }

  .card-actions {
    display: flex;
    gap: 4px;
    padding: 0 16px 12px;
    border-top: 1px solid var(--border-light);
    padding-top: 12px;
  }
}
</style>
