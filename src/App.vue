<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <div class="logo">
        <el-icon size="24"><House /></el-icon>
        <span>家谱管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-menu-item index="/families">
          <el-icon><UserFilled /></el-icon>
          <span>家族管理</span>
        </el-menu-item>
        <el-menu-item index="/members">
          <el-icon><Avatar /></el-icon>
          <span>成员管理</span>
        </el-menu-item>
        <el-menu-item index="/tree">
          <el-icon><Share /></el-icon>
          <span>家族树图</span>
        </el-menu-item>
        <el-menu-item index="/books">
          <el-icon><Notebook /></el-icon>
          <span>图书管理</span>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <span>历史版本</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header>
        <div class="header-title">{{ currentTitle }}</div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path.split('/').slice(0, 2).join('/') || '/dashboard')
const currentTitle = computed(() => route.meta?.title || '控制台')
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #545c64;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.el-main {
  background-color: #f5f5f5;
  padding: 20px;
}
</style>
