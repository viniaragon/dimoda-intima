import { notificationKey, postNotificationJson } from './notificationTransport.js'

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || ''

/**
 * Formats an order notification message for WhatsApp
 * @param {Object} order - The order data
 * @returns {string} - Formatted message
 */
export function formatOrderMessage(order, isPaid = false) {
    const itemsList = order.items
        .map(item => `• ${item.name || 'Produto'} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`)
        .join('\n')

    const message = `
${isPaid ? '✅ *PAGAMENTO CONFIRMADO!*' : '🛒 *NOVO PEDIDO!*'}

📋 Pedido: #${order.id}

👤 *Cliente:*
${order.customer_name}
Tel: ${order.customer_phone}

📍 *Endereço:*
${order.address || 'Não informado'}

📦 *Itens:*
${itemsList}

💰 *Total:* R$ ${order.total.toFixed(2)}
💳 *Pagamento:* ${order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão' : order.payment_method}
${order.notes ? `📝 Obs: ${order.notes}` : ''}
`.trim()

    return message
}

/**
 * Generates a WhatsApp URL to send a message
 * @param {string} phone - Phone number with country code
 * @param {string} message - Message to send
 * @returns {string} - WhatsApp URL
 */
export function generateWhatsAppUrl(phone, message) {
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${phone}?text=${encodedMessage}`
}

/** Optional server-to-server adapter. Destination is never read from an order/request. */
export async function notifyAdminWhatsApp(order, isPaid = false, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
    if (!env.WHATSAPP_GATEWAY_URL?.trim()) return { success: false, skipped: true, reason: 'WHATSAPP_NOT_CONFIGURED' }
    try {
        let url
        try { url = new URL(env.WHATSAPP_GATEWAY_URL) } catch { throw new Error('INVALID_WHATSAPP_GATEWAY_URL') }
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
            (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
                env.WHATSAPP_GATEWAY_ALLOW_INSECURE_HTTP !== 'true')) {
            throw new Error('INVALID_WHATSAPP_GATEWAY_URL')
        }
        const destination = (env.ADMIN_WHATSAPP || '').replace(/[+\s()-]/g, '')
        if (!/^[1-9]\d{9,14}$/.test(destination)) throw new Error('INVALID_ADMIN_WHATSAPP')
        if (!env.WHATSAPP_GATEWAY_TOKEN?.trim()) throw new Error('WHATSAPP_TOKEN_REQUIRED')
        const key = notificationKey(order.id, isPaid, 'whatsapp-admin')
        url.pathname = `${url.pathname.replace(/\/$/, '')}/messages`
        const message = formatOrderMessage(order, isPaid)
        if (message.length > 4096) throw new Error('WHATSAPP_MESSAGE_TOO_LONG')
        const configuredTimeout = Number(env.NOTIFICATION_TIMEOUT_MS)
        const duration = Number.isInteger(configuredTimeout) && configuredTimeout > 0
            ? Math.min(configuredTimeout, 30000) : 8000
        const deadline = Date.now() + duration
        // Repeating the exact key/body queries a queued send; it must never create another send.
        while (Date.now() < deadline) {
            const { status, data } = await postNotificationJson(url.href, {
                token: env.WHATSAPP_GATEWAY_TOKEN, key,
                payload: { phone: destination, message },
                timeoutMs: Math.max(1, deadline - Date.now()), responseEnvelope: true, fetchImpl
            })
            if (status === 200 && data?.status === 'sent' && data.idempotencyKey === key) {
                return { success: true, method: 'service', status: 'sent', id: key }
            }
            if (status === 202 && data?.status === 'unknown') {
                return { success: false, method: 'service', status: 'unknown', error: 'WHATSAPP_DELIVERY_UNCONFIRMED' }
            }
            if (status !== 202 || data?.status !== 'pending' || data.idempotencyKey !== key) {
                throw new Error('INVALID_PROVIDER_RESPONSE')
            }
            const remaining = deadline - Date.now()
            if (remaining > 0) await new Promise(resolve => setTimeout(resolve, Math.min(500, remaining)))
        }
        return { success: false, method: 'service', status: 'pending', error: 'WHATSAPP_DELIVERY_UNCONFIRMED' }
    } catch (error) { return { success: false, error: error.message } }
}

export default { formatOrderMessage, generateWhatsAppUrl, notifyAdminWhatsApp, ADMIN_WHATSAPP }
