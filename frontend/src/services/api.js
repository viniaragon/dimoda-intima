import axios from 'axios'

// Use environment variable in production, empty for local development (proxy handles it)
const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor for debugging
api.interceptors.request.use(
    config => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    error => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('dimoda_token')
            localStorage.removeItem('dimoda_user')
            window.location.href = '/admin/login'
        }
        return Promise.reject(error)
    }
)

export default api
