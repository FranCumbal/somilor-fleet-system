import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
})

// Adjuntar token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('somilor_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirigir a login si expira la sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('somilor_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Helpers por módulo ──────────────────────

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/token', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
}

export const vehiculosAPI = {
  list: (params) => api.get('/vehiculos', { params }),
  get: (id) => api.get(`/vehiculos/${id}`),
  create: (data) => api.post('/vehiculos', data),
  update: (id, data) => api.patch(`/vehiculos/${id}`, data),
  delete: (id) => api.delete(`/vehiculos/${id}`),
}

export const choferesAPI = {
  list: () => api.get('/choferes'),
  get: (id) => api.get(`/choferes/${id}`),
  create: (data) => api.post('/choferes', data),
  update: (id, data) => api.put(`/choferes/${id}`, data),
  delete: (id) => api.delete(`/choferes/${id}`),
}

export const combustibleAPI = {
  list: (params) => api.get('/combustible', { params }),
  create: (data) => api.post('/combustible', data),
  update: (id, data) => api.patch(`/combustible/${id}`, data),
  delete: (id) => api.delete(`/combustible/${id}`),
  resumenHoy: () => api.get('/combustible/resumen/hoy'),
  resumenPorVehiculo: () => api.get('/combustible/resumen/por-vehiculo'),
}

export const mantenimientoAPI = {
  list: (params) => api.get('/mantenimiento', { params }),
  alertas: () => api.get('/mantenimiento/alertas'),
  create: (data) => api.post('/mantenimiento', data),
  update: (id, data) => api.patch(`/mantenimiento/${id}`, data),
  delete: (id) => api.delete(`/mantenimiento/${id}`),
}

export const checklistAPI = {
  list: (params) => api.get('/checklist', { params }),
  create: (data) => api.post('/checklist', data),
  update: (id, data) => api.patch(`/checklist/${id}`, data),
  delete: (id) => api.delete(`/checklist/${id}`),
  resumenHoy: () => api.get('/checklist/hoy/resumen'),
}

export const dashboardAPI = {
  kpis: () => api.get('/dashboard/kpis'),
}
