import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../database-firebase.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' })
        }

        const user = await db.getUserByEmail(email)

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' })
        }

        const isValidPassword = bcrypt.compareSync(password, user.password)

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' })
        }

        const token = generateToken(user)

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

// Register (creates client by default)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
        }

        // Check if user exists
        const existingUser = await db.getUserByEmail(email)
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' })
        }

        const hashedPassword = bcrypt.hashSync(password, 10)
        const user = await db.createUser({
            name: name || '',
            email,
            password: hashedPassword,
            role: 'client' // New users are clients by default
        })

        const token = generateToken(user)

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

// Get current user data
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserByEmail(req.userEmail)
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' })
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

// Get current user's orders
router.get('/me/orders', authMiddleware, async (req, res) => {
    try {
        const orders = await db.getOrdersByEmail(req.userEmail)
        res.json(orders)
    } catch (error) {
        console.error('Get orders error:', error)
        res.status(500).json({ error: 'Erro ao buscar pedidos' })
    }
})

export default router

