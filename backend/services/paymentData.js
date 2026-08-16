export function buildStripeLineItems(order) {
    return order.items.map(item => ({
        price_data: {
            currency: 'brl',
            product_data: {
                name: item.name
            },
            unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
    }))
}

export function buildPixData(order, config) {
    return {
        pix_key: config.pixKey,
        pix_key_type: 'phone',
        beneficiary: config.beneficiary,
        amount: order.total,
        order_id: order.id,
        description: `Pedido #${order.id}`,
        whatsapp_number: config.whatsappNumber,
        whatsapp_message: `Olá! Acabei de fazer o pedido #${order.id} no valor de R$${order.total.toFixed(2)}. Segue o comprovante de pagamento.`
    }
}
