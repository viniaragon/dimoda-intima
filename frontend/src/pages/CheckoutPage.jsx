import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, QrCode, Banknote, ChevronLeft, Check } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import { getProductImage, handleImageError } from '../utils/images'

const paymentMethods = [
    { id: 'pix', name: 'PIX', icon: QrCode, description: 'Pagamento instantâneo' },
    { id: 'cash', name: 'Dinheiro', icon: Banknote, description: 'Pague na entrega' },
    { id: 'card', name: 'Cartão de Crédito', icon: CreditCard, description: 'Pague com cartão' },
]

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { items, total, clearCart } = useCart()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: ''
    })

    const [paymentMethod, setPaymentMethod] = useState('pix')

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setCustomerData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            const orderData = {
                customer_name: customerData.name,
                customer_email: customerData.email || '',
                customer_phone: customerData.phone,
                address: customerData.address,
                payment_method: paymentMethod,
                notes: customerData.notes,
                items: items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                }))
            }

            // Criar pedido
            const orderResponse = await api.post('/api/orders', orderData)
            const canonicalOrder = orderResponse.data
            const orderId = canonicalOrder.id

            // PIX Manual - Navega para tela de confirmação com dados do PIX
            if (paymentMethod === 'pix') {
                try {
                    const pixResponse = await api.post('/api/pix/create', {
                        orderId
                    })

                    clearCart()
                    toast.success('Pedido realizado! Faça o PIX para concluir.')

                    // Navegar para confirmação com dados do PIX
                    navigate(`/pedido/${orderId}`, {
                        state: {
                            pixData: pixResponse.data,
                            orderData: canonicalOrder
                        }
                    })
                    return
                } catch (pixError) {
                    console.error('Erro ao gerar PIX:', pixError)
                    toast.error('Pedido criado, mas não foi possível carregar os dados do PIX.')
                    clearCart()
                    navigate(`/pedido/${orderId}`, {
                        state: { orderData: canonicalOrder, paymentSetupError: true }
                    })
                    return
                }
            }

            // Cartão - Redireciona para Stripe Checkout
            if (paymentMethod === 'card') {
                try {
                    const cardResponse = await api.post('/api/pix/card/create', {
                        orderId
                    })

                    clearCart()

                    if (cardResponse.data.checkout_url) {
                        window.location.href = cardResponse.data.checkout_url
                        return
                    }
                } catch (cardError) {
                    console.error('Erro ao criar sessão de cartão:', cardError)
                    toast.error('Erro ao processar pagamento. Tente novamente.')
                    setLoading(false)
                    return
                }
            }

            // Para outros métodos de pagamento (dinheiro, etc)
            clearCart()
            toast.success('Pedido realizado com sucesso!')
            navigate(`/pedido/${orderId}`, {
                state: { orderData: canonicalOrder }
            })
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Erro ao processar pedido. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }


    const isStep1Valid = customerData.name && customerData.phone && customerData.address

    if (items.length === 0) {
        navigate('/carrinho')
        return null
    }

    return (
        <div className="py-8 px-6 md:px-12 max-w-4xl mx-auto">
            <SEO
                title="Finalizar Pedido"
                description="Complete sua compra na Di' Moda Íntima com segurança."
                canonical="/checkout"
                noIndex={true}
            />

            <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-8">
                Finalizar Compra
            </h1>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-12">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s
                            ? 'bg-primary text-stone-900'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                            }`}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-stone-200 dark:bg-stone-700'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Steps */}
                <div className="lg:col-span-2">
                    {/* Step 1: Customer Info */}
                    {step === 1 && (
                        <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white mb-6">
                                Dados para Entrega
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Nome completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={customerData.name}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Telefone/WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={customerData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(00) 00000-0000"
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Endereço completo *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={customerData.address}
                                        onChange={handleInputChange}
                                        placeholder="Rua, número, complemento, bairro, cidade, estado"
                                        className="input-field"
                                        rows={2}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Observações
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={customerData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="input-field"
                                        placeholder="Instruções de entrega, ponto de referência..."
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid}
                                className="btn-primary w-full mt-6 disabled:opacity-50"
                            >
                                Continuar para Pagamento
                            </button>
                        </div>
                    )}

                    {/* Step 2: Payment */}
                    {step === 2 && (
                        <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white mb-6">
                                Forma de Pagamento
                            </h2>

                            <div className="space-y-4">
                                {paymentMethods.map(method => {
                                    const Icon = method.icon
                                    return (
                                        <label
                                            key={method.id}
                                            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${method.disabled
                                                ? 'opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-700'
                                                : paymentMethod === method.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={method.id}
                                                checked={paymentMethod === method.id}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                disabled={method.disabled}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === method.id
                                                ? 'bg-primary text-stone-900'
                                                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-stone-800 dark:text-white">
                                                    {method.name}
                                                </p>
                                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                                    {method.description}
                                                </p>
                                            </div>
                                            {paymentMethod === method.id && (
                                                <Check className="w-6 h-6 text-primary" />
                                            )}
                                        </label>
                                    )
                                })}
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Voltar
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="btn-primary flex-1"
                                >
                                    Revisar Pedido
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white mb-6">
                                Confirme seu Pedido
                            </h2>

                            {/* Customer Info Summary */}
                            <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
                                <h3 className="font-bold text-stone-800 dark:text-white mb-2">
                                    Dados de Entrega
                                </h3>
                                <p className="text-stone-600 dark:text-stone-400">{customerData.name}</p>
                                <p className="text-stone-600 dark:text-stone-400">{customerData.phone}</p>
                                <p className="text-stone-600 dark:text-stone-400">{customerData.address}</p>

                            </div>

                            {/* Payment Summary */}
                            <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
                                <h3 className="font-bold text-stone-800 dark:text-white mb-2">
                                    Forma de Pagamento
                                </h3>
                                <p className="text-stone-600 dark:text-stone-400">
                                    {paymentMethods.find(m => m.id === paymentMethod)?.name}
                                </p>
                            </div>

                            {/* Items Summary */}
                            <div className="mb-6">
                                <h3 className="font-bold text-stone-800 dark:text-white mb-4">
                                    Itens do Pedido
                                </h3>
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-stone-600 dark:text-stone-400">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="text-stone-800 dark:text-white font-medium">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Voltar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Confirmar Pedido
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm sticky top-4">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-4">
                            Resumo
                        </h3>

                        <div className="space-y-3 mb-4">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-3 text-sm">
                                    <img
                                        src={getProductImage(item)}
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded"
                                        onError={handleImageError}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-stone-800 dark:text-white truncate">{item.name}</p>
                                        <p className="text-stone-500 dark:text-stone-400">
                                            {item.quantity}x {formatPrice(item.price)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <hr className="my-4 border-stone-200 dark:border-stone-700" />

                        <div className="flex justify-between font-bold text-lg text-stone-800 dark:text-white">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
