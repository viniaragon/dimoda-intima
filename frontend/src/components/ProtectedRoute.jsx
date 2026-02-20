import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-stone-600 dark:text-stone-400">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return <Navigate to="/admin/login" replace />
    }

    return children
}
