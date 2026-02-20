import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('dimoda_token')
        const savedUser = localStorage.getItem('dimoda_user')

        if (token && savedUser) {
            setUser(JSON.parse(savedUser))
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password })
            const { token, user } = response.data

            localStorage.setItem('dimoda_token', token)
            localStorage.setItem('dimoda_user', JSON.stringify(user))
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            setUser(user)
            return { success: true, user }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao fazer login'
            }
        }
    }

    const register = async (name, email, password) => {
        try {
            const response = await api.post('/api/auth/register', { name, email, password })
            const { token, user } = response.data

            localStorage.setItem('dimoda_token', token)
            localStorage.setItem('dimoda_user', JSON.stringify(user))
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            setUser(user)
            return { success: true, user }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao criar conta'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('dimoda_token')
        localStorage.removeItem('dimoda_user')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

