import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, DollarSign, TrendingUp, ArrowRight, Calendar, Archive, RotateCcw, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadError from '../components/LoadError'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [dateRange, setDateRange] = useState('all')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [showArchiveModal, setShowArchiveModal] = useState(false)
    const [archiving, setArchiving] = useState(false)

    useEffect(() => {
        loadDashboardData()
    }, [dateRange, customStartDate, customEndDate])

    const getDateRange = () => {
        const today = new Date()
        let startDate = null
        let endDate = null

        switch (dateRange) {
            case 'today':
                startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0]
                endDate = startDate
                break
            case '7days':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                endDate = new Date().toISOString().split('T')[0]
                break
            case '30days':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                endDate = new Date().toISOString().split('T')[0]
                break
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
                endDate = new Date().toISOString().split('T')[0]
                break
            case 'lastMonth':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                startDate = lastMonth.toISOString().split('T')[0]
                endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                break
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
                endDate = new Date().toISOString().split('T')[0]
                break
            case 'custom':
                startDate = customStartDate || null
                endDate = customEndDate || null
                break
            default:
                return { startDate: null, endDate: null }
        }

        return { startDate, endDate }
    }

    const loadDashboardData = async () => {
        setLoading(true)
        setLoadError(false)
        try {
            const { startDate, endDate } = getDateRange()
            let statsUrl = '/api/stats'
            if (startDate || endDate) {
                const params = new URLSearchParams()
                if (startDate) params.append('startDate', startDate)
                if (endDate) params.append('endDate', endDate)
                statsUrl += `?${params.toString()}`
            }

            const [statsRes, ordersRes] = await Promise.all([
                api.get(statsUrl),
                api.get('/api/orders?limit=5')
            ])
            setStats(statsRes.data)
            setRecentOrders(ordersRes.data)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            setStats({
                totalProducts: 0,
                totalOrders: 0,
                pendingOrders: 0,
                totalRevenue: 0
            })
            setRecentOrders([])
            setLoadError(true)
        } finally {
            setLoading(false)
        }
    }

    const handleArchiveAll = async () => {
        setArchiving(true)
        try {
            const response = await api.post('/api/orders/archive-all')
            toast.success(`${response.data.archivedCount} pedidos arquivados com sucesso!`)
            loadDashboardData()
        } catch (error) {
            console.error('Error archiving orders:', error)
            toast.error('Erro ao arquivar pedidos')
        } finally {
            setArchiving(false)
            setShowArchiveModal(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date'
        const date = dateString.toDate ? dateString.toDate() : new Date(dateString)
        if (isNaN(date.getTime())) return 'Invalid Date'
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const statusLabels = {
        pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
        confirmed: { text: 'Confirmado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
        shipped: { text: 'Enviado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
        delivered: { text: 'Entregue', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
        cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    }

    const dateRangeOptions = [
        { value: 'all', label: 'Todo período' },
        { value: 'today', label: 'Hoje' },
        { value: '7days', label: 'Últimos 7 dias' },
        { value: '30days', label: 'Últimos 30 dias' },
        { value: 'thisMonth', label: 'Este mês' },
        { value: 'lastMonth', label: 'Mês passado' },
        { value: 'thisYear', label: 'Este ano' },
        { value: 'custom', label: 'Personalizado' },
    ]

    const statCards = [
        { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'bg-blue-500' },
        { label: 'Pedidos Totais', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
        { label: 'Pedidos Pendentes', value: stats.pendingOrders, icon: TrendingUp, color: 'bg-yellow-500' },
        { label: 'Receita Total', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-primary' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (loadError) {
        return <LoadError onRetry={loadDashboardData} className="min-h-64" />
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <h1 className="font-display text-3xl text-stone-800 dark:text-white">
                    Dashboard
                </h1>

                {/* Date Range Selector */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-stone-500" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="input-field py-2 w-auto"
                        >
                            {dateRangeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="input-field py-2 w-auto"
                            />
                            <span className="text-stone-500">até</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="input-field py-2 w-auto"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => setShowArchiveModal(true)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        <RotateCcw className="w-4 h-4" />
                        Arquivar e Reiniciar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={index}
                            className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500 dark:text-stone-400">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold text-stone-800 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm">
                <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-700">
                    <h2 className="font-bold text-xl text-stone-800 dark:text-white">
                        Pedidos Recentes
                    </h2>
                    <Link
                        to="/admin/pedidos"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        Ver todos
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50 dark:bg-stone-900">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                    Pedido
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                    Cliente
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                    Total
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                    Status
                                </th>
                                <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(order => (
                                <tr
                                    key={order.id}
                                    className="border-t border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                >
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-primary">
                                            #{typeof order.id === 'string' ? order.id.slice(-8) : order.id}
                                        </span>
                                    </td>
                                    <td className="p-4 text-stone-800 dark:text-white">
                                        {order.customer_name}
                                    </td>
                                    <td className="p-4 font-medium text-stone-800 dark:text-white">
                                        {formatPrice(order.total)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[order.status]?.color || 'bg-stone-100 text-stone-800'}`}>
                                            {statusLabels[order.status]?.text || order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-stone-500 dark:text-stone-400">
                                        {formatDate(order.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {recentOrders.length === 0 && (
                    <div className="p-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhum pedido encontrado.
                    </div>
                )}
            </div>

            {/* Archive Confirmation Modal */}
            {showArchiveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-stone-800 dark:text-white">
                                    Arquivar Todos os Pedidos
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    Todos os pedidos ativos serão arquivados e o Dashboard será reiniciado.
                                </p>
                            </div>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-4 mb-4">
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                                <strong>O que acontece:</strong>
                            </p>
                            <ul className="text-sm text-stone-500 dark:text-stone-400 mt-2 space-y-1">
                                <li>• Um snapshot de todos os pedidos será criado</li>
                                <li>• Os pedidos ativos serão removidos da lista principal</li>
                                <li>• Você poderá acessar o histórico em "Pedidos Arquivados"</li>
                            </ul>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowArchiveModal(false)}
                                disabled={archiving}
                                className="flex-1 py-2 px-4 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleArchiveAll}
                                disabled={archiving}
                                className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {archiving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Arquivando...
                                    </>
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

