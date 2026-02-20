// WhatsApp notification service
// Uses CallMeBot API for automatic WhatsApp notifications

// Your WhatsApp number (with country code, no spaces or special chars)
const ADMIN_WHATSAPP = '5575983185141'

// CallMeBot API Key - Get yours free at https://www.callmebot.com/blog/free-api-whatsapp-messages/
// Steps: 1. Add +34 644 71 79 36 to your contacts
//        2. Send "I allow callmebot to send me messages" to them on WhatsApp
//        3. Wait for confirmation with your API key
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || ''

/**
 * Formats an order notification message for WhatsApp
 * @param {Object} order - The order data
 * @returns {string} - Formatted message
 */
export function formatOrderMessage(order) {
    const itemsList = order.items
        .map(item => `• ${item.name || 'Produto'} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`)
        .join('\n')

    const message = `
🛒 *NOVO PEDIDO!*

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

/**
 * Sends a notification to admin WhatsApp via CallMeBot API
 * @param {Object} order - The order data
 */
export async function notifyAdminWhatsApp(order) {
    const message = formatOrderMessage(order)

    console.log('\n📱 ==================== NOVO PEDIDO ====================')
    console.log(message)
    console.log('=======================================================\n')

    // If CallMeBot API key is configured, send actual WhatsApp message
    if (CALLMEBOT_API_KEY) {
        try {
            const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`

            const response = await fetch(callMeBotUrl)
            const result = await response.text()

            console.log('📱 CallMeBot response:', result)
            return { success: true, method: 'callmebot', result }
        } catch (error) {
            console.error('❌ CallMeBot error:', error.message)
            // Fall through to manual URL
        }
    } else {
        console.log('💡 Para receber notificações automáticas no WhatsApp, configure a variável CALLMEBOT_API_KEY')
        console.log('   Instruções: https://www.callmebot.com/blog/free-api-whatsapp-messages/')
    }

    // Generate manual URL as fallback
    const manualUrl = generateWhatsAppUrl(ADMIN_WHATSAPP, message)
    console.log('📱 Link manual WhatsApp:', manualUrl)

    return { success: true, method: 'console', url: manualUrl }
}

export default {
    formatOrderMessage,
    generateWhatsAppUrl,
    notifyAdminWhatsApp,
    ADMIN_WHATSAPP
}
