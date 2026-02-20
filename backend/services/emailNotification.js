// Email notification service using Resend API
// Resend is free and works in cloud environments where SMTP is blocked

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dimodaintima@gmail.com'

/**
 * Formats an order notification email
 * @param {Object} order - The order data
 * @returns {Object} - Email subject and HTML content
 */
export function formatOrderEmail(order) {
    const itemsHtml = order.items
        .map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Produto'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `)
        .join('')

    const subject = `🛒 Novo Pedido #${order.id} - Di' Moda Íntima`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #D4A574, #C49A6C); color: #1a1a1a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 20px; border: 1px solid #ddd; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; color: #D4A574; margin-bottom: 10px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f5f5f5; padding: 10px; text-align: left; }
            .total { font-size: 20px; font-weight: bold; color: #D4A574; }
            .footer { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">🛒 Novo Pedido!</h1>
                <p style="margin: 5px 0 0 0;">Pedido #${order.id}</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <div class="section-title">👤 Cliente</div>
                    <p style="margin: 5px 0;"><strong>Nome:</strong> ${order.customer_name}</p>
                    <p style="margin: 5px 0;"><strong>Telefone:</strong> ${order.customer_phone}</p>
                    ${order.customer_email ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer_email}</p>` : ''}
                </div>
                
                <div class="section">
                    <div class="section-title">📍 Endereço de Entrega</div>
                    <p style="margin: 5px 0;">${order.address || 'Não informado'}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">📦 Itens do Pedido</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th style="text-align: center;">Qtd</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
                
                <div class="section" style="text-align: right;">
                    <p class="total">💰 Total: R$ ${order.total.toFixed(2)}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">💳 Pagamento</div>
                    <p style="margin: 5px 0;">${order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão de Crédito' : order.payment_method}</p>
                </div>
                
                ${order.notes ? `
                <div class="section">
                    <div class="section-title">📝 Observações</div>
                    <p style="margin: 5px 0;">${order.notes}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p style="margin: 0; color: #666;">
                    📅 ${new Date().toLocaleString('pt-BR')}<br>
                    Di' Moda Íntima
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    return { subject, html }
}

/**
 * Sends an email notification to admin about a new order using Resend API
 * @param {Object} order - The order data
 */
export async function notifyAdminEmail(order) {
    const { subject, html } = formatOrderEmail(order)

    console.log('\n📧 ==================== NOVO PEDIDO ====================')
    console.log(`Pedido #${order.id}`)
    console.log(`Cliente: ${order.customer_name} - ${order.customer_phone}`)
    console.log(`Total: R$ ${order.total.toFixed(2)}`)
    console.log('=======================================================\n')

    if (!RESEND_API_KEY) {
        console.log('💡 Para receber emails, configure RESEND_API_KEY no Railway')
        console.log('   Crie uma conta grátis em: https://resend.com')
        return { success: true, method: 'console' }
    }

    try {
        console.log('📧 Enviando email via Resend para:', ADMIN_EMAIL)

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Di Moda Íntima <onboarding@resend.dev>',
                to: [ADMIN_EMAIL],
                subject: subject,
                html: html
            })
        })

        const result = await response.json()

        if (response.ok) {
            console.log('📧 Email enviado com sucesso:', result.id)
            return { success: true, method: 'resend', id: result.id }
        } else {
            console.error('❌ Erro Resend:', result)
            return { success: false, error: result.message || 'Erro desconhecido' }
        }
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error.message)
        return { success: false, error: error.message }
    }
}

export default {
    formatOrderEmail,
    notifyAdminEmail,
    ADMIN_EMAIL
}
