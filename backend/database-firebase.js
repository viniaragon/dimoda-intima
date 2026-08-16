import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Firebase Admin SDK
let serviceAccount

// Try to load from JSON file first (local dev), then from env vars (production)
const jsonPath = join(__dirname, 'firebase-service-account.json')
if (existsSync(jsonPath)) {
    serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'))
    console.log('🔥 Using Firebase service account from JSON file')
} else if (process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CERT_URL
    }
    console.log('🔥 Using Firebase service account from environment variables')
} else {
    throw new Error('Firebase credentials not found. Add firebase-service-account.json or set FIREBASE_PRIVATE_KEY env var.')
}

// Only initialize if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}

const db = admin.firestore()

// ==================== PRODUCTS ====================

export async function getAllProducts(options = {}) {
    let query = db.collection('products')

    if (options.featured) {
        query = query.where('featured', '==', true)
    }
    if (options.category) {
        query = query.where('category_slug', '==', options.category)
    }

    const snapshot = await query.get()
    const products = []
    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() })
    })

    if (options.limit) {
        return products.slice(0, options.limit)
    }
    return products
}

export async function getProductById(id) {
    const doc = await db.collection('products').doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
}

export async function createProduct(product) {
    const docRef = await db.collection('products').add({
        ...product,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    })
    return { id: docRef.id, ...product }
}

export async function updateProduct(id, product) {
    await db.collection('products').doc(id).update(product)
    return { id, ...product }
}

export async function deleteProduct(id) {
    await db.collection('products').doc(id).delete()
    return { success: true }
}

// ==================== CATEGORIES ====================

export async function getAllCategories() {
    const snapshot = await db.collection('categories').get()
    const categories = []
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() })
    })
    return categories
}

export async function getCategoryBySlug(slug) {
    const snapshot = await db.collection('categories').where('slug', '==', slug).limit(1).get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
}

export async function createCategory(category) {
    const docRef = await db.collection('categories').add({
        ...category,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    })
    return { id: docRef.id, ...category }
}

export async function updateCategory(id, category) {
    await db.collection('categories').doc(id).update(category)
    return { id, ...category }
}

export async function deleteCategory(id) {
    await db.collection('categories').doc(id).delete()
    return { success: true }
}

// ==================== ORDERS ====================

export async function getAllOrders() {
    const snapshot = await db.collection('orders').orderBy('created_at', 'desc').get()
    const orders = []
    snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() })
    })
    return orders
}

export async function getOrderById(id) {
    const doc = await db.collection('orders').doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
}

export async function createOrder(order) {
    const docRef = await db.collection('orders').add({
        ...order,
        status: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp()
    })
    return { id: docRef.id, ...order }
}

export async function updateOrderStatus(id, status) {
    await db.collection('orders').doc(id).update({ status })
    return { id, status }
}

export async function updateOrderPayment(id, paymentData) {
    await db.collection('orders').doc(id).update({
        payment_id: paymentData.payment_id,
        payment_status: paymentData.payment_status,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    })
    return { id, ...paymentData }
}

export async function deleteOrder(id) {
    await db.collection('orders').doc(id).delete()
    return { success: true }
}

export async function archiveOrder(id) {
    const order = await getOrderById(id)
    if (!order) return null

    // Add to archived orders
    await db.collection('archivedOrders').doc(id).set({
        ...order,
        archived_at: admin.firestore.FieldValue.serverTimestamp()
    })

    // Delete from active orders
    await db.collection('orders').doc(id).delete()

    return { success: true, id }
}

export async function archiveAllOrders() {
    const orders = await getAllOrders()
    const batch = db.batch()
    const archiveTimestamp = admin.firestore.FieldValue.serverTimestamp()
    const archiveId = new Date().toISOString().split('T')[0] + '_' + Date.now()

    // Create archive snapshot
    const archiveSnapshot = {
        id: archiveId,
        created_at: archiveTimestamp,
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: orders
    }

    await db.collection('orderArchives').doc(archiveId).set(archiveSnapshot)

    // Delete all orders
    for (const order of orders) {
        batch.delete(db.collection('orders').doc(order.id))
    }

    await batch.commit()

    return { success: true, archivedCount: orders.length, archiveId }
}

export async function getArchivedOrders() {
    const snapshot = await db.collection('archivedOrders').orderBy('archived_at', 'desc').get()
    const orders = []
    snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() })
    })
    return orders
}

export async function getOrderArchives() {
    const snapshot = await db.collection('orderArchives').orderBy('created_at', 'desc').get()
    const archives = []
    snapshot.forEach(doc => {
        archives.push({ id: doc.id, ...doc.data() })
    })
    return archives
}

export async function getStats(startDate = null, endDate = null) {
    const products = await getAllProducts()
    let ordersQuery = db.collection('orders')

    // Note: Firestore requires special handling for date ranges
    const snapshot = await ordersQuery.get()
    let orders = []
    snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() })
    })

    // Filter by date if provided
    if (startDate || endDate) {
        orders = orders.filter(order => {
            const orderDate = order.created_at?.toDate ? order.created_at.toDate() : new Date(order.created_at)
            if (startDate && orderDate < new Date(startDate)) return false
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (orderDate > end) return false
            }
            return true
        })
    }

    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)

    const pendingOrders = orders.filter(o => o.status === 'pending').length

    return {
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue
    }
}

// ==================== USERS ====================

export async function getUserByEmail(email) {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
}

export async function createUser(user) {
    const docRef = await db.collection('users').add({
        ...user,
        created_at: admin.firestore.FieldValue.serverTimestamp()
    })
    return { id: docRef.id, ...user }
}

export async function getAllUsers() {
    const snapshot = await db.collection('users').orderBy('created_at', 'desc').get()
    const users = []
    snapshot.forEach(doc => {
        const data = doc.data()
        // Don't expose passwords
        users.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            role: data.role,
            created_at: data.created_at
        })
    })
    return users
}

export async function updateUserRole(id, role) {
    await db.collection('users').doc(id).update({ role })
    return { id, role }
}

export async function getOrdersByEmail(email) {
    const snapshot = await db.collection('orders')
        .where('customer_email', '==', email)
        .orderBy('created_at', 'desc')
        .get()
    const orders = []
    snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() })
    })
    return orders
}

// ==================== SITE CONFIG ====================

export async function getSiteConfig() {
    const doc = await db.collection('config').doc('site').get()
    if (!doc.exists) return null
    return doc.data()
}

export async function updateSiteConfig(config) {
    await db.collection('config').doc('site').set(config, { merge: true })
    return config
}

// ==================== INITIALIZATION ====================

export async function initDatabase() {
    console.log('🔥 Connecting to Firebase Firestore...')

    // Bootstrap administrativo somente com credenciais explícitas de ambiente.
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL
    const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD
    if (initialAdminEmail && initialAdminPassword) {
        const adminUser = await getUserByEmail(initialAdminEmail)
        if (!adminUser) {
            console.log('Creating initial admin user...')
            const bcrypt = await import('bcryptjs')
            const hashedPassword = bcrypt.default.hashSync(initialAdminPassword, 10)
            await createUser({
                email: initialAdminEmail,
                password: hashedPassword,
                role: 'admin'
            })
            console.log('✅ Initial admin user created')
        }
    } else {
        console.log('ℹ️ Initial admin bootstrap disabled')
    }

    // Check if categories exist
    const categories = await getAllCategories()
    if (categories.length === 0) {
        console.log('Creating default categories...')
        const defaultCategories = [
            { name: 'Vibrador', slug: 'vibrador', icon: '💫' },
            { name: 'Fantasia', slug: 'fantasia', icon: '🎭' },
            { name: 'Energético Sexual', slug: 'energetico-sexual', icon: '⚡' },
            { name: 'Gel Beijável', slug: 'gel-beijavel', icon: '💋' },
            { name: 'Gel Feminino', slug: 'gel-feminino', icon: '🌸' },
            { name: 'Gel Masculino', slug: 'gel-masculino', icon: '🔵' },
            { name: 'Sexo Anal', slug: 'sexo-anal', icon: '💜' },
            { name: 'Outros', slug: 'outros', icon: '✨' },
        ]
        for (const cat of defaultCategories) {
            await createCategory(cat)
        }
        console.log('✅ Default categories created')
    }

    // Produtos e configuração visual são dados reais e devem ser cadastrados
    // explicitamente pelo painel; o startup nunca injeta conteúdo demonstrativo.

    console.log('🎉 Firebase Firestore initialized successfully!')
}

// Export for compatibility
export default {
    initDatabase,
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrderPayment,
    deleteOrder,
    archiveOrder,
    archiveAllOrders,
    getArchivedOrders,
    getOrderArchives,
    getStats,
    getUserByEmail,
    createUser,
    getAllUsers,
    updateUserRole,
    getOrdersByEmail,
    getSiteConfig,
    updateSiteConfig
}
