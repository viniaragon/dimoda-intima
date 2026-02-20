import { useState, useEffect } from 'react'
import { Users, Shield, User, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users')
            setUsers(response.data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Erro ao carregar usuários')
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId)
        try {
            await api.put(`/api/users/${userId}/role`, { role: newRole })
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            toast.success(`Usuário atualizado para ${newRole === 'admin' ? 'Administrador' : 'Cliente'}`)
        } catch (error) {
            console.error('Error updating role:', error)
            toast.error('Erro ao atualizar usuário')
        } finally {
            setUpdating(null)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '-'
        try {
            const date = timestamp._seconds
                ? new Date(timestamp._seconds * 1000)
                : timestamp.toDate
                    ? timestamp.toDate()
                    : new Date(timestamp)
            return date.toLocaleDateString('pt-BR')
        } catch {
            return '-'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    Usuários
                </h1>
                <span className="text-sm text-stone-500">
                    {users.length} usuário(s) cadastrado(s)
                </span>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                    <thead className="bg-stone-50 dark:bg-stone-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Cadastro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-stone-800 divide-y divide-stone-200 dark:divide-stone-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin'
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                                            }`}>
                                            {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-stone-800 dark:text-white">
                                                {user.name || 'Sem nome'}
                                            </div>
                                            <div className="text-sm text-stone-500">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                                        }`}>
                                        {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                    {formatDate(user.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {updating === user.id ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    ) : (
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="text-sm border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-700 text-stone-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                        >
                                            <option value="client">Cliente</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                        <p className="text-stone-500">Nenhum usuário cadastrado</p>
                    </div>
                )}
            </div>
        </div>
    )
}
