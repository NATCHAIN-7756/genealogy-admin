<template>
  <div class="books-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图书列表</span>
          <el-upload
            :show-file-list="false"
            :before-upload="handleUpload"
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传图书
            </el-button>
          </el-upload>
        </div>
      </template>

      <el-table :data="books" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="书名" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="file_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.file_type.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_pages" label="页数" width="80" />
        <el-table-column prop="created_at" label="上传时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewBook(row)">阅读</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传图书" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="书名" required>
          <el-input v-model="uploadForm.title" placeholder="请输入书名" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="uploadForm.author" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="文件">
          <el-tag v-if="uploadForm.file">{{ uploadForm.file.name }}</el-tag>
          <el-tag v-else type="danger">未选择文件</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- 阅读对话框 -->
    <el-dialog v-model="readDialogVisible" :title="currentBook?.title" width="80%" top="5vh">
      <div v-if="currentBook" class="reader">
        <el-empty description="阅读器开发中，敬请期待" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bookApi } from '../api'

const loading = ref(false)
const uploading = ref(false)
const books = ref([])
const uploadDialogVisible = ref(false)
const readDialogVisible = ref(false)
const currentBook = ref(null)

const uploadForm = ref({
  title: '',
  author: '',
  description: '',
  family_id: 1,
  file: null
})

const loadBooks = async () => {
  loading.value = true
  try {
    books.value = await bookApi.list()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleUpload = (file) => {
  uploadForm.value.file = file
  uploadForm.value.title = file.name.replace(/\.[^.]+$/, '')
  uploadDialogVisible.value = true
  return false
}

const submitUpload = async () => {
  if (!uploadForm.value.title || !uploadForm.value.file) {
    ElMessage.warning('请填写书名并选择文件')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('title', uploadForm.value.title)
    formData.append('author', uploadForm.value.author || '')
    formData.append('description', uploadForm.value.description || '')
    formData.append('family_id', uploadForm.value.family_id)
    
    await bookApi.upload(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    loadBooks()
  } catch (e) {
    console.error(e)
  } finally {
    uploading.value = false
  }
}

const viewBook = async (book) => {
  currentBook.value = book
  readDialogVisible.value = true
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定删除该图书？', '提示', { type: 'warning' })
  await bookApi.delete(row.id)
  ElMessage.success('删除成功')
  loadBooks()
}

onMounted(() => {
  loadBooks()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reader {
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
