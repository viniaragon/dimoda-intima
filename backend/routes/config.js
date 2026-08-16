import { Router } from 'express'
import db from '../database-firebase.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

// Get site config (public)
router.get('/', async (req, res) => {
    try {
        const config = await db.getSiteConfig()
        if (!config) {
            return res.status(404).json({ error: 'Configuração do site não encontrada' })
        }
        res.json(config)
    } catch (error) {
        console.error('Error fetching config:', error)
        res.status(500).json({ error: 'Erro ao buscar configurações' })
    }
})

// Update site config (admin only)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const config = await db.updateSiteConfig(req.body)
        res.json(config)
    } catch (error) {
        console.error('Error updating config:', error)
        res.status(500).json({ error: 'Erro ao atualizar configurações' })
    }
})

export default router
