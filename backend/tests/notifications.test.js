import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { sendOrderEmails, getAdminEmails, formatOrderEmail } from '../services/emailNotification.js'
import { notifyAdminWhatsApp } from '../services/whatsappNotification.js'
import { notifyOrder } from '../services/orderNotifications.js'
import { notificationKey } from '../services/notificationTransport.js'

const order = {
    id: 'order-1', customer_name: 'Cliente', customer_phone: '75999999999',
    customer_email: 'customer@example.com', address: 'Rua 1', payment_method: 'pix',
    total: 20, items: [{ name: 'Produto', price: 10, quantity: 2 }]
}
const emailEnv = { RESEND_API_KEY: 'fake-key', ADMIN_EMAILS: 'viniaragon@gmail.com,diannalmeida1@gmail.com' }
const whatsappEnv = { WHATSAPP_GATEWAY_URL: 'https://gateway.example.com', WHATSAPP_GATEWAY_TOKEN: 'fake-token', ADMIN_WHATSAPP: '+55 75 9156-8274' }
const jsonResponse = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data })

test('admin list supports legacy, trims and deduplicates; invalid config is rejected', () => {
    assert.deepEqual(getAdminEmails({ ADMIN_EMAILS: ' A@example.com; a@example.com\nB@example.com ' }), ['a@example.com', 'b@example.com'])
    assert.deepEqual(getAdminEmails({ ADMIN_EMAIL: 'legacy@example.com' }), ['legacy@example.com'])
    assert.throws(() => getAdminEmails({ ADMIN_EMAILS: 'bad' }), /INVALID_ADMIN_EMAILS/)
})

test('missing configuration reports skipped without any fetch', async () => {
    const fetchImpl = () => assert.fail('Network must never be called')
    for (const send of [sendOrderEmails, notifyAdminWhatsApp]) {
        const result = await send(order, false, { env: {}, fetchImpl })
        assert.equal(result.success, false)
        assert.equal(result.skipped, true)
    }
})

test('email sends both admins and separate customer, with stable per-event idempotency', async () => {
    const calls = []
    const fetchImpl = async (url, options) => { calls.push({ url, ...options }); return jsonResponse({ id: 'email-id' }) }
    const result = await sendOrderEmails(order, false, { env: emailEnv, fetchImpl })
    assert.equal(result.success, true)
    assert.deepEqual(JSON.parse(calls[0].body).to, ['viniaragon@gmail.com', 'diannalmeida1@gmail.com'])
    assert.deepEqual(JSON.parse(calls[1].body).to, ['customer@example.com'])
    assert.equal(result.results[0].status, 'accepted')
    await sendOrderEmails(order, false, { env: emailEnv, fetchImpl })
    assert.equal(calls[0].body, calls[2].body)
    assert.equal(calls[0].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key'])
    assert.notEqual(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key'])
    assert.notEqual(notificationKey(order.id, false, 'email-admin'), notificationKey(order.id, true, 'email-admin'))
})

test('email rejects HTTP errors and malformed success; independent customer still succeeds', async () => {
    for (const response of [jsonResponse({ message: 'secret-body' }, 403), jsonResponse({}), { ok: true, status: 200, json: async () => { throw Error('private body') } }]) {
        let calls = 0
        const result = await sendOrderEmails(order, false, {
            env: emailEnv, fetchImpl: async () => ++calls === 1 ? response : jsonResponse({ id: 'customer-id' })
        })
        assert.equal(calls, 2)
        assert.equal(result.success, false)
        assert.equal(result.results[0].success, false)
        assert.equal(result.results[1].success, true)
        assert.doesNotMatch(JSON.stringify(result), /secret-body|private body/)
    }
})

test('email escapes customer and catalog HTML', () => {
    const { html } = formatOrderEmail({ ...order, customer_name: '<img src=x>', notes: '<script>x</script>', items: [{ name: '<b>product</b>', quantity: 1, price: 20 }] })
    assert.ok(html.includes('&lt;img src=x&gt;'))
    assert.ok(html.includes('&lt;b&gt;product&lt;/b&gt;'))
    assert.ok(!html.includes('<script>'))
})

test('timeouts abort stalled fetch and stalled response body without exposing network errors', async () => {
    for (const stage of ['fetch', 'body']) {
        let signal
        const result = await sendOrderEmails({ ...order, customer_email: '' }, false, {
            env: { ...emailEnv, NOTIFICATION_TIMEOUT_MS: '10' },
            fetchImpl: async (_, options) => {
                signal = options.signal
                if (stage === 'fetch') return new Promise(() => {})
                return { ok: true, status: 200, json: () => new Promise(() => {}) }
            }
        })
        assert.equal(result.results[0].error, 'NOTIFICATION_TIMEOUT')
        assert.equal(signal.aborted, true)
    }
})

test('WhatsApp uses fixed env recipient, authenticated base URL and exact stable key', async () => {
    let call
    const result = await notifyAdminWhatsApp({ ...order, phone: 'attacker', ADMIN_WHATSAPP: 'attacker' }, true, {
        env: whatsappEnv, fetchImpl: async (url, options) => {
            call = { url, ...options }
            return jsonResponse({ status: 'sent', idempotencyKey: options.headers['Idempotency-Key'] })
        }
    })
    assert.equal(result.success, true)
    assert.equal(call.url, 'https://gateway.example.com/messages')
    assert.equal(call.headers.Authorization, 'Bearer fake-token')
    assert.equal(call.redirect, 'error')
    assert.equal(JSON.parse(call.body).phone, '557591568274')
    assert.match(JSON.parse(call.body).message, /PAGAMENTO CONFIRMADO/)
    assert.match(call.headers['Idempotency-Key'], /^[A-Za-z0-9._:-]{8,128}$/)
})

test('WhatsApp never treats pending/unknown, HTTP errors, or false success as sent', async () => {
    for (const response of [jsonResponse({ status: 'pending' }, 202), jsonResponse({ status: 'unknown' }, 202), jsonResponse({ status: 'pending' }), jsonResponse({ status: 'sent', idempotencyKey: 'wrong' }), jsonResponse({ status: 'sent' }, 503)]) {
        let calls = 0
        const result = await notifyAdminWhatsApp(order, false, { env: whatsappEnv, fetchImpl: async () => { calls++; return response } })
        assert.equal(result.success, false)
        assert.equal(calls, 1)
    }
})

test('gateway queued send is polled with identical body and key until sent', async () => {
    const calls = []
    const result = await notifyAdminWhatsApp(order, false, {
        env: whatsappEnv, fetchImpl: async (_, options) => {
            calls.push(options)
            return jsonResponse({ status: calls.length === 1 ? 'pending' : 'sent', idempotencyKey: options.headers['Idempotency-Key'] }, calls.length === 1 ? 202 : 200)
        }
    })
    assert.equal(result.success, true)
    assert.equal(calls.length, 2)
    assert.equal(calls[0].body, calls[1].body)
    assert.deepEqual(calls[0].headers, calls[1].headers)
})

test('pending polling has one global budget; unknown never polls', async () => {
    for (const status of ['pending', 'unknown']) {
        let calls = 0
        const result = await notifyAdminWhatsApp(order, false, {
            env: { ...whatsappEnv, NOTIFICATION_TIMEOUT_MS: '15' },
            fetchImpl: async (_, options) => {
                calls++
                return jsonResponse({ status, idempotencyKey: options.headers['Idempotency-Key'] }, 202)
            }
        })
        assert.equal(result.success, false)
        assert.equal(result.status, status)
        assert.equal(calls, 1)
    }
})

test('WhatsApp validates server configuration and bounds message before fetch', async () => {
    for (const overrides of [{ ADMIN_WHATSAPP: 'invalid' }, { WHATSAPP_GATEWAY_TOKEN: '' }, { WHATSAPP_GATEWAY_URL: 'http://external.example.com' }, { WHATSAPP_GATEWAY_URL: 'https://user:secret@example.com' }]) {
        const result = await notifyAdminWhatsApp(order, false, { env: { ...whatsappEnv, ...overrides }, fetchImpl: () => assert.fail('No network') })
        assert.equal(result.success, false)
    }
    const oversized = await notifyAdminWhatsApp({ ...order, notes: 'x'.repeat(4096) }, false, { env: whatsappEnv, fetchImpl: () => assert.fail('No network') })
    assert.equal(oversized.error, 'WHATSAPP_MESSAGE_TOO_LONG')
})

test('one channel throwing never suppresses the other or rejects the dispatch', async () => {
    let sent = 0
    const result = await notifyOrder(order, false, { email: () => { throw Error('private error') }, whatsapp: async () => { sent++; return { success: true } }, logger: { info() {} } })
    assert.equal(sent, 1)
    assert.equal(result.email.success, false)
    assert.equal(result.whatsapp.success, true)
})

test('Docker HTTP requires explicit opt-in; no public request can change this setting', async () => {
    const env = { ...whatsappEnv, WHATSAPP_GATEWAY_URL: 'http://dimoda-whatsapp:3000', WHATSAPP_GATEWAY_ALLOW_INSECURE_HTTP: 'true' }
    const result = await notifyAdminWhatsApp(order, false, { env, fetchImpl: async (url, options) => {
        assert.equal(url, 'http://dimoda-whatsapp:3000/messages')
        return jsonResponse({ status: 'sent', idempotencyKey: options.headers['Idempotency-Key'] })
    } })
    assert.equal(result.success, true)
})

test('actual creation route responds 201 when notification fails; card waits for paid event', async () => {
    const source = await readFile(new URL('../routes/orders.js', import.meta.url), 'utf8')
    const routeSource = source.slice(source.indexOf("router.post('/', async"), source.indexOf('// Get single order'))
    for (const payment_method of ['pix', 'cash', 'card']) {
        let handler
        let notifications = 0
        const response = { status(code) { this.code = code; return this }, json(value) { this.value = value; return this } }
        new Function('router', 'db', 'canonicalizeOrderItems', 'notifyOrder', 'sendCommerceError', 'console', routeSource)(
            { post: (_, callback) => { handler = callback } },
            { createOrder: async data => ({ ...data, id: order.id }) },
            async () => ({ items: order.items, total: order.total }),
            async () => { notifications++; throw Error('Unavailable channel') },
            () => assert.fail('Purchase must not fail'),
            { error() {} }
        )
        await handler({ body: { ...order, payment_method } }, response)
        assert.equal(response.code, 201)
        assert.equal(response.value.id, order.id)
        assert.equal(notifications, payment_method === 'card' ? 0 : 1)
    }
})

// Execute the actual transaction function with an in-memory Firestore double.
// Do not import database-firebase.js: importing it would read production credentials.
async function paymentHarness(initialOrder) {
    const source = await readFile(new URL('../database-firebase.js', import.meta.url), 'utf8')
    const functionSource = source.slice(source.indexOf('export async function confirmOrderPayment('), source.indexOf('export async function deleteOrder(')).replace('export ', '')
    let stored = { ...initialOrder }
    let writes = 0
    let queue = Promise.resolve()
    const db = {
        collection: () => ({ doc: id => ({ id }) }),
        runTransaction: fn => {
            const operation = queue.then(() => fn({
                get: async ref => ({ exists: true, id: ref.id, data: () => ({ ...stored }) }),
                update: (_, updates) => { writes++; stored = { ...stored, ...updates } }
            }))
            queue = operation.catch(() => {})
            return operation
        }
    }
    const confirm = new Function('db', 'admin', `${functionSource}; return confirmOrderPayment`)(db, { firestore: { FieldValue: { serverTimestamp: () => 'timestamp' } } })
    return { confirm, getStored: () => stored, getWrites: () => writes }
}

test('real payment transaction changes once for concurrent confirmations', async () => {
    const harness = await paymentHarness({ ...order, status: 'pending', payment_status: 'pending' })
    const results = await Promise.all([1, 2].map(() => harness.confirm(order.id, { payment_id: 'session-1' })))
    assert.deepEqual(results.map(result => result.changed), [true, false])
    assert.equal(harness.getWrites(), 1)
})

test('paid replay after shipped/delivered/cancelled neither writes nor regresses status', async () => {
    for (const status of ['confirmed', 'shipped', 'delivered', 'cancelled']) {
        const harness = await paymentHarness({ ...order, status, payment_status: 'paid', payment_id: 'original-session' })
        assert.equal((await harness.confirm(order.id, { payment_id: 'replayed-session' })).changed, false)
        assert.equal(harness.getWrites(), 0)
        assert.equal(harness.getStored().status, status)
        assert.equal(harness.getStored().payment_id, 'original-session')
    }
})

test('actual Stripe reconciliation dispatches only on changed, paid transaction', async () => {
    const source = await readFile(new URL('../routes/pix.js', import.meta.url), 'utf8')
    const functionSource = source.slice(source.indexOf('async function reconcilePaidStripeSession('), source.indexOf('async function loadPixOrder('))
    const harness = await paymentHarness({ ...order, status: 'pending', payment_status: 'pending' })
    const sent = []
    const reconcile = new Function('db', 'notifyOrder', 'CommerceValidationError', `${functionSource}; return reconcilePaidStripeSession`)({ confirmOrderPayment: harness.confirm }, async (...args) => { sent.push(args) }, Error)
    await reconcile(order, { id: 'session-1', payment_status: 'unpaid' })
    await Promise.all([1, 2].map(() => reconcile(order, { id: 'session-1', payment_status: 'paid' })))
    assert.equal(sent.length, 1)
    assert.equal(sent[0][1], true)
    assert.equal(sent[0][0].payment_status, 'paid')
})
