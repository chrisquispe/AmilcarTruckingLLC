import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

// --- Reports ---
export const getReports = () => api.get('/reports')
export const getReport = (id) => api.get(`/reports/${id}`)
export const deleteReport = (id) => api.delete(`/reports/${id}`)

// --- Upload ---
export const uploadPdf = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// --- Tickets ---
export const getTickets = (reportId) => api.get(`/reports/${reportId}/tickets`)
export const updateTicket = (ticketId, data) => api.put(`/tickets/${ticketId}`, data)
export const deleteTicket = (ticketId) => api.delete(`/tickets/${ticketId}`)
export const createTicket = (reportId, truckId, data) =>
  api.post(`/reports/${reportId}/trucks/${truckId}/tickets`, data)

// --- Totals ---
export const getTotals = (reportId) => api.get(`/reports/${reportId}/totals`)
export const updateTotal = (reportId, truckId, data) =>
  api.put(`/reports/${reportId}/totals/${truckId}`, data)
export const calculateTotals = (reportId) => api.post(`/reports/${reportId}/calculate`)

// --- Driver assignment ---
export const assignDriver = (reportId, truckId, driverId) =>
  api.put(`/reports/${reportId}/trucks/${truckId}/driver`, { driverId })

// --- Generate & Download (per truck) ---
export const generateForTruck = (reportId, truckId, reportDate) =>
  api.post(`/reports/${reportId}/trucks/${truckId}/generate`, { reportDate })
export const downloadForTruck = (reportId, truckId) =>
  api.get(`/reports/${reportId}/trucks/${truckId}/download`, { responseType: 'blob' })

// --- Drivers ---
export const getDrivers = () => api.get('/drivers')
export const createDriver = (data) => api.post('/drivers', data)
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data)
export const deleteDriver = (id) => api.delete(`/drivers/${id}`)

// --- Trucks ---
export const getTrucks = () => api.get('/trucks')
export const getTruckReports = (id) => api.get(`/trucks/${id}/reports`)

// --- Dashboard ---
export const getDashboard = () => api.get('/dashboard')
