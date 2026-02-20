import { Router } from 'express'
import Stripe from 'stripe'
import db from '../database-firebase.js'

const router = Router()

// Configuração do Stripe (para cartões)
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null

// URL base do frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Chave PIX da loja
const PIX_KEY = '75983185141'
const PIX_BENEFICIARY = "Di' Moda Íntima"

// ==================== PIX MANUAL ====================

// Gerar dados do PIX estático
router.post('/create', async (req, res) => {
    try {
        const { orderId, amount, customerName } = req.body

        if (!orderId || !amount) {
            return res.status(400).json({ error: 'orderId e amount são obrigatórios' })
        }

        // Atualizar pedido com status pending
        await db.updateOrderPayment(orderId, {
            payment_id: `PIX_${orderId}_${Date.now()}`,
            payment_status: 'pending',
            payment_method: 'pix'
        })

        console.log(`[PIX Manual] Pedido: ${orderId}, Valor: R$${amount}`)

        // Retornar dados do PIX estático
        res.json({
            pix_key: PIX_KEY,
            pix_key_type: 'phone',
            beneficiary: PIX_BENEFICIARY,
            amount: amount,
            order_id: orderId,
            // Mensagem para o cliente incluir na descrição do PIX
            description: `Pedido #${orderId}`,
            // WhatsApp para enviar comprovante
            whatsapp_number: '5575983185141',
            whatsapp_message: `Olá! Acabei de fazer o pedido #${orderId} no valor de R$${amount.toFixed(2)}. Segue o comprovante de pagamento.`
        })
    } catch (error) {
        console.error('[PIX Manual] Erro:', error)
        res.status(500).json({
            error: 'Erro ao gerar dados do PIX',
            details: error.message
        })
    }
})

// ==================== CARTÃO (STRIPE) ====================

// Criar sessão de checkout para cartão
router.post('/card/create', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                error: 'Stripe não configurado. Adicione STRIPE_SECRET_KEY ao .env'
            })
        }

        const { orderId, amount, customerEmail, customerName, items } = req.body

        if (!orderId || !amount) {
            return res.status(400).json({ error: 'orderId e amount são obrigatórios' })
        }

        // Criar line items para o Stripe
        const lineItems = items?.length > 0
            ? items.map(item => ({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: item.name || `Produto`,
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe usa centavos
                },
                quantity: item.quantity || 1,
            }))
            : [{
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: `Pedido #${orderId}`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }]

        // Criar sessão de checkout do Stripe (apenas cartão)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${FRONTEND_URL}/pedido/${orderId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/pedido/${orderId}?canceled=true`,
            customer_email: customerEmail || undefined,
            metadata: {
                order_id: orderId.toString(),
                customer_name: customerName || ''
            }
        })

        // Atualizar pedido com session_id do Stripe
        await db.updateOrderPayment(orderId, {
            payment_id: session.id,
            payment_status: 'pending',
            payment_method: 'card'
        })

        console.log(`[Stripe Card] Sessão criada - Pedido: ${orderId}, Session: ${session.id}`)

        res.json({
            session_id: session.id,
            checkout_url: session.url
        })
    } catch (error) {
        console.error('[Stripe Card] Erro:', error)
        res.status(500).json({
            error: 'Erro ao criar sessão de pagamento',
            details: error.message
        })
    }
})

// Consultar status do pagamento (Stripe)
router.get('/status/:sessionId', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ error: 'Stripe não configurado' })
        }

        const { sessionId } = req.params
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        res.json({
            session_id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            amount_total: session.amount_total / 100,
            metadata: session.metadata
        })
    } catch (error) {
        console.error('[Stripe] Erro ao consultar status:', error)
        res.status(500).json({
            error: 'Erro ao consultar status',
            details: error.message
        })
    }
})

// Webhook do Stripe
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        if (stripe && process.env.STRIPE_WEBHOOK_SECRET && sig) {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            )
        } else {
            event = req.body
        }
    } catch (err) {
        console.error('[Webhook] Assinatura inválida:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Processar eventos
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const orderId = session.metadata?.order_id

        if (orderId) {
            await db.updateOrderPayment(orderId, {
                payment_id: session.id,
                payment_status: session.payment_status
            })

            if (session.payment_status === 'paid') {
                await db.updateOrderStatus(orderId, 'confirmed')
                console.log(`[Webhook] Pedido ${orderId} confirmado!`)
            }
        }
    }

    res.json({ received: true })
})

export default router
