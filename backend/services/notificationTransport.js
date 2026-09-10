import { createHash } from 'node:crypto'

export function notificationKey(orderId, isPaid, channel) {
    return `order:${createHash('sha256').update(String(orderId)).digest('hex')}:${isPaid ? 'paid' : 'created'}:${channel}`
}

// Bound both the request and body read. Never log provider bodies or bearer tokens.
export async function postNotificationJson(url, { token, key, payload, timeoutMs, expectedStatus, responseEnvelope = false, fetchImpl = globalThis.fetch }) {
    const configuredTimeout = Number(timeoutMs)
    const duration = Number.isInteger(configuredTimeout) && configuredTimeout > 0
        ? Math.min(configuredTimeout, 30000) : 8000
    const controller = new AbortController()
    let timer
    try {
        return await Promise.race([
            (async () => {
                let response
                try {
                    response = await fetchImpl(url, {
                        method: 'POST', redirect: 'error', signal: controller.signal,
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
                        body: JSON.stringify(payload)
                    })
                } catch { throw new Error('NOTIFICATION_NETWORK_ERROR') }
                if (!response.ok || (expectedStatus && response.status !== expectedStatus)) {
                    throw new Error(`NOTIFICATION_HTTP_${response.status}`)
                }
                try {
                    const data = await response.json()
                    return responseEnvelope ? { status: response.status, data } : data
                }
                catch { throw new Error('INVALID_PROVIDER_RESPONSE') }
            })(),
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error('NOTIFICATION_TIMEOUT'))
                    controller.abort()
                }, duration)
            })
        ])
    } finally { clearTimeout(timer) }
}
