const MAX_DISTINCT_ITEMS = 100
const MAX_QUANTITY_PER_ITEM = 99

export class CommerceValidationError extends Error {
    constructor(message, { status = 400, code = 'INVALID_ORDER', details } = {}) {
        super(message)
        this.name = 'CommerceValidationError'
        this.status = status
        this.code = code
        this.details = details
    }
}

function toCents(value, fieldName) {
    const number = Number(value)
    if (!Number.isFinite(number) || number < 0) {
        throw new CommerceValidationError(`${fieldName} inválido`, {
            status: 409,
            code: 'INVALID_CATALOG_DATA'
        })
    }
    return Math.round(number * 100)
}

function normalizeProductId(value) {
    const id = typeof value === 'string' || typeof value === 'number'
        ? String(value).trim()
        : ''

    if (!id || id.length > 200) {
        throw new CommerceValidationError('ID de produto inválido', {
            code: 'INVALID_PRODUCT_ID'
        })
    }

    return id
}

function normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new CommerceValidationError('O pedido precisa ter ao menos um item', {
            code: 'EMPTY_ORDER'
        })
    }

    const quantitiesByProduct = new Map()

    for (const item of items) {
        const productId = normalizeProductId(item?.product_id)
        const quantity = Number(item?.quantity)

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
            throw new CommerceValidationError('Quantidade de produto inválida', {
                code: 'INVALID_QUANTITY',
                details: { product_id: productId }
            })
        }

        const accumulatedQuantity = (quantitiesByProduct.get(productId) || 0) + quantity
        if (accumulatedQuantity > MAX_QUANTITY_PER_ITEM) {
            throw new CommerceValidationError('Quantidade de produto inválida', {
                code: 'INVALID_QUANTITY',
                details: { product_id: productId }
            })
        }
        quantitiesByProduct.set(productId, accumulatedQuantity)
    }

    if (quantitiesByProduct.size > MAX_DISTINCT_ITEMS) {
        throw new CommerceValidationError('O pedido excede o limite de itens', {
            code: 'TOO_MANY_ITEMS'
        })
    }

    return [...quantitiesByProduct.entries()].map(([productId, quantity]) => ({
        productId,
        quantity
    }))
}

export async function canonicalizeOrderItems(items, getProductById) {
    if (typeof getProductById !== 'function') {
        throw new TypeError('getProductById precisa ser uma função')
    }

    const requestedItems = normalizeItems(items)
    const canonicalItems = []
    let totalCents = 0

    for (const requestedItem of requestedItems) {
        const product = await getProductById(requestedItem.productId)

        if (!product) {
            throw new CommerceValidationError('Produto não encontrado', {
                status: 404,
                code: 'PRODUCT_NOT_FOUND',
                details: { product_id: requestedItem.productId }
            })
        }

        if (product.active === false) {
            throw new CommerceValidationError('Produto indisponível', {
                status: 409,
                code: 'PRODUCT_UNAVAILABLE',
                details: { product_id: requestedItem.productId }
            })
        }

        const stock = Number(product.stock)
        if (!Number.isInteger(stock) || stock < requestedItem.quantity) {
            throw new CommerceValidationError('Estoque insuficiente', {
                status: 409,
                code: 'INSUFFICIENT_STOCK',
                details: {
                    product_id: requestedItem.productId,
                    requested: requestedItem.quantity,
                    available: Number.isInteger(stock) && stock >= 0 ? stock : 0
                }
            })
        }

        const name = typeof product.name === 'string' ? product.name.trim() : ''
        if (!name) {
            throw new CommerceValidationError('Produto com cadastro inválido', {
                status: 409,
                code: 'INVALID_CATALOG_DATA',
                details: { product_id: requestedItem.productId }
            })
        }

        const unitPriceCents = toCents(product.price, 'Preço do produto')
        const subtotalCents = unitPriceCents * requestedItem.quantity
        totalCents += subtotalCents

        canonicalItems.push({
            product_id: String(product.id ?? requestedItem.productId),
            name,
            quantity: requestedItem.quantity,
            price: unitPriceCents / 100,
            subtotal: subtotalCents / 100
        })
    }

    return {
        items: canonicalItems,
        total: totalCents / 100
    }
}

export async function getValidatedOrderForPayment(orderId, database) {
    const normalizedOrderId = typeof orderId === 'string' || typeof orderId === 'number'
        ? String(orderId).trim()
        : ''

    if (!normalizedOrderId || normalizedOrderId.length > 200) {
        throw new CommerceValidationError('ID do pedido inválido', {
            code: 'INVALID_ORDER_ID'
        })
    }

    const order = await database.getOrderById(normalizedOrderId)
    if (!order) {
        throw new CommerceValidationError('Pedido não encontrado', {
            status: 404,
            code: 'ORDER_NOT_FOUND'
        })
    }

    if (order.status === 'cancelled') {
        throw new CommerceValidationError('Pedido cancelado não pode ser pago', {
            status: 409,
            code: 'ORDER_CANCELLED'
        })
    }

    if (order.payment_status === 'paid') {
        throw new CommerceValidationError('Pedido já foi pago', {
            status: 409,
            code: 'ORDER_ALREADY_PAID'
        })
    }

    const canonical = await canonicalizeOrderItems(order.items, database.getProductById)
    const storedTotalCents = toCents(order.total, 'Total do pedido')
    const canonicalTotalCents = toCents(canonical.total, 'Total recalculado')

    if (storedTotalCents !== canonicalTotalCents) {
        throw new CommerceValidationError('O pedido precisa ser recalculado antes do pagamento', {
            status: 409,
            code: 'ORDER_TOTAL_CHANGED'
        })
    }

    return {
        ...order,
        id: normalizedOrderId,
        items: canonical.items,
        total: canonical.total
    }
}

export function sendCommerceError(res, error, fallbackMessage) {
    if (error instanceof CommerceValidationError) {
        return res.status(error.status).json({
            error: error.message,
            code: error.code,
            ...(error.details ? { details: error.details } : {})
        })
    }

    return res.status(500).json({ error: fallbackMessage })
}
