<template>
  <div class="books-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="book-list-card">
          <template #header>
            <div class="card-header">
              <span>图书列表</span>
              <el-button type="primary" size="small" @click="showUploadDialog = true">上传</el-button>
            </div>
          </template>
          
          <el-input v-model="searchText" placeholder="搜索图书" clearable style="margin-bottom: 15px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          
          <div class="book-list">
            <div
              v-for="book in filteredBooks"
              :key="book.id"
              class="book-item"
              :class="{ active: currentBook?.id === book.id }"
              @click="selectBook(book)"
            >
              <el-icon :size="24">
                <Document v-if="book.file_type === 'pdf'" />
                <Notebook v-else-if="book.file_type === 'epub'" />
                <Picture v-else />
              </el-icon>
              <div class="book-info">
                <div class="book-title">{{ book.title }}</div>
                <div class="book-meta">{{ book.file_type?.toUpperCase() }} · {{ formatDate(book.created_at) }}</div>
              </div>
            </div>
            
            <el-empty v-if="filteredBooks.length === 0" description="暂无图书" />
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-card class="reader-card">
          <div v-if="!currentBook" class="empty-reader">
            <el-empty description="请选择一本图书开始阅读" />
          </div>
          
          <div v-else class="reader-container">
            <div class="reader-toolbar">
              <div class="toolbar-left">
                <span class="book-title">{{ currentBook.title }}</span>
                <el-tag v-if="currentBook.file_type" size="small">{{ currentBook.file_type.toUpperCase() }}</el-tag>
              </div>
              <div class="toolbar-right">
                <el-button-group v-if="currentBook.file_type === 'pdf'">
                  <el-button :disabled="currentPage <= 1" @click="prevPage">
                    <el-icon><ArrowLeft /></el-icon> 上一页
                  </el-button>
                  <el-button disabled>{{ currentPage }} / {{ totalPages }}</el-button>
                  <el-button :disabled="currentPage >= totalPages" @click="nextPage">
                    下一页 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </el-button-group>
                
                <el-button-group v-else-if="currentBook.file_type === 'epub'">
                  <el-button @click="prevChapter">
                    <el-icon><ArrowLeft /></el-icon> 上一章
                  </el-button>
                  <el-button @click="showToc = !showToc">
                    <el-icon><Menu /></el-icon> 目录
                  </el-button>
                  <el-button @click="nextChapter">
                    下一章 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </el-button-group>
                
                <el-button-group v-else-if="currentBook.file_type === 'image'">
                  <el-button @click="zoomOut">
                    <el-icon><ZoomOut /></el-icon>
                  </el-button>
                  <el-button disabled>{{ Math.round(zoomLevel * 100) }}%</el-button>
                  <el-button @click="zoomIn">
                    <el-icon><ZoomIn /></el-icon>
                  </el-button>
                </el-button-group>
                
                <el-button @click="toggleFullscreen">
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="reader-content" ref="readerContent">
              <!-- PDF 阅读器 -->
              <div v-if="currentBook.file_type === 'pdf'" class="pdf-viewer">
                <canvas ref="pdfCanvas"></canvas>
              </div>
              
              <!-- EPUB 阅读器 -->
              <div v-else-if="currentBook.file_type === 'epub'" class="epub-viewer">
                <div v-if="showToc" class="epub-toc">
                  <div v-for="chapter in chapters" :key="chapter.href" 
                       class="toc-item" @click="goToChapter(chapter.href)">
                    {{ chapter.label }}
                  </div>
                </div>
                <div ref="epubViewer" class="epub-content"></div>
              </div>
              
              <!-- 图片阅读器 -->
              <div v-else-if="currentBook.file_type === 'image'" class="image-viewer">
                <img :src="currentBook.file_url" :style="{ transform: scaleStyle }" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传图书" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="家族">
          <el-select v-model="uploadForm.family_id" placeholder="选择家族">
            <el-option v-for="f in families" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="书名">
          <el-input v-model="uploadForm.title" placeholder="请输入书名" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="uploadForm.author" placeholder="作者（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="简介（可选）" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.epub,.jpg,.jpeg,.png"
            :on-change="handleFileChange"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、EPUB、JPG、PNG 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadBook" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue"
import { ElMessage } from "element-plus"
import { Search, Document, Notebook, Picture, ArrowLeft, ArrowRight, Menu, ZoomIn, ZoomOut, FullScreen } from "@element-plus/icons-vue"
import { bookApi, familyApi } from "../api"
import * as pdfjsLib from "pdfjs-dist"

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@" + pdfjsLib.version + "/build/pdf.worker.min.mjs"

const books = ref([])
const families = ref([])
const currentBook = ref(null)
const searchText = ref("")
const showUploadDialog = ref(false)
const showToc = ref(false)
const uploading = ref(false)

const uploadForm = ref({
  family_id: null,
  title: "",
  author: "",
  description: ""
})
const uploadFile = ref(null)
const uploadRef = ref(null)

// PDF相关
const pdfCanvas = ref(null)
const pdfDoc = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)

// EPUB相关
const epubViewer = ref(null)
const epubBook = ref(null)
const epubRendition = ref(null)
const chapters = ref([])

// 图片相关
const zoomLevel = ref(1)
const scaleStyle = computed(() => "scale(" + zoomLevel.value + ")")

const readerContent = ref(null)

const filteredBooks = computed(() => {
  if (!searchText.value) return books.value
  return books.value.filter(b => 
    b.title?.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

function formatDate(date) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("zh-CN")
}

async function loadBooks() {
  try {
    books.value = await bookApi.list()
  } catch (e) {
    console.error("加载图书失败", e)
  }
}

async function loadFamilies() {
  try {
    families.value = await familyApi.list()
  } catch (e) {
    console.error("加载家族失败", e)
  }
}

async function selectBook(book) {
  currentBook.value = book
  currentPage.value = 1
  zoomLevel.value = 1
  
  await nextTick()
  
  if (book.file_type === "pdf") {
    await loadPdf(book.file_url)
  } else if (book.file_type === "epub") {
    await loadEpub(book.file_url)
  }
}

// PDF 阅读器
async function loadPdf(url) {
  try {
    pdfDoc.value = await pdfjsLib.getDocument(url).promise
    totalPages.value = pdfDoc.value.numPages
    await renderPage(1)
  } catch (e) {
    ElMessage.error("加载PDF失败: " + e.message)
  }
}

async function renderPage(pageNum) {
  if (!pdfDoc.value || !pdfCanvas.value) return
  
  const page = await pdfDoc.value.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.5 })
  
  const canvas = pdfCanvas.value
  const context = canvas.getContext("2d")
  canvas.height = viewport.height
  canvas.width = viewport.width
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise
}

async function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage(currentPage.value)
  }
}

async function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await renderPage(currentPage.value)
  }
}

// EPUB 阅读器
async function loadEpub(url) {
  try {
    const ePub = await import("epub.js")
    epubBook.value = ePub.default(url)
    
    await epubBook.value.loaded.navigation
    chapters.value = epubBook.value.navigation.toc
    
    if (epubViewer.value) {
      epubRendition.value = epubBook.value.renderTo(epubViewer.value, {
        width: "100%",
        height: "100%",
        spread: "none"
      })
      await epubRendition.value.display()
    }
  } catch (e) {
    ElMessage.error("加载EPUB失败: " + e.message)
  }
}

function prevChapter() {
  if (epubRendition.value) {
    epubRendition.value.prev()
  }
}

function nextChapter() {
  if (epubRendition.value) {
    epubRendition.value.next()
  }
}

function goToChapter(href) {
  if (epubRendition.value) {
    epubRendition.value.display(href)
    showToc.value = false
  }
}

// 图片阅读器
function zoomIn() {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.1
  }
}

function zoomOut() {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.1
  }
}

// 全屏
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    readerContent.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 上传
function handleFileChange(file) {
  uploadFile.value = file.raw
  if (!uploadForm.value.title) {
    uploadForm.value.title = file.name.replace(/\.[^/.]+$/, "")
  }
}

async function uploadBook() {
  if (!uploadForm.value.family_id) {
    ElMessage.warning("请选择家族")
    return
  }
  if (!uploadForm.value.title) {
    ElMessage.warning("请输入书名")
    return
  }
  if (!uploadFile.value) {
    ElMessage.warning("请选择文件")
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append("family_id", uploadForm.value.family_id)
    formData.append("title", uploadForm.value.title)
    formData.append("author", uploadForm.value.author || "")
    formData.append("description", uploadForm.value.description || "")
    formData.append("file", uploadFile.value)
    
    await bookApi.upload(formData)
    ElMessage.success("上传成功")
    showUploadDialog.value = false
    await loadBooks()
    
    uploadForm.value = { family_id: null, title: "", author: "", description: "" }
    uploadFile.value = null
    uploadRef.value?.clearFiles()
  } catch (e) {
    ElMessage.error("上传失败: " + e.message)
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadBooks()
  loadFamilies()
})
</script>

<style scoped>
.books-page {
  height: calc(100vh - 100px);
}

.book-list-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.book-list {
  overflow-y: auto;
  max-height: calc(100vh - 280px);
}

.book-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.book-item:hover {
  background: #f5f7fa;
}

.book-item.active {
  background: #ecf5ff;
}

.book-info {
  flex: 1;
  overflow: hidden;
}

.book-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.reader-card {
  height: 100%;
}

.empty-reader {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 500px;
}

.reader-container {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.reader-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-left .book-title {
  font-weight: 600;
  font-size: 16px;
}

.reader-content {
  flex: 1;
  overflow: auto;
  background: #fafafa;
  border-radius: 8px;
}

.pdf-viewer {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.pdf-viewer canvas {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.epub-viewer {
  height: 100%;
  display: flex;
}

.epub-toc {
  width: 250px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
  padding: 10px;
}

.toc-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
}

.toc-item:hover {
  background: #f5f7fa;
}

.epub-content {
  flex: 1;
  height: 100%;
}

.image-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: auto;
}

.image-viewer img {
  max-width: 100%;
  transition: transform 0.3s;
}
</style>