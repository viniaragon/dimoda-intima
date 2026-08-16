import { Router } from 'express'
import db from '../database-firebase.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { sendOrderEmails } from '../services/emailNotification.js'
import {
    canonicalizeOrderItems,
    sendCommerceError
} from '../services/orderValidation.js'

const router = Router()

// Get all orders (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await db.getAllOrders()
        res.json(orders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'Erro ao buscar pedidos' })
    }
})

// Get archived orders (admin only). Keep static routes before /:id.
router.get('/archived', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await db.getArchivedOrders()
        res.json(orders)
    } catch (error) {
        console.error('Error fetching archived orders:', error)
        res.status(500).json({ error: 'Erro ao buscar pedidos arquivados' })
    }
})

// Get order archives/snapshots (admin only)
router.get('/archives', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const archives = await db.getOrderArchives()
        res.json(archives)
    } catch (error) {
        console.error('Error fetching order archives:', error)
        res.status(500).json({ error: 'Erro ao buscar arquivos de pedidos' })
    }
})

// Create order (public)
router.post('/', async (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            address,
            payment_method,
            notes,
            items
        } = req.body || {}

        if (typeof customer_name !== 'string' || !customer_name.trim() ||
            typeof customer_phone !== 'string' || !customer_phone.trim()) {
            return res.status(400).json({ error: 'Dados incompletos' })
        }

        const allowedPaymentMethods = ['pix', 'cash', 'card']
        const paymentMethod = payment_method || 'pix'
        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Forma de pagamento inválida' })
        }

        const canonical = await canonicalizeOrderItems(items, db.getProductById)

        const order = await db.createOrder({
            customer_name: customer_name.trim(),
            customer_email: typeof customer_email === 'string' ? customer_email.trim() : '',
            customer_phone: customer_phone.trim(),
            address: typeof address === 'string' ? address.trim() : '',
            payment_method: paymentMethod,
            notes: typeof notes === 'string' ? notes.trim() : '',
            items: canonical.items,
            total: canonical.total
        })

        // Enviar os emails se o pagamento NÃO for cartão (cartão envia apenas após confirmação no Stripe webhook)
        if (order.payment_method !== 'card') {
            sendOrderEmails(order, false)
                .then(result => console.log('📧 Email notifications resolved.'))
                .catch(err => console.error('Error sending email notification:', err))
        }

        res.status(201).json(order)
    } catch (error) {
        console.error('Error creating order:', error)
        sendCommerceError(res, error, 'Erro ao criar pedido')
    }
})

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id)

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' })
        }

        res.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        res.status(500).json({ error: 'Erro ao buscar pedido' })
    }
})

// Update order status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' })
        }

        const order = await db.updateOrderStatus(req.params.id, status)
        res.json(order)
    } catch (error) {
        console.error('Error updating order status:', error)
        res.status(500).json({ error: 'Erro ao atualizar status' })
    }
})

// Delete order permanently (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await db.deleteOrder(req.params.id)
        res.json(result)
    } catch (error) {
        console.error('Error deleting order:', error)
        res.status(500).json({ error: 'Erro ao deletar pedido' })
    }
})

// Archive single order (admin only)
router.post('/:id/archive', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await db.archiveOrder(req.params.id)
        if (!result) {
            return res.status(404).json({ error: 'Pedido não encontrado' })
        }
        res.json(result)
    } catch (error) {
        console.error('Error archiving order:', error)
        res.status(500).json({ error: 'Erro ao arquivar pedido' })
    }
})

// Archive all orders and reset (admin only)
router.post('/archive-all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await db.archiveAllOrders()
        res.json(result)
    } catch (error) {
        console.error('Error archiving all orders:', error)
        res.status(500).json({ error: 'Erro ao arquivar pedidos' })
    }
})

export default router
