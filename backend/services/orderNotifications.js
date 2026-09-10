import { sendOrderEmails } from './emailNotification.js'
import { notifyAdminWhatsApp } from './whatsappNotification.js'

// Each channel settles independently; failures must never reject a completed purchase.
export async function notifyOrder(order, isPaid = false, {
    email = sendOrderEmails, whatsapp = notifyAdminWhatsApp, logger = console
} = {}) {
    const entries = await Promise.allSettled([
        Promise.resolve().then(() => email(order, isPaid)),
        Promise.resolve().then(() => whatsapp(order, isPaid))
    ])
    const channels = Object.fromEntries(entries.map((entry, index) => [
        index === 0 ? 'email' : 'whatsapp',
        entry.status === 'fulfilled' ? entry.value : { success: false, error: 'NOTIFICATION_CHANNEL_ERROR' }
    ]))
    for (const [channel, result] of Object.entries(channels)) {
        logger.info('[Order notification]', {
            orderId: order.id, event: isPaid ? 'paid' : 'created', channel,
            status: result?.skipped ? 'skipped' : result?.success ? 'accepted' : 'failed',
            reason: result?.reason || result?.error,
            results: result?.results?.map(({ audience, success, error }) => ({ audience, success, error }))
        })
    }
    return channels
}
