import { Router } from 'express'
import db from '../database-firebase.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await db.getAllUsers()
        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: 'Erro ao buscar usuários' })
    }
})

// Update user role (admin only)
router.put('/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body

        if (!['admin', 'client'].includes(role)) {
            return res.status(400).json({ error: 'Role inválido. Use "admin" ou "client".' })
        }

        const result = await db.updateUserRole(req.params.id, role)
        res.json(result)
    } catch (error) {
        console.error('Error updating user role:', error)
        res.status(500).json({ error: 'Erro ao atualizar role do usuário' })
    }
})

export default router
