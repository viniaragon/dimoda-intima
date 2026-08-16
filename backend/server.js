import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Database (Firebase Firestore)
import db from './database-firebase.js'

// Routes
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import configRoutes from './routes/config.js'
import uploadRoutes from './routes/upload.js'
import pixRoutes from './routes/pix.js'
import userRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// Initialize database before starting
async function startServer() {
    try {
        await db.initDatabase()
        console.log('📦 Database initialized')

        // API Routes
        app.use('/api/auth', authRoutes)
        app.use('/api/products', productRoutes)
        app.use('/api/categories', categoryRoutes)
        app.use('/api/orders', orderRoutes)
        app.use('/api/users', userRoutes)
        app.use('/api/site-config', configRoutes)
        app.use('/api/upload', uploadRoutes)
        app.use('/api/pix', pixRoutes)

        // Stats endpoint with date filtering
        app.get('/api/stats', async (req, res) => {
            try {
                const { startDate, endDate } = req.query
                const stats = await db.getStats(startDate, endDate)
                res.json(stats)
            } catch (error) {
                console.error('Stats error:', error)
                res.json({
                    totalProducts: 0,
                    totalOrders: 0,
                    pendingOrders: 0,
                    totalRevenue: 0
                })
            }
        })

        // Health check
        app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() })
        })

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Error:', err.message)
            res.status(err.status || 500).json({
                error: err.message || 'Internal Server Error'
            })
        })

        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
            console.log(`📦 API available at http://0.0.0.0:${PORT}/api`)
        })
    } catch (error) {
        console.error('CRITICAL: Failed to start server:', error)
        // Removed process.exit(1) so the Zeabur runtime logs can capture the stack trace
    }
}

startServer()
