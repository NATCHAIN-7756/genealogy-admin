<template>
  <div class="history-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>历史版本管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建快照
          </el-button>
        </div>
      </template>

      <el-select v-model="selectedFamilyId" placeholder="选择家族" @change="loadSnapshots" style="margin-bottom: 20px; width: 200px">
        <el-option v-for="f in families" :key="f.id" :label="f.name" :value="f.id" />
      </el-select>

      <el-table :data="snapshots" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="version_name" label="版本名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewSnapshot(row)">查看</el-button>
            <el-button size="small" type="warning" @click="restoreSnapshot(row)">恢复</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建快照对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建快照" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="家族" required>
          <el-select v-model="formData.family_id" style="width: 100%">
            <el-option v-for="f in families" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本名称" required>
          <el-input v-model="formData.version_name" placeholder="如：2026年6月版本" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>

    <!-- 查看快照对话框 -->
    <el-dialog v-model="viewDialogVisible" title="快照详情" width="80%">
      <el-descriptions :column="2" border v-if="currentSnapshot">
        <el-descriptions-item label="版本名称">{{ currentSnapshot.version_name }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentSnapshot.created_at }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentSnapshot.description }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <el-tabs>
        <el-tab-pane label="成员列表">
          <el-table :data="snapshotData.members" size="small" max-height="400">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="gender" label="性别" width="80" />
            <el-table-column prop="generation" label="辈分" width="80" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="关系列表">
          <el-table :data="snapshotData.relations" size="small" max-height="400">
            <el-table-column prop="member_id" label="成员ID" width="100" />
            <el-table-column prop="related_member_id" label="关联成员ID" width="120" />
            <el-table-column prop="relation_type" label="关系类型" width="100" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { historyApi, familyApi } from '../api'

const loading = ref(false)
const submitting = ref(false)
const families = ref([])
const snapshots = ref([])
const selectedFamilyId = ref(null)
const createDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentSnapshot = ref(null)
const snapshotData = ref({ members: [], relations: [] })

const formData = ref({
  family_id: null,
  version_name: '',
  description: ''
})

const loadFamilies = async () => {
  try {
    families.value = await familyApi.list()
    if (families.value.length) {
      selectedFamilyId.value = families.value[0].id
      loadSnapshots()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadSnapshots = async () => {
  if (!selectedFamilyId.value) return
  loading.value = true
  try {
    snapshots.value = await historyApi.list(selectedFamilyId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  formData.value = {
    family_id: selectedFamilyId.value || families.value[0]?.id,
    version_name: `${new Date().toLocaleDateString('zh-CN')} 版本`,
    description: ''
  }
  createDialogVisible.value = true
}

const handleCreate = async () => {
  if (!formData.value.family_id || !formData.value.version_name) {
    ElMessage.warning('请选择家族并填写版本名称')
    return
  }
  submitting.value = true
  try {
    await historyApi.create(formData.value.family_id, {
      version_name: formData.value.version_name,
      description: formData.value.description
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadSnapshots()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const viewSnapshot = async (row) => {
  try {
    const data = await historyApi.get(row.id)
    currentSnapshot.value = data.snapshot
    snapshotData.value = data.data
    viewDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const restoreSnapshot = async (row) => {
  await ElMessageBox.confirm('恢复将覆盖当前数据，确定继续？', '警告', { type: 'warning' })
  try {
    await historyApi.restore(row.id)
    ElMessage.success('恢复成功')
  } catch (e) {
    ElMessage.error('恢复失败')
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定删除该快照？', '提示', { type: 'warning' })
  await historyApi.delete(row.id)
  ElMessage.success('删除成功')
  loadSnapshots()
}

onMounted(() => {
  loadFamilies()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
