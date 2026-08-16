import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom'
import { Check, QrCode, Home, Loader2, CheckCircle2, XCircle, Copy, Banknote } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import LoadError from '../components/LoadError'

export default function OrderConfirmationPage() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const [copied, setCopied] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState('checking')
    const [orderData, setOrderData] = useState(null)
    const [paymentData, setPaymentData] = useState(location.state?.pixData || null)
    const [retryKey, setRetryKey] = useState(0)

    // Dados vindos do checkout
    const initialPixData = location.state?.pixData
    const stateOrderData = location.state?.orderData

    // Parâmetros da URL (vindos do Stripe)
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    const pixKey = paymentData?.pix_key || ''
    const whatsappNumber = paymentData?.whatsapp_number || ''

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const copyPixKey = () => {
        if (!pixKey) return
        navigator.clipboard.writeText(pixKey)
        setCopied(true)
        toast.success('Chave PIX copiada!')
        setTimeout(() => setCopied(false), 3000)
    }

    // Verificar status do pagamento
    useEffect(() => {
        let active = true

        const checkStatus = async () => {
            setPaymentStatus('checking')

            // Cartão pago via Stripe
            if (success === 'true' && sessionId) {
                try {
                    const response = await api.get(`/api/pix/status/${sessionId}`)
                    if (!active) return
                    if (response.data.payment_status === 'paid') {
                        setPaymentStatus('approved')
                        toast.success('Pagamento confirmado! 🎉')
                    } else {
                        setPaymentStatus('pending')
                    }
                } catch (error) {
                    console.error('Erro ao consultar pagamento:', error)
                    if (active) setPaymentStatus('error')
                }
                return
            }

            // Pagamento cancelado
            if (canceled === 'true') {
                setPaymentStatus('canceled')
                return
            }

            // PIX Manual - mostra tela de PIX
            if (initialPixData) {
                setPaymentData(initialPixData)
                setPaymentStatus('pix')
                setOrderData(stateOrderData)
                return
            }

            // Buscar dados do pedido
            try {
                const response = await api.get(`/api/orders/${id}`)
                if (!active) return
                setOrderData(response.data)

                if (response.data.payment_status === 'paid') {
                    setPaymentStatus('approved')
                } else if (response.data.payment_method === 'cash') {
                    setPaymentStatus('cash')
                } else if (response.data.payment_method === 'pix') {
                    const pixResponse = await api.get(`/api/pix/order/${id}`)
                    if (!active) return
                    setPaymentData(pixResponse.data)
                    setPaymentStatus('pix')
                } else {
                    setPaymentStatus('pending')
                }
            } catch (error) {
                console.error('Erro ao carregar pedido:', error)
                if (!active) return
                setPaymentStatus(error.response?.status === 404 ? 'not-found' : 'error')
            }
        }

        checkStatus()

        return () => {
            active = false
        }
    }, [id, success, canceled, sessionId, initialPixData, stateOrderData, retryKey])

    // Mensagem WhatsApp
    const total = orderData?.total || paymentData?.amount || 0
    const whatsappMessage = encodeURIComponent(
        paymentData?.whatsapp_message ||
        `Olá! Acabei de fazer o pedido #${id}${total ? ` no valor de ${formatPrice(total)}` : ''}. Segue o comprovante de pagamento.`
    )
    const whatsappLink = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
        : ''

    // WhatsApp Button Component
    const WhatsAppButton = ({ text = 'Enviar Comprovante no WhatsApp' }) => whatsappLink ? (
        <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            {text}
        </a>
    ) : null

    // Renderização baseada no status
    const renderContent = () => {
        switch (paymentStatus) {
            case 'checking':
                return (
                    <>
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Verificando...
                        </h1>
                    </>
                )

            case 'pix':
                return (
                    <>
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                            <QrCode className="w-12 h-12 text-primary" />
                        </div>

                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pedido Realizado!
                        </h1>

                        <p className="text-stone-600 dark:text-stone-400 text-lg mb-2">
                            Faça o PIX para concluir seu pedido.
                        </p>

                        <p className="text-stone-500 mb-8">
                            Pedido: <span className="font-mono font-bold text-primary">#{id}</span>
                            {total > 0 && <span className="ml-2">• Total: <span className="font-bold text-primary">{formatPrice(total)}</span></span>}
                        </p>

                        {/* PIX Info */}
                        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-6 mb-8">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white mb-4 flex items-center justify-center gap-2">
                                <QrCode className="w-6 h-6" />
                                Pagamento via PIX
                            </h2>

                            {/* Chave PIX */}
                            <div className="bg-white dark:bg-stone-900 rounded-lg p-4 mb-4">
                                <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                                    Chave PIX (Telefone)
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="font-mono text-xl font-bold text-stone-800 dark:text-white">
                                        {pixKey}
                                    </span>
                                    <button
                                        onClick={copyPixKey}
                                        className={`p-2 rounded transition ${copied
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                            }`}
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Beneficiário */}
                            <div className="text-center mb-4">
                                <p className="text-sm text-stone-500">Beneficiário</p>
                                <p className="font-bold text-stone-800 dark:text-white">
                                    {paymentData?.beneficiary || "Di' Moda Íntima"}
                                </p>
                            </div>

                            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                                Após o pagamento, envie o comprovante via WhatsApp:
                            </p>

                            <WhatsAppButton />
                        </div>

                        {/* Próximos Passos */}
                        <div className="bg-primary/10 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-stone-800 dark:text-white mb-4">
                                Próximos Passos
                            </h3>
                            <ol className="text-left text-stone-600 dark:text-stone-300 space-y-2">
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                                    <span>Copie a chave PIX acima</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                                    <span>Faça o PIX no app do seu banco</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                                    <span>Envie o comprovante pelo WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-stone-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
                                    <span>Aguarde a confirmação e envio</span>
                                </li>
                            </ol>
                        </div>
                    </>
                )

            case 'approved':
                return (
                    <>
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pagamento Confirmado!
                        </h1>
                        <p className="text-stone-600 dark:text-stone-400 text-lg mb-2">
                            Seu pagamento foi recebido com sucesso!
                        </p>
                        <p className="text-stone-500 mb-8">
                            Pedido: <span className="font-mono font-bold text-primary">#{id}</span>
                        </p>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-8 border border-green-200 dark:border-green-800">
                            <p className="text-green-700 dark:text-green-400 mb-4">
                                Seu pedido está sendo preparado!
                            </p>
                            <WhatsAppButton text="Falar no WhatsApp" />
                        </div>
                    </>
                )

            case 'canceled':
                return (
                    <>
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pagamento Cancelado
                        </h1>
                        <p className="text-stone-600 dark:text-stone-400 text-lg mb-8">
                            O pagamento foi cancelado. Você pode tentar novamente.
                        </p>
                        <Link
                            to="/carrinho"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-stone-900 font-bold py-3 px-6 rounded-lg transition"
                        >
                            Voltar ao Carrinho
                        </Link>
                    </>
                )

            case 'cash':
                return (
                    <>
                        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Banknote className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pedido Realizado!
                        </h1>
                        <p className="text-stone-600 dark:text-stone-400 text-lg mb-2">
                            Pagamento na entrega (Dinheiro)
                        </p>
                        <p className="text-stone-500 mb-8">
                            Pedido: <span className="font-mono font-bold text-primary">#{id}</span>
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 mb-8 border border-amber-200 dark:border-amber-800">
                            <p className="text-amber-700 dark:text-amber-400 mb-4">
                                Entraremos em contato para confirmar a entrega.
                            </p>
                            <WhatsAppButton text="Falar no WhatsApp" />
                        </div>
                    </>
                )

            case 'not-found':
                return (
                    <>
                        <XCircle className="w-20 h-20 text-stone-400 mx-auto mb-6" />
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pedido não encontrado
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 mb-8">
                            Confira o endereço informado ou volte para a loja.
                        </p>
                    </>
                )

            case 'error':
                return (
                    <LoadError
                        onRetry={() => setRetryKey(current => current + 1)}
                        className="py-4"
                    />
                )

            case 'pending':
                return (
                    <>
                        <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Loader2 className="w-12 h-12 text-stone-600 dark:text-stone-400" />
                        </div>
                        <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-4">
                            Pagamento pendente
                        </h1>
                        <p className="text-stone-500 mb-8">
                            Pedido: <span className="font-mono font-bold text-primary">#{id}</span>
                        </p>
                        <WhatsAppButton text="Falar no WhatsApp" />
                    </>
                )

            default:
                return null
        }
    }

    return (
        <div className="py-12 px-6 max-w-2xl mx-auto text-center">
            {renderContent()}

            <Link
                to="/"
                className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-primary transition-colors mt-8"
            >
                <Home className="w-5 h-5" />
                Voltar para a Loja
            </Link>
        </div>
    )
}
