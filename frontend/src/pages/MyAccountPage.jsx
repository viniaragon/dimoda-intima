import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, User, LogOut, Loader2, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import SEO from '../components/SEO'

export default function MyAccountPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('orders')

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        fetchOrders()
    }, [user, navigate])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/auth/me/orders')
            setOrders(response.data)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '-'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleDateString('pt-BR')
    }

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-100', icon: Clock },
            confirmed: { label: 'Confirmado', color: 'text-blue-600 bg-blue-100', icon: CheckCircle },
            shipped: { label: 'Enviado', color: 'text-purple-600 bg-purple-100', icon: Truck },
            delivered: { label: 'Entregue', color: 'text-green-600 bg-green-100', icon: CheckCircle },
            cancelled: { label: 'Cancelado', color: 'text-red-600 bg-red-100', icon: XCircle }
        }
        return statusMap[status] || statusMap.pending
    }

    if (!user) return null

    return (
        <div className="py-8 px-6 md:px-12 max-w-6xl mx-auto">
            <SEO
                title="Minha Conta"
                description="Gerencie seus pedidos e dados pessoais na Di' Moda Íntima."
                canonical="/minha-conta"
                noIndex={true}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-4xl text-stone-800 dark:text-white">
                        Minha Conta
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400 mt-1">
                        Olá, {user.name || user.email}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-red-600 transition"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-stone-200 dark:border-stone-700">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-2 font-medium transition ${activeTab === 'orders'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <Package className="w-5 h-5 inline-block mr-2" />
                    Meus Pedidos
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-4 px-2 font-medium transition ${activeTab === 'profile'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <User className="w-5 h-5 inline-block mr-2" />
                    Meus Dados
                </button>
            </div>

            {/* Content */}
            {activeTab === 'orders' && (
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-stone-700 dark:text-stone-300 mb-2">
                                Nenhum pedido ainda
                            </h2>
                            <p className="text-stone-500 dark:text-stone-400 mb-6">
                                Você ainda não fez nenhum pedido.
                            </p>
                            <Link to="/" className="btn-primary">
                                Ver Produtos
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => {
                                const statusInfo = getStatusInfo(order.status)
                                const StatusIcon = statusInfo.icon
                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <span className="font-mono text-sm text-stone-500">
                                                    Pedido #{order.id.slice(-8)}
                                                </span>
                                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="border-t border-stone-100 dark:border-stone-700 pt-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-stone-600 dark:text-stone-400">
                                                        {order.items?.length || 0} item(s)
                                                    </p>
                                                </div>
                                                <p className="font-bold text-lg text-stone-800 dark:text-white">
                                                    {formatPrice(order.total)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm max-w-lg">
                    <h2 className="font-display text-xl text-stone-800 dark:text-white mb-6">
                        Dados da Conta
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">
                                Nome
                            </label>
                            <p className="text-stone-800 dark:text-white font-medium">
                                {user.name || '-'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">
                                Email
                            </label>
                            <p className="text-stone-800 dark:text-white font-medium">
                                {user.email}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">
                                Tipo de Conta
                            </label>
                            <p className="text-stone-800 dark:text-white font-medium capitalize">
                                {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
