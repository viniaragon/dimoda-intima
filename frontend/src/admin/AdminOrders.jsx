import { useState, useEffect } from 'react'
import { Eye, Search, Trash2, Archive, Phone, X as XIcon, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'shipped', label: 'Enviado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'delivered', label: 'Entregue', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
]

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [archivedOrders, setArchivedOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showArchived, setShowArchived] = useState(false)
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', orderId: null })

    useEffect(() => {
        loadOrders()
    }, [])

    useEffect(() => {
        if (showArchived) {
            loadArchivedOrders()
        }
    }, [showArchived])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/orders')
            setOrders(response.data)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders(sampleOrders)
        } finally {
            setLoading(false)
        }
    }

    const loadArchivedOrders = async () => {
        try {
            const response = await api.get('/api/orders/archived')
            setArchivedOrders(response.data)
        } catch (error) {
            console.error('Error loading archived orders:', error)
            setArchivedOrders([])
        }
    }

    const displayedOrders = showArchived ? archivedOrders : orders

    const filteredOrders = displayedOrders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm)
        return matchesStatus && matchesSearch
    })

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

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/api/orders/${orderId}/status`, { status: newStatus })
            toast.success('Status atualizado!')
            loadOrders()
        } catch (error) {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
            toast.success('Status atualizado!')
        }
        setSelectedOrder(null)
    }

    const handleDelete = async (orderId) => {
        try {
            await api.delete(`/api/orders/${orderId}`)
            toast.success('Pedido deletado com sucesso!')
            loadOrders()
        } catch (error) {
            console.error('Error deleting order:', error)
            toast.error('Erro ao deletar pedido')
        }
        setConfirmModal({ show: false, type: '', orderId: null })
        setSelectedOrder(null)
    }

    const handleArchive = async (orderId) => {
        try {
            await api.post(`/api/orders/${orderId}/archive`)
            toast.success('Pedido arquivado com sucesso!')
            loadOrders()
        } catch (error) {
            console.error('Error archiving order:', error)
            toast.error('Erro ao arquivar pedido')
        }
        setConfirmModal({ show: false, type: '', orderId: null })
        setSelectedOrder(null)
    }

    const getStatusOption = (status) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0]
    }

    const showConfirm = (type, orderId) => {
        setConfirmModal({ show: true, type, orderId })
    }

    return (
        <div>
            <h1 className="font-display text-3xl text-stone-800 dark:text-white mb-8">
                {showArchived ? 'Pedidos Arquivados' : 'Pedidos'}
            </h1>

            {/* Filters */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou nº do pedido..."
                            className="input-field pl-10"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-field w-auto"
                    >
                        <option value="all">Todos os status</option>
                        {statusOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${showArchived
                                ? 'bg-primary text-white'
                                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                            }`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
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
                                        Pagamento
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
                                    <th className="text-right p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr
                                        key={order.id}
                                        className="border-t border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                    >
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-primary">
                                                #{order.id?.slice(-8) || order.id}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-stone-800 dark:text-white">
                                                    {order.customer_name}
                                                </p>
                                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                                    {order.customer_phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-stone-600 dark:text-stone-400 capitalize">
                                            {order.payment_method === 'pix' ? 'PIX' :
                                                order.payment_method === 'cash' ? 'Dinheiro' :
                                                    order.payment_method === 'card' ? 'Cartão' :
                                                        order.payment_method}
                                        </td>
                                        <td className="p-4 font-medium text-primary">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusOption(order.status).color}`}>
                                                {getStatusOption(order.status).label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-stone-500 dark:text-stone-400">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-stone-600 dark:text-stone-400 hover:text-primary hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                                    title="Ver detalhes"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {!showArchived && (
                                                    <>
                                                        <button
                                                            onClick={() => showConfirm('archive', order.id)}
                                                            className="p-2 text-stone-600 dark:text-stone-400 hover:text-blue-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                                            title="Arquivar pedido"
                                                        >
                                                            <Archive className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => showConfirm('delete', order.id)}
                                                            className="p-2 text-stone-600 dark:text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                                            title="Deletar pedido"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredOrders.length === 0 && (
                    <div className="p-12 text-center text-stone-500 dark:text-stone-400">
                        {showArchived ? 'Nenhum pedido arquivado encontrado.' : 'Nenhum pedido encontrado.'}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-700">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white">
                                Pedido #{selectedOrder.id?.slice(-8) || selectedOrder.id}
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-4">
                                <h3 className="font-bold text-stone-800 dark:text-white mb-3">
                                    Dados do Cliente
                                </h3>
                                <div className="space-y-2 text-stone-600 dark:text-stone-400">
                                    <p><strong>Nome:</strong> {selectedOrder.customer_name}</p>
                                    <p><strong>Telefone:</strong> {selectedOrder.customer_phone}</p>
                                    {selectedOrder.customer_email && (
                                        <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                    )}
                                    <p><strong>Endereço:</strong> {selectedOrder.address}</p>
                                </div>
                                <a
                                    href={`https://wa.me/55${selectedOrder.customer_phone?.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-3 text-sm text-green-600 hover:text-green-700"
                                >
                                    <Phone className="w-4 h-4" />
                                    Contatar via WhatsApp
                                </a>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-bold text-stone-800 dark:text-white mb-3">
                                    Itens do Pedido
                                </h3>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-700 last:border-0"
                                        >
                                            <span className="text-stone-600 dark:text-stone-400">
                                                {item.quantity}x {item.name || `Produto #${item.product_id}`}
                                            </span>
                                            <span className="font-medium text-stone-800 dark:text-white">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    )) || (
                                            <p className="text-stone-500 dark:text-stone-400">
                                                Detalhes dos itens não disponíveis.
                                            </p>
                                        )}
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                    <span className="font-bold text-stone-800 dark:text-white">Total</span>
                                    <span className="font-bold text-primary text-xl">
                                        {formatPrice(selectedOrder.total)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-4">
                                <h3 className="font-bold text-stone-800 dark:text-white mb-2">
                                    Pagamento
                                </h3>
                                <p className="text-stone-600 dark:text-stone-400 capitalize">
                                    {selectedOrder.payment_method === 'pix' ? 'PIX' :
                                        selectedOrder.payment_method === 'cash' ? 'Dinheiro' :
                                            selectedOrder.payment_method === 'card' ? 'Cartão' :
                                                selectedOrder.payment_method}
                                </p>
                            </div>

                            {/* Status Update - only for active orders */}
                            {!showArchived && (
                                <div>
                                    <h3 className="font-bold text-stone-800 dark:text-white mb-3">
                                        Atualizar Status
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map(status => (
                                            <button
                                                key={status.value}
                                                onClick={() => updateStatus(selectedOrder.id, status.value)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedOrder.status === status.value
                                                    ? status.color + ' ring-2 ring-offset-2 ring-stone-400'
                                                    : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                                                    }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions - only for active orders */}
                            {!showArchived && (
                                <div className="flex gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
                                    <button
                                        onClick={() => showConfirm('archive', selectedOrder.id)}
                                        className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <Archive className="w-4 h-4" />
                                        Arquivar Pedido
                                    </button>
                                    <button
                                        onClick={() => showConfirm('delete', selectedOrder.id)}
                                        className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Deletar Pedido
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-full ${confirmModal.type === 'delete' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                <AlertTriangle className={`w-6 h-6 ${confirmModal.type === 'delete' ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-stone-800 dark:text-white">
                                    {confirmModal.type === 'delete' ? 'Deletar Pedido' : 'Arquivar Pedido'}
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    {confirmModal.type === 'delete'
                                        ? 'Esta ação é permanente e não pode ser desfeita.'
                                        : 'O pedido será movido para os arquivados.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, type: '', orderId: null })}
                                className="flex-1 py-2 px-4 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmModal.type === 'delete'
                                    ? handleDelete(confirmModal.orderId)
                                    : handleArchive(confirmModal.orderId)
                                }
                                className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition ${confirmModal.type === 'delete'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Sample orders for development
const sampleOrders = [
    {
        id: '1001',
        customer_name: 'Maria Silva',
        customer_phone: '(75) 98888-1234',
        customer_email: 'maria@email.com',
        address: 'Rua das Flores, 123, Centro - Salvador/BA',
        payment_method: 'pix',
        status: 'pending',
        total: 299.80,
        created_at: new Date().toISOString(),
        items: [
            { product_id: 1, name: 'Vibrador Ponto G Luxo', quantity: 1, price: 199.90 },
            { product_id: 3, name: 'Gel Beijável Morango', quantity: 2, price: 49.95 }
        ]
    },
    {
        id: '1002',
        customer_name: 'João Santos',
        customer_phone: '(75) 99999-5678',
        address: 'Av. Brasil, 456 - Feira de Santana/BA',
        payment_method: 'cash',
        status: 'confirmed',
        total: 159.90,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        items: [
            { product_id: 2, name: 'Fantasia Enfermeira', quantity: 1, price: 159.90 }
        ]
    },
    {
        id: '1003',
        customer_name: 'Ana Oliveira',
        customer_phone: '(75) 97777-4321',
        address: 'Rua do Comércio, 789 - Alagoinhas/BA',
        payment_method: 'pix',
        status: 'shipped',
        total: 449.70,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        items: [
            { product_id: 1, name: 'Vibrador Ponto G Luxo', quantity: 2, price: 399.80 },
            { product_id: 3, name: 'Gel Beijável', quantity: 1, price: 49.90 }
        ]
    },
]

