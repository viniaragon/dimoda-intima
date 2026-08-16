import assert from 'node:assert/strict'
import test from 'node:test'
import {
    canonicalizeOrderItems,
    CommerceValidationError,
    getValidatedOrderForPayment
} from '../services/orderValidation.js'
import { buildPixData, buildStripeLineItems } from '../services/paymentData.js'

function catalog(overrides = {}) {
    const products = {
        'product-1': {
            id: 'product-1',
            name: 'Produto real',
            price: 19.9,
            stock: 5,
            active: true
        },
        ...overrides
    }

    return async id => products[id] || null
}

async function expectCommerceError(promise, { status, code }) {
    await assert.rejects(promise, error => {
        assert.ok(error instanceof CommerceValidationError)
        assert.equal(error.status, status)
        assert.equal(error.code, code)
        return true
    })
}

test('reconstrói nome, preço, subtotal e total a partir do catálogo', async () => {
    const result = await canonicalizeOrderItems([{
        product_id: 'product-1',
        quantity: 2,
        name: 'Nome adulterado',
        price: 0.01,
        subtotal: 0.02
    }], catalog())

    assert.deepEqual(result, {
        items: [{
            product_id: 'product-1',
            name: 'Produto real',
            quantity: 2,
            price: 19.9,
            subtotal: 39.8
        }],
        total: 39.8
    })
})

test('agrega IDs repetidos antes de validar o estoque', async () => {
    await expectCommerceError(
        canonicalizeOrderItems([
            { product_id: 'product-1', quantity: 3 },
            { product_id: 'product-1', quantity: 3 }
        ], catalog()),
        { status: 409, code: 'INSUFFICIENT_STOCK' }
    )
})

test('recusa ID inexistente', async () => {
    await expectCommerceError(
        canonicalizeOrderItems([{ product_id: 'missing', quantity: 1 }], catalog()),
        { status: 404, code: 'PRODUCT_NOT_FOUND' }
    )
})

test('recusa quantidade inválida, produto inativo e estoque insuficiente', async t => {
    await t.test('quantidade inválida', async () => {
        await expectCommerceError(
            canonicalizeOrderItems([{ product_id: 'product-1', quantity: 0 }], catalog()),
            { status: 400, code: 'INVALID_QUANTITY' }
        )
    })

    await t.test('produto inativo', async () => {
        await expectCommerceError(
            canonicalizeOrderItems([{ product_id: 'product-1', quantity: 1 }], catalog({
                'product-1': { id: 'product-1', name: 'Inativo', price: 10, stock: 2, active: false }
            })),
            { status: 409, code: 'PRODUCT_UNAVAILABLE' }
        )
    })

    await t.test('estoque insuficiente', async () => {
        await expectCommerceError(
            canonicalizeOrderItems([{ product_id: 'product-1', quantity: 6 }], catalog()),
            { status: 409, code: 'INSUFFICIENT_STOCK' }
        )
    })
})

test('pagamento usa pedido persistido validado e ignora preço/valor enviados pelo cliente', async () => {
    const clientPayload = {
        amount: 0.01,
        customerName: 'Nome adulterado',
        items: [{ product_id: 'product-1', name: 'Falso', price: 0.01, quantity: 1 }]
    }
    const database = {
        getOrderById: async () => ({
            id: 'order-1',
            customer_name: 'Cliente real',
            customer_email: 'cliente@example.com',
            payment_method: 'card',
            payment_status: 'pending',
            status: 'pending',
            items: [{ product_id: 'product-1', quantity: 1, name: 'Produto real', price: 19.9 }],
            total: 19.9
        }),
        getProductById: catalog()
    }

    const order = await getValidatedOrderForPayment('order-1', database)
    const stripeItems = buildStripeLineItems(order)
    const pixData = buildPixData(order, {
        pixKey: 'configured-key',
        beneficiary: 'Loja',
        whatsappNumber: '5500000000000'
    })

    assert.equal(order.customer_name, 'Cliente real')
    assert.equal(order.total, 19.9)
    assert.equal(stripeItems[0].price_data.unit_amount, 1990)
    assert.equal(stripeItems[0].price_data.product_data.name, 'Produto real')
    assert.equal(pixData.amount, 19.9)
    assert.notEqual(pixData.amount, clientPayload.amount)
    assert.notEqual(order.customer_name, clientPayload.customerName)
})

test('recusa pagamento quando o total persistido diverge do catálogo', async () => {
    const database = {
        getOrderById: async () => ({
            id: 'order-1',
            payment_method: 'pix',
            payment_status: 'pending',
            status: 'pending',
            items: [{ product_id: 'product-1', quantity: 1 }],
            total: 0.01
        }),
        getProductById: catalog()
    }

    await expectCommerceError(
        getValidatedOrderForPayment('order-1', database),
        { status: 409, code: 'ORDER_TOTAL_CHANGED' }
    )
})
