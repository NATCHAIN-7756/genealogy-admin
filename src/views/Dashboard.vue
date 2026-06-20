<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon size="40" color="#409EFF"><UserFilled /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.families }}</div>
              <div class="stat-label">家族总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon size="40" color="#67C23A"><Avatar /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.members }}</div>
              <div class="stat-label">成员总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon size="40" color="#E6A23C"><Notebook /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.books }}</div>
              <div class="stat-label">图书数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon size="40" color="#F56C6C"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.snapshots }}</div>
              <div class="stat-label">历史快照</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" style="margin-top: 20px;">
      <template #header>
        <span>欢迎使用家谱管理系统</span>
      </template>
      <el-empty description="选择左侧菜单开始管理" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref({
  families: 0,
  members: 0,
  books: 0,
  snapshots: 0
})

onMounted(() => {
  // TODO: 从API获取统计数据
  stats.value = { families: 5, members: 128, books: 12, snapshots: 23 }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  color: #999;
  margin-top: 4px;
}
</style>
