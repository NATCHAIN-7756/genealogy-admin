<template>
  <div class="members-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员列表 {{ familyId ? '- 家族' + familyId : '' }}</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            添加成员
          </el-button>
        </div>
      </template>

      <el-table :data="members" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === 'male' ? 'primary' : row.gender === 'female' ? 'danger' : 'info'">
              {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="generation" label="辈分" width="80" />
        <el-table-column prop="birth_date" label="出生日期" width="120" />
        <el-table-column prop="birth_place" label="出生地" />
        <el-table-column prop="is_alive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_alive ? 'success' : 'info'">
              {{ row.is_alive ? '在世' : '已故' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewRelations(row.id)">关系</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑成员对话框 -->
    <el-dialog v-model="createDialogVisible" :title="editingMember ? '编辑成员' : '添加成员'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="formData.name" placeholder="成员姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="formData.gender" style="width: 100%">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
                <el-option label="未知" value="unknown" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="formData.birth_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="去世日期">
              <el-date-picker v-model="formData.death_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生地">
              <el-input v-model="formData.birth_place" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="辈分">
              <el-input v-model="formData.generation" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="生平简介">
          <el-input v-model="formData.biography" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="在世">
          <el-switch v-model="formData.is_alive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingMember ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 关系管理对话框 -->
    <el-dialog v-model="relationDialogVisible" title="成员关系" width="700px">
      <el-button type="primary" size="small" @click="showAddRelation" style="margin-bottom: 15px">
        添加关系
      </el-button>
      <el-table :data="relations" size="small">
        <el-table-column prop="relation_type" label="关系类型" width="100">
          <template #default="{ row }">
            {{ relationTypeLabel[row.relation_type] || row.relation_type }}
          </template>
        </el-table-column>
        <el-table-column prop="related_member_id" label="关联成员" width="100" />
        <el-table-column prop="is_bio" label="血缘" width="80">
          <template #default="{ row }">
            {{ row.is_bio ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="handleDeleteRelation(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { memberApi } from '../api'

const route = useRoute()
const familyId = ref(null)
const loading = ref(false)
const submitting = ref(false)
const members = ref([])
const createDialogVisible = ref(false)
const relationDialogVisible = ref(false)
const editingMember = ref(null)
const currentMemberId = ref(null)
const relations = ref([])

const formData = ref({
  name: '',
  gender: 'unknown',
  birth_date: null,
  death_date: null,
  birth_place: '',
  generation: '',
  biography: '',
  is_alive: true
})

const relationTypeLabel = {
  father: '父亲',
  mother: '母亲',
  spouse: '配偶',
  child: '子女',
  adopted_child: '养子女'
}

watch(() => route.params.familyId, (val) => {
  if (val) {
    familyId.value = parseInt(val)
    loadMembers()
  }
}, { immediate: true })

const loadMembers = async () => {
  if (!familyId.value) return
  loading.value = true
  try {
    members.value = await memberApi.list(familyId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  editingMember.value = null
  formData.value = {
    family_id: familyId.value,
    name: '',
    gender: 'unknown',
    birth_date: null,
    death_date: null,
    birth_place: '',
    generation: '',
    biography: '',
    is_alive: true
  }
  createDialogVisible.value = true
}

const handleEdit = (row) => {
  editingMember.value = row
  formData.value = { ...row }
  createDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  submitting.value = true
  try {
    if (editingMember.value) {
      await memberApi.update(editingMember.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await memberApi.create({ ...formData.value, family_id: familyId.value })
      ElMessage.success('创建成功')
    }
    createDialogVisible.value = false
    loadMembers()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定删除该成员？', '提示', { type: 'warning' })
  await memberApi.delete(row.id)
  ElMessage.success('删除成功')
  loadMembers()
}

const viewRelations = async (memberId) => {
  currentMemberId.value = memberId
  relations.value = await memberApi.relations(memberId)
  relationDialogVisible.value = true
}

const showAddRelation = () => {
  // TODO: 添加关系
  ElMessage.info('待实现')
}

const handleDeleteRelation = async (row) => {
  // TODO: 删除关系
  ElMessage.info('待实现')
}

onMounted(() => {
  if (route.params.familyId) {
    familyId.value = parseInt(route.params.familyId)
    loadMembers()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
