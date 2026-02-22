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
    coach: (prompt) => api.post('/ai/coach', { prompt }),
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

// Habits
export const habitsAPI = {
    list: () => api.get('/habits/'),
    create: (data) => api.post('/habits/', data),
    update: (id, data) => api.put(`/habits/${id}`, data),
    delete: (id) => api.delete(`/habits/${id}`),
    checkIn: (data) => api.post('/habits/check-in', data),
    heatmap: (id, days) => api.get(`/habits/${id}/heatmap`, { params: { days } }),
    today: () => api.get('/habits/today'),
};

// Standups
export const standupsAPI = {
    list: (limit) => api.get('/standups/', { params: { limit } }),
    today: () => api.get('/standups/today'),
    get: (d) => api.get(`/standups/${d}`),
    create: (data) => api.post('/standups/', data),
    update: (d, data) => api.put(`/standups/${d}`, data),
    weekly: () => api.get('/standups/weekly-summary'),
};

// Income
export const incomeAPI = {
    entries: (params) => api.get('/income/entries', { params }),
    createEntry: (data) => api.post('/income/entries', data),
    updateEntry: (id, data) => api.put(`/income/entries/${id}`, data),
    deleteEntry: (id) => api.delete(`/income/entries/${id}`),
    goals: () => api.get('/income/goals'),
    createGoal: (data) => api.post('/income/goals', data),
    deleteGoal: (id) => api.delete(`/income/goals/${id}`),
    summary: () => api.get('/income/summary'),
};

// Time Blocks
export const timeBlocksAPI = {
    list: (d) => api.get('/time-blocks/', { params: { block_date: d } }),
    create: (data) => api.post('/time-blocks/', data),
    update: (id, data) => api.put(`/time-blocks/${id}`, data),
    delete: (id) => api.delete(`/time-blocks/${id}`),
    complete: (id) => api.post(`/time-blocks/${id}/complete`),
};

export default api;

