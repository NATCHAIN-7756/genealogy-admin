<template>
  <div class="tree-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>家族树图 - 家族 {{ familyId }}</span>
          <el-button-group>
            <el-button @click="zoomIn"><el-icon><ZoomIn /></el-icon> 放大</el-button>
            <el-button @click="zoomOut"><el-icon><ZoomOut /></el-icon> 缩小</el-button>
            <el-button @click="resetZoom"><el-icon><RefreshRight /></el-icon> 重置</el-button>
            <el-button type="primary" @click="exportTree">导出</el-button>
          </el-button-group>
        </div>
      </template>

      <div v-loading="loading" class="tree-container" ref="treeContainer">
        <div v-if="treeData.nodes && Object.keys(treeData.nodes).length" class="tree-canvas" :style="canvasStyle">
          <!-- 渲染家族树 -->
          <div 
            v-for="node in Object.values(treeData.nodes)" 
            :key="node.id"
            class="tree-node"
            :style="getNodeStyle(node)"
            @click="selectNode(node)"
          >
            <div class="node-avatar" :class="node.gender">
              {{ node.name.charAt(0) }}
            </div>
            <div class="node-name">{{ node.name }}</div>
            <div class="node-gen" v-if="node.generation">{{ node.generation }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无数据，请先添加成员" />
      </div>
    </el-card>

    <!-- 节点详情侧边栏 -->
    <el-drawer v-model="drawerVisible" title="成员详情" size="400px">
      <el-descriptions :column="1" border v-if="selectedNode">
        <el-descriptions-item label="姓名">{{ selectedNode.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ selectedNode.gender === 'male' ? '男' : selectedNode.gender === 'female' ? '女' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="辈分">{{ selectedNode.generation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ selectedNode.birth_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedNode.is_alive ? 'success' : 'info'">
            {{ selectedNode.is_alive ? '在世' : '已故' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关系">
          <el-tag v-for="rel in selectedNode.relations" :key="rel.member_id" style="margin: 2px">
            {{ relationTypeLabel[rel.type] }}: {{ treeData.nodes[rel.member_id]?.name || rel.member_id }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { treeApi } from '../api'

const route = useRoute()
const familyId = ref(null)
const loading = ref(false)
const treeContainer = ref(null)
const drawerVisible = ref(false)
const selectedNode = ref(null)

const treeData = ref({
  family_id: 0,
  root_nodes: [],
  nodes: {},
  total_generations: 0
})

const zoom = ref(1)
const relationTypeLabel = {
  father: '父亲',
  mother: '母亲',
  spouse: '配偶',
  child: '子女',
  parent: '父母'
}

const canvasStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: 'top left'
}))

const zoomIn = () => { zoom.value = Math.min(2, zoom.value + 0.1) }
const zoomOut = () => { zoom.value = Math.max(0.3, zoom.value - 0.1) }
const resetZoom = () => { zoom.value = 1 }

const loadTree = async () => {
  if (!familyId.value) return
  loading.value = true
  try {
    treeData.value = await treeApi.get(familyId.value)
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const getNodeStyle = (node) => {
  // 简单布局：按层级和位置排列
  const nodes = Object.values(treeData.value.nodes)
  const index = nodes.indexOf(node)
  const row = Math.floor(index / 4)
  const col = index % 4
  return {
    left: `${col * 180 + 50}px`,
    top: `${row * 140 + 50}px`
  }
}

const selectNode = (node) => {
  selectedNode.value = node
  drawerVisible.value = true
}

const exportTree = async () => {
  try {
    const data = await treeApi.export(familyId.value, 'json')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `family-tree-${familyId.value}.json`
    a.click()
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

watch(() => route.params.familyId, (val) => {
  if (val) {
    familyId.value = parseInt(val)
    loadTree()
  }
}, { immediate: true })

onMounted(() => {
  if (route.params.familyId) {
    familyId.value = parseInt(route.params.familyId)
    loadTree()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-container {
  height: calc(100vh - 250px);
  overflow: auto;
  background: #f5f7fa;
  border-radius: 4px;
}

.tree-canvas {
  position: relative;
  min-width: 800px;
  min-height: 600px;
  transition: transform 0.2s;
}

.tree-node {
  position: absolute;
  width: 120px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.tree-node:hover {
  transform: scale(1.1);
}

.node-avatar {
  width: 60px;
  height: 60px;
  line-height: 60px;
  margin: 0 auto 8px;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.node-avatar.male {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.node-avatar.female {
  background: linear-gradient(135deg, #F56C6C, #f78989);
}

.node-avatar.unknown {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.node-name {
  font-weight: 500;
  color: #303133;
}

.node-gen {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
