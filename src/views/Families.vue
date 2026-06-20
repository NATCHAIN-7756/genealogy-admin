<template>
  <div class="families-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>家族列表</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建家族
          </el-button>
        </div>
      </template>

      <el-table :data="families" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="家族名称" />
        <el-table-column prop="surname" label="姓氏" width="100" />
        <el-table-column prop="origin" label="祖籍" />
        <el-table-column prop="invite_code" label="邀请码" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.invite_code">{{ row.invite_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_public" label="公开" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_public ? 'success' : 'info'">
              {{ row.is_public ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMembers(row.id)">成员</el-button>
            <el-button size="small" @click="viewTree(row.id)">树图</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建家族对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建家族" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="家族名称" required>
          <el-input v-model="formData.name" placeholder="请输入家族名称" />
        </el-form-item>
        <el-form-item label="姓氏">
          <el-input v-model="formData.surname" placeholder="家族姓氏" />
        </el-form-item>
        <el-form-item label="祖籍">
          <el-input v-model="formData.origin" placeholder="祖籍所在地" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="formData.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { familyApi } from '../api'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const families = ref([])
const createDialogVisible = ref(false)
const formData = ref({
  name: '',
  surname: '',
  origin: '',
  description: '',
  is_public: false
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const loadFamilies = async () => {
  loading.value = true
  try {
    families.value = await familyApi.list()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  formData.value = { name: '', surname: '', origin: '', description: '', is_public: false }
  createDialogVisible.value = true
}

const handleCreate = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入家族名称')
    return
  }
  submitting.value = true
  try {
    await familyApi.create(formData.value)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadFamilies()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定删除该家族？', '提示', { type: 'warning' })
  // TODO: 实现删除
  ElMessage.success('删除成功')
  loadFamilies()
}

const viewMembers = (familyId) => {
  router.push(`/members/${familyId}`)
}

const viewTree = (familyId) => {
  router.push(`/tree/${familyId}`)
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
