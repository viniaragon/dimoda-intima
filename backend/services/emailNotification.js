// Email notification service using Resend API
// Resend is free and works in cloud environments where SMTP is blocked

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dimodaintima@gmail.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Di Moda Íntima <onboarding@resend.dev>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * Formats an order notification email
 * @param {Object} order - The order data
 * @param {boolean} isPaid - Whether the order is paid
 * @param {boolean} isCustomer - Whether the email is directed to the customer
 * @returns {Object} - Email subject and HTML content
 */
export function formatOrderEmail(order, isPaid = false, isCustomer = false) {
    const itemsHtml = order.items
        .map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Produto'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `)
        .join('')

    const subjectPrefix = isPaid ? '✅ Pagamento Confirmado' : '🛒 Pedido Processado'
    const subject = `${subjectPrefix} #${order.id} - Di' Moda Íntima`

    let headerTitle = isPaid ? "Pagamento Confirmado!" : "Pedido Registrado!";
    let statusMessage = "";

    if (isPaid) {
        statusMessage = isCustomer 
            ? "Ótima notícia! Seu pagamento foi aprovado e o pedido já está sendo preparado para envio."
            : "O pagamento deste pedido foi confirmado (Cartão de Crédito).";
    } else {
        if (order.payment_method === 'pix') {
            statusMessage = isCustomer 
                ? "Recebemos o seu pedido! Estamos aguardando o envio do seu comprovante PIX no WhatsApp para liberar a entrega." 
                : "Novo pedido via PIX. Aguardando recebimento do comprovante do cliente para confirmação.";
        } else if (order.payment_method === 'cash') {
            statusMessage = isCustomer 
                ? "Recebemos o seu pedido! O pagamento deverá ser realizado no momento da entrega."
                : "Novo pedido com pagamento na entrega (Dinheiro).";
        } else {
            statusMessage = "Aguardando processamento/pagamento.";
        }
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #D4A574, #C49A6C); color: #1a1a1a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-top: none; }
            .section { margin-bottom: 20px; }
            .status-box { background-color: #fcf8f2; padding: 15px; border-left: 4px solid #D4A574; border-radius: 4px; }
            .section-title { font-weight: bold; color: #D4A574; margin-bottom: 10px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f5f5f5; padding: 10px; text-align: left; }
            .total { font-size: 20px; font-weight: bold; color: #D4A574; }
            .footer { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background-color: #1a1a1a; color: #D4A574 !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">${headerTitle}</h1>
                <p style="margin: 5px 0 0 0;">Pedido #${order.id}</p>
            </div>
            
            <div class="content">
                <div class="section status-box">
                    <p style="margin: 0; font-size: 15px;">${statusMessage}</p>
                </div>

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
                    <div class="section-title">💳 Pagamento selecionado</div>
                    <p style="margin: 5px 0;">${order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão de Crédito' : order.payment_method === 'cash' ? 'Dinheiro (na entrega)' : order.payment_method}</p>
                </div>
                
                ${order.notes ? `
                <div class="section">
                    <div class="section-title">📝 Observações</div>
                    <p style="margin: 5px 0;">${order.notes}</p>
                </div>
                ` : ''}

                <div class="section" style="text-align: center; margin-top: 30px;">
                    <a href="${FRONTEND_URL}/pedido/${order.id}" class="btn">Acompanhar Pedido</a>
                </div>
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
 * Sends an email notification to admin (and customer if applicable) using Resend API
 * @param {Object} order - The order data
 * @param {boolean} isPaid - Whether the order is paid (to change email phrasing)
 */
export async function sendOrderEmails(order, isPaid = false) {
    if (!RESEND_API_KEY) {
        console.log('💡 Para receber emails, configure RESEND_API_KEY no Railway')
        return { success: true, method: 'console' }
    }

    try {
        const promises = []

        // Email para o Admin
        const adminData = formatOrderEmail(order, isPaid, false)
        promises.push(
            fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: [ADMIN_EMAIL],
                    subject: adminData.subject,
                    html: adminData.html
                })
            })
        )

        // Email para o Cliente (se houver e-mail válido no pedido)
        if (order.customer_email && order.customer_email.includes('@')) {
            const customerData = formatOrderEmail(order, isPaid, true)
            promises.push(
                fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: FROM_EMAIL,
                        to: [order.customer_email],
                        subject: customerData.subject,
                        html: customerData.html
                    })
                })
            )
        }

        const responses = await Promise.all(promises)
        const checkResults = await Promise.all(responses.map(res => res.json()))
        
        console.log('📧 Emails enviados:', checkResults.map(r => r.id || r.message))
        return { success: true, results: checkResults }

    } catch (error) {
        console.error('❌ Erro ao enviar emails:', error.message)
        return { success: false, error: error.message }
    }
}

export default {
    formatOrderEmail,
    sendOrderEmails,
    ADMIN_EMAIL
}
