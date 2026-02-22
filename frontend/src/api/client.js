import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Goals
export const goalsAPI = {
    list: (params) => api.get('/goals/', { params }),
    get: (id) => api.get(`/goals/${id}`),
    create: (data) => api.post('/goals/', data),
    update: (id, data) => api.put(`/goals/${id}`, data),
    delete: (id) => api.delete(`/goals/${id}`),
};

// Tasks
export const tasksAPI = {
    list: (params) => api.get('/tasks/', { params }),
    get: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks/', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    complete: (id, actualMinutes) => api.post(`/tasks/${id}/complete`, null, { params: { actual_minutes: actualMinutes } }),
    today: () => api.get('/tasks/today'),
    overdue: () => api.get('/tasks/overdue'),
    calendar: (year, month) => api.get(`/tasks/calendar/${year}/${month}`),
};

// Notes
export const notesAPI = {
    list: (params) => api.get('/notes/', { params }),
    get: (id) => api.get(`/notes/${id}`),
    create: (data) => api.post('/notes/', data),
    update: (id, data) => api.put(`/notes/${id}`, data),
    delete: (id) => api.delete(`/notes/${id}`),
};

// Analytics
export const analyticsAPI = {
    dashboard: () => api.get('/analytics/dashboard'),
    dailyLogs: (params) => api.get('/analytics/daily-logs', { params }),
    createDailyLog: (data) => api.post('/analytics/daily-logs', data),
    weeklyReports: (limit) => api.get('/analytics/weekly-reports', { params: { limit } }),
    weeklyReport: (id) => api.get(`/analytics/weekly-reports/${id}`),
};

// AI
export const aiAPI = {
    analyze: (prompt) => api.post('/ai/analyze', { prompt }),
    prioritize: (prompt) => api.post('/ai/prioritize', { prompt }),
    report: (prompt) => api.post('/ai/report', { prompt }),
    research: (prompt) => api.post('/ai/research', { prompt }),
    noteAssist: (prompt, context) => api.post('/ai/note-assist', { prompt, context }),
    chat: (prompt) => api.post('/ai/chat', { prompt }),
    contentSuggest: (prompt) => api.post('/ai/content-suggest', { prompt }),
};

// Task Categories
export const categoriesAPI = {
    list: () => api.get('/categories/'),
    get: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories/', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    listItems: (catId) => api.get(`/categories/${catId}/items`),
    createItem: (data) => api.post('/categories/items', data),
    updateItem: (id, data) => api.put(`/categories/items/${id}`, data),
    deleteItem: (id) => api.delete(`/categories/items/${id}`),
};

// Content Posts
export const contentAPI = {
    list: (params) => api.get('/categories/content/posts', { params }),
    create: (data) => api.post('/categories/content/posts', data),
    update: (id, data) => api.put(`/categories/content/posts/${id}`, data),
    delete: (id) => api.delete(`/categories/content/posts/${id}`),
};

export default api;

