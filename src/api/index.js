import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    ElMessage.error(error.response?.data?.detail || '请求失败')
    return Promise.reject(error)
  }
)

export const familyApi = {
  list: () => api.get('/families'),
  get: (id) => api.get(`/families/${id}`),
  create: (data) => api.post('/families', data),
  update: (id, data) => api.put(`/families/${id}`, data),
  invite: (id) => api.post(`/families/${id}/invite`),
  join: (code) => api.post(`/families/join/${code}`)
}

export const memberApi = {
  list: (familyId) => api.get(`/members/family/${familyId}`),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  relations: (id) => api.get(`/members/${id}/relations`),
  addRelation: (data) => api.post('/members/relations', data)
}

export const treeApi = {
  get: (familyId, rootId) => api.get(`/canvas/${familyId}`, { params: { root_member_id: rootId } }),
  getNode: (familyId, memberId) => api.get(`/canvas/${familyId}/node/${memberId}`),
  export: (familyId, format) => api.get(`/canvas/${familyId}/export`, { params: { format } })
}

export const bookApi = {
  list: (familyId) => api.get('/books', { params: { family_id: familyId } }),
  get: (id) => api.get(`/books/${id}`),
  upload: (formData) => api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  pages: (id) => api.get(`/books/${id}/pages`),
  read: (id, page) => api.get(`/books/${id}/read/${page}`),
  delete: (id) => api.delete(`/books/${id}`)
}

export const historyApi = {
  list: (familyId) => api.get(`/history/family/${familyId}`),
  create: (familyId, data) => api.post(`/history/family/${familyId}`, data),
  get: (id) => api.get(`/history/${id}`),
  restore: (id) => api.post(`/history/${id}/restore`),
  delete: (id) => api.delete(`/history/${id}`)
}

export default api
