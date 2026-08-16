import { Router } from 'express'
import Stripe from 'stripe'
import db from '../database-firebase.js'
import { sendOrderEmails } from '../services/emailNotification.js'
import {
    CommerceValidationError,
    getValidatedOrderForPayment,
    sendCommerceError
} from '../services/orderValidation.js'
import { buildPixData, buildStripeLineItems } from '../services/paymentData.js'

const router = Router()

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const pixConfig = {
    pixKey: process.env.PIX_KEY || '75983185141',
    beneficiary: process.env.PIX_BENEFICIARY || "Di' Moda Íntima",
    whatsappNumber: process.env.WHATSAPP_NUMBER || '5575983185141'
}

function assertPaymentMethod(order, expectedMethod) {
    if (order.payment_method !== expectedMethod) {
        throw new CommerceValidationError('Forma de pagamento incompatível com o pedido', {
            status: 409,
            code: 'PAYMENT_METHOD_MISMATCH'
        })
    }
}

async function loadPixOrder(orderId) {
    const order = await getValidatedOrderForPayment(orderId, db)
    assertPaymentMethod(order, 'pix')
    return order
}

// Consultar dados PIX canônicos de um pedido sem aceitar valor do navegador.
router.get('/order/:orderId', async (req, res) => {
    try {
        const order = await loadPixOrder(req.params.orderId)
        res.json(buildPixData(order, pixConfig))
    } catch (error) {
        console.error('[PIX Manual] Erro ao consultar pedido:', error)
        sendCommerceError(res, error, 'Erro ao carregar dados do PIX')
    }
})

// Gerar dados do PIX estático a partir do pedido persistido e validado.
router.post('/create', async (req, res) => {
    try {
        const { orderId } = req.body || {}
        const order = await loadPixOrder(orderId)

        await db.updateOrderPayment(order.id, {
            payment_id: `PIX_${order.id}_${Date.now()}`,
            payment_status: 'pending',
            payment_method: 'pix'
        })

        console.log(`[PIX Manual] Pedido: ${order.id}, Valor validado: R$${order.total.toFixed(2)}`)
        res.json(buildPixData(order, pixConfig))
    } catch (error) {
        console.error('[PIX Manual] Erro:', error)
        sendCommerceError(res, error, 'Erro ao gerar dados do PIX')
    }
})

// Criar sessão de checkout para cartão usando somente o pedido canônico.
router.post('/card/create', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Pagamento por cartão indisponível' })
        }

        const { orderId } = req.body || {}
        const order = await getValidatedOrderForPayment(orderId, db)
        assertPaymentMethod(order, 'card')

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: buildStripeLineItems(order),
            mode: 'payment',
            success_url: `${FRONTEND_URL}/pedido/${order.id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/pedido/${order.id}?canceled=true`,
            customer_email: order.customer_email || undefined,
            metadata: {
                order_id: order.id,
                customer_name: order.customer_name || ''
            }
        })

        await db.updateOrderPayment(order.id, {
            payment_id: session.id,
            payment_status: 'pending',
            payment_method: 'card'
        })

        console.log(`[Stripe Card] Sessão criada - Pedido: ${order.id}, Session: ${session.id}`)

        res.json({
            session_id: session.id,
            checkout_url: session.url
        })
    } catch (error) {
        console.error('[Stripe Card] Erro:', error)
        sendCommerceError(res, error, 'Erro ao criar sessão de pagamento')
    }
})

// Consultar status do pagamento e conferir o valor contra o pedido persistido.
router.get('/status/:sessionId', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Pagamento por cartão indisponível' })
        }

        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
        const orderId = session.metadata?.order_id
        const order = orderId ? await db.getOrderById(orderId) : null

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' })
        }

        const expectedAmount = Math.round(Number(order.total) * 100)
        if (!Number.isFinite(expectedAmount) || expectedAmount !== session.amount_total) {
            return res.status(409).json({ error: 'Valor do pagamento não corresponde ao pedido' })
        }

        res.json({
            session_id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            amount_total: session.amount_total / 100,
            metadata: session.metadata
        })
    } catch (error) {
        console.error('[Stripe] Erro ao consultar status:', error)
        res.status(500).json({ error: 'Erro ao consultar status' })
    }
})

// Webhook do Stripe. A rota recebe corpo bruto no server.js para validar a assinatura.
router.post('/webhook', async (req, res) => {
    const signature = req.headers['stripe-signature']

    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ error: 'Webhook do Stripe não configurado' })
    }

    if (!signature) {
        return res.status(400).json({ error: 'Assinatura do Stripe ausente' })
    }

    let event
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.error('[Webhook] Assinatura inválida:', error.message)
        return res.status(400).send('Webhook Error')
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const orderId = session.metadata?.order_id

        if (orderId) {
            const order = await db.getOrderById(orderId)
            const expectedAmount = Math.round(Number(order?.total) * 100)

            if (!order || !Number.isFinite(expectedAmount) || expectedAmount !== session.amount_total) {
                console.error(`[Webhook] Valor ou pedido inválido para sessão ${session.id}`)
                return res.status(409).json({ error: 'Pagamento não corresponde ao pedido' })
            }

            await db.updateOrderPayment(orderId, {
                payment_id: session.id,
                payment_status: session.payment_status
            })

            if (session.payment_status === 'paid') {
                await db.updateOrderStatus(orderId, 'confirmed')
                console.log(`[Webhook] Pedido ${orderId} confirmado!`)

                sendOrderEmails({ ...order, status: 'confirmed', payment_status: 'paid' }, true)
                    .catch(error => console.error('Erro ao enviar email de confirmação Stripe', error))
            }
        }
    }

    res.json({ received: true })
})

export default router
