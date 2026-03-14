import axios from 'axios'

// Em produção, usa relative path (mesma origem do Caddy)
// Em desenvolvimento, usa localhost:3000
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
